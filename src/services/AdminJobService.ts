import { API_BASE_URL, apiRequest, getAuthHeaders, handleApiError } from './api';
import { AdminJob } from '../types/admin';
import { BuildingType, TransactionType } from '../types/property';

export const getAdminJobs = async (): Promise<AdminJob[]> => {
  const res = await apiRequest(`${API_BASE_URL}/api/admin/jobs`, { headers: getAuthHeaders() });
  if (!res.ok) await handleApiError(res, 'Failed to load jobs');
  return res.json();
};

const startJob = async (path: string, building: BuildingType, transaction: TransactionType): Promise<AdminJob> => {
  const url = new URL(`${API_BASE_URL}/api/admin/jobs/${path}`);
  url.searchParams.append('building', building);
  url.searchParams.append('transaction', transaction);

  const res = await apiRequest(url.toString(), { method: 'POST', headers: getAuthHeaders() });
  if (!res.ok) await handleApiError(res, 'Failed to start the job');
  return res.json();
};

export const startScrapeJob = (building: BuildingType, transaction: TransactionType) =>
  startJob('scrape', building, transaction);

export const startCoordinatesBackfillJob = (building: BuildingType, transaction: TransactionType) =>
  startJob('backfill-coordinates', building, transaction);
