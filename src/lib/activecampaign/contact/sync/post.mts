import type { Result } from 'generic-result-type';
import { failure, success } from 'generic-result-type';
import zod from 'zod';

import { activeCampaignFetch, isErrorResponse } from '../../index.mjs';

interface Contact {
  email: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

interface Fields {
  countryCode: string;
  provinceCode?: string;
  city?: string;
}

interface Body {
  contact: {
    email: string;
    allowNullEmail?: boolean;
    phone?: string;
    firstName?: string;
    lastName?: string;
    fieldValues?: { field: number; value: string }[];
  };
}

enum FieldValues {
  COUNTRY_CODE = 2,
  PROVINCE_CODE = 3,
  CITY = 4,
}

export const postContact = async (contact: Contact, fields?: Fields, signal: AbortSignal | null = null): Promise<Result<bigint>> => {
  try {
    const body: Body = {
      contact: {
        email: contact.email,
        ...(contact.firstName ? { firstName: contact.firstName } : undefined),
        ...(contact.lastName ? { lastName: contact.lastName } : undefined),
        ...(contact.phone ? { phone: contact.phone } : undefined),
        allowNullEmail: false,
      },
    };

    if (fields) {
      body.contact.fieldValues = [ { field: FieldValues.COUNTRY_CODE, value: fields.countryCode } ];
      if (fields.provinceCode) {
        body.contact.fieldValues.push({ field: FieldValues.PROVINCE_CODE, value: fields.provinceCode });
      }
      if (fields.city) {
        body.contact.fieldValues.push({ field: FieldValues.CITY, value: fields.city });
      }
    }

    const response = await activeCampaignFetch(`/contact/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (response.status === 422) {
      const responseBody: unknown = await response.json();
      if (isErrorResponse(responseBody)) {
        console.error(responseBody.errors);
        return failure(Error(responseBody.errors[0]?.title));
      }
    }

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    if (response.status !== 200 && response.status !== 201) {
      return failure(Error('Contact not created'));
    }

    const responseBody: unknown = await response.json();
    const contactResponse = await creationResponseSchema.parseAsync(responseBody);
    return success(contactResponse.contact.id);

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};

interface CreationResponse {
  contact: {
    id: bigint;
  };
}

const creationResponseSchema: zod.ZodType<CreationResponse> = zod.object({
  contact: zod.object({
    id: zod.coerce.bigint(),
  }),
});
