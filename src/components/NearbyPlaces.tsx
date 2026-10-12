import React from 'react';
import { NearbyPlace, PLACE_CATEGORY_META } from '../types/places';
import { formatDistance } from '../utils/format';

// straight line plus a quarter for streets, at 80 m a minute
const walkingMinutes = (meters: number) => Math.max(1, Math.round((meters * 1.25) / 80));
const MAX_WALKING_DISTANCE = 2500;

const NearbyPlaces: React.FC<{ places: NearbyPlace[] }> = ({ places }) => (
  <>
    <div className="nearby-grid">
      {places.map(place => {
        const { label, icon: CategoryIcon } = PLACE_CATEGORY_META[place.category];
        return (
          <div className="nearby-row" key={place.category}>
            <span className="nearby-icon">
              <CategoryIcon size={15} />
            </span>
            <div className="nearby-text">
              <div className="nearby-label">{label}</div>
              <div className="nearby-name" title={place.name ?? undefined}>{place.name ?? 'Unnamed'}</div>
            </div>
            <div className="nearby-distance">
              <div className="tabular">{formatDistance(place.distanceInMeters)}</div>
              {place.distanceInMeters <= MAX_WALKING_DISTANCE && (
                <div className="nearby-walk">{walkingMinutes(place.distanceInMeters)} min walk</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
    <p className="nearby-note">
      Straight-line distance to the nearest one, to a park's edge; walking times are estimates. Places from OpenStreetMap.
    </p>
  </>
);

export default NearbyPlaces;
