import {RealEstate} from '../types/realEstate';
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

export const fetchRealEstates = async (
  offset: number = 0,
  limit: number = 10,
  sortDirection: SortDirection = 'DESC',
  search?: string,
  transaction?: 'SALE' | 'RENT',
  building: string = 'APARTMENT',
  sizeMin: number = 0,
  sizeMax: number = 1000,
  priceMin: number = 0,
  priceMax: number = 1000000000
): Promise<RealEstate[]> => {
  const url = new URL(`${API_BASE_URL}/api/real-estates`);
  url.searchParams.append('offset', offset.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sortDirection', sortDirection);

  // Add search parameter if provided and not empty
  if (search && search.trim() !== '') {
    url.searchParams.append('search', encodeURIComponent(search.trim()));
  }

  // Add transaction parameter if provided
  if (transaction) {
    url.searchParams.append('transaction', transaction);
  }

  // Add advanced search parameters
  url.searchParams.append('building', building);
  url.searchParams.append('sizeMin', sizeMin.toString());
  url.searchParams.append('sizeMax', sizeMax.toString());
  url.searchParams.append('priceMin', priceMin.toString());
  url.searchParams.append('priceMax', priceMax.toString());

  const res = await apiRequest(url.toString(), {
    headers: getAuthHeaders(),
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

export const realEstateService = {
  fetchRealEstates,
  fetchRealEstateById
};
