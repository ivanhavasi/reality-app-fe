import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useUser } from './UserContext';
import { useError } from './ErrorContext';
import { addFavorite, getFavorites, removeFavorite } from '../services/FavoriteService';
import { FavoriteListing } from '../types/realEstate';

interface FavoritesContextType {
  // false when signed out (the public listing page): stars are hidden
  enabled: boolean;
  // null until the first load finishes
  count: number | null;
  isFavorite: (listingId: string) => boolean;
  toggleFavorite: (listingId: string) => Promise<void>;
  reload: () => Promise<FavoriteListing[]>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const { setError } = useError();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState<Set<string> | null>(null);

  const reload = useCallback(async () => {
    if (!userId) return [];
    const favorites = await getFavorites(userId);
    setIds(new Set(favorites.map(favorite => favorite.listing.id)));
    return favorites;
  }, [userId]);

  useEffect(() => {
    setIds(null);
    reload().catch(() => setIds(new Set()));
  }, [reload]);

  const isFavorite = useCallback((listingId: string) => ids?.has(listingId) ?? false, [ids]);

  // the star flips at once; a failed request puts back what the server has
  const toggleFavorite = useCallback(async (listingId: string) => {
    if (!userId) return;
    const starring = !(ids?.has(listingId) ?? false);
    setIds(previous => {
      const next = new Set(previous ?? []);
      if (starring) next.add(listingId);
      else next.delete(listingId);
      return next;
    });
    try {
      await (starring ? addFavorite(userId, listingId) : removeFavorite(userId, listingId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update saved listings');
      reload().catch(() => undefined);
    }
  }, [ids, userId, reload, setError]);

  const value = useMemo(
    () => ({ enabled: userId !== null, count: ids?.size ?? null, isFavorite, toggleFavorite, reload }),
    [userId, ids, isFavorite, toggleFavorite, reload],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within a FavoritesProvider');
  return context;
};
