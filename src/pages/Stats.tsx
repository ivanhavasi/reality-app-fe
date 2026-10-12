import { useState, useEffect } from 'react';
import { Row, Col, Form, Button } from 'react-bootstrap';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { BarChartLine } from 'react-bootstrap-icons';
import StatisticsService from '../services/StatisticsService';
import { MarketStatistics, BuildingType, TransactionType, TimePeriod, TimeGranularity } from '../types/statistics';
import { useError } from '../context/ErrorContext';
import DualRangeSlider from '../components/DualRangeSlider';
import { BUILDING_TYPE_META, ENABLED_BUILDING_TYPES, ENABLED_LAND_SUB_TYPES, SIZE_RANGE } from '../types/property';
import { formatPricePerM2 } from '../utils/format';
import { EmptyState, PageHeader, Segmented } from '../components/ui';

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

  const getMaxSizeForType = (type: BuildingType): number => SIZE_RANGE[type].max;

  const maxSize = getMaxSizeForType(buildingType);

  const transactionTypes: { value: TransactionType; label: string }[] = [
    { value: 'SALE', label: 'Sale' },
    { value: 'RENT', label: 'Rent' }
  ];

  const periods: { value: TimePeriod; label: string }[] = [
    { value: '1M', label: 'Last month' },
    { value: '3M', label: 'Last 3 months' },
    { value: '6M', label: 'Last 6 months' },
    { value: '1Y', label: 'Last year' },
    { value: '2Y', label: 'Last 2 years' },
    { value: '5Y', label: 'Last 5 years' },
    { value: 'MAX', label: 'All time' }
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
      const effectiveSubCategory = buildingType === 'LAND' ? ENABLED_LAND_SUB_TYPES[0] : subCategory;
      if (effectiveSubCategory) params.subCategory = effectiveSubCategory;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildingType]);

  const handleBuildingTypeChange = (newType: BuildingType) => {
    if (newType === buildingType) return;
    setBuildingType(newType);
    setSubCategory('');
    setSizeMin(0);
    setSizeMax(getMaxSizeForType(newType));
  };

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

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `${(price / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })}M`;
    } else if (price >= 1000) {
      return `${Math.round(price / 1000)}K`;
    }
    return price.toFixed(0);
  };

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

  const chartData = statistics.map(stat => ({
    period: formatPeriodLabel(stat.period),
    avgPrice: stat.avgPrice,
    avgPricePerM2: stat.avgPricePerM2 || 0,
    avgSize: stat.avgSize,
    count: stat.count,
    minPrice: stat.minPrice,
    maxPrice: stat.maxPrice,
  }));

  const axisProps = {
    tickLine: false,
    axisLine: false,
    tick: { fill: 'var(--app-text-3)', fontSize: 12 },
  };

  const renderTooltip = (format: (value: number) => string) => ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="chart-tooltip">
        <div className="chart-tooltip-label">{label}</div>
        {payload.map((entry: any) => (
          <div className="chart-tooltip-row" key={entry.dataKey}>
            <i style={{ background: entry.color }} />
            {entry.name}
            <b>{format(Number(entry.value) || 0)}</b>
          </div>
        ))}
      </div>
    );
  };

  type Series = { dataKey: string; name: string; color: string };

  const renderChart = (series: Series[], format: (value: number) => string, axisFormat = format) => (
    <ResponsiveContainer width="100%" height={260}>
      {chartType === 'line' ? (
        <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--app-border)" />
          <XAxis dataKey="period" {...axisProps} minTickGap={16} dy={6} />
          <YAxis tickFormatter={axisFormat} {...axisProps} width={56} />
          <Tooltip content={renderTooltip(format)} cursor={{ stroke: 'var(--app-border-strong)' }} />
          {series.map(({ dataKey, name, color }) => (
            <Line
              key={dataKey}
              type="monotone"
              dataKey={dataKey}
              name={name}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--app-surface)' }}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="var(--app-border)" />
          <XAxis dataKey="period" {...axisProps} minTickGap={16} dy={6} />
          <YAxis tickFormatter={axisFormat} {...axisProps} width={56} />
          <Tooltip content={renderTooltip(format)} cursor={{ fill: 'var(--app-surface-2)' }} />
          {series.map(({ dataKey, name, color }) => (
            <Bar key={dataKey} dataKey={dataKey} name={name} fill={color} radius={[4, 4, 0, 0]} maxBarSize={24} />
          ))}
        </BarChart>
      )}
    </ResponsiveContainer>
  );

  const average = (values: number[]) => (values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : 0);
  const perM2Values = statistics.filter(s => s.avgPricePerM2).map(s => s.avgPricePerM2 || 0);
  const isLand = buildingType === 'LAND';

  return (
    <>
      <PageHeader
        title="Market stats"
        subtitle={isLand ? 'Building plot prices in the Prague region' : 'Asking prices and supply over time'}
        actions={
          <Segmented
            ariaLabel="Property type"
            value={buildingType}
            onChange={handleBuildingTypeChange}
            disabled={loading}
            options={ENABLED_BUILDING_TYPES.map(type => ({
              value: type,
              label: BUILDING_TYPE_META[type].plural,
              icon: BUILDING_TYPE_META[type].icon,
            }))}
          />
        }
      />

      <div className="toolbar mb-4 p-3">
        <Row className="g-3">
          <Col sm={6} lg={3}>
            <Form.Label htmlFor="stats-city">City</Form.Label>
            <Form.Control
              id="stats-city"
              type="text"
              placeholder="Any city, e.g. Praha"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </Col>
          <Col sm={6} lg={3}>
            <Form.Label as="div">Transaction</Form.Label>
            <Segmented
              ariaLabel="Transaction"
              block
              value={transactionType}
              onChange={setTransactionType}
              options={transactionTypes.map(type => ({ value: type.value, label: type.value === 'SALE' ? 'Buy' : 'Rent' }))}
            />
          </Col>
          {!isLand && (
            <Col sm={6} lg={3}>
              <Form.Label htmlFor="stats-layout">Layout</Form.Label>
              <Form.Select id="stats-layout" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                <option value="">All layouts</option>
                {subCategories.map(sub => (
                  <option key={sub.value} value={sub.value}>{sub.label}</option>
                ))}
              </Form.Select>
            </Col>
          )}
          <Col sm={6} lg={3}>
            <DualRangeSlider
              label={isLand ? 'Plot area' : 'Floor area'}
              minValue={sizeMin}
              maxValue={sizeMax}
              min={0}
              max={maxSize}
              step={SIZE_RANGE[buildingType].step}
              onChange={(min, max) => {
                setSizeMin(min);
                setSizeMax(max);
              }}
              formatValue={(value) => `${value.toLocaleString('cs-CZ')} m²`}
            />
          </Col>
          <Col sm={6} lg={3}>
            <Form.Label htmlFor="stats-period">Period</Form.Label>
            <Form.Select id="stats-period" value={period} onChange={(e) => setPeriod(e.target.value as TimePeriod)}>
              {periods.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col sm={6} lg={3}>
            <Form.Label htmlFor="stats-granularity">Group by</Form.Label>
            <Form.Select
              id="stats-granularity"
              value={granularity}
              onChange={(e) => setGranularity(e.target.value as TimeGranularity)}
            >
              {granularities.map(g => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </Form.Select>
          </Col>
          <Col lg={isLand ? 6 : 3} className="d-flex gap-2 justify-content-lg-end align-self-end">
            <Button variant="ghost" onClick={handleResetFilters} disabled={loading}>
              Reset
            </Button>
            <Button variant="primary" onClick={handleApplyFilters} disabled={loading}>
              Apply filters
            </Button>
          </Col>
        </Row>
      </div>

      {loading ? (
        <>
          <div className="stat-grid mb-4">
            {[0, 1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 84, borderRadius: 14 }} />)}
          </div>
          <div className="chart-grid">
            {[0, 1].map(i => <div key={i} className="skeleton" style={{ height: 330, borderRadius: 14 }} />)}
          </div>
        </>
      ) : statistics.length === 0 ? (
        <EmptyState
          icon={BarChartLine}
          title="No data for these filters"
          text="Try a longer period, a different layout or a wider size range."
        />
      ) : (
        <>
          <div className="stat-grid mb-4">
            <div className="stat-tile">
              <div className="stat-label">Average price</div>
              <div className="stat-value">
                {formatPrice(average(statistics.map(s => s.avgPrice)))}
                <small>Kč</small>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Average price per m²</div>
              <div className="stat-value">
                {Math.round(average(perM2Values)).toLocaleString('cs-CZ')}
                <small>Kč/m²</small>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Average size</div>
              <div className="stat-value">
                {average(statistics.map(s => s.avgSize)).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })}
                <small>m²</small>
              </div>
            </div>
            <div className="stat-tile">
              <div className="stat-label">Listings in period</div>
              <div className="stat-value">{statistics.reduce((sum, s) => sum + s.count, 0).toLocaleString('cs-CZ')}</div>
            </div>
          </div>

          <div className="section-head">
            <h2 className="section-title">Trends</h2>
            <Segmented
              ariaLabel="Chart type"
              size="sm"
              value={chartType}
              onChange={setChartType}
              options={[
                { value: 'line', label: 'Line' },
                { value: 'bar', label: 'Bar' },
              ]}
            />
          </div>

          <div className="chart-grid">
            <div className="panel">
              <h3 className="panel-title">Average price</h3>
              <p className="panel-subtitle mb-3">Kč</p>
              {renderChart([{ dataKey: 'avgPrice', name: 'Average price', color: 'var(--app-chart-1)' }], formatPrice)}
            </div>
            <div className="panel">
              <h3 className="panel-title">Average price per m²</h3>
              <p className="panel-subtitle mb-3">Kč / m²</p>
              {renderChart(
                [{ dataKey: 'avgPricePerM2', name: 'Price per m²', color: 'var(--app-chart-1)' }],
                (value) => formatPricePerM2(value),
                formatPrice,
              )}
            </div>
            <div className="panel">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div>
                  <h3 className="panel-title">Price range</h3>
                  <p className="panel-subtitle">Cheapest and most expensive listing, Kč</p>
                </div>
                <div className="chart-legend">
                  <span><i style={{ background: 'var(--app-chart-2)' }} />Lowest</span>
                  <span><i style={{ background: 'var(--app-chart-1)' }} />Highest</span>
                </div>
              </div>
              {renderChart(
                [
                  { dataKey: 'minPrice', name: 'Lowest', color: 'var(--app-chart-2)' },
                  { dataKey: 'maxPrice', name: 'Highest', color: 'var(--app-chart-1)' },
                ],
                formatPrice,
              )}
            </div>
            <div className="panel">
              <h3 className="panel-title">Listings</h3>
              <p className="panel-subtitle mb-3">New listings per period</p>
              {renderChart(
                [{ dataKey: 'count', name: 'Listings', color: 'var(--app-chart-1)' }],
                (value) => value.toLocaleString('cs-CZ'),
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Stats;