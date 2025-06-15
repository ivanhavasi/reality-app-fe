import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Carousel, Table, Alert, Tab, Tabs } from 'react-bootstrap';
import { useRealEstate } from '../context/RealEstateContext';
import { RealEstate, Duplicate } from '../types/realEstate';
import { ArrowLeft, GeoAlt, Houses, CardImage, Info, Link as LinkIcon } from 'react-bootstrap-icons';

interface RealEstateDetailProps {
  token?: string;
}

const RealEstateDetail: React.FC<RealEstateDetailProps> = ({ token }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { findEstateById } = useRealEstate();
  const [realEstate, setRealEstate] = useState<RealEstate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadRealEstateDetails(id);
    }
  }, [id]);

  const loadRealEstateDetails = (estateId: string) => {
    try {
      setLoading(true);
      setError(null);

      const estate = findEstateById(estateId);

      if (estate) {
        setRealEstate(estate);
      } else {
        setError('Real estate not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load real estate details');
      console.error('Error loading real estate details:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency with correct symbol
  const formatCurrency = (price: number, currency: string) => {
    if (currency === 'CZK') {
      return `${price.toLocaleString()} Kč`;
    }
    return `${price.toLocaleString()} ${currency}`;
  };

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

  // Get address string
  const getAddressString = (estate: RealEstate): string => {
    if (!estate.locality) return '';

    const { street, streetNumber, district, city } = estate.locality;
    const parts = [];

    if (street) parts.push(street);
    if (streetNumber) parts.push(streetNumber);
    if (district) parts.push(district);
    if (city) parts.push(city);

    return parts.join(', ');
  };

  // Render property details in a table
  const renderPropertyDetails = (estate: RealEstate) => {
    return (
      <Table striped bordered hover>
        <tbody>
          <tr>
            <th>Category</th>
            <td>{estate.mainCategory}</td>
          </tr>
          <tr>
            <th>Subcategory</th>
            <td>{estate.subCategory}</td>
          </tr>
          <tr>
            <th>Size</th>
            <td>{estate.sizeInM2} m²</td>
          </tr>
          <tr>
            <th>Price</th>
            <td>
              {getLowestPrice(estate) < estate.price ? (
                <>
                  <span className="text-decoration-line-through">
                    {formatCurrency(estate.price, estate.currency)}
                  </span>
                  <span className="ms-2 text-danger">
                    {formatCurrency(getLowestPrice(estate), estate.currency)}
                  </span>
                  <Badge bg="danger" className="ms-2">
                    Save {Math.round((1 - getLowestPrice(estate) / estate.price) * 100)}%
                  </Badge>
                </>
              ) : (
                <span>{formatCurrency(estate.price, estate.currency)}</span>
              )}
            </td>
          </tr>
          <tr>
            <th>Price per m²</th>
            <td>{formatCurrency(estate.pricePerM2, estate.currency)}</td>
          </tr>
          <tr>
            <th>Transaction Type</th>
            <td>{estate.transactionType}</td>
          </tr>
          <tr>
            <th>Provider</th>
            <td>
              <Badge bg="secondary">{estate.provider}</Badge>
            </td>
          </tr>
        </tbody>
      </Table>
    );
  };

  // Render price history
  const renderPriceHistory = (estate: RealEstate) => {
    if (!estate.duplicates || estate.duplicates.length === 0) {
      return (
        <Alert variant="info">No price history available.</Alert>
      );
    }

    // Create a list of all providers with the original listing
    const allProviders = [
      {
        provider: estate.provider,
        price: estate.price,
        pricePerM2: estate.pricePerM2,
        url: estate.url,
        images: estate.images,
        isOriginal: true
      },
      ...estate.duplicates.map(duplicate => ({
        provider: duplicate.provider,
        price: duplicate.price,
        pricePerM2: duplicate.pricePerM2,
        url: duplicate.url,
        images: duplicate.images,
        isOriginal: false
      }))
    ];

    // Sort by price (highest to lowest) for price history
    allProviders.sort((a, b) => b.price - a.price);

    return (
      <div className="price-history-container">
        <Alert variant="info" className="mb-3">
          <Info className="me-2" />
          This chart shows price variations across different listing providers.
        </Alert>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Date Point</th>
              <th>Price</th>
              <th>Change</th>
              <th>Provider</th>
            </tr>
          </thead>
          <tbody>
            {allProviders.map((provider, index) => {
              // Calculate price difference from highest price
              const highestPrice = allProviders[0].price;
              const priceDiff = ((provider.price - highestPrice) / highestPrice) * 100;
              const isPositive = priceDiff >= 0;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{formatCurrency(provider.price, estate.currency)}</td>
                  <td>
                    {index === 0 ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className={priceDiff < 0 ? 'text-danger' : 'text-success'}>
                        {priceDiff.toFixed(2)}%
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="d-flex align-items-center">
                      <Badge bg={provider.isOriginal ? 'primary' : 'secondary'} className="me-2">
                        {provider.provider}
                      </Badge>
                      {provider.isOriginal && (
                        <Badge bg="info" pill>
                          Original
                        </Badge>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
    );
  };

  // Render all providers
  const renderAllProviders = (estate: RealEstate) => {
    if (!estate.duplicates || estate.duplicates.length === 0) {
      return (
        <Alert variant="info">No alternative providers available.</Alert>
      );
    }

    // Create a list of all providers with the original listing
    const allProviders = [
      {
        provider: estate.provider,
        price: estate.price,
        pricePerM2: estate.pricePerM2,
        url: estate.url,
        images: estate.images,
        isOriginal: true
      },
      ...estate.duplicates.map(duplicate => ({
        provider: duplicate.provider,
        price: duplicate.price,
        pricePerM2: duplicate.pricePerM2,
        url: duplicate.url,
        images: duplicate.images,
        isOriginal: false
      }))
    ];

    // Sort by price (lowest first)
    allProviders.sort((a, b) => a.price - b.price);

    return (
      <div className="providers-container">
        <Alert variant="info" className="mb-3">
          <Info className="me-2" />
          This property is listed on multiple platforms. Compare prices and visit different listings below.
        </Alert>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Provider</th>
              <th>Price</th>
              <th>Price per m²</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {allProviders.map((provider, index) => (
              <tr key={index} className={provider.isOriginal ? 'table-primary' : ''}>
                <td>
                  <div className="d-flex align-items-center">
                    <Badge bg={provider.isOriginal ? 'primary' : 'secondary'} className="me-2">
                      {provider.provider}
                    </Badge>
                    {provider.isOriginal && (
                      <Badge bg="info" pill>
                        Original
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  {formatCurrency(provider.price, estate.currency)}
                  {index === 0 && !provider.isOriginal && (
                    <Badge bg="success" className="ms-2">
                      Best price
                    </Badge>
                  )}
                </td>
                <td>{formatCurrency(provider.pricePerM2, estate.currency)}</td>
                <td>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    href={provider.url} 
                    target="_blank"
                  >
                    <LinkIcon className="me-1" />
                    View Listing
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Container fluid className="p-0">
      <Button 
        variant="outline-secondary" 
        className="mb-4" 
        onClick={() => navigate('/real-estates')}
      >
        <ArrowLeft className="me-1" /> Back to listings
      </Button>

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <Alert variant="danger">
          {error}
          <Button 
            variant="link" 
            className="p-0 ms-2" 
            onClick={() => navigate('/real-estates')}
          >
            Back to listings
          </Button>
        </Alert>
      ) : realEstate ? (
        <>
          <h1 className="mb-3">{realEstate.name}</h1>

          {/* Location badge */}
          <div className="mb-4">
            <Badge bg="light" text="dark" className="p-2 fs-6">
              <GeoAlt className="me-1" />
              {getAddressString(realEstate)}
            </Badge>
          </div>

          <Row>
            <Col lg={8}>
              {/* Image carousel */}
              {realEstate.images && realEstate.images.length > 0 ? (
                <Card className="mb-4">
                  <Carousel>
                    {realEstate.images.map((image, index) => (
                      <Carousel.Item key={index}>
                        <img
                          className="d-block w-100"
                          src={image}
                          alt={`Property ${index + 1}`}
                          style={{ height: '400px', objectFit: 'cover' }}
                        />
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </Card>
              ) : (
                <Card className="mb-4 text-center p-5">
                  <CardImage size={48} className="mb-3 mx-auto text-muted" />
                  <p className="text-muted">No images available</p>
                </Card>
              )}

              {/* Tabs for Details, Price History, and All Providers */}
              <Tabs defaultActiveKey="details" className="mb-4">
                <Tab eventKey="details" title="Property Details">
                  <Card className="p-3">
                    {renderPropertyDetails(realEstate)}
                  </Card>
                </Tab>
                <Tab eventKey="price-history" title="Price History">
                  <Card className="p-3">
                    {renderPriceHistory(realEstate)}
                  </Card>
                </Tab>
                <Tab eventKey="providers" title={`All Providers (${realEstate.duplicates.length + 1})`}>
                  <Card className="p-3">
                    {renderAllProviders(realEstate)}
                  </Card>
                </Tab>
              </Tabs>
            </Col>

            <Col lg={4}>
              {/* Action card */}
              <Card className="mb-4">
                <Card.Header className="bg-primary text-white">
                  <strong>Price Information</strong>
                </Card.Header>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="mb-0">
                      {getLowestPrice(realEstate) < realEstate.price ? (
                        <>
                          <span className="text-decoration-line-through text-muted" style={{fontSize: '1rem'}}>
                            {formatCurrency(realEstate.price, realEstate.currency)}
                          </span>
                          <div className="text-danger">
                            {formatCurrency(getLowestPrice(realEstate), realEstate.currency)}
                          </div>
                        </>
                      ) : (
                        formatCurrency(realEstate.price, realEstate.currency)
                      )}
                    </h3>
                    {getLowestPrice(realEstate) < realEstate.price && (
                      <Badge bg="danger" className="p-2">
                        Save {Math.round((1 - getLowestPrice(realEstate) / realEstate.price) * 100)}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-muted mb-3">
                    {formatCurrency(realEstate.pricePerM2, realEstate.currency)} per m²
                  </div>
                  <Button 
                    variant="primary" 
                    className="w-100 mb-3"
                    href={realEstate.url}
                    target="_blank"
                  >
                    View Original Listing
                  </Button>
                  {getLowerPriceProviders(realEstate).length > 0 && (
                    <Alert variant="success" className="mb-0 small">
                      <Info className="me-1" />
                      Lower prices available from other providers. See "All Providers" tab for details.
                    </Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Property details card */}
              <Card className="mb-4">
                <Card.Header>
                  <Houses className="me-2" />
                  <strong>Property Overview</strong>
                </Card.Header>
                <Card.Body>
                  <Row className="g-3">
                    <Col xs={6}>
                      <div className="text-muted small">Type</div>
                      <div>{realEstate.subCategory}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted small">Size</div>
                      <div>{realEstate.sizeInM2} m²</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted small">Transaction</div>
                      <div>{realEstate.transactionType}</div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-muted small">Provider</div>
                      <div>{realEstate.provider}</div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Available Providers card */}
              {realEstate.duplicates && realEstate.duplicates.length > 0 && (
                <Card className="mb-4">
                  <Card.Header className="d-flex align-items-center">
                    <LinkIcon className="me-2" />
                    <strong>Available Providers</strong>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="list-group list-group-flush">
                      <div className="list-group-item d-flex justify-content-between align-items-center">
                        <div>
                          <Badge bg="primary" className="me-2">{realEstate.provider}</Badge>
                          <Badge bg="info" pill>Original</Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline-primary"
                          href={realEstate.url}
                          target="_blank"
                        >
                          <LinkIcon size={14} />
                        </Button>
                      </div>
                      {realEstate.duplicates.map((duplicate, index) => (
                        <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          <div>
                            <Badge bg="secondary" className="me-2">{duplicate.provider}</Badge>
                            {duplicate.price < realEstate.price && (
                              <Badge bg="success" pill>
                                {Math.round((1 - duplicate.price / realEstate.price) * 100)}% off
                              </Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            href={duplicate.url}
                            target="_blank"
                          >
                            <LinkIcon size={14} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </Card.Body>
                  <Card.Footer className="text-center bg-white">
                    <Button 
                      variant="link" 
                      size="sm"
                      className="text-decoration-none"
                      onClick={() => document.querySelector('[data-bs-target="#providers"]')?.dispatchEvent(new Event('click'))}
                    >
                      View all providers
                    </Button>
                  </Card.Footer>
                </Card>
              )}
            </Col>
          </Row>
        </>
      ) : (
        <Alert variant="warning">Real estate information not found.</Alert>
      )}
    </Container>
  );
};

export default RealEstateDetail;
