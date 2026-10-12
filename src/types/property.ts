import { Building, HouseDoor, Tree } from 'react-bootstrap-icons';
import type { Icon } from 'react-bootstrap-icons';

export type BuildingType = 'APARTMENT' | 'HOUSE' | 'LAND';
export type TransactionType = 'SALE' | 'RENT';

export const ENABLED_BUILDING_TYPES: BuildingType[] = ['APARTMENT', 'LAND'];

export const isBuildingType = (value: string | null | undefined): value is BuildingType =>
  value === 'APARTMENT' || value === 'HOUSE' || value === 'LAND';

// labels identical to backend LandSubCategory.label
export const LAND_SUB_TYPE_LABELS: Record<string, string> = {
  BUILDING_PLOT: 'Building plot',
  COMMERCIAL: 'Commercial',
  FIELD: 'Field',
  MEADOW: 'Meadow',
  FOREST: 'Forest',
  GARDEN: 'Garden',
  ORCHARD_VINEYARD: 'Orchard / vineyard',
  POND: 'Pond',
  OTHER: 'Other',
};

export const ENABLED_LAND_SUB_TYPES: string[] = ['BUILDING_PLOT'];

export const BUILDING_TYPE_META: Record<BuildingType, { label: string; plural: string; icon: Icon }> = {
  APARTMENT: { label: 'Apartment', plural: 'Apartments', icon: Building },
  HOUSE: { label: 'House', plural: 'Houses', icon: HouseDoor },
  LAND: { label: 'Land', plural: 'Land', icon: Tree },
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  SALE: 'For sale',
  RENT: 'For rent',
};

export const SIZE_RANGE: Record<BuildingType, { max: number; step: number }> = {
  APARTMENT: { max: 300, step: 5 },
  HOUSE: { max: 1000, step: 10 },
  LAND: { max: 10_000, step: 50 },
};

export const PRICE_RANGE: Record<BuildingType, Record<TransactionType, { max: number; step: number }>> = {
  APARTMENT: { SALE: { max: 100_000_000, step: 100_000 }, RENT: { max: 250_000, step: 500 } },
  HOUSE: { SALE: { max: 100_000_000, step: 100_000 }, RENT: { max: 250_000, step: 1_000 } },
  LAND: { SALE: { max: 50_000_000, step: 50_000 }, RENT: { max: 100_000, step: 500 } },
};

// sent when a slider sits at its top, so "10 000+ m²" / "50M+" really mean unbounded
export const OPEN_SIZE_MAX = 1_000_000;
export const OPEN_PRICE_MAX = 2_000_000_000;
