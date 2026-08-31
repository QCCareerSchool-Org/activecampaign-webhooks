import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';
import zod from 'zod';

import { activeCampaignFetch } from '../index.mjs';

interface Contact {
  id: bigint;
  cdate: Date;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  deleted: number;
  anonymized: number;
  contactLists?: bigint[];
}

export const getContactById = async (id: bigint, signal: AbortSignal | null = null): Promise<Result<Contact>> => {
  try {
    const response = await activeCampaignFetch(`/contacts/${id}`, { signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    const responseBody = await response.json();

    if (!(typeof responseBody === 'object' && responseBody !== null && 'contact' in responseBody)) {
      return failure(Error('contact key missing'));
    }

    const contact = await schema.parseAsync(responseBody.contact);

    return success(contact);

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};

export const getContactByEmailAddress = async (emailAddress: string, signal?: AbortSignal): Promise<Result<Contact>> => {
  const searchParams = new URLSearchParams({ email: emailAddress });

  try {

    const response = await activeCampaignFetch(`/contacts?${searchParams.toString()}`, { signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    const responseBody = await response.json();

    if (!(typeof responseBody === 'object' && responseBody !== null && 'contacts' in responseBody)) {
      return failure(Error('contacts key missing'));
    }

    if (!Array.isArray(responseBody.contacts)) {
      return failure(Error('contacts is not an array'));
    }

    if (responseBody.contacts.length < 1) {
      return failure(Error('contact not found'));
    }

    const contact = await schema.parseAsync(responseBody.contacts[0]);

    return success(contact);

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};

const schema: zod.ZodType<Contact> = zod.object({
  id: zod.coerce.bigint(),
  cdate: zod.coerce.date(),
  email: zod.string(),
  phone: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
  deleted: zod.coerce.number().int(),
  anonymized: zod.coerce.number().int(),
  contactLists: zod.array(zod.coerce.bigint()).optional(),
});
