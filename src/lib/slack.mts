import ky from 'ky';

const token = process.env.SLACK_BOT_TOKEN;
if (!token) {
  throw Error('Environment variable SLACK_BOT_TOKEN not found');
}

const channel = process.env.SLACK_CHANNEL;
if (!channel) {
  throw Error('Environment variable SLACK_CHANNEL not found');
}

export interface SlackSectionBlock {
  type: 'section';
  text: {
    type: 'mrkdwn' | 'plain_text';
    text: string;
  };
}

export interface SlackDividerBlock {
  type: 'divider';
}

export type SlackBlock = SlackSectionBlock | SlackDividerBlock;

export interface SlackMessage {
  text: string;
  blocks?: SlackBlock[];
}

export const escapeMrkdwn = (value: string): string => {
  return value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');
};

export interface SlackMessageIdentifier {
  channel: string;
  ts: string;
}

export const sendSlack = async (message: SlackMessage, threadTs?: string): Promise<SlackMessageIdentifier> => {
  const response = await ky.post('https://slack.com/api/chat.postMessage', {
    headers: {
      authorization: `Bearer ${token}`,
    },
    json: { ...message, channel, thread_ts: threadTs }, // eslint-disable-line camelcase
    timeout: 5_000,
    totalTimeout: 45_000,
    retry: {
      limit: 3,
      methods: [ 'post' ],
      statusCodes: [ 429, 500, 502, 503, 504 ],
      afterStatusCodes: [ 429, 503 ],
      backoffLimit: 30_000,
      maxRetryAfter: 30_000,
      jitter: true,
      retryOnTimeout: true,
    },
  });

  if (!response.ok) {
    throw new Error(`Slack request failed: ${response.status} ${await response.text()}`);
  }

  const json: unknown = await response.json();

  if (!isSlackPostMessageResponse(json)) {
    throw new Error(`Slack API error: unrecognized response shape`);
  }

  if (!json.ok) {
    throw new Error(`Slack API error: ${json.error}`);
  }

  return { channel: json.channel, ts: json.ts };
};

type SlackPostMessageResponse = {
  ok: true;
  channel: string;
  ts: string;
  error: never;
} | {
  ok: false;
  channel: never;
  ts: never;
  error: string;
};

const isSlackPostMessageResponse = (value: unknown): value is SlackPostMessageResponse => {
  if (typeof value !== 'object' || value === null || !('ok' in value) || typeof value.ok !== 'boolean') {
    return false;
  }

  return value.ok
    ? 'channel' in value && typeof value.channel === 'string' && 'ts' in value && typeof value.ts === 'string'
    : 'error' in value && typeof value.error === 'string';
};
