import { fetchWithRetry } from './fetchWithRetry.mjs';

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

export const sendSlack = async (message: SlackMessage): Promise<void> => {
  const response = await fetchWithRetry(url, {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${await response.text()}`);
  }
};
