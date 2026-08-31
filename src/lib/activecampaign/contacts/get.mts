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

type OrderField = 'id' | 'cdate' | 'email' | 'first_name' | 'last_name';

interface Params {
  search?: string;
  segmentId?: string;
  orders?: { field: OrderField; order: 'asc' | 'desc' };
  offset?: number;
  idGreater?: number;
}
export const getContacts = async (params: Params, signal: AbortSignal | null = null): Promise<Result<Contact[]>> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.set('limit', '100');
    if (params.search) {
      searchParams.set('search', params.search);
    }
    if (params.segmentId) {
      searchParams.set('segmentid', params.segmentId);
    }
    if (params.orders) {
      searchParams.set(`orders[${params.orders.field}]`, params.orders.order);
    }
    if (params.idGreater) {
      searchParams.set('id_greater', params.idGreater.toFixed(0));
    }
    if (params.offset) {
      searchParams.set('offset', params.offset.toFixed(0));
    }

    const response = await activeCampaignFetch(`/contacts?${searchParams.toString()}`, { signal });

    if (!response.ok) {
      return failure(Error(response.statusText));
    }

    const responseBody = await response.json();

    if (!(typeof responseBody === 'object' && responseBody !== null && 'contacts' in responseBody)) {
      return failure(Error('contacts key missing'));
    }

    const contacts = await schema.parseAsync(responseBody.contacts);

    return success(contacts);

  } catch (err) {
    if (!signal?.aborted) {
      console.error(err);
    }
    return failure(err instanceof Error ? err : Error(String(err)));
  }
};

const schema = zod.array(zod.object({
  id: zod.coerce.bigint(),
  cdate: zod.coerce.date(),
  email: zod.string(),
  phone: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
  deleted: zod.coerce.number().int(),
  anonymized: zod.coerce.number().int(),
  contactLists: zod.array(zod.coerce.bigint()).optional(),
})) satisfies zod.ZodType<Contact[]>;
