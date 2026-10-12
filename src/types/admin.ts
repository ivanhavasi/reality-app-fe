import { BuildingType, TransactionType } from './property';

export type AdminJobType = 'SCRAPE' | 'BACKFILL_COORDINATES' | 'IMPORT_PLACES';
// WAITING: a scheduled scrape holds the portals, the job starts right after it
export type AdminJobStatus = 'WAITING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface AdminJob {
  id: string;
  type: AdminJobType;
  // null for the places import
  buildingType: BuildingType | null;
  transactionType: TransactionType | null;
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
  placeCategoriesImported: number;
  placesImported: number;
  error: string | null;
}

export const isActiveJob = (job: AdminJob) => job.status === 'WAITING' || job.status === 'RUNNING';
