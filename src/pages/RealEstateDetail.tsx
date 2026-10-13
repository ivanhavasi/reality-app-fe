import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button, Spinner, Carousel, Table } from 'react-bootstrap';
import { useRealEstate } from '../context/RealEstateContext';
import { AreaPriceComparison, RealEstate } from '../types/realEstate';
import { ArrowLeft, ArrowUpRight, Building, ExclamationTriangle, GeoAlt } from 'react-bootstrap-icons';
import { fetchAreaPriceComparison, fetchNearbyPlaces, fetchRealEstateById } from '../services/RealEstateService';
import NearbyPlaces from '../components/NearbyPlaces';
import { NearbyPlace } from '../types/places';
import AreaPrice from '../components/AreaPrice';
import FavoriteButton from '../components/FavoriteButton';
import OpenStreetMap from '../components/OpenStreetMap';
import { EmptyState } from '../components/ui';
import { SIZE_LABEL, TRANSACTION_TYPE_LABELS } from '../types/property';
import { buildingTypeLabel, formatArea, formatPrice, formatPricePerM2, subCategoryLabel, typeLabel } from '../utils/format';
import { getLowestPrice, localityToString } from '../utils/realEstate';
import { PLACEHOLDER_IMAGE, showPlaceholder } from '../utils/placeholder';

interface RealEstateDetailProps {
  token?: string;
}

interface Source {
  provider: string;
  price: number;
  pricePerM2: number | null;
  url: string;
  isOriginal: boolean;
}

const RealEstateDetail: React.FC<RealEstateDetailProps> = ({ token }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { findEstateById } = useRealEstate();
  const [realEstate, setRealEstate] = useState<RealEstate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [areaPrice, setAreaPrice] = useState<AreaPriceComparison | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);

  useEffect(() => {
    if (id) {
      loadRealEstateDetails(id);
    }
  }, [id]);

  // optional extra: the detail stays as it is when the comparison can't be made or fails
  useEffect(() => {
    setAreaPrice(null);
    if (!id) return;
    const controller = new AbortController();
    fetchAreaPriceComparison(id, controller.signal)
      .then(setAreaPrice)
      .catch(() => undefined);
    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    setNearbyPlaces([]);
    if (!id) return;
    const controller = new AbortController();
    fetchNearbyPlaces(id, controller.signal)
      .then(setNearbyPlaces)
      .catch(() => undefined);
    return () => controller.abort();
  }, [id]);

  const loadRealEstateDetails = async (estateId: string) => {
    try {
      setLoading(true);
      setError(null);
      setImageIndex(0);

      // Try to fetch from the new endpoint first (accessible to all users)
      try {
        const estateData = await fetchRealEstateById(estateId);
        setRealEstate(estateData);
        setLoading(false);
        return;
      } catch (fetchError) {
        console.warn("Could not fetch from public endpoint, falling back to context:", fetchError);

        // Fallback to context if public endpoint fails
        const estate = findEstateById(estateId);
        if (estate) {
          setRealEstate(estate);
        } else {
          setError('Real estate not found');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load real estate details');
      console.error('Error loading real estate details:', err);
    } finally {
      setLoading(false);
    }
  };

  // a shared link opened in a fresh tab has no history entry to go back to
  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/real-estates'));

  const backLink = (
    <button type="button" className="back-link" onClick={goBack}>
      <ArrowLeft size={14} />
      Back
    </button>
  );

  if (loading) {
    return (
      <div className="loading-block">
        <Spinner animation="border" size="sm" role="status" />
        Loading listing…
      </div>
    );
  }

  if (error || !realEstate) {
    return (
      <>
        {backLink}
        <EmptyState
          icon={ExclamationTriangle}
          title="Listing not available"
          text={error || 'This listing could not be found. It may have been removed from the source portal.'}
        />
      </>
    );
  }

  const isLand = realEstate.mainCategory === 'LAND';
  const isHouse = realEstate.mainCategory === 'HOUSE';
  const isRent = realEstate.transactionType === 'RENT';
  const address = localityToString(realEstate.locality, true);
  const lowestPrice = getLowestPrice(realEstate);
  const hasSaving = lowestPrice < realEstate.price;
  const images = realEstate.images || [];

  // price 0 means "on request" and must not rank as the cheapest source
  const sources: Source[] = [
    { provider: realEstate.provider, price: realEstate.price, pricePerM2: realEstate.pricePerM2, url: realEstate.url, isOriginal: true },
    ...(realEstate.duplicates || []).map(duplicate => ({
      provider: duplicate.provider,
      price: duplicate.price,
      pricePerM2: duplicate.pricePerM2,
      url: duplicate.url,
      isOriginal: false,
    })),
  ].sort((a, b) => (a.price <= 0 ? 1 : b.price <= 0 ? -1 : a.price - b.price));
  const cheapest = sources[0];
  const otherSources = sources.filter(source => !source.isOriginal);

  const facts = [
    { label: isRent ? 'Monthly rent' : 'Price', value: formatPrice(lowestPrice, realEstate.currency) },
    { label: 'Price per m²', value: formatPricePerM2(realEstate.pricePerM2, realEstate.currency) },
    { label: SIZE_LABEL[realEstate.mainCategory] ?? 'Size', value: formatArea(realEstate.sizeInM2) },
    ...(isHouse ? [{ label: 'Plot area', value: formatArea(realEstate.landSizeInM2) }] : []),
    {
      label: isLand ? 'Plot type' : isHouse ? 'House type' : 'Layout',
      value: subCategoryLabel(realEstate.mainCategory, realEstate.subCategory) || '—',
    },
    { label: 'Category', value: buildingTypeLabel(realEstate.mainCategory) },
    { label: 'Listed on', value: sources.length > 1 ? `${sources.length} portals` : realEstate.provider },
  ];

  return (
    <>
      {backLink}

      <div className="detail-head">
        <div>
          <div className="detail-eyebrow">
            {[typeLabel(realEstate.mainCategory, realEstate.subCategory), TRANSACTION_TYPE_LABELS[realEstate.transactionType]]
              .filter(Boolean)
              .join(' · ')}
          </div>
          <h1 className="detail-title">{realEstate.name}</h1>
          {address && (
            <div className="detail-address">
              <GeoAlt size={14} />
              {address}
            </div>
          )}
        </div>
        <FavoriteButton listingId={realEstate.id} variant="button" />
      </div>

      <div className="detail-grid">
        <div style={{ minWidth: 0 }}>
          {images.length > 0 ? (
            <>
              <div className="gallery">
                <Carousel
                  activeIndex={imageIndex}
                  onSelect={setImageIndex}
                  interval={null}
                  indicators={false}
                  controls={images.length > 1}
                >
                  {images.map((image, index) => (
                    <Carousel.Item key={index}>
                      <img
                        src={image}
                        alt={`${realEstate.name} (${index + 1} of ${images.length})`}
                        loading={index === 0 ? 'eager' : 'lazy'}
                        onError={(e) => showPlaceholder(e.currentTarget)}
                      />
                    </Carousel.Item>
                  ))}
                </Carousel>
                {images.length > 1 && (
                  <span className="gallery-count">
                    {imageIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="thumbs">
                  {images.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`thumb${index === imageIndex ? ' is-active' : ''}`}
                      onClick={() => setImageIndex(index)}
                      aria-label={`Show photo ${index + 1}`}
                    >
                      <img src={image} alt="" loading="lazy" onError={(e) => showPlaceholder(e.currentTarget)} />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="gallery gallery-empty">
              <div className="text-center">
                <img src={PLACEHOLDER_IMAGE} alt="" width={96} height={96} />
                <div>No photos for this listing</div>
              </div>
            </div>
          )}

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Key facts</h2>
            </div>
            <div className="facts-grid">
              {facts.map(fact => (
                <div className="fact" key={fact.label}>
                  <div className="fact-label">{fact.label}</div>
                  <div className="fact-value">{fact.value}</div>
                </div>
              ))}
            </div>
          </section>

          {realEstate.description && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Description</h2>
              </div>
              <p className="description">{realEstate.description}</p>
            </section>
          )}

          <section className="section">
            <div className="section-head">
              <h2 className="section-title">Location</h2>
              <a
                className="btn btn-ghost btn-sm"
                href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(address || realEstate.locality.city || '')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in OpenStreetMap
                <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="map-frame">
              <OpenStreetMap realEstate={realEstate} height="380px" places={nearbyPlaces} />
            </div>
          </section>

          {nearbyPlaces.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Nearby</h2>
              </div>
              <NearbyPlaces places={nearbyPlaces} />
            </section>
          )}

          {sources.length > 1 && (
            <section className="section">
              <div className="section-head">
                <h2 className="section-title">Price across portals</h2>
              </div>
              <div className="surface overflow-hidden">
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>Portal</th>
                        <th className="text-end">Price</th>
                        <th className="text-end">Per m²</th>
                        <th className="text-end">vs. lowest</th>
                        <th aria-label="Link" />
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((source, index) => (
                        <tr key={index}>
                          <td>
                            <span className="fw-semibold">{source.provider}</span>
                            {index === 0 && source.price > 0 && <span className="chip chip-positive ms-2">Lowest</span>}
                          </td>
                          <td className="text-end text-nowrap tabular fw-semibold">{formatPrice(source.price, realEstate.currency)}</td>
                          <td className="text-end text-nowrap tabular text-2">{formatPricePerM2(source.pricePerM2, realEstate.currency)}</td>
                          <td className="text-end text-nowrap tabular text-2">
                            {index === 0 || source.price <= 0 || cheapest.price <= 0
                              ? '—'
                              : `+${formatPrice(source.price - cheapest.price, realEstate.currency)}`}
                          </td>
                          <td className="text-end">
                            <a className="btn btn-ghost btn-sm" href={source.url} target="_blank" rel="noopener noreferrer">
                              Open
                              <ArrowUpRight size={12} />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </section>
          )}
        </div>

        <aside className="detail-aside">
          <div className="price-card">
            <div className="price-card-label">{isRent ? 'Monthly rent' : 'Asking price'}</div>
            <div className="price-card-value">{formatPrice(lowestPrice, realEstate.currency)}</div>
            <div className="price-card-meta">
              {hasSaving && (
                <>
                  <span className="text-decoration-line-through">{formatPrice(realEstate.price, realEstate.currency)}</span>
                  <span className="saving">−{Math.round((1 - lowestPrice / realEstate.price) * 100)}% on {cheapest.provider}</span>
                </>
              )}
              {!hasSaving && realEstate.pricePerM2 != null && (
                <span>{formatPricePerM2(realEstate.pricePerM2, realEstate.currency)}</span>
              )}
            </div>

            {areaPrice && (
              <AreaPrice comparison={areaPrice} buildingType={realEstate.mainCategory} currency={realEstate.currency} />
            )}

            <Button
              variant="primary"
              size="lg"
              className="w-100 mt-3"
              href={realEstate.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on {realEstate.provider}
              <ArrowUpRight size={14} />
            </Button>

            {otherSources.length > 0 && (
              <div className="price-card-sources">
                <div className="fact-label mb-1">Also listed on</div>
                {otherSources.map((source, index) => (
                  <a key={index} className="source-row" href={source.url} target="_blank" rel="noopener noreferrer">
                    <span className="source-name">
                      <Building size={13} className="text-3" />
                      {source.provider}
                    </span>
                    <span className="source-price">
                      {formatPrice(source.price, realEstate.currency)}
                      <ArrowUpRight size={11} className="ms-1" />
                    </span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default RealEstateDetail;
