export type BuildingType = 'APARTMENT' | 'HOUSE' | 'LAND';
export type TransactionType = 'SALE' | 'RENT';
export type TimeGranularity = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export type GroupByDimension = 'CITY' | 'DISTRICT' | 'STREET' | 'BUILDING_TYPE' | 'TRANSACTION_TYPE';
export type TimePeriod = '1M' | '3M' | '6M' | '1Y' | '2Y' | '5Y' | 'MAX';

export interface MarketStatistics {
  period: string;
  grouping: Record<string, string | null>;
  avgPrice: number;
  avgPricePerM2: number | null;
  avgSize: number;
  minPrice: number;
  maxPrice: number;
  count: number;
}

export interface StatisticsQueryParams {
  city?: string;
  district?: string;
  buildingType?: BuildingType;
  transactionType?: TransactionType;
  subCategory?: string;
  sizeMin?: number;
  sizeMax?: number;
  period?: TimePeriod;
  granularity?: TimeGranularity;
  groupBy?: GroupByDimension[];
}