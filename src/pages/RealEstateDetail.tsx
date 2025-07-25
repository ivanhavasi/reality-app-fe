import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Carousel, Table, Alert, Tab, Tabs } from 'react-bootstrap';
import { useRealEstate } from '../context/RealEstateContext';
import { RealEstate, Duplicate } from '../types/realEstate';
import { ArrowLeft, GeoAlt, Houses, CardImage, Info, Link as LinkIcon } from 'react-bootstrap-icons';
import { fetchRealEstateById } from '../services/RealEstateService';

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

  const loadRealEstateDetails = async (estateId: string) => {
    try {
      setLoading(true);
      setError(null);

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
      <div className="property-details-modern">
        <Row className="g-3">
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-tag text-primary me-2"></i>
                  <strong>Category</strong>
                </div>
                <p className="mb-0 text-muted">{estate.mainCategory}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-tags text-primary me-2"></i>
                  <strong>Subcategory</strong>
                </div>
                <p className="mb-0 text-muted">{estate.subCategory}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-expand-arrows-alt text-primary me-2"></i>
                  <strong>Property Size</strong>
                </div>
                <p className="mb-0 text-muted">{estate.sizeInM2} m²</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-calculator text-primary me-2"></i>
                  <strong>Price per m²</strong>
                </div>
                <p className="mb-0 text-muted">{formatCurrency(estate.pricePerM2, estate.currency)}</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-handshake text-primary me-2"></i>
                  <strong>Transaction Type</strong>
                </div>
                <Badge bg="primary" className="text-capitalize">
                  {estate.transactionType.toLowerCase()}
                </Badge>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 border-0 bg-light">
              <Card.Body className="p-3">
                <div className="d-flex align-items-center mb-2">
                  <i className="fas fa-building text-primary me-2"></i>
                  <strong>Provider</strong>
                </div>
                <Badge bg="secondary">{estate.provider}</Badge>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Price Information Card */}
        <Row className="mt-4">
          <Col>
            <Card className="border-0" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <Card.Body className="p-4 text-white">
                <div className="d-flex align-items-center mb-3">
                  <i className="fas fa-euro-sign fa-2x me-3"></i>
                  <div>
                    <h5 className="mb-1 text-white">Pricing Information</h5>
                    <small className="opacity-90">Current market pricing</small>
                  </div>
                </div>
                <Row>
                  <Col md={6}>
                    {getLowestPrice(estate) < estate.price ? (
                      <div>
                        <div className="text-decoration-line-through opacity-75 mb-1">
                          Original: {formatCurrency(estate.price, estate.currency)}
                        </div>
                        <div className="fs-4 fw-bold">
                          Best Price: {formatCurrency(getLowestPrice(estate), estate.currency)}
                        </div>
                        <Badge bg="success" className="mt-2">
                          Save {Math.round((1 - getLowestPrice(estate) / estate.price) * 100)}%
                        </Badge>
                      </div>
                    ) : (
                      <div className="fs-4 fw-bold">
                        {formatCurrency(estate.price, estate.currency)}
                      </div>
                    )}
                  </Col>
                  <Col md={6} className="text-md-end">
                    <div className="opacity-90">
                      <small>Average per m²</small>
                      <div className="fs-5 fw-semibold">
                        {formatCurrency(estate.pricePerM2, estate.currency)}
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
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
    // Always create a list that includes the original provider
    const allProviders = [
      {
        provider: estate.provider,
        price: estate.price,
        pricePerM2: estate.pricePerM2,
        url: estate.url,
        images: estate.images,
        isOriginal: true
      },
      ...(estate.duplicates || []).map(duplicate => ({
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
        <Alert variant="info" className="mb-4">
          <div className="d-flex align-items-center">
            <Info className="me-2" />
            <div>
              {allProviders.length === 1
                ? "This property is available from one provider. Click to view the listing."
                : "This property is listed on multiple platforms. Compare prices and visit different listings below."
              }
            </div>
          </div>
        </Alert>

        {/* Main Provider Quick Action */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0 bg-gradient-primary text-white">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5 className="text-white mb-1">View Original Listing</h5>
                    <p className="text-white opacity-90 mb-0">
                      Visit the main provider ({estate.provider}) to see complete details
                    </p>
                  </div>
                  <Button
                    variant="light"
                    size="lg"
                    href={estate.url}
                    target="_blank"
                    className="modern-btn shadow"
                  >
                    <LinkIcon className="me-2" />
                    Visit {estate.provider}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Modern Providers Cards */}
        <Row className="g-4">
          {allProviders.map((provider, index) => (
            <Col key={index} md={6} lg={4}>
              <Card className={`modern-card h-100 ${provider.isOriginal ? 'border-primary' : ''}`}>
                <Card.Header className="bg-transparent border-0 py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle d-flex align-items-center justify-content-center me-3 ${
                        provider.isOriginal ? 'bg-primary bg-opacity-10' : 'bg-secondary bg-opacity-10'
                      }`} style={{width: '40px', height: '40px'}}>
                        <i className={`fas fa-store ${
                          provider.isOriginal ? 'text-primary' : 'text-secondary'
                        }`}></i>
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">{provider.provider}</h6>
                        <small className="text-muted">
                          {provider.isOriginal ? 'Original Listing' : 'Alternative Source'}
                        </small>
                      </div>
                    </div>
                    {provider.isOriginal && (
                      <Badge bg="primary" pill>
                        Main
                      </Badge>
                    )}
                    {index === 0 && allProviders.length > 1 && !provider.isOriginal && (
                      <Badge bg="success" pill>
                        Best Price
                      </Badge>
                    )}
                  </div>
                </Card.Header>

                <Card.Body className="pt-0">
                  {/* Price Information */}
                  <div className="text-center mb-3">
                    <div className="price-badge py-2 px-3 d-inline-block mb-2">
                      <div className="fs-5 fw-bold">
                        {formatCurrency(provider.price, estate.currency)}
                      </div>
                    </div>
                    <div className="text-muted small">
                      {formatCurrency(provider.pricePerM2, estate.currency)} per m²
                    </div>
                  </div>

                  {/* Price Comparison */}
                  {allProviders.length > 1 && (
                    <div className="mb-3">
                      {index === 0 && !provider.isOriginal ? (
                        <div className="text-center">
                          <Badge bg="success" className="px-3 py-2">
                            <i className="fas fa-trophy me-1"></i>
                            Lowest Price
                          </Badge>
                        </div>
                      ) : index > 0 ? (
                        <div className="text-center">
                          <small className="text-muted">
                            +{formatCurrency(provider.price - allProviders[0].price, estate.currency)} more
                          </small>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="d-grid">
                    <Button
                      variant={provider.isOriginal ? "primary" : "outline-primary"}
                      href={provider.url}
                      target="_blank"
                      className="modern-btn"
                    >
                      <LinkIcon className="me-2" />
                      View on {provider.provider}
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Summary Table for Comparison */}
        {allProviders.length > 1 && (
          <Row className="mt-5">
            <Col>
              <Card className="modern-card">
                <Card.Header className="bg-transparent border-0 py-3">
                  <h6 className="mb-0 fw-bold">
                    <i className="fas fa-chart-bar me-2 text-primary"></i>
                    Price Comparison Summary
                  </h6>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="table-responsive">
                    <Table className="mb-0" hover>
                      <thead>
                        <tr>
                          <th className="border-0 ps-4">Provider</th>
                          <th className="border-0">Price</th>
                          <th className="border-0">Per m²</th>
                          <th className="border-0">Difference</th>
                          <th className="border-0 pe-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allProviders.map((provider, index) => (
                          <tr key={index} className={provider.isOriginal ? 'table-light' : ''}>
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <i className="fas fa-store text-muted me-2"></i>
                                <span className="fw-medium">{provider.provider}</span>
                                {provider.isOriginal && (
                                  <Badge bg="primary" className="ms-2">Main</Badge>
                                )}
                              </div>
                            </td>
                            <td className="fw-medium">
                              {formatCurrency(provider.price, estate.currency)}
                            </td>
                            <td className="text-muted">
                              {formatCurrency(provider.pricePerM2, estate.currency)}
                            </td>
                            <td>
                              {index === 0 ? (
                                <Badge bg="success">Best Price</Badge>
                              ) : (
                                <span className="text-danger small">
                                  +{formatCurrency(provider.price - allProviders[0].price, estate.currency)}
                                </span>
                              )}
                            </td>
                            <td className="pe-4">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                href={provider.url}
                                target="_blank"
                                className="modern-btn"
                              >
                                Visit
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Container>
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading real estate details...</span>
          </Spinner>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">
          <Alert.Heading>Error Loading Property</Alert.Heading>
          {error}
          <hr />
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate(-1)}>
              <ArrowLeft className="me-2" />
              Back
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  if (!realEstate) {
    return (
      <Container>
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="fas fa-home"></i>
          </div>
          <h3>Property Not Found</h3>
          <p className="text-muted">The requested property could not be found.</p>
          <Button variant="primary" className="modern-btn" onClick={() => navigate(-1)}>
            <ArrowLeft className="me-2" />
            Back
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="p-0">
      {/* Modern Header Section */}
      <div className="gradient-header py-4 py-md-5 mb-4">
        <Container>
          <Row className="align-items-center">
            <Col>
              <Button
                variant="light"
                className="modern-btn mb-3 shadow-sm"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="me-2" />
                Back
              </Button>
              <h1
                className="display-6 display-md-4 fw-bold text-white mb-2"
                style={{ cursor: 'pointer' }}
                onClick={() => window.open(realEstate.url, '_blank')}
                title="Click to view original listing"
              >
                {realEstate.mainCategory} - {realEstate.subCategory}
              </h1>
              <div className="d-flex align-items-center text-white opacity-90 fs-6">
                <GeoAlt className="me-2" />
                <span>{getAddressString(realEstate)}</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container>
        {/* View Original Listing - Prominent Top Section */}
        <Row className="mb-4">
          <Col>
            <Card className="border-0" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
              <Card.Body className="p-4">
                <Row className="align-items-center">
                  <Col md={8}>
                    <div className="text-white">
                      <h4 className="text-white mb-2">
                        <i className="fas fa-external-link-alt me-2"></i>
                        View Original Listing
                      </h4>
                      <p className="text-white opacity-90 mb-0">
                        Visit the main provider ({realEstate.provider}) to see complete property details,
                        additional photos, contact information, and schedule viewings.
                      </p>
                    </div>
                  </Col>
                  <Col md={4} className="text-center text-md-end mt-3 mt-md-0">
                    <Button
                      variant="light"
                      size="lg"
                      href={realEstate.url}
                      target="_blank"
                      className="modern-btn shadow px-4 py-2"
                    >
                      <LinkIcon className="me-2" />
                      Visit {realEstate.provider}
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Property Overview Cards */}
        <Row className="mb-4">
          <Col lg={4} className="mb-3">
            <Card className="modern-card h-100">
              <Card.Body className="text-center">
                <div className="price-badge py-2 px-3 mb-3 d-inline-block">
                  {getLowestPrice(realEstate) < realEstate.price ? (
                    <>
                      <div className="text-decoration-line-through opacity-75 small">
                        {formatCurrency(realEstate.price, realEstate.currency)}
                      </div>
                      <div className="fs-4">
                        {formatCurrency(getLowestPrice(realEstate), realEstate.currency)}
                      </div>
                    </>
                  ) : (
                    <div className="fs-4">
                      {formatCurrency(realEstate.price, realEstate.currency)}
                    </div>
                  )}
                </div>
                <h6 className="text-muted">
                  {formatCurrency(realEstate.pricePerM2, realEstate.currency)} per m²
                </h6>
                {getLowestPrice(realEstate) < realEstate.price && (
                  <Badge bg="success" className="mt-2">
                    Save {Math.round((1 - getLowestPrice(realEstate) / realEstate.price) * 100)}%
                  </Badge>
                )}
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-3">
            <Card className="modern-card h-100">
              <Card.Body className="text-center">
                <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <Houses className="text-primary" size={24} />
                </div>
                <h5>{realEstate.sizeInM2} m²</h5>
                <p className="text-muted mb-0">Property Size</p>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={4} className="mb-3">
            <Card className="modern-card h-100">
              <Card.Body className="text-center">
                <div className="bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                  <Info className="text-info" size={24} />
                </div>
                <h5 className="text-capitalize">{realEstate.transactionType.toLowerCase()}</h5>
                <p className="text-muted mb-0">Transaction Type</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Image Carousel Section */}
        {realEstate.images && realEstate.images.length > 0 && (
          <Row className="mb-4">
            <Col>
              <Card className="modern-card overflow-hidden">
                <Card.Header className="bg-transparent border-0 py-3">
                  <div className="d-flex align-items-center">
                    <CardImage className="me-2 text-primary" size={20} />
                    <h5 className="mb-0">Property Images</h5>
                    <Badge bg="primary" className="ms-auto">
                      {realEstate.images.length} {realEstate.images.length === 1 ? 'Image' : 'Images'}
                    </Badge>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Carousel
                    interval={null}
                    indicators={realEstate.images.length > 1}
                    controls={realEstate.images.length > 1}
                    className="property-carousel"
                  >
                    {realEstate.images.map((image, index) => (
                      <Carousel.Item key={index}>
                        <div
                          className="carousel-image-container"
                          style={{
                            height: '400px',
                            background: `url(${image}) center/cover no-repeat`,
                            position: 'relative'
                          }}
                        >
                          <div className="carousel-overlay d-flex align-items-end p-4">
                            <div className="text-white">
                              <h6 className="mb-1 opacity-90">
                                Image {index + 1} of {realEstate.images.length}
                              </h6>
                              <small className="opacity-75">
                                {realEstate.mainCategory} - {realEstate.subCategory}
                              </small>
                            </div>
                          </div>
                        </div>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Modernized Tabs for Details, Price History, and All Providers */}
        <Row>
          <Col>
            <Tabs defaultActiveKey="details" className="modern-tabs mb-4">
              <Tab eventKey="details" title={
                <span className="d-flex align-items-center">
                  <Info className="me-2" size={16} />
                  Property Details
                </span>
              }>
                <Card className="modern-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    {renderPropertyDetails(realEstate)}
                  </Card.Body>
                </Card>
              </Tab>
              <Tab eventKey="price-history" title={
                <span className="d-flex align-items-center">
                  <i className="fas fa-chart-line me-2"></i>
                  Price History
                </span>
              }>
                <Card className="modern-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    {renderPriceHistory(realEstate)}
                  </Card.Body>
                </Card>
              </Tab>
              <Tab eventKey="providers" title={
                <span className="d-flex align-items-center">
                  <i className="fas fa-store me-2"></i>
                  All Providers ({(realEstate.duplicates?.length || 0) + 1})
                </span>
              }>
                <Card className="modern-card border-0 shadow-sm">
                  <Card.Body className="p-4">
                    {renderAllProviders(realEstate)}
                  </Card.Body>
                </Card>
              </Tab>
            </Tabs>
          </Col>
        </Row>
      </Container>
    </Container>
  );
};

export default RealEstateDetail;
