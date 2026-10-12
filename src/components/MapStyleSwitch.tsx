import React, { useState } from 'react';
import { isMapStyle, MAP_STYLES, MapStyle } from '../utils/map';
import { Segmented } from './ui';

const STORAGE_ITEM = 'mapStyle';

// shared by every map, so picking satellite on the listings also applies on a listing's detail
export const useMapStyle = () => {
  const [style, setStyle] = useState<MapStyle>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ITEM);
      return isMapStyle(saved) ? saved : 'default';
    } catch {
      return 'default';
    }
  });

  const update = (next: MapStyle) => {
    setStyle(next);
    try {
      localStorage.setItem(STORAGE_ITEM, next);
    } catch {
      // private mode: the choice just isn't remembered
    }
  };

  return [style, update] as const;
};

interface MapStyleSwitchProps {
  value: MapStyle;
  onChange: (style: MapStyle) => void;
}

const MapStyleSwitch: React.FC<MapStyleSwitchProps> = ({ value, onChange }) => (
  <div className="map-style-switch">
    <Segmented ariaLabel="Map style" size="sm" value={value} onChange={onChange} options={MAP_STYLES} />
  </div>
);

export default MapStyleSwitch;
