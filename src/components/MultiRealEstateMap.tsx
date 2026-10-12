import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Supercluster from 'supercluster';
import './OpenStreetMap.css';
import { useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { RealEstateMapPoint } from '../types/realEstate';
import { escapeHtml, formatArea, formatCompactPrice, formatPrice, formatPricePerM2, subCategoryLabel } from '../utils/format';
import { localityToString } from '../utils/realEstate';
import { applyMapStyle, clusterIcon, MapStyle, PRAGUE_CENTER, pricePinIcon } from '../utils/map';
import MapStyleSwitch, { useMapStyle } from './MapStyleSwitch';
import { PLACEHOLDER_IMAGE, showPlaceholder } from '../utils/placeholder';

interface MultiRealEstateMapProps {
    points: RealEstateMapPoint[];
    loading?: boolean;
    // the backend's cap; reaching it means older listings were left off the map
    limit?: number;
    height?: string;
    // identifies the filter set; returning with the same one restores the last map position instead of refitting
    viewKey?: string;
}

interface SavedView {
    viewKey: string;
    lat: number;
    lng: number;
    zoom: number;
    // marker whose popup was open
    popup: string | null;
}

const VIEW_STORAGE_ITEM = 'listingsMapView';

const readSavedView = (viewKey?: string): SavedView | null => {
    if (!viewKey) return null;
    try {
        const saved: SavedView | null = JSON.parse(sessionStorage.getItem(VIEW_STORAGE_ITEM) ?? 'null');
        return saved?.viewKey === viewKey ? saved : null;
    } catch {
        return null;
    }
};

const saveView = (viewKey: string, map: L.Map, popup: string | null) => {
    const { lat, lng } = map.getCenter();
    const view: SavedView = { viewKey, lat, lng, zoom: map.getZoom(), popup };
    try {
        sessionStorage.setItem(VIEW_STORAGE_ITEM, JSON.stringify(view));
    } catch {
        // private mode or full storage: the map just refits next time
    }
};

// listings sharing exact coordinates (flats in one building) become one location, so none hide under another
interface Location {
    points: RealEstateMapPoint[];
}

interface ClusterTotals {
    listings: number;
}

// clusters exist up to this zoom; past it a cluster can't split any further
const CLUSTER_MAX_ZOOM = 18;

const createIndex = (locations: Supercluster.PointFeature<Location>[]) =>
    new Supercluster<Location, ClusterTotals>({
        radius: 56,
        // supercluster assumes 512 px tiles; Leaflet's are 256, so without this the radius is halved
        extent: 256,
        maxZoom: CLUSTER_MAX_ZOOM,
        // a pair stays as two price labels, only 3+ nearby locations become a numbered circle
        minPoints: 3,
        map: properties => ({ listings: properties.points.length }),
        reduce: (totals, properties) => {
            totals.listings += properties.listings;
        },
    }).load(locations);

const summary = (point: RealEstateMapPoint) => [
    subCategoryLabel(point.mainCategory, point.subCategory),
    formatArea(point.sizeInM2),
    point.mainCategory === 'LAND' && point.pricePerM2 ? formatPricePerM2(point.pricePerM2, point.currency) : '',
].filter(Boolean).join(' · ');

const imageHtml = (src: string | null) =>
    src ? `<img src="${escapeHtml(src)}" alt="">` : `<img src="${PLACEHOLDER_IMAGE}" class="placeholder-img" alt="">`;

const popupHtml = (point: RealEstateMapPoint) => `
      <div class="map-popup">
        ${imageHtml(point.image)}
        <div class="map-popup-body">
          <div class="map-popup-price">${escapeHtml(formatPrice(point.lowestPrice, point.currency))}</div>
          <div class="map-popup-title">${escapeHtml(point.name)}</div>
          <div class="map-popup-meta">${escapeHtml(summary(point))}</div>
          <div class="map-popup-meta">${escapeHtml(localityToString(point.locality, true))}</div>
          <button class="map-popup-btn" data-estate-id="${escapeHtml(point.id)}">View listing</button>
        </div>
      </div>`;

const listPopupHtml = (points: RealEstateMapPoint[]) => `
      <div class="map-popup">
        <div class="map-popup-list-head">${points.length} listings here</div>
        <div class="map-popup-list">
          ${points.map(point => `
            <button class="map-popup-row" data-estate-id="${escapeHtml(point.id)}">
              ${imageHtml(point.image)}
              <span>
                <span class="map-popup-price">${escapeHtml(formatPrice(point.lowestPrice, point.currency))}</span>
                <span class="map-popup-meta">${escapeHtml(summary(point))}</span>
              </span>
            </button>`).join('')}
        </div>
      </div>`;

const sortByPrice = (points: RealEstateMapPoint[]) =>
    [...points].sort((a, b) => (a.lowestPrice <= 0 ? 1 : b.lowestPrice <= 0 ? -1 : a.lowestPrice - b.lowestPrice));

const locationLabel = (points: RealEstateMapPoint[]) => {
    const [cheapest] = sortByPrice(points);
    const price = formatCompactPrice(cheapest.lowestPrice, cheapest.currency);
    return escapeHtml(points.length > 1 ? `${price} +${points.length - 1}` : price);
};

const toLocations = (points: RealEstateMapPoint[]): Supercluster.PointFeature<Location>[] => {
    const byCoordinates = new Map<string, RealEstateMapPoint[]>();
    points.forEach(point => {
        const { latitude, longitude } = point.locality;
        if (latitude == null || longitude == null) return;
        const key = `${latitude},${longitude}`;
        byCoordinates.set(key, [...(byCoordinates.get(key) ?? []), point]);
    });
    return Array.from(byCoordinates.values(), group => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [group[0].locality.longitude!, group[0].locality.latitude!] },
        properties: { points: group },
    }));
};

const MultiRealEstateMap: React.FC<MultiRealEstateMapProps> = ({ points, loading = false, limit, height = '400px', viewKey }) => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerRef = useRef<L.LayerGroup | null>(null);
    const indexRef = useRef<Supercluster<Location, ClusterTotals> | null>(null);
    // markers are reused across re-renders, otherwise the map panning to fit an open popup would close it
    const markersRef = useRef(new Map<string, L.Marker>());
    const viewKeyRef = useRef(viewKey);
    viewKeyRef.current = viewKey;
    // set when the map opened at a saved position, so the first load of the same results doesn't refit it
    const restoredViewKeyRef = useRef<string | null>(null);
    const [mapStyle, setMapStyle] = useMapStyle();
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const appliedStyleRef = useRef<MapStyle | null>(null);
    const restoredPopupRef = useRef<string | null>(null);
    const openPopupRef = useRef<string | null>(null);
    // tearing the map down closes its popup; that must not be saved as the user closing it
    const unmountingRef = useRef(false);

    const persistView = () => {
        if (mapRef.current && viewKeyRef.current) {
            saveView(viewKeyRef.current, mapRef.current, openPopupRef.current);
        }
    };

    const renderMarkers = () => {
        const map = mapRef.current;
        const layer = layerRef.current;
        const index = indexRef.current;
        if (!map || !layer || !index) return;

        const bounds = map.getBounds().pad(0.25);
        const features = index.getClusters(
            [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
            map.getZoom(),
        );

        const next = new Map<string, L.Marker>();
        features.forEach(feature => {
            const [lng, lat] = feature.geometry.coordinates;
            const properties = feature.properties;

            if ('cluster' in properties && properties.cluster) {
                const key = `c${properties.cluster_id}`;
                const marker = markersRef.current.get(key) ?? L.marker([lat, lng], {
                    icon: clusterIcon(properties.listings),
                    riseOnHover: true,
                }).on('click', () => {
                    const expansionZoom = index.getClusterExpansionZoom(properties.cluster_id);
                    if (expansionZoom <= CLUSTER_MAX_ZOOM) {
                        map.setView([lat, lng], expansionZoom);
                    } else {
                        const leaves = index.getLeaves(properties.cluster_id, Infinity).flatMap(leaf => leaf.properties.points);
                        L.popup().setLatLng([lat, lng]).setContent(listPopupHtml(sortByPrice(leaves))).openOn(map);
                    }
                });
                next.set(key, marker);
            } else {
                const group = (properties as Location).points;
                const key = `p${group.map(point => point.id).join(',')}`;
                const marker = markersRef.current.get(key) ?? L.marker([lat, lng], {
                    icon: pricePinIcon(locationLabel(group)),
                    riseOnHover: true,
                })
                    .bindPopup(group.length > 1 ? listPopupHtml(sortByPrice(group)) : popupHtml(group[0]))
                    .on('popupopen', () => {
                        openPopupRef.current = key;
                        persistView();
                    })
                    .on('popupclose', () => {
                        if (unmountingRef.current || openPopupRef.current !== key) return;
                        openPopupRef.current = null;
                        persistView();
                    });
                next.set(key, marker);
            }
        });

        markersRef.current.forEach((marker, key) => !next.has(key) && layer.removeLayer(marker));
        next.forEach((marker, key) => !markersRef.current.has(key) && layer.addLayer(marker));
        markersRef.current = next;
    };

    useEffect(() => {
        if (!containerRef.current) return;

        const saved = readSavedView(viewKey);
        restoredViewKeyRef.current = saved?.viewKey ?? null;
        restoredPopupRef.current = saved?.popup ?? null;
        unmountingRef.current = false;
        const map = L.map(containerRef.current, {
            center: saved ? [saved.lat, saved.lng] : PRAGUE_CENTER,
            zoom: saved?.zoom ?? 11,
        });
        layerRef.current = L.layerGroup().addTo(map);
        map.on('moveend', renderMarkers);
        map.on('moveend', persistView);

        map.on('popupopen', (e) => {
            const element = e.popup.getElement();
            element?.querySelectorAll<HTMLElement>('[data-estate-id]').forEach(target => {
                target.onclick = () => navigate(`/real-estates/${target.dataset.estateId}`);
            });
            element?.querySelectorAll('img').forEach(image => {
                if (image.complete && image.naturalWidth === 0) showPlaceholder(image);
                else image.onerror = () => showPlaceholder(image);
            });
        });

        const resizeObserver = new ResizeObserver(() => map.invalidateSize());
        resizeObserver.observe(containerRef.current);
        mapRef.current = map;

        return () => {
            unmountingRef.current = true;
            resizeObserver.disconnect();
            map.remove();
            mapRef.current = null;
            tileLayerRef.current = null;
            appliedStyleRef.current = null;
            layerRef.current = null;
            markersRef.current = new Map();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        const layer = layerRef.current;
        if (!map || !layer) return;

        const locations = toLocations(points);
        indexRef.current = createIndex(locations);
        layer.clearLayers();
        markersRef.current = new Map();

        const coordinates = locations.map(({ geometry: { coordinates: [lng, lat] } }): [number, number] => [lat, lng]);
        const backOnSameResults = coordinates.length > 0 && restoredViewKeyRef.current === viewKeyRef.current;
        if (coordinates.length > 0) {
            restoredViewKeyRef.current = null;
            if (!backOnSameResults && coordinates.length === 1) {
                map.setView(coordinates[0], 15);
            } else if (!backOnSameResults) {
                map.fitBounds(L.latLngBounds(coordinates), { padding: [40, 40], maxZoom: 15, animate: false });
            }
        }
        // fitBounds skips moveend when the view doesn't change
        renderMarkers();

        if (coordinates.length > 0) {
            const popup = backOnSameResults ? restoredPopupRef.current : null;
            restoredPopupRef.current = null;
            if (popup) markersRef.current.get(popup)?.openPopup();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points]);

    useEffect(() => {
        if (!mapRef.current) return;
        tileLayerRef.current = applyMapStyle(mapRef.current, tileLayerRef.current, appliedStyleRef.current, mapStyle);
        appliedStyleRef.current = mapStyle;
    }, [mapStyle]);

    const capped = limit !== undefined && points.length >= limit;

    return (
        <div className="map-container" style={{ height }}>
            <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
            {loading && points.length === 0 && (
                <div className="loading-block" style={{ position: 'absolute', inset: 0, zIndex: 1000, minHeight: 0, background: 'var(--app-surface-2)' }}>
                    <Spinner animation="border" size="sm" role="status" />
                    Loading map…
                </div>
            )}
            <MapStyleSwitch value={mapStyle} onChange={setMapStyle} />
            {(points.length > 0 || !loading) && (
                <div className="map-count" title="Listings without coordinates from the portal aren't shown on the map">
                    {loading && <Spinner animation="border" size="sm" role="status" />}
                    {capped
                        ? `Newest ${points.length.toLocaleString('cs-CZ')} on map`
                        : `${points.length.toLocaleString('cs-CZ')} on map`}
                </div>
            )}
        </div>
    );
};

export default MultiRealEstateMap;
