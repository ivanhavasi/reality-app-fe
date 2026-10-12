import { BuildingType, TransactionType } from './property';

export type AdminJobType = 'SCRAPE' | 'BACKFILL_COORDINATES';
// WAITING: a scheduled scrape holds the portals, the job starts right after it
export type AdminJobStatus = 'WAITING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface AdminJob {
  id: string;
  type: AdminJobType;
  buildingType: BuildingType;
  transactionType: TransactionType;
  status: AdminJobStatus;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  savedListings: number;
  pagesScanned: number;
  listingsSeen: number;
  coordinatesFilled: number;
  // backfill phase 2: listings no portal can re-read, located from their street address
  addressesToLocate: number;
  addressesChecked: number;
  addressesLocated: number;
  error: string | null;
}

export const isActiveJob = (job: AdminJob) => job.status === 'WAITING' || job.status === 'RUNNING';
