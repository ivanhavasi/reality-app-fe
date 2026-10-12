import React from 'react';
import { Button } from 'react-bootstrap';
import { Star, StarFill } from 'react-bootstrap-icons';
import { useFavorites } from '../context/FavoritesContext';

interface FavoriteButtonProps {
  listingId: string;
  // overlay: round icon on a listing photo; button: labelled button on the detail page
  variant?: 'overlay' | 'button';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ listingId, variant = 'overlay' }) => {
  const { enabled, isFavorite, toggleFavorite } = useFavorites();
  if (!enabled) return null;

  const active = isFavorite(listingId);
  const label = active ? 'Remove from saved' : 'Save listing';
  const StarIcon = active ? StarFill : Star;
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(listingId);
  };

  if (variant === 'button') {
    return (
      <Button
        variant="outline-secondary"
        className={`favorite-button${active ? ' is-active' : ''}`}
        aria-pressed={active}
        title={label}
        onClick={onClick}
      >
        <StarIcon size={15} />
        {active ? 'Saved' : 'Save'}
      </Button>
    );
  }

  return (
    <button
      type="button"
      className={`favorite-toggle${active ? ' is-active' : ''}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <StarIcon size={15} />
    </button>
  );
};

export default FavoriteButton;
