import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Container, Form, Pagination, Row, Spinner, Badge, Image, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useRealEstate } from '../context/RealEstateContext';
import { fetchRealEstates, SortDirection } from '../services/RealEstateService';
import { RealEstate } from '../types/realEstate';

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
      <Row className="mb-4">
        <Col>
          <h1>Real Estates</h1>
          <p className="text-muted">Browse available real estates</p>
        </Col>
        <Col xs="auto" className="d-flex align-items-center">
          <Form.Group controlId="sortDirection" className="me-2">
            <Form.Select 
              value={sortDirection} 
              onChange={handleSortDirectionChange}
              size="sm"
            >
              <option value="DESC">Newest first</option>
              <option value="ASC">Oldest first</option>
            </Form.Select>
          </Form.Group>
          <Form.Group controlId="transactionType">
            <Form.Select
              value={transactionType}
              onChange={handleTransactionTypeChange}
              size="sm"
            >
              <option value="SALE">For Sale</option>
              <option value="RENT">For Rent</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6} lg={4} className="mx-auto">
          <Form.Group controlId="searchRealEstates">
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search real estates by name, address or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shadow-sm"
              />
              {searchTerm && (
                <Button 
                  variant="link" 
                  className="position-absolute end-0 top-0 text-secondary" 
                  style={{ padding: '0.375rem 0.75rem' }}
                  onClick={() => {
                    setSearchTerm('');
                    // Clear search parameter from URL
                    const url = new URL(window.location.href);
                    url.searchParams.delete('search');
                    window.history.replaceState({}, '', url.toString());
                  }}
                >
                  &times;
                </Button>
              )}
            </div>
          </Form.Group>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          {error}
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={loadRealEstates}
          >
            Try again
          </Button>
        </div>
      ) : realEstates.length === 0 ? (
        <div className="text-center my-5">
          <p className="mb-0">No real estates found.</p>
        </div>
      ) : (
        <>
                      <Row xs={1} md={2} lg={3} xl={3} className="g-4 mb-4 mx-0">
            {realEstates.map((estate: RealEstate) => (
              <Col key={estate.id}>
                <Card 
                  className="h-100 shadow-sm" 
                  onClick={() => navigate(`/real-estates/${estate.id}`)}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseOver={(e) => { 
                    e.currentTarget.style.transform = 'translateY(-5px)'; 
                    e.currentTarget.style.boxShadow = '0 .5rem 1rem rgba(0,0,0,.15)'; 
                  }}
                  onMouseOut={(e) => { 
                    e.currentTarget.style.transform = 'translateY(0)'; 
                    e.currentTarget.style.boxShadow = '0 .125rem .25rem rgba(0,0,0,.075)'; 
                  }}
                >
                  {estate.images && estate.images.length > 0 && (
                    <Card.Img 
                      variant="top" 
                      src={estate.images[0]} 
                      alt={estate.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body>
                    <Card.Title>{estate.name}</Card.Title>
                    <Card.Subtitle className="mb-2">
                      {getLowestPrice(estate) < estate.price ? (
                        <>
                          <span className="text-decoration-line-through text-muted">
                            {formatCurrency(estate.price, estate.currency)}
                          </span>
                          <span className="ms-2 text-danger">
                            {formatCurrency(getLowestPrice(estate), estate.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-muted">
                          {formatCurrency(estate.price, estate.currency)}
                        </span>
                      )}
                    </Card.Subtitle>
                    <div className="d-flex justify-content-between mb-2 text-muted small">
                      <span>{estate.sizeInM2} m²</span>
                      <span>{estate.subCategory}</span>
                    </div>
                    {estate.locality && (
                      <Card.Text className="text-muted small mb-2">
                        {estate.locality.street && `${estate.locality.street}, `}
                        {estate.locality.district && `${estate.locality.district}, `}
                        {estate.locality.city}
                      </Card.Text>
                    )}
                    <div className="mt-2 d-flex justify-content-between">
                      <Badge bg="secondary">{estate.provider}</Badge>
                      <div>
                        {getLowestPrice(estate) < estate.price && (
                          <OverlayTrigger
                            placement="top"
                            overlay={
                              <Tooltip>
                                {getLowerPriceProviders(estate).join(', ')}
                              </Tooltip>
                            }
                          >
                            <Badge bg="danger" className="me-1">
                              Save {Math.round((1 - getLowestPrice(estate) / estate.price) * 100)}%
                            </Badge>
                          </OverlayTrigger>
                        )}
                        {estate.duplicates.length > 0 && (
                          <Badge bg="info">{estate.duplicates.length} duplicate{estate.duplicates.length > 1 ? 's' : ''}</Badge>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

                      <Row className="mt-4">
            <Col md={4} className="text-md-start text-center mb-3 mb-md-0">
              <div className="text-muted small">
                {realEstates.length > 0 ? (
                  <>Showing {(currentPage - 1) * itemsPerPage + 1} - {(currentPage - 1) * itemsPerPage + realEstates.length} results
                  {debouncedSearchTerm && <> for "{debouncedSearchTerm}"</>}</>
                ) : (
                  <>No results found {debouncedSearchTerm && <>for "{debouncedSearchTerm}"</>}</>
                )}
              </div>
            </Col>
            <Col md={4} className="d-flex justify-content-center">
              {(paginationItems.length > 1) && (
                <Pagination className="flex-wrap justify-content-center">
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
                  {/* Don't show Last button since we don't know the actual last page */}
                </Pagination>
              )}
            </Col>
            <Col md={4}></Col> {/* Empty column for balance */}
          </Row>
        </>
      )}
    </Container>
  );
};

export default RealEstates;
