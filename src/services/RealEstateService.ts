import {RealEstate, RealEstateMapPoint} from '../types/realEstate';
import {BuildingType, TransactionType} from '../types/property';
import {API_BASE_URL, getAuthHeaders, handleApiError, apiRequest} from "./api";

export type SortDirection = 'ASC' | 'DESC';

export const fetchRealEstateById = async (id: string): Promise<RealEstate> => {
  const url = `${API_BASE_URL}/api/real-estates/${id}`;

  const res = await fetch(url);

  if (!res.ok) {
    const error = await res.text();
    throw new Error(error || 'Failed to fetch real estate details');
  }

  return await res.json();
};

export interface FetchRealEstatesOptions {
  offset?: number;
  limit?: number;
  sortDirection?: SortDirection;
  search?: string;
  transaction?: TransactionType;
  building?: BuildingType;
  subCategories?: string[];
  sizeMin?: number;
  sizeMax: number;
  priceMin?: number;
  priceMax?: number;
  signal?: AbortSignal;
}

const appendFilters = (url: URL, {
  sortDirection = 'DESC',
  search,
  transaction = 'SALE',
  building = 'APARTMENT',
  subCategories = [],
  sizeMin = 0,
  sizeMax,
  priceMin = 0,
  priceMax = 1000000000,
}: FetchRealEstatesOptions) => {
  url.searchParams.append('sortDirection', sortDirection);

  if (search && search.trim() !== '') {
    url.searchParams.append('search', search.trim());
  }

  url.searchParams.append('transaction', transaction);
  url.searchParams.append('building', building);
  subCategories.forEach(sub => url.searchParams.append('subCategory', sub));
  url.searchParams.append('sizeMin', sizeMin.toString());
  url.searchParams.append('sizeMax', sizeMax.toString());
  url.searchParams.append('priceMin', priceMin.toString());
  url.searchParams.append('priceMax', priceMax.toString());
};

export const fetchRealEstates = async (options: FetchRealEstatesOptions): Promise<RealEstate[]> => {
  const { offset = 0, limit = 10, signal } = options;
  const url = new URL(`${API_BASE_URL}/api/real-estates`);
  url.searchParams.append('offset', offset.toString());
  url.searchParams.append('limit', limit.toString());
  appendFilters(url, options);

  const res = await apiRequest(url.toString(), {
    headers: getAuthHeaders(),
    signal,
  });

  if (!res.ok) await handleApiError(res, 'Failed to fetch real estates');
  const response = await res.json();

  // Handle different response formats
  if (Array.isArray(response)) {
    // If API returns just an array of real estates
    return response;
  } else if (response.data && Array.isArray(response.data)) {
    // If API returns an object with a data property containing the array
    return response.data;
  } else {
    // Default fallback
    return [];
  }
};

// the backend caps this at 500, newest first
export const fetchRealEstateMapPoints = async (options: FetchRealEstatesOptions): Promise<RealEstateMapPoint[]> => {
  const url = new URL(`${API_BASE_URL}/api/real-estates/map`);
  if (options.limit) url.searchParams.append('limit', options.limit.toString());
  appendFilters(url, options);

  const res = await apiRequest(url.toString(), {
    headers: getAuthHeaders(),
    signal: options.signal,
  });

  if (!res.ok) await handleApiError(res, 'Failed to fetch map listings');
  const points = await res.json();
  return Array.isArray(points) ? points : [];
};

export const realEstateService = {
  fetchRealEstates,
  fetchRealEstateById
};
