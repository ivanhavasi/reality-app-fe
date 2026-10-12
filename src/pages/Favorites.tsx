import React, { useEffect, useState } from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Star } from 'react-bootstrap-icons';
import RealEstateCard from '../components/RealEstateCard';
import { EmptyState, ListingSkeletonGrid, PageHeader } from '../components/ui';
import { useError } from '../context/ErrorContext';
import { useFavorites } from '../context/FavoritesContext';
import { FavoriteListing } from '../types/realEstate';

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const { setError } = useError();
  const { enabled, reload } = useFavorites();
  // kept as loaded: an unstarred card stays until you leave, so a mis-click can be undone with another click
  const [favorites, setFavorites] = useState<FavoriteListing[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    reload()
      .then(setFavorites)
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load saved listings');
        setFavorites([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  return (
    <>
      <PageHeader
        title="Saved"
        subtitle={
          favorites && favorites.length > 0
            ? `${favorites.length} ${favorites.length === 1 ? 'listing' : 'listings'} you starred, newest first.`
            : 'Listings you starred, newest first.'
        }
      />

      {favorites === null ? (
        <ListingSkeletonGrid />
      ) : favorites.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No saved listings yet"
          text="Star a listing on its photo or detail page to keep it here and come back to it later."
          actions={
            <Button variant="primary" onClick={() => navigate('/real-estates')}>
              Browse listings
            </Button>
          }
        />
      ) : (
        <div className="listing-grid mb-5">
          {favorites.map(favorite => (
            <RealEstateCard key={favorite.listing.id} estate={favorite.listing} />
          ))}
        </div>
      )}
    </>
  );
};

export default Favorites;
