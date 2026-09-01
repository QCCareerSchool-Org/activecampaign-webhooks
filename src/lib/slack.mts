import ky from 'ky';

const url = process.env.SLACK_WEBHOOK_URL;
if (!url) {
  throw Error('Environment variable SLACK_WEBHOOK_URL not found');
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

export const sendSlack = async (message: SlackMessage): Promise<number> => {
  const response = await ky.post(url, {
    json: message,
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
    throw new Error(`Slack webhook failed: ${response.status} ${await response.text()}`);
  }

  const json: unknown = await response.json();
  if (isSlackResponse(json)) {
    return json.id;
  }

  return -1;
};

interface SlackResponse {
  id: number;
}

const isSlackResponse = (value: unknown): value is SlackResponse => {
  return typeof value === 'object' && value !== null
    && 'id' in value && typeof value.id === 'number';
};
