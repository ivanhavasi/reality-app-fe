export interface Locality {
  city: string;
  district: string;
  street: string;
  streetNumber: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Duplicate {
  url: string;
  price: number;
  pricePerM2: number;
  images: string[];
  provider: string;
}

export interface RealEstate {
  id: string;
  fingerprint: string;
  name: string;
  url: string;
  price: number;
  pricePerM2: number;
  sizeInM2: number;
  currency: string;
  locality: Locality;
  mainCategory: string;
  subCategory: string;
  transactionType: string;
  images: string[];
  description: string | null;
  provider: string;
  duplicates: Duplicate[];
}

export interface RealEstateResponse {
  totalCount?: number;
  offset?: number;
  limit?: number;
}
