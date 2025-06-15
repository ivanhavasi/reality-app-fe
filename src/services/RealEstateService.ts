import {tokenService} from './TokenService';
import {RealEstate} from '../types/realEstate';

// API base URL from environment variable with fallback to localhost
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8080';

// Helper function to get authorization headers
const getAuthHeaders = () => {
  const token = tokenService.getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
};

// Helper function to handle API errors
const handleApiError = async (response: Response, defaultMessage: string): Promise<never> => {
  let errorMessage = defaultMessage;

  try {
    // Try to get the error message from the response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        errorMessage = errorData.error;
      }
    } else {
      const text = await response.text();
      if (text) {
        errorMessage = text;
      }
    }
  } catch (e) {
    console.error('Error parsing error response:', e);
  }

  // Add status code to the error message
  if (response.status >= 400 && response.status < 500) {
    errorMessage = `Client Error (${response.status}): ${errorMessage}`;
  } else if (response.status >= 500) {
    errorMessage = `Server Error (${response.status}): ${errorMessage}`;
  }

  throw new Error(errorMessage);
};

export type SortDirection = 'ASC' | 'DESC';

export const fetchRealEstates = async (
  offset: number = 0,
  limit: number = 10,
  sortDirection: SortDirection = 'DESC',
  search?: string
): Promise<RealEstate[]> => {
  const url = new URL(`${API_BASE_URL}/api/real-estates`);
  url.searchParams.append('offset', offset.toString());
  url.searchParams.append('limit', limit.toString());
  url.searchParams.append('sortDirection', sortDirection);

  // Add search parameter if provided and not empty
  if (search && search.trim() !== '') {
    url.searchParams.append('search', encodeURIComponent(search.trim()));
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
