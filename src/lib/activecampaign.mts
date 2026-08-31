import type { Result } from 'generic-result-type';
import { success } from 'generic-result-type';

import type { SchoolName } from '#domain/school.mjs';
import { getContactByEmailAddress } from './activecampaign/contact/get.mjs';
import { putContact } from './activecampaign/contact/put.mjs';
import { postContact } from './activecampaign/contact/sync/post.mjs';
import { getContactAutomations } from './activecampaign/contactAutomations/get.mjs';
import { postContactAutomations } from './activecampaign/contactAutomations/post.mjs';
import { ContactListStatus, postContactLists } from './activecampaign/contactLists/post.mjs';
import { postContactTags } from './activecampaign/contactTags/post.mjs';

export const createContact = async (
  emailAddress: string,
  emailOptIn: boolean,
  smsOptIn: boolean,
  schoolName: SchoolName,
  firstName: string | undefined,
  lastName: string | undefined,
  countryCode: string,
  provinceCode?: string | null,
  city?: string | null,
  telephoneNumber?: string,
  requiredAutomationIds?: bigint[],
  optionalAutomationIds?: bigint[],
  source?: Source,
  courseCode?: string,
): Promise<Result> => {
  const contact = {
    email: emailAddress,
    firstName,
    lastName,
    phone: telephoneNumber,
  };

  const fields = { countryCode, provinceCode: provinceCode ?? undefined, city: city ?? undefined };

  const postContactResult = await postContact(contact, fields);

  if (!postContactResult.success) {
    return postContactResult;
  }

  const contactId = postContactResult.value;

  const contactAutomationsResult = await getContactAutomations(contactId);
  const contactAutomations = contactAutomationsResult.success ? contactAutomationsResult.value : [];

  if (source) {
    const postSourceContactTagsResult = await postContactTags({
      contact: contactId,
      tag: sourceTags[source],
    });

    if (!postSourceContactTagsResult.success) {
      console.error(postSourceContactTagsResult.error);
    }
  }

  // the contact is always added to the email list
  if (emailListIds[schoolName]) {
    const postContactListsResult = await postContactLists({
      contact: contactId,
      list: emailListIds[schoolName],
      status: ContactListStatus.ACTIVE,
    });

    if (!postContactListsResult.success) {
      console.error(postContactListsResult.error);
    }
  } else {
    console.error(`Email list id not specified for ${schoolName}`);
  }

  if (smsOptIn && telephoneNumber) {
    // if the contact opts in, add them to the sms list for this school
    if (smsListIds[schoolName]) {
      const postContactListsResult = await postContactLists({
        contact: contactId,
        list: courseCode ? smsListIds[schoolName][courseCode] ?? smsListIds[schoolName].default : smsListIds[schoolName].default,
        status: ContactListStatus.ACTIVE,
      });

      if (!postContactListsResult.success) {
        console.error(postContactListsResult.error);
      }
    } else {
      console.error(`SMS list id not specified for ${schoolName}`);
    }
  }

  // these are the automations that fullfill the forms stated purpose (e.g., send the brochure email)
  if (requiredAutomationIds) {
    for (const automationId of requiredAutomationIds) {
      // skip this automation the contact is already in it
      if (contactAutomations.findIndex(c => c.automation === automationId && !c.completed) !== -1) {
        continue;
      }

      const postContactAutomationsResult = await postContactAutomations({
        contact: contactId,
        automation: automationId,
      });

      if (!postContactAutomationsResult.success) {
        console.error(postContactAutomationsResult.error);
      }
    }
  }

  if (emailOptIn) {
    // these are the automations that the contact can opt into (nuture streams)
    if (optionalAutomationIds) {
      for (const automationId of optionalAutomationIds) {
        // skip this automation the contact is already in it
        if (contactAutomations.findIndex(c => c.automation === automationId && !c.completed) !== -1) {
          continue;
        }

        const postContactAutomationsResult = await postContactAutomations({
          contact: contactId,
          automation: automationId,
        });

        if (!postContactAutomationsResult.success) {
          console.error(postContactAutomationsResult.error);
        }
      }
    } else {
      console.warn(`No optional automation ids found for contact, ${contactId}`);
    }
  }

  return success();
};

export const updateTelephoneNumber = async (emailAddress: string, telephoneNumber: string, schoolName: SchoolName, courseCode?: string): Promise<Result> => {
  const contactResult = await getContactByEmailAddress(emailAddress);
  console.log(contactResult);
  if (!contactResult.success) {
    return contactResult;
  }

  const contactId = contactResult.value.id;

  const updateResult = await putContact(contactId, { phone: telephoneNumber });
  if (!updateResult.success) {
    return updateResult;
  }

  if (smsListIds[schoolName]) {
    const postContactListsResult = await postContactLists({
      contact: contactId,
      list: courseCode ? smsListIds[schoolName][courseCode] ?? smsListIds[schoolName].default : smsListIds[schoolName].default,
      status: ContactListStatus.ACTIVE,
    });

    if (!postContactListsResult.success) {
      console.error(postContactListsResult.error);
    }
  } else {
    console.error(`SMS list id not specified for ${schoolName}`);
  }

  return success();
};

const emailListIds: Partial<Record<SchoolName, bigint>> = {
  'QC Design School': 35n,
  'QC Event School': 32n,
  'QC Makeup Academy': 37n,
  'QC Pet Studies': 39n,
  'QC Wellness Studies': 36n,
} as const;

const smsListIds: Partial<Record<SchoolName, { [key: string]: bigint; default: bigint }>> = {
  'QC Design School': { default: 34n },
  'QC Event School': { default: 33n },
  'QC Makeup Academy': { default: 38n },
  'QC Pet Studies': { default: 92n, dt: 93n },
} as const;

const sourceTags = {
  'Meta': 27n,
  'Course Compare': 28n,
  'OpenAI': 82n,
  'Chat': 83n,
} as const;

type Source = keyof typeof sourceTags;
