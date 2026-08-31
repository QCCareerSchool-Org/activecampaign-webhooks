import { fetchWithRetry } from './fetchWithRetry.mjs';

const url = process.env.SLACK_WEBHOOK_URL;
if (!url) {
  throw Error('Environment variable SLACK_WEBHOOK_URL not found');
}

export const sendSlack = async (name: string, telephoneNumber: string, message: string): Promise<void> => {
  const response = await fetchWithRetry(url, {
    method: 'post',
    body: JSON.stringify({
      text: `New message from ${name}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*New Message*\n*Name:* ${name}\n*Tel:* ${telephoneNumber}\n>${message}`,
          },
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(
      `Slack webhook failed: ${response.status} ${await response.text()}`,
    );
  }
};
