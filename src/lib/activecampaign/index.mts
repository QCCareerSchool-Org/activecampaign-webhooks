import { fetchWithRetry } from '../fetchWithRetry.mjs';

const activeCampaignAccount = process.env.ACTIVE_CAMPAIGN_ACCOUNT;
if (!activeCampaignAccount) {
  throw Error('Environment variable ACTIVE_CAMPAIGN_ACCOUNT not found');
}

const apiToken = process.env.ACTIVE_CAMPAIGN_API_TOKEN;
if (!apiToken) {
  throw Error('Environment variable ACTIVE_CAMPAIGN_API_TOKEN not found');
}

const baseUrl = `https://${activeCampaignAccount}.api-us1.com/api/3`;

export const activeCampaignFetch = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers);
  headers.set('Api-Token', apiToken);
  return fetchWithRetry(`${baseUrl}${path}`, { ...options, headers });
};

interface ActiveCampaignError {
  title: string;
  status?: number;
  detail?: string;
  code?: string;
  source: {
    pointer: string;
  };
}

const isActiveCampaignError = (value: unknown): value is ActiveCampaignError => {
  return typeof value === 'object' && value !== null
    && 'title' in value && typeof value.title === 'string'
    && (('status' in value && typeof value.status === 'number') || !('status' in value))
    && (('detail' in value && typeof value.detail === 'string') || !('detail' in value))
    && (('code' in value && typeof value.code === 'string') || !('code' in value))
    && 'source' in value && typeof value.source === 'object' && value.source !== null
    && 'pointer' in value.source && typeof value.source.pointer === 'string';
};

export const isErrorResponse = (value: unknown): value is { errors: ActiveCampaignError[] } => {
  return typeof value === 'object' && value !== null
    && 'errors' in value && Array.isArray(value.errors) && value.errors.every(isActiveCampaignError);
};
