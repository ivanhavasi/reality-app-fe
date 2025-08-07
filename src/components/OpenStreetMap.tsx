import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OpenStreetMap.css';
import { RealEstate } from '../types/realEstate';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface OpenStreetMapProps {
  realEstate: RealEstate;
  height?: string;
}

const OpenStreetMap: React.FC<OpenStreetMapProps> = ({ realEstate, height = '450px' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { latitude, longitude, city, district, street, streetNumber } = realEstate.locality;

  const initializeMap = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if map container exists and is properly mounted
      if (!mapRef.current) {
        throw new Error('Map container not found');
      }

      // Clean up any existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Clear the container to ensure it's clean
      if (mapRef.current) {
        mapRef.current.innerHTML = '';
      }

      // Get container dimensions before map initialization
      const containerWidth = mapRef.current.clientWidth;
      const containerHeight = mapRef.current.clientHeight;

      // Log container dimensions for debugging
      console.log(`Map container initial dimensions: ${containerWidth}x${containerHeight}`);

      // Force explicit dimensions on the container to avoid zero-size issues
      if (mapRef.current) {
        // Set explicit dimensions in pixels to avoid percentage calculations issues
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
      }

      // Default center (Prague)
      const mapCenter: [number, number] = [50.0755, 14.4378];
      const zoomLevel = 12;

      // Initialize the map with explicit size control options
      const map = L.map(mapRef.current, {
        center: mapCenter,
        zoom: zoomLevel,
        zoomControl: true,
        attributionControl: true,
        fadeAnimation: true,  // Enable fade animations for smoother rendering
        markerZoomAnimation: true,
        // Handle container size issues
        trackResize: true,
      });

      // Add OpenStreetMap tile layer with better error handling
      const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 1,
        updateWhenIdle: false,  // Update tiles even when not idle
        updateWhenZooming: false, // Update tiles even during zoom
        keepBuffer: 2, // Keep more tiles in buffer
      });

      // Add error handling for tile loading issues
      tileLayer.on('tileerror', (error) => {
        console.warn('Tile loading error:', error);
      });

      tileLayer.addTo(map);
      mapInstanceRef.current = map;

      // Critical: Force multiple invalidations with delays between them
      // This is key to fixing the issue where the map only works after a manual resize
      map.invalidateSize(true);

      // Staggered invalidations to catch any late layout changes
      const invalidateWithDelay = () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize(true);

          // Ensure the map container size is recognized
          const container = mapInstanceRef.current.getContainer();
          if (container) {
            // Force browser repaint by accessing the container's dimensions
            const width = container.offsetWidth;
            const height = container.offsetHeight;
            console.log(`Map invalidated with container size: ${width}x${height}`);
          }
        }
      };

      // Multiple invalidations at different times to catch all possible layout changes
      setTimeout(invalidateWithDelay, 100);
      setTimeout(invalidateWithDelay, 300);
      setTimeout(invalidateWithDelay, 500);

      // Wait for the map to be ready
      map.whenReady(async () => {
        try {
          // Force another invalidation
          map.invalidateSize(true);

          // Try to use coordinates first
          if (latitude && longitude) {
            const propertyLocation: [number, number] = [latitude, longitude];
            map.setView(propertyLocation, 16);

            // Add marker for the exact location
            const marker = L.marker(propertyLocation);
            marker.bindPopup(`
              <div>
                <strong>Property Location</strong><br>
                ${getAddressString()}<br>
                <small>GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</small>
              </div>
            `);
            marker.addTo(map);
          } else {
            // Use API search to find the location
            await searchAndHighlightStreet(map);
          }

          // Final invalidation after all content is loaded
          setTimeout(() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.invalidateSize(true);
            }
          }, 300);
        } catch (err) {
          console.error('Error in location setup:', err);
        }

        setLoading(false);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to load map');
      setLoading(false);
    }
  };

  const getAddressString = (): string => {
    const parts = [];
    if (street) parts.push(street);
    if (streetNumber) parts.push(streetNumber);
    if (district) parts.push(district);
    if (city) parts.push(city);
    return parts.join(', ') || 'Address not available';
  };

  const searchAndHighlightStreet = async (map: L.Map) => {
    // Simplified approach - just use Nominatim to find the street location
    try {
      // Build search query with just the essential information
      const searchQuery = [];
      if (street) searchQuery.push(street);
      if (city) searchQuery.push(city);
      searchQuery.push('Czech Republic');

      const searchAddress = searchQuery.join(', ');
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1&countrycodes=cz`;

      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'RealEstateApp/1.0'
        }
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
          // Center on the found location and add a simple marker
          map.setView([lat, lon], 16);

          const marker = L.marker([lat, lon]);
          marker.bindPopup(`<strong>${street || 'Location'}</strong><br>${city || ''}`);
          marker.addTo(map);
          return;
        }
      }

      // Fallback to default location if search failed
      showDefaultLocation(map);
    } catch (err) {
      console.error('Error in street search:', err);
      showDefaultLocation(map);
    }
  };

  const showDefaultLocation = (map: L.Map) => {
    // Always center on the city or fallback location
    const defaultCity = city || 'Prague';
    const cityCenter: [number, number] = [50.0755, 14.4378]; // Prague coordinates

    // Always center the map on the default location
    map.setView(cityCenter, 12);

    const marker = L.marker(cityCenter);
    marker.bindPopup(`
      <div>
        <strong>${defaultCity}</strong><br>
        ${getAddressString() || 'General area'}<br>
        <small>Approximate location</small>
      </div>
    `);
    marker.addTo(map);
    marker.openPopup();
  };


  useEffect(() => {
    // Delay initialization to ensure DOM is ready
    const timer = setTimeout(() => {
      if (mapRef.current && !mapInstanceRef.current) {
        initializeMap();
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [realEstate]);

  // Handle window resize to fix map display issues
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        setTimeout(() => {
          mapInstanceRef.current?.invalidateSize();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resize observer to handle container size changes
  useEffect(() => {
    if (!mapRef.current) return;

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect) {
          const { width, height } = entry.contentRect;
          if (mapInstanceRef.current) {
            // Explicitly set width and height to avoid any percentage-based calculations
            mapInstanceRef.current.getContainer().style.width = `${width}px`;
            mapInstanceRef.current.getContainer().style.height = `${height}px`;

            // Invalidate map size to trigger re-calculation of dimensions
            mapInstanceRef.current.invalidateSize();
          }
        }
      }
    });

    resizeObserver.observe(mapRef.current);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
    };
  }, [mapRef]);

  if (error) {
    return (
      <div 
        style={{ 
          height, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f8f9fa', 
          color: '#6c757d',
          borderRadius: '0.375rem',
          border: '1px solid #dee2e6'
        }}
      >
        <div className="text-center">
          <i className="fas fa-map-marked-alt fa-2x mb-2"></i>
          <div>Map could not be loaded</div>
          <small>{error}</small>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, width: '100%' }} className="map-container">
      {loading && (
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(248, 249, 250, 0.9)',
            zIndex: 1000,
            borderRadius: '0.375rem'
          }}
        >
          <div className="text-center">
            <div className="spinner-border text-primary mb-2" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Loading map...</div>
          </div>
        </div>
      )}
      <div
        ref={mapRef}
        style={{
          height: '100%',
          width: '100%',
          borderRadius: '0.375rem',
          border: '1px solid #dee2e6',
          position: 'relative',
          zIndex: 0,
          overflow: 'hidden'
        }}
        className="leaflet-container"
      />
    </div>
  );
};

export default OpenStreetMap;
