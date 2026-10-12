import L from 'leaflet';

export const PRAGUE_CENTER: [number, number] = [50.0755, 14.4378];

// muted via the .leaflet-tile-pane filter in theme.css so the pins carry the color
export const createTileLayer = () =>
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    minZoom: 1,
    updateWhenIdle: false,
    updateWhenZooming: false,
    keepBuffer: 2,
  });

export const locationPinIcon = () =>
  L.divIcon({
    className: 'location-pin-icon',
    html: '<span class="location-pin"></span>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });

export const pricePinIcon = (label: string) =>
  L.divIcon({
    className: 'price-pin-icon',
    html: `<span class="price-pin">${label}</span>`,
    iconSize: [0, 0],
    popupAnchor: [0, -14],
  });
