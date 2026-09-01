import { getCache } from '@vercel/functions';

import type { SlackMessageIdentifier } from './slack.mjs';

const keyFor = (contactId: string): string => `slack-thread:${contactId}`;

export const getThreadForContact = async (contactId: string): Promise<SlackMessageIdentifier | null> => {
  const value = await getCache().get(keyFor(contactId));
  return isSlackMessageIdentifier(value) ? value : null;
};

export const saveThreadForContact = async (contactId: string, identifier: SlackMessageIdentifier): Promise<void> => {
  await getCache().set(keyFor(contactId), identifier);
};

const isSlackMessageIdentifier = (value: unknown): value is SlackMessageIdentifier => {
  return typeof value === 'object' && value !== null
    && 'channel' in value && typeof value.channel === 'string'
    && 'ts' in value && typeof value.ts === 'string';
};
