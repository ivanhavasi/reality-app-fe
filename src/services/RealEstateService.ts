import {RealEstate} from '../types/realEstate';
import {API_BASE_URL, getAuthHeaders, handleApiError} from "./api";

export type SortDirection = 'ASC' | 'DESC';

export const fetchRealEstates = async (
  offset: number = 0,
  limit: number = 10,
  sortDirection: SortDirection = 'DESC',
  search?: string,
  transaction?: 'SALE' | 'RENT'
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

  const res = await fetch(url.toString(), {
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
  fetchRealEstates
};
