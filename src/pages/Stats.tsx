import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatisticsService from '../services/StatisticsService';
import { MarketStatistics, BuildingType, TransactionType, TimePeriod, TimeGranularity } from '../types/statistics';
import { useError } from '../context/ErrorContext';
import DualRangeSlider from '../components/DualRangeSlider';

const Stats = () => {
  const { setError } = useError();
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<MarketStatistics[]>([]);

  // Filter states
  const [city, setCity] = useState<string>('');
  const [buildingType, setBuildingType] = useState<BuildingType>('APARTMENT');
  const [transactionType, setTransactionType] = useState<TransactionType>('SALE');
  const [subCategory, setSubCategory] = useState<string>('');
  const [sizeMin, setSizeMin] = useState<number>(0);
  const [sizeMax, setSizeMax] = useState<number>(300);
  const [period, setPeriod] = useState<TimePeriod>('6M');
  const [granularity, setGranularity] = useState<TimeGranularity>('MONTHLY');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');

  // Calculate max size based on building type
  const getMaxSizeForType = (type: BuildingType): number => {
    switch (type) {
      case 'APARTMENT':
        return 300;
      case 'HOUSE':
        return 1000;
      case 'LAND':
        return 10000;
    }
  };

  const maxSize = getMaxSizeForType(buildingType);

  const buildingTypes: { value: BuildingType; label: string }[] = [
    { value: 'APARTMENT', label: 'Apartment' },
    { value: 'HOUSE', label: 'House' },
    { value: 'LAND', label: 'Land' }
  ];

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'SALE', label: 'Sale' },
    { value: 'RENT', label: 'Rent' }
  ];

  const periods: { value: TimePeriod; label: string }[] = [
    { value: '1M', label: 'Last Month' },
    { value: '3M', label: 'Last 3 Months' },
    { value: '6M', label: 'Last 6 Months' },
    { value: '1Y', label: 'Last Year' },
    { value: '2Y', label: 'Last 2 Years' },
    { value: '5Y', label: 'Last 5 Years' },
    { value: 'MAX', label: 'All Time' }
  ];

  const granularities: { value: TimeGranularity; label: string }[] = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' }
  ];

  const subCategories: { value: string; label: string }[] = [
    { value: '1+kk', label: '1+kk (Studio)' },
    { value: '1+1', label: '1+1' },
    { value: '2+kk', label: '2+kk' },
    { value: '2+1', label: '2+1' },
    { value: '3+kk', label: '3+kk' },
    { value: '3+1', label: '3+1' },
    { value: '4+kk', label: '4+kk' },
    { value: 'atypicky', label: 'Atypical' }
  ];

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const params: any = {
        period,
        granularity
      };

      if (city) params.city = city;
      params.buildingType = buildingType;
      params.transactionType = transactionType;
      if (subCategory) params.subCategory = subCategory;
      if (sizeMin > 0) params.sizeMin = sizeMin;
      if (sizeMax < maxSize) params.sizeMax = sizeMax;

      const data = await StatisticsService.getMarketStatistics(params);
      setStatistics(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleApplyFilters = () => {
    fetchStatistics();
  };

  const handleResetFilters = () => {
    setCity('');
    setBuildingType('APARTMENT');
    setTransactionType('SALE');
    setSubCategory('');
    setSizeMin(0);
    setSizeMax(getMaxSizeForType('APARTMENT'));
    setPeriod('6M');
    setGranularity('MONTHLY');
  };

  // Format price for display
  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(2)}M`;
    } else if (price >= 1000) {
      return `${(price / 1000).toFixed(0)}K`;
    }
    return price.toFixed(0);
  };

  // Format period label for chart
  const formatPeriodLabel = (period: string) => {
    if (period.includes('-W')) {
      return period.split('-W')[1] ? `W${period.split('-W')[1]}` : period;
    }
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    if (period.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return new Date(period).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return period;
  };

  // Prepare chart data
  const chartData = statistics.map(stat => ({
    period: formatPeriodLabel(stat.period),
    avgPrice: stat.avgPrice,
    avgPricePerM2: stat.avgPricePerM2 || 0,
    avgSize: stat.avgSize,
    count: stat.count,
    minPrice: stat.minPrice,
    maxPrice: stat.maxPrice,
  }));

  const renderChart = (dataKey: string, label: string, color: string, yAxisFormatter?: (value: number) => string) => {
    const ChartComponent = chartType === 'line' ? LineChart : BarChart;
    const DataComponent = chartType === 'line' ? Line : Bar;

    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
          <YAxis tickFormatter={yAxisFormatter || formatPrice} />
          <Tooltip formatter={(value: any) => yAxisFormatter ? yAxisFormatter(value || 0) : formatPrice(value || 0)} />
          <Legend />
          <DataComponent type="monotone" dataKey={dataKey} stroke={color} fill={color} name={label} />
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Container fluid className="p-4">
      <div className="mb-4">
        <h2 className="fw-bold mb-2">Market Statistics</h2>
        <p className="text-muted">Analyze real estate market trends and pricing data</p>
      </div>

      {/* Filters Card */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <h5 className="fw-bold mb-3">Filters</h5>
          <Row className="g-3">
            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">City</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Praha"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Building Type</Form.Label>
                <Form.Select
                  value={buildingType}
                  onChange={(e) => {
                    const newType = e.target.value as BuildingType;
                    setBuildingType(newType);
                    // Reset size range when building type changes
                    const newMax = getMaxSizeForType(newType);
                    setSizeMin(0);
                    setSizeMax(newMax);
                  }}
                >
                  {buildingTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Transaction Type</Form.Label>
                <Form.Select
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                >
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Apartment Layout</Form.Label>
                <Form.Select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                >
                  <option value="">All Layouts</option>
                  {subCategories.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Size Range (m²)</Form.Label>
                <div
                  className="mt-2 p-3 rounded-3"
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    minHeight: '70px'
                  }}
                >
                  <DualRangeSlider
                    minValue={sizeMin}
                    maxValue={sizeMax}
                    min={0}
                    max={maxSize}
                    step={buildingType === 'LAND' ? 100 : 10}
                    onChange={(min, max) => {
                      setSizeMin(min);
                      setSizeMax(max);
                    }}
                    formatValue={(value) => `${value} m²`}
                  />
                </div>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Time Period</Form.Label>
                <Form.Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as TimePeriod)}
                >
                  {periods.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Granularity</Form.Label>
                <Form.Select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
                >
                  {granularities.map(g => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6} lg={3}>
              <Form.Group>
                <Form.Label className="small fw-semibold">Chart Type</Form.Label>
                <Form.Select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
                >
                  <option value="line">Line Chart</option>
                  <option value="bar">Bar Chart</option>
                </Form.Select>
              </Form.Group>
            </Col>

            <Col lg={6} className="d-flex align-items-end gap-2">
              <Button variant="primary" onClick={handleApplyFilters} disabled={loading}>
                <i className="fas fa-filter me-2"></i>
                Apply Filters
              </Button>
              <Button variant="outline-secondary" onClick={handleResetFilters} disabled={loading}>
                <i className="fas fa-undo me-2"></i>
                Reset
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3 text-muted">Loading statistics...</p>
        </div>
      )}

      {/* No Data State */}
      {!loading && statistics.length === 0 && (
        <Alert variant="info">
          <i className="fas fa-info-circle me-2"></i>
          No data available for the selected filters. Try adjusting your criteria.
        </Alert>
      )}

      {/* Charts */}
      {!loading && statistics.length > 0 && (
        <>
          {/* Summary Stats */}
          <Row className="mb-4">
            <Col md={6} lg={3} className="mb-3">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                      <i className="fas fa-chart-line text-primary" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Avg Price</small>
                      <h4 className="fw-bold mb-0">
                        {formatPrice(statistics.reduce((sum, s) => sum + s.avgPrice, 0) / statistics.length)}
                      </h4>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                      <i className="fas fa-ruler-combined text-success" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Avg Size</small>
                      <h4 className="fw-bold mb-0">
                        {(statistics.reduce((sum, s) => sum + s.avgSize, 0) / statistics.length).toFixed(1)} m²
                      </h4>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                      <i className="fas fa-calculator text-warning" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Avg Price/m²</small>
                      <h4 className="fw-bold mb-0">
                        {formatPrice(
                          statistics.filter(s => s.avgPricePerM2).reduce((sum, s) => sum + (s.avgPricePerM2 || 0), 0) /
                          statistics.filter(s => s.avgPricePerM2).length || 0
                        )}
                      </h4>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} lg={3} className="mb-3">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <div className="d-flex align-items-center">
                    <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                      <i className="fas fa-home text-info" style={{ fontSize: '24px' }}></i>
                    </div>
                    <div>
                      <small className="text-muted d-block">Total Properties</small>
                      <h4 className="fw-bold mb-0">
                        {statistics.reduce((sum, s) => sum + s.count, 0)}
                      </h4>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts Grid */}
          <Row>
            <Col lg={6} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Average Price Trend</h5>
                  {renderChart('avgPrice', 'Average Price', '#0d6efd')}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Average Price per m² Trend</h5>
                  {renderChart('avgPricePerM2', 'Avg Price/m²', '#198754')}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Price Range (Min/Max)</h5>
                  <ResponsiveContainer width="100%" height={300}>
                    {chartType === 'line' ? (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                        <YAxis tickFormatter={formatPrice} />
                        <Tooltip formatter={(value: any) => formatPrice(value || 0)} />
                        <Legend />
                        <Line type="monotone" dataKey="minPrice" stroke="#dc3545" name="Min Price" />
                        <Line type="monotone" dataKey="maxPrice" stroke="#ffc107" name="Max Price" />
                      </LineChart>
                    ) : (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                        <YAxis tickFormatter={formatPrice} />
                        <Tooltip formatter={(value: any) => formatPrice(value || 0)} />
                        <Legend />
                        <Bar dataKey="minPrice" fill="#dc3545" name="Min Price" />
                        <Bar dataKey="maxPrice" fill="#ffc107" name="Max Price" />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={6} className="mb-4">
              <Card className="shadow-sm">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Property Count</h5>
                  {renderChart('count', 'Number of Properties', '#6f42c1', (value) => value.toString())}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default Stats;