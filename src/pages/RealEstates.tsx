import React, { useEffect, useRef, useState } from 'react';
import { Button, Form, Pagination, Collapse } from 'react-bootstrap';
import { ArrowCounterclockwise, ChevronLeft, ChevronRight, ExclamationTriangle, Search, Sliders, X } from 'react-bootstrap-icons';
import { useRealEstate } from '../context/RealEstateContext';
import { fetchRealEstateMapPoints, fetchRealEstates, FetchRealEstatesOptions, SortDirection } from '../services/RealEstateService';
import { RealEstate, RealEstateMapPoint } from '../types/realEstate';
import {
  BUILDING_TYPE_META,
  BuildingType,
  ENABLED_BUILDING_TYPES,
  ENABLED_LAND_SUB_TYPES,
  OPEN_PRICE_MAX,
  OPEN_SIZE_MAX,
  PRICE_RANGE,
  SIZE_RANGE,
  TransactionType,
} from '../types/property';
import MultiRealEstateMap from '../components/MultiRealEstateMap';
import DualRangeSlider from '../components/DualRangeSlider';
import RealEstateCard from '../components/RealEstateCard';
import { EmptyState, ListingSkeletonGrid, PageHeader, Segmented } from '../components/ui';

interface RealEstatesProps {
  token?: string;
}

interface SearchState {
  search: string;
  transaction: TransactionType;
  building: BuildingType;
  sizeMin: number;
  sizeMax: number;
  priceMin: number;
  priceMax: number;
}

const MAP_POINT_LIMIT = 500;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const readNumberParam = (params: URLSearchParams, name: string, fallback: number, max: number) => {
  const raw = params.get(name);
  return raw !== null && raw.trim() !== '' && !isNaN(Number(raw)) ? clamp(Number(raw), 0, max) : fallback;
};

const readInitialState = (): SearchState => {
  const params = new URLSearchParams(window.location.search);
  const buildingParam = params.get('building') as BuildingType | null;
  const building = buildingParam && ENABLED_BUILDING_TYPES.includes(buildingParam) ? buildingParam : 'APARTMENT';
  const transaction: TransactionType = params.get('transaction') === 'RENT' ? 'RENT' : 'SALE';
  const sizeRange = SIZE_RANGE[building];
  const priceRange = PRICE_RANGE[building][transaction];
  const sizeMin = readNumberParam(params, 'sizeMin', 0, sizeRange.max);
  const priceMin = readNumberParam(params, 'priceMin', 0, priceRange.max);
  return {
    search: params.get('search') ?? '',
    transaction,
    building,
    sizeMin,
    sizeMax: Math.max(sizeMin, readNumberParam(params, 'sizeMax', sizeRange.max, sizeRange.max)),
    priceMin,
    priceMax: Math.max(priceMin, readNumberParam(params, 'priceMax', priceRange.max, priceRange.max)),
  };
};

const writeUrlState = (state: SearchState) => {
  try {
    const url = new URL(window.location.href);
    const sizeRange = SIZE_RANGE[state.building];
    const priceRange = PRICE_RANGE[state.building][state.transaction];
    const entries: [string, string | null][] = [
      ['search', state.search.trim() !== '' ? state.search.trim() : null],
      ['transaction', state.transaction !== 'SALE' ? state.transaction : null],
      ['building', state.building !== 'APARTMENT' ? state.building : null],
      ['sizeMin', state.sizeMin > 0 ? state.sizeMin.toString() : null],
      ['sizeMax', state.sizeMax < sizeRange.max ? state.sizeMax.toString() : null],
      ['priceMin', state.priceMin > 0 ? state.priceMin.toString() : null],
      ['priceMax', state.priceMax < priceRange.max ? state.priceMax.toString() : null],
    ];
    entries.forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    console.error('Error updating URL:', error);
  }
};

const formatPriceValue = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
};

const RealEstates: React.FC<RealEstatesProps> = ({ token }) => {
  const { realEstates, setRealEstates } = useRealEstate();
  const [initialState] = useState<SearchState>(readInitialState);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
  const [searchTerm, setSearchTerm] = useState<string>(initialState.search);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>(initialState.search);
  const [transactionType, setTransactionType] = useState<TransactionType>(initialState.transaction);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState<boolean>(false);
  const [building, setBuilding] = useState<BuildingType>(initialState.building);
  const [sizeMin, setSizeMin] = useState<number>(initialState.sizeMin);
  const [sizeMax, setSizeMax] = useState<number>(initialState.sizeMax);
  const [priceMin, setPriceMin] = useState<number>(initialState.priceMin);
  const [priceMax, setPriceMax] = useState<number>(initialState.priceMax);

  const [debouncedSizeMin, setDebouncedSizeMin] = useState<number>(initialState.sizeMin);
  const [debouncedSizeMax, setDebouncedSizeMax] = useState<number>(initialState.sizeMax);
  const [debouncedPriceMin, setDebouncedPriceMin] = useState<number>(initialState.priceMin);
  const [debouncedPriceMax, setDebouncedPriceMax] = useState<number>(initialState.priceMax);

  const requestSeqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const debouncedSearchRef = useRef(initialState.search);
  const [mapPoints, setMapPoints] = useState<RealEstateMapPoint[]>([]);
  const [mapLoading, setMapLoading] = useState<boolean>(true);

  const itemsPerPage = 10;
  const sizeRange = SIZE_RANGE[building];
  const priceRange = PRICE_RANGE[building][transactionType];
  const isLand = building === 'LAND';

  useEffect(() => {
    const timer = setTimeout(() => {
      if (debouncedSearchRef.current !== searchTerm) {
        debouncedSearchRef.current = searchTerm;
        setDebouncedSearchTerm(searchTerm);
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSizeMin(sizeMin);
      setDebouncedSizeMax(sizeMax);
      setDebouncedPriceMin(priceMin);
      setDebouncedPriceMax(priceMax);
      setCurrentPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [sizeMin, sizeMax, priceMin, priceMax]);

  useEffect(() => {
    writeUrlState({
      search: debouncedSearchTerm,
      transaction: transactionType,
      building,
      sizeMin: debouncedSizeMin,
      sizeMax: debouncedSizeMax,
      priceMin: debouncedPriceMin,
      priceMax: debouncedPriceMax,
    });
  }, [debouncedSearchTerm, transactionType, building, debouncedSizeMin, debouncedSizeMax, debouncedPriceMin, debouncedPriceMax]);

  useEffect(() => {
    loadRealEstates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, sortDirection, debouncedSearchTerm, transactionType, building, debouncedSizeMin, debouncedSizeMax, debouncedPriceMin, debouncedPriceMax]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // the map covers every match (up to the backend cap), not just the current page
  useEffect(() => {
    const controller = new AbortController();
    setMapLoading(true);
    fetchRealEstateMapPoints({ ...currentFilters(), limit: MAP_POINT_LIMIT, signal: controller.signal })
      .then(points => setMapPoints(points))
      .catch(err => {
        if (controller.signal.aborted) return;
        console.error('Error loading map listings:', err);
        setMapPoints([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setMapLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortDirection, debouncedSearchTerm, transactionType, building, debouncedSizeMin, debouncedSizeMax, debouncedPriceMin, debouncedPriceMax]);

  const currentFilters = (): FetchRealEstatesOptions => ({
    sortDirection,
    search: debouncedSearchTerm,
    transaction: transactionType,
    building,
    subCategories: building === 'LAND' ? ENABLED_LAND_SUB_TYPES : [],
    sizeMin: debouncedSizeMin,
    sizeMax: debouncedSizeMax >= sizeRange.max ? OPEN_SIZE_MAX : debouncedSizeMax,
    priceMin: debouncedPriceMin,
    priceMax: debouncedPriceMax >= priceRange.max ? OPEN_PRICE_MAX : debouncedPriceMax,
  });

  const loadRealEstates = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const seq = ++requestSeqRef.current;

    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * itemsPerPage;

      const results = await fetchRealEstates({
        ...currentFilters(),
        offset,
        limit: itemsPerPage + 1, // one extra item tells us whether there is a next page
        signal: controller.signal,
      });

      if (seq !== requestSeqRef.current) return;

      const hasMorePages = results.length > itemsPerPage;
      const realEstatesData = hasMorePages ? results.slice(0, itemsPerPage) : results;
      setRealEstates(realEstatesData);

      const newTotalCount = hasMorePages
        ? Math.max((currentPage * itemsPerPage) + 1, totalCount)
        : Math.max((currentPage - 1) * itemsPerPage + results.length, totalCount);

      setTotalCount(newTotalCount);
    } catch (err) {
      if (seq !== requestSeqRef.current || controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Failed to load real estates');
      console.error('Error loading real estates:', err);
    } finally {
      if (seq === requestSeqRef.current && !controller.signal.aborted) {
        setLoading(false);
      }
    }
  };

  const applyRanges = (
    nextSize: { min: number; max: number } | null,
    nextPrice: { min: number; max: number } | null,
  ) => {
    if (nextSize) {
      setSizeMin(nextSize.min);
      setSizeMax(nextSize.max);
      setDebouncedSizeMin(nextSize.min);
      setDebouncedSizeMax(nextSize.max);
    }
    if (nextPrice) {
      setPriceMin(nextPrice.min);
      setPriceMax(nextPrice.max);
      setDebouncedPriceMin(nextPrice.min);
      setDebouncedPriceMax(nextPrice.max);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortDirection(e.target.value as SortDirection);
    setCurrentPage(1);
  };

  const handleTransactionTypeChange = (newTransactionType: TransactionType) => {
    setTransactionType(newTransactionType);
    applyRanges(null, { min: 0, max: PRICE_RANGE[building][newTransactionType].max });
    setCurrentPage(1);
  };

  const handleBuildingChange = (newBuilding: BuildingType) => {
    if (newBuilding === building) return;
    setBuilding(newBuilding);
    applyRanges(
      { min: 0, max: SIZE_RANGE[newBuilding].max },
      { min: 0, max: PRICE_RANGE[newBuilding][transactionType].max },
    );
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearchTerm('');
    debouncedSearchRef.current = '';
    setDebouncedSearchTerm('');
    setCurrentPage(1);
  };

  // Check if we have more pages based on current data
  const hasMoreItems = realEstates.length === itemsPerPage;

  // Simple pagination approach that doesn't rely on accurate totalCount
  const paginationItems: React.ReactNode[] = [];

  // Add current page
  paginationItems.push(
    <Pagination.Item key={currentPage} active>
      {currentPage}
    </Pagination.Item>
  );

  // If we're not on the first page, add a previous page button
  if (currentPage > 1) {
    paginationItems.unshift(
      <Pagination.Item 
        key={currentPage - 1} 
        onClick={() => handlePageChange(currentPage - 1)}
      >
        {currentPage - 1}
      </Pagination.Item>
    );

    // Add one more previous page if we're not on the second page
    if (currentPage > 2) {
      paginationItems.unshift(
        <Pagination.Item 
          key={currentPage - 2} 
          onClick={() => handlePageChange(currentPage - 2)}
        >
        {currentPage - 2}
        </Pagination.Item>
      );

      // Add ellipsis if we're beyond page 3
      if (currentPage > 3) {
        paginationItems.unshift(<Pagination.Ellipsis key="ellipsis-start" />);

        // Add first page button if we're beyond page 3
        paginationItems.unshift(
          <Pagination.Item 
            key={1} 
            onClick={() => handlePageChange(1)}
          >
            1
          </Pagination.Item>
        );
      }
    }
  }

  // If we have more items, add a next page button
  if (hasMoreItems) {
    paginationItems.push(
      <Pagination.Item 
        key={currentPage + 1} 
        onClick={() => handlePageChange(currentPage + 1)}
      >
        {currentPage + 1}
      </Pagination.Item>
    );

    // Add one more next page if we have more items
    paginationItems.push(
      <Pagination.Item 
        key={currentPage + 2} 
        onClick={() => handlePageChange(currentPage + 2)}
      >
        {currentPage + 2}
      </Pagination.Item>
    );

    // Add ellipsis to indicate there might be more pages
    paginationItems.push(<Pagination.Ellipsis key="ellipsis-end" />);
  }

  const resetAdvancedSearch = () => {
    applyRanges(
      { min: 0, max: SIZE_RANGE[building].max },
      { min: 0, max: PRICE_RANGE[building].SALE.max },
    );
    clearSearch();
    setTransactionType('SALE');
    setSortDirection('DESC');
  };

  const activeFilterCount =
    (sizeMin > 0 || sizeMax < sizeRange.max ? 1 : 0) + (priceMin > 0 || priceMax < priceRange.max ? 1 : 0);
  const firstShown = (currentPage - 1) * itemsPerPage + 1;
  const lastShown = (currentPage - 1) * itemsPerPage + realEstates.length;

  return (
    <>
      <PageHeader
        title={`${isLand ? 'Building plots' : 'Apartments'} for ${transactionType === 'SALE' ? 'sale' : 'rent'}`}
        subtitle="Prague and the surrounding region, merged from every major listing portal"
      />

      <div className="toolbar mb-4">
        <div className="toolbar-row">
          <Segmented
            ariaLabel="Property type"
            value={building}
            onChange={handleBuildingChange}
            options={ENABLED_BUILDING_TYPES.map(type => ({
              value: type,
              label: BUILDING_TYPE_META[type].plural,
              icon: BUILDING_TYPE_META[type].icon,
            }))}
          />
          <Segmented
            ariaLabel="Transaction"
            value={transactionType}
            onChange={handleTransactionTypeChange}
            options={[
              { value: 'SALE', label: 'Buy' },
              { value: 'RENT', label: 'Rent' },
            ]}
          />
          <div className="search-field">
            <Search size={15} />
            <Form.Control
              type="search"
              placeholder="Search by street, district or keyword"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search listings"
            />
            {searchTerm && (
              <Button variant="ghost" size="sm" className="btn-icon search-clear" onClick={clearSearch} aria-label="Clear search">
                <X size={18} />
              </Button>
            )}
          </div>
          <Form.Select value={sortDirection} onChange={handleSortDirectionChange} aria-label="Sort">
            <option value="DESC">Newest first</option>
            <option value="ASC">Oldest first</option>
          </Form.Select>
          <Button
            variant="outline-secondary"
            onClick={() => setAdvancedSearchOpen(!advancedSearchOpen)}
            aria-controls="advanced-search-collapse"
            aria-expanded={advancedSearchOpen}
          >
            <Sliders size={14} />
            Filters
            {activeFilterCount > 0 && <span className="count-badge">{activeFilterCount}</span>}
          </Button>
        </div>

        <Collapse in={advancedSearchOpen}>
          <div id="advanced-search-collapse">
            <div className="filter-panel">
              <div className="filter-grid">
                <DualRangeSlider
                  label={isLand ? 'Plot area' : 'Size'}
                  minValue={sizeMin}
                  maxValue={sizeMax}
                  min={0}
                  max={sizeRange.max}
                  step={sizeRange.step}
                  onChange={(min, max) => {
                    setSizeMin(min);
                    setSizeMax(max);
                  }}
                  formatValue={(value) =>
                    `${value.toLocaleString('cs-CZ')}${value >= sizeRange.max ? '+' : ''} m²`
                  }
                />
                <DualRangeSlider
                  label={transactionType === 'SALE' ? 'Price (Kč)' : 'Rent (Kč / month)'}
                  minValue={priceMin}
                  maxValue={priceMax}
                  min={0}
                  max={priceRange.max}
                  step={priceRange.step}
                  onChange={(min, max) => {
                    setPriceMin(min);
                    setPriceMax(max);
                  }}
                  formatValue={(value) =>
                    `${formatPriceValue(value)}${value >= priceRange.max ? '+' : ''}`
                  }
                />
              </div>
              <div className="d-flex justify-content-end mt-3">
                <Button variant="ghost" size="sm" onClick={resetAdvancedSearch}>
                  <ArrowCounterclockwise size={13} />
                  Reset all filters
                </Button>
              </div>
            </div>
          </div>
        </Collapse>
      </div>

      {error ? (
        <EmptyState
          icon={ExclamationTriangle}
          title="Couldn't load listings"
          text={error}
          actions={
            <Button variant="primary" onClick={loadRealEstates}>
              <ArrowCounterclockwise size={14} />
              Try again
            </Button>
          }
        />
      ) : !loading && realEstates.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No listings match"
          text={
            debouncedSearchTerm
              ? `Nothing matches “${debouncedSearchTerm}” with the current filters. Try a broader search.`
              : 'Nothing matches the current filters. Try widening the price or size range.'
          }
          actions={
            <Button variant="outline-secondary" onClick={resetAdvancedSearch}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="map-frame mb-4">
            <MultiRealEstateMap
              points={mapPoints}
              loading={mapLoading}
              limit={MAP_POINT_LIMIT}
              height="clamp(320px, 45vw, 520px)"
              viewKey={JSON.stringify(currentFilters())}
            />
          </div>

          {loading ? (
            <ListingSkeletonGrid />
          ) : (
            <>
              <div className="d-flex align-items-baseline justify-content-between mb-3">
                <div className="text-2" style={{ fontSize: '0.875rem' }}>
                  Showing <span className="fw-semibold text-body tabular">{firstShown}–{lastShown}</span>
                  {debouncedSearchTerm && <> for “{debouncedSearchTerm}”</>}
                </div>
              </div>

              <div className="listing-grid mb-5">
                {realEstates.map((estate: RealEstate) => (
                  <RealEstateCard key={estate.id} estate={estate} />
                ))}
              </div>

              {paginationItems.length > 1 && (
                <Pagination className="mb-0">
                  <Pagination.Prev
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={14} />
                  </Pagination.Prev>
                  {paginationItems}
                  <Pagination.Next
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMoreItems}
                    aria-label="Next page"
                  >
                    <ChevronRight size={14} />
                  </Pagination.Next>
                </Pagination>
              )}
            </>
          )}
        </>
      )}
    </>
  );
};

export default RealEstates;
