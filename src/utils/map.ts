import L from 'leaflet';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PLACE_CATEGORY_META, PlaceCategory } from '../types/places';

export const PRAGUE_CENTER: [number, number] = [50.0755, 14.4378];

export type MapStyle = 'default' | 'color' | 'satellite';

export const MAP_STYLES: { value: MapStyle; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'color', label: 'Color' },
  { value: 'satellite', label: 'Satellite' },
];

export const isMapStyle = (value: unknown): value is MapStyle => MAP_STYLES.some(style => style.value === value);

const TILE_OPTIONS: L.TileLayerOptions = {
  maxZoom: 19,
  minZoom: 1,
  updateWhenIdle: false,
  updateWhenZooming: false,
  keepBuffer: 2,
};

// "default" and "color" share these tiles; default is muted by the .leaflet-tile-pane filter in theme.css
const osmLayer = () =>
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    ...TILE_OPTIONS,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  });

// ČÚZK ortofoto: free official aerial imagery, Czech Republic only, which covers every listing
const satelliteLayer = () =>
  L.tileLayer('https://ags.cuzk.gov.cz/arcgis1/rest/services/ORTOFOTO_WM/MapServer/tile/{z}/{y}/{x}', {
    ...TILE_OPTIONS,
    attribution: '&copy; <a href="https://cuzk.gov.cz">ČÚZK</a>',
  });

export const createTileLayer = (style: MapStyle = 'default') => (style === 'satellite' ? satelliteLayer() : osmLayer());

// switching between default and color only toggles the filter class; the tiles stay loaded
export const applyMapStyle = (map: L.Map, layer: L.TileLayer | null, from: MapStyle | null, to: MapStyle): L.TileLayer => {
  const container = map.getContainer();
  MAP_STYLES.forEach(({ value }) => container.classList.toggle(`map-style-${value}`, value === to));
  if (layer && from !== null && (from === 'satellite') === (to === 'satellite')) return layer;
  layer?.remove();
  return createTileLayer(to).addTo(map);
};

export const locationPinIcon = () =>
  L.divIcon({
    className: 'location-pin-icon',
    html: '<span class="location-pin"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });

export const placePinIcon = (category: PlaceCategory) =>
  L.divIcon({
    className: 'place-pin-icon',
    html: `<span class="place-pin">${renderToStaticMarkup(createElement(PLACE_CATEGORY_META[category].icon, { size: 13 }))}</span>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

export const clusterIcon = (count: number) => {
  const size = count < 10 ? 34 : count < 50 ? 40 : count < 200 ? 46 : 52;
  return L.divIcon({
    className: 'cluster-pin-icon',
    html: `<span class="cluster-pin">${count}</span>`,
    iconSize: [size, size],
  });
};

export const pricePinIcon = (label: string) =>
  L.divIcon({
    className: 'price-pin-icon',
    html: `<span class="price-pin">${label}</span>`,
    iconSize: [0, 0],
    popupAnchor: [0, -14],
  });
