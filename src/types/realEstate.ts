import { BuildingType, TransactionType } from './property';

export interface Locality {
  city: string;
  district: string | null;
  street: string | null;
  streetNumber: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Duplicate {
  url: string;
  price: number;
  pricePerM2: number | null;
  images: string[];
  provider: string;
}

export interface RealEstate {
  id: string;
  fingerprint: string;
  name: string;
  url: string;
  price: number;
  pricePerM2: number | null;
  sizeInM2: number;
  currency: string;
  locality: Locality;
  mainCategory: BuildingType;
  subCategory: string | null;
  transactionType: TransactionType;
  images: string[];
  description: string | null;
  provider: string;
  duplicates: Duplicate[];
}

// slim listing from /api/real-estates/map; always has coordinates
export interface RealEstateMapPoint {
  id: string;
  name: string;
  price: number;
  lowestPrice: number;
  pricePerM2: number | null;
  sizeInM2: number;
  currency: string;
  mainCategory: BuildingType;
  subCategory: string | null;
  locality: Locality;
  image: string | null;
}

export interface RealEstateResponse {
  totalCount?: number;
  offset?: number;
  limit?: number;
}
