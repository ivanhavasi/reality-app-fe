import { FavoriteListing } from '../types/realEstate';
import { API_BASE_URL, apiRequest, getAuthHeaders, handleApiError } from './api';

const favoritesUrl = (userId: string) => `${API_BASE_URL}/api/users/${userId}/favorites`;

// newest first
export const getFavorites = async (userId: string): Promise<FavoriteListing[]> => {
  const res = await apiRequest(favoritesUrl(userId), { headers: getAuthHeaders() });
  if (!res.ok) await handleApiError(res, 'Failed to load saved listings');
  const favorites = await res.json();
  return Array.isArray(favorites) ? favorites : [];
};

export const addFavorite = async (userId: string, listingId: string): Promise<void> => {
  const res = await apiRequest(`${favoritesUrl(userId)}/${encodeURIComponent(listingId)}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleApiError(res, 'Failed to save the listing');
};

export const removeFavorite = async (userId: string, listingId: string): Promise<void> => {
  const res = await apiRequest(`${favoritesUrl(userId)}/${encodeURIComponent(listingId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) await handleApiError(res, 'Failed to remove the saved listing');
};
