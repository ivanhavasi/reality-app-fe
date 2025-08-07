import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Container, Form, Pagination, Row, Spinner, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useRealEstate } from '../context/RealEstateContext';
import { fetchRealEstates, SortDirection } from '../services/RealEstateService';
import { RealEstate } from '../types/realEstate';
import MultiRealEstateMap from '../components/MultiRealEstateMap';

interface RealEstatesProps {
  token?: string;
}

const RealEstates: React.FC<RealEstatesProps> = ({ token }) => {
  const navigate = useNavigate();
  const { realEstates, setRealEstates } = useRealEstate();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('DESC');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'SALE' | 'RENT'>('SALE');

  const itemsPerPage = 10;

  // Parse URL search params on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    const transactionParam = urlParams.get('transaction');

    if (searchParam) {
      setSearchTerm(decodeURIComponent(searchParam));
      setDebouncedSearchTerm(decodeURIComponent(searchParam));
    }

    if (transactionParam && (transactionParam === 'SALE' || transactionParam === 'RENT')) {
      setTransactionType(transactionParam);
    }
  }, []);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Update URL with search parameter
      const url = new URL(window.location.href);
      if (searchTerm && searchTerm.trim() !== '') {
        url.searchParams.set('search', encodeURIComponent(searchTerm.trim()));
      } else {
        url.searchParams.delete('search');
      }
      window.history.replaceState({}, '', url.toString());
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    // Reset to first page when search term changes
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
    loadRealEstates();
  }, [currentPage, sortDirection, debouncedSearchTerm, transactionType]);

  const loadRealEstates = async () => {
    try {
      setLoading(true);
      setError(null);
      const offset = (currentPage - 1) * itemsPerPage;

      const results = await fetchRealEstates(
        offset,
        itemsPerPage + 1, // Request one extra item to check if there are more pages
        sortDirection,
        debouncedSearchTerm,
        transactionType
      );

      // Check if we have more items than the requested limit
      const hasMorePages = results.length > itemsPerPage;

      // Set real estates (removing the extra item if it exists)
      const realEstatesData = hasMorePages ? results.slice(0, itemsPerPage) : results;
      setRealEstates(realEstatesData);

      // Calculate a new estimated total based on what we know
      // If we have less items than requested, we're on the last page
      // If we have exactly itemsPerPage + 1 items, there are more pages
      const newTotalCount = hasMorePages 
        ? Math.max((currentPage * itemsPerPage) + 1, totalCount) // At least one more item exists
        : Math.max((currentPage - 1) * itemsPerPage + results.length, totalCount); // This is the last page

      setTotalCount(newTotalCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load real estates');
      console.error('Error loading real estates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSortDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortDirection(e.target.value as SortDirection);
    setCurrentPage(1); // Reset to first page when changing sort direction
  };

  const handleTransactionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTransactionType = e.target.value as 'SALE' | 'RENT';
    setTransactionType(newTransactionType);
    setCurrentPage(1); // Reset to first page when changing transaction type

    // Update URL with transaction type parameter
    const url = new URL(window.location.href);
    if (newTransactionType) {
      url.searchParams.set('transaction', newTransactionType);
    } else {
      url.searchParams.delete('transaction');
    }
    window.history.replaceState({}, '', url.toString());
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

  // Find the lowest price among all duplicates
  const getLowestPrice = (estate: RealEstate): number => {
    if (!estate.duplicates || estate.duplicates.length === 0) {
      return estate.price;
    }

    // Get all prices including the original and duplicates
    const allPrices = [estate.price, ...estate.duplicates.map(dup => dup.price)];

    // Return the lowest price
    return Math.min(...allPrices);
  };

  // Get a list of providers that have lower prices than the original
  const getLowerPriceProviders = (estate: RealEstate): string[] => {
    if (!estate.duplicates || estate.duplicates.length === 0) {
      return [];
    }

    return estate.duplicates
      .filter(dup => dup.price < estate.price)
      .map(dup => dup.provider);
  };

  // Format currency with correct symbol
  const formatCurrency = (price: number, currency: string) => {
    if (currency === 'CZK') {
      return `${price.toLocaleString()} Kč`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

  return (
    <Container fluid className="p-0">
      {/* Modern Hero Section */}
      <div className="gradient-header py-4 py-md-5 mb-4 rounded-3">
        <Container>
          <Row>
            <Col>
              <h1 className="display-6 fw-bold text-white mb-3">
                <i className="fas fa-home me-3"></i>
                Real Estates
              </h1>
              <p className="text-white opacity-90 fs-5 mb-4">
                Discover your perfect home in Prague and surrounding areas
              </p>
              
              {/* Search and Filters in Hero */}
              <Row className="g-3">
                <Col lg={6}>
                  <div className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder="Search real estates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="shadow-sm border-0"
                      size="lg"
                      style={{
                        backgroundColor: 'var(--bs-body-bg)',
                        color: 'var(--bs-body-color)',
                        opacity: 0.95,
                        height: '48px'
                      }}
                    />
                    {searchTerm && (
                      <Button 
                        variant="link" 
                        className="position-absolute end-0 top-0 p-3"
                        style={{ color: 'var(--bs-body-color)' }}
                        onClick={() => {
                          setSearchTerm('');
                          const url = new URL(window.location.href);
                          url.searchParams.delete('search');
                          window.history.replaceState({}, '', url.toString());
                        }}
                      >
                        &times;
                      </Button>
                    )}
                  </div>
                </Col>
                <Col lg={6}>
                  <Row className="g-2">
                    <Col>
                      <Form.Select
                        value={transactionType}
                        onChange={handleTransactionTypeChange}
                        className="shadow-sm border-0"
                        size="lg"
                        style={{
                          backgroundColor: 'var(--bs-body-bg)',
                          color: 'var(--bs-body-color)',
                          opacity: 0.95,
                          height: '48px'
                        }}
                      >
                        <option value="SALE">For Sale</option>
                        <option value="RENT">For Rent</option>
                      </Form.Select>
                    </Col>
                    <Col>
                      <Form.Select
                        value={sortDirection}
                        onChange={handleSortDirectionChange}
                        className="shadow-sm border-0"
                        size="lg"
                        style={{
                          backgroundColor: 'var(--bs-body-bg)',
                          color: 'var(--bs-body-color)',
                          opacity: 0.95,
                          height: '48px'
                        }}
                      >
                        <option value="DESC">Newest first</option>
                        <option value="ASC">Oldest first</option>
                      </Form.Select>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {loading ? (
          <div className="text-center my-5">
            <div className="rounded-3 p-5" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
              <Spinner animation="border" role="status" className="text-primary mb-3">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="text-muted mb-0">Loading properties...</p>
            </div>
          </div>
        ) : error ? (
          <div className="modern-card border-0 shadow-sm">
            <div className="card-body p-4 text-center">
              <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="fas fa-exclamation-triangle fa-lg text-danger"></i>
              </div>
              <h5 className="text-danger mb-3">Oops! Something went wrong</h5>
              <p className="text-muted mb-3">{error}</p>
              <Button 
                variant="primary" 
                className="modern-btn"
                onClick={loadRealEstates}
              >
                <i className="fas fa-redo me-2"></i>
                Try Again
              </Button>
            </div>
          </div>
        ) : realEstates.length === 0 ? (
          <div className="modern-card border-0 shadow-sm">
            <div className="card-body p-5 text-center">
              <div className="bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '80px', height: '80px'}}>
                <i className="fas fa-search fa-2x text-secondary"></i>
              </div>
              <h4 className="mb-3">No Properties Found</h4>
              <p className="text-muted mb-4">
                {debouncedSearchTerm 
                  ? `We couldn't find any properties matching "${debouncedSearchTerm}". Try adjusting your search criteria.`
                  : "No properties are currently available. Please check back later or adjust your filters."
                }
              </p>
              {debouncedSearchTerm && (
                <Button 
                  variant="outline-primary" 
                  className="modern-btn"
                  onClick={() => {
                    setSearchTerm('');
                    const url = new URL(window.location.href);
                    url.searchParams.delete('search');
                    window.history.replaceState({}, '', url.toString());
                  }}
                >
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Results Summary */}
            <Row className="mb-4">
              <Col>
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="mb-1">
                      {transactionType === 'SALE' ? 'Properties for Sale' : 'Properties for Rent'}
                    </h5>
                    <p className="text-muted mb-0">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {(currentPage - 1) * itemsPerPage + realEstates.length} results
                      {debouncedSearchTerm && <> for "{debouncedSearchTerm}"</>}
                    </p>
                  </div>
                </div>
              </Col>
            </Row>

            {/* Map showing all real estate locations */}
            <Row className="mb-5">
              <Col>
                <div className="modern-card border-0 shadow-sm p-0 overflow-hidden">
                  <h5 className="p-3 m-0 border-bottom">RealEstates</h5>
                  <MultiRealEstateMap
                    realEstates={realEstates}
                    height="500px"
                  />
                </div>
              </Col>
            </Row>

            {/* Properties Grid */}
            <Row xs={1} sm={2} lg={3} xl={4} className="g-4 mb-5">
              {realEstates.map((estate: RealEstate) => (
                <Col key={estate.id}>
                  <Card 
                    className="real-estate-card h-100 border-0 shadow-sm" 
                    onClick={() => navigate(`/real-estates/${estate.id}`)}
                    style={{
                      cursor: 'pointer',
                      minHeight: '400px'
                    }}
                  >
                    {estate.images && estate.images.length > 0 && (
                      <div className="position-relative overflow-hidden">
                        <Card.Img 
                          variant="top" 
                          src={estate.images[0]} 
                          alt={estate.name}
                          className="card-img-top"
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        {/* Price Badge */}
                        <div className="position-absolute top-0 start-0 m-3">
                          {getLowestPrice(estate) < estate.price ? (
                            <div>
                              <Badge className="price-badge mb-1 d-block">
                                {formatCurrency(getLowestPrice(estate), estate.currency)}
                              </Badge>
                              <Badge bg="danger" className="small">
                                Save {Math.round((1 - getLowestPrice(estate) / estate.price) * 100)}%
                              </Badge>
                            </div>
                          ) : (
                            <Badge className="price-badge">
                              {formatCurrency(estate.price, estate.currency)}
                            </Badge>
                          )}
                        </div>
                        {/* Provider Badge */}
                        <div className="position-absolute top-0 end-0 m-3">
                          <Badge bg="dark" className="opacity-75">
                            {estate.provider}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <Card.Body className="d-flex flex-column p-4">
                      <Card.Title className="h6 mb-3 line-clamp-2" style={{ minHeight: '3rem' }}>
                        {estate.name}
                      </Card.Title>
                      
                      {/* Property Features */}
                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <span className="property-feature">
                          <i className="fas fa-expand-arrows-alt me-1"></i>
                          {estate.sizeInM2} m²
                        </span>
                        <span className="property-feature">
                          <i className="fas fa-building me-1"></i>
                          {estate.subCategory}
                        </span>
                      </div>

                      {/* Location */}
                      {estate.locality && (
                        <div className="mb-3">
                          <div className="d-flex align-items-start text-muted small">
                            <i className="fas fa-map-marker-alt me-2 mt-1"></i>
                            <span className="line-clamp-2">
                              {estate.locality.street && `${estate.locality.street}, `}
                              {estate.locality.district && `${estate.locality.district}, `}
                              {estate.locality.city}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Badges */}
                      <div className="mt-auto">
                        {estate.duplicates.length > 0 && (
                          <div className="d-flex flex-wrap gap-1">
                            <OverlayTrigger
                              placement="top"
                              overlay={
                                <Tooltip>
                                  Available on multiple platforms: {getLowerPriceProviders(estate).join(', ')}
                                </Tooltip>
                              }
                            >
                              <Badge bg="info" className="small">
                                <i className="fas fa-clone me-1"></i>
                                {estate.duplicates.length} duplicate{estate.duplicates.length > 1 ? 's' : ''}
                              </Badge>
                            </OverlayTrigger>
                          </div>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            {(paginationItems.length > 1) && (
              <Row className="mt-4">
                <Col className="d-flex justify-content-center">
                  <div className="modern-card border-0 shadow-sm p-3">
                    <Pagination className="mb-0">
                      <Pagination.First
                        onClick={() => handlePageChange(1)} 
                        disabled={currentPage === 1} 
                      />
                      <Pagination.Prev 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1} 
                      />
                      {paginationItems}
                      <Pagination.Next 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={!hasMoreItems} 
                      />
                    </Pagination>
                  </div>
                </Col>
              </Row>
            )}
          </>
        )}
      </Container>
    </Container>
  );
};

export default RealEstates;
