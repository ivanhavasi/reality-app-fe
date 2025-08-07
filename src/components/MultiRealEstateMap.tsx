import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OpenStreetMap.css';
import { RealEstate } from '../types/realEstate';
import { useNavigate } from 'react-router-dom';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MultiRealEstateMapProps {
    realEstates: RealEstate[];
    height?: string;
}

// Shared map utilities - extracted from OpenStreetMap.tsx
class MapUtilities {
    static initializeMapContainer(mapRef: React.RefObject<HTMLDivElement | null>): L.Map {
        if (!mapRef.current) {
            throw new Error('Map container not found');
        }

        // Get container dimensions and set explicit dimensions
        const containerWidth = mapRef.current.clientWidth;
        const containerHeight = mapRef.current.clientHeight;

        if (containerWidth > 0) {
            mapRef.current.style.width = `${containerWidth}px`;
        } else {
            mapRef.current.style.width = '100%';
        }

        if (containerHeight > 0) {
            mapRef.current.style.height = `${containerHeight}px`;
        } else {
            mapRef.current.style.height = '100%';
        }

        // Initialize the map
        const map = L.map(mapRef.current, {
            center: [50.0755, 14.4378], // Prague center
            zoom: 11,
            zoomControl: true,
            attributionControl: true,
            fadeAnimation: true,
            markerZoomAnimation: true,
            trackResize: true,
        });

        // Add tile layer
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            minZoom: 1,
            updateWhenIdle: false,
            updateWhenZooming: false,
            keepBuffer: 2,
        });

        tileLayer.on('tileerror', (error) => {
            console.warn('Tile loading error:', error);
        });

        tileLayer.addTo(map);
        return map;
    }

    static invalidateMapSize(map: L.Map) {
        map.invalidateSize(true);

        const invalidateWithDelay = () => {
            if (map) {
                map.invalidateSize(true);
            }
        };

        setTimeout(invalidateWithDelay, 100);
        setTimeout(invalidateWithDelay, 300);
        setTimeout(invalidateWithDelay, 500);
    }

    static async geocodeAddress(locality: any): Promise<[number, number] | null> {
        const { city, district, street, streetNumber } = locality;

        const searchQuery = [];
        if (street) {
            if (streetNumber) {
                searchQuery.push(`${street} ${streetNumber}`);
            } else {
                searchQuery.push(street);
            }
        }
        if (district) searchQuery.push(district);
        if (city) searchQuery.push(city);
        searchQuery.push('Czech Republic');

        if (searchQuery.length === 1) {
            return null; // Only "Czech Republic", not enough to geocode
        }

        const searchAddress = searchQuery.join(', ');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=cz`;

        try {
            const response = await fetch(nominatimUrl, {
                headers: { 'User-Agent': 'RealEstateApp/1.0' }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);

                if (!isNaN(lat) && !isNaN(lon)) {
                    return [lat, lon];
                }
            }
            return null;
        } catch (error) {
            console.warn(`Geocoding failed for address: ${searchAddress}`, error);
            return null;
        }
    }

    static formatCurrency(price: number, currency: string): string {
        if (currency === 'CZK') {
            return `${price.toLocaleString()} Kč`;
        }
        return `${price.toLocaleString()} ${currency}`;
    }

    static getAddressString(locality: any): string {
        const { city, district, street, streetNumber } = locality;
        const parts = [];
        if (street) parts.push(street);
        if (streetNumber) parts.push(streetNumber);
        if (district) parts.push(district);
        if (city) parts.push(city);
        return parts.join(', ') || 'Address not available';
    }
}

const MultiRealEstateMap: React.FC<MultiRealEstateMapProps> = ({ realEstates, height = '400px' }) => {
    const navigate = useNavigate();
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const markersRef = useRef<L.Marker[]>([]);
    const geocodingQueueRef = useRef<RealEstate[]>([]);

    const createMarkerForEstate = (estate: RealEstate, location: [number, number], map: L.Map): L.Marker => {
        const marker = L.marker(location);

        let popupContent = `
      <div style="width: 220px">
        <div style="font-weight: bold; margin-bottom: 5px;">${estate.name}</div>
    `;

        if (estate.images && estate.images.length > 0) {
            popupContent += `
        <img src="${estate.images[0]}" alt="${estate.name}" 
          style="width: 100%; height: 120px; object-fit: cover; margin-bottom: 5px; border-radius: 4px;">
      `;
        }

        popupContent += `
      <div style="margin-bottom: 5px;">
        <strong>${MapUtilities.formatCurrency(estate.price, estate.currency)}</strong>
      </div>
      <div style="margin-bottom: 5px;">
        ${estate.sizeInM2} m² - ${estate.subCategory}
      </div>
      <div style="font-size: 0.9em; color: #666; margin-bottom: 5px;">
        ${MapUtilities.getAddressString(estate.locality)}
      </div>
      <button 
        class="popup-view-btn" 
        data-estate-id="${estate.id}" 
        style="width: 100%; padding: 5px; background-color: #0d6efd; color: white; border: none; 
        border-radius: 4px; cursor: pointer; margin-top: 5px;">
        View Property
      </button>
    </div>`;

        marker.bindPopup(popupContent);
        marker.addTo(map);
        markersRef.current.push(marker);
        return marker;
    };

    // Process geocoding in the background after initial map load
    const processGeocodingQueue = async () => {
        const properties = geocodingQueueRef.current;
        if (properties.length === 0 || !mapInstanceRef.current) return;

        // Process in smaller batches to be API-friendly
        const batchSize = 2;
        const delay = 300; // ms between batches

        for (let i = 0; i < properties.length; i += batchSize) {
            if (!mapInstanceRef.current) break; // Stop if map was unmounted

            const batch = properties.slice(i, i + batchSize);
            const batchPromises = batch.map(async (estate) => {
                try {
                    const coords = await MapUtilities.geocodeAddress(estate.locality);
                    if (coords && mapInstanceRef.current) {
                        createMarkerForEstate(estate, coords, mapInstanceRef.current);
                    }
                } catch (err) {
                    console.warn(`Geocoding failed for property ${estate.id}`, err);
                }
            });

            await Promise.all(batchPromises);

            // Don't delay after the last batch
            if (i + batchSize < properties.length) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // Clear the queue after processing
        geocodingQueueRef.current = [];
    };

    const initializeMap = async () => {
        try {
            setLoading(true);
            setError(null);

            // Clean up existing map and markers
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            markersRef.current = [];
            geocodingQueueRef.current = [];

            if (mapRef.current) {
                mapRef.current.innerHTML = '';
            }

            // Initialize map using shared utilities
            const map = MapUtilities.initializeMapContainer(mapRef);
            mapInstanceRef.current = map;

            // Apply aggressive map invalidation (similar to OpenStreetMap.tsx)
            map.invalidateSize(true);

            // Multiple invalidations with timeouts
            const invalidateMapAggressively = () => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.invalidateSize(true);
                    const container = mapInstanceRef.current.getContainer();
                    if (container) {
                        // Force browser repaint
                        const width = container.offsetWidth;
                        const height = container.offsetHeight;
                        console.log(`Map container size: ${width}x${height}`);
                    }
                }
            };

            // Multiple invalidations at different times
            setTimeout(invalidateMapAggressively, 100);
            setTimeout(invalidateMapAggressively, 300);
            setTimeout(invalidateMapAggressively, 500);

            map.whenReady(() => {
                try {
                    // Separate properties with and without coordinates
                    const propertiesWithCoords: RealEstate[] = [];
                    const propertiesWithoutCoords: RealEstate[] = [];
                    const validCoordinates: [number, number][] = [];

                    // First pass: only process properties with coordinates
                    realEstates.forEach(estate => {
                        const { latitude, longitude } = estate.locality;
                        if (latitude && longitude) {
                            propertiesWithCoords.push(estate);
                            validCoordinates.push([latitude, longitude]);
                            createMarkerForEstate(estate, [latitude, longitude], map);
                        } else {
                            propertiesWithoutCoords.push(estate);
                        }
                    });

                    // Queue properties without coordinates for background processing
                    geocodingQueueRef.current = propertiesWithoutCoords;

                    // Show map immediately with properties that have coordinates
                    if (validCoordinates.length > 0) {
                        try {
                            // Give the map a moment to stabilize
                            setTimeout(() => {
                                if (!mapInstanceRef.current) return;

                                // Force size invalidation again
                                mapInstanceRef.current.invalidateSize(true);

                                if (validCoordinates.length === 1) {
                                    mapInstanceRef.current.setView(validCoordinates[0], 15);
                                } else {
                                    try {
                                        const bounds = L.latLngBounds(validCoordinates);
                                        mapInstanceRef.current.fitBounds(bounds, {
                                            padding: [50, 50],
                                            maxZoom: 15,
                                            animate: false // Disable animation for better performance
                                        });
                                    } catch (err) {
                                        console.warn('Error fitting bounds, falling back to default view:', err);
                                        mapInstanceRef.current.setView([50.0755, 14.4378], 11);
                                    }
                                }
                            }, 100);
                        } catch (err) {
                            console.warn('Error setting map view:', err);
                            if (mapInstanceRef.current) {
                                mapInstanceRef.current.setView([50.0755, 14.4378], 11);
                            }
                        }
                    } else {
                        if (mapInstanceRef.current) {
                            mapInstanceRef.current.setView([50.0755, 14.4378], 11);
                        }
                    }

                    // Handle popup interactions
                    map.on('popupopen', (e) => {
                        const popup = e.popup;
                        const container = popup.getElement();
                        const viewBtn = container?.querySelector('.popup-view-btn');

                        if (viewBtn) {
                            viewBtn.addEventListener('click', (e) => {
                                e.stopPropagation();
                                const estateId = (e.target as HTMLElement).getAttribute('data-estate-id');
                                if (estateId) {
                                    navigate(`/real-estates/${estateId}`);
                                }
                            });
                        }
                    });

                    // Map is loaded with coordinate-based properties, mark as ready
                    setLoading(false);

                    // Start background geocoding AFTER the map is shown
                    if (geocodingQueueRef.current.length > 0) {
                        // Slight delay to ensure map is fully rendered
                        setTimeout(() => {
                            processGeocodingQueue().catch(err => {
                                console.warn('Background geocoding error:', err);
                            });
                        }, 1000);
                    }
                } catch (err) {
                    console.error('Error during map initialization:', err);
                    setError('Failed to initialize map');
                    setLoading(false);
                }
            });
        } catch (err) {
            console.error('Error initializing map component:', err);
            setError('Failed to initialize map component');
            setLoading(false);
        }
    };

    useEffect(() => {
        initializeMap();

        // Cleanup on unmount
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
            markersRef.current = [];
            geocodingQueueRef.current = [];
        };
    }, [realEstates]);

    // Resize observer to handle dynamic height changes
    useEffect(() => {
        const handleResize = () => {
            if (mapInstanceRef.current) {
                MapUtilities.invalidateMapSize(mapInstanceRef.current);
            }
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (mapRef.current) {
            resizeObserver.observe(mapRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [mapRef]);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div style={{ position: 'relative', height }}>
            <div ref={mapRef} className="map-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
            {loading && <div className="loading-indicator">Loading map...</div>}
        </div>
    );
};

export default MultiRealEstateMap;
