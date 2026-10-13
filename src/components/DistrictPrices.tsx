import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { MarketStatistics } from '../types/statistics';
import { formatPricePerM2 } from '../utils/format';

// thinner districts swing too much on a single listing
const MIN_LISTINGS = 5;
const COLLAPSED_COUNT = 15;

// "Praha 9" and "Hlavní město Praha" name no city part (Sreality apartments stored before the city part was kept)
const NOT_A_CITY_PART = /^(Praha( \d+)?|Hlavní město Praha)$/;

interface DistrictPrice {
  name: string;
  count: number;
  avgPricePerM2: number;
}

const comparable = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// rows come per district and month; averages are merged weighted by their listing counts
const aggregateByDistrict = (rows: MarketStatistics[]): DistrictPrice[] => {
  const groups = new Map<string, { names: Map<string, number>; count: number; pricePerM2Sum: number }>();
  rows.forEach(({ grouping, avgPricePerM2, count }) => {
    const name = grouping.district?.trim().replace(/^Praha-/, '');
    if (!name || NOT_A_CITY_PART.test(name) || avgPricePerM2 == null) return;
    const key = comparable(name);
    const group = groups.get(key) ?? { names: new Map<string, number>(), count: 0, pricePerM2Sum: 0 };
    group.names.set(name, (group.names.get(name) ?? 0) + count);
    group.count += count;
    group.pricePerM2Sum += avgPricePerM2 * count;
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .filter(group => group.count >= MIN_LISTINGS)
    .map(group => ({
      name: Array.from(group.names.entries()).sort((a, b) => b[1] - a[1])[0][0],
      count: group.count,
      avgPricePerM2: group.pricePerM2Sum / group.count,
    }))
    .sort((a, b) => b.avgPricePerM2 - a.avgPricePerM2);
};

interface DistrictPricesProps {
  rows: MarketStatistics[];
}

const DistrictPrices: React.FC<DistrictPricesProps> = ({ rows }) => {
  const [expanded, setExpanded] = useState(false);
  const districts = aggregateByDistrict(rows);
  const visible = expanded ? districts : districts.slice(0, COLLAPSED_COUNT);
  const max = districts[0]?.avgPricePerM2 ?? 0;

  return (
    <div className="panel mt-3">
      <h3 className="panel-title">Price per m² by district</h3>
      <p className="panel-subtitle mb-3">Average over the period, districts with at least {MIN_LISTINGS} listings</p>

      {districts.length === 0 ? (
        <p className="text-2 mb-0" style={{ fontSize: '0.875rem' }}>
          No district has {MIN_LISTINGS} listings for these filters yet. Try a longer period.
        </p>
      ) : (
        <>
          <ol className="district-list">
            {visible.map(district => (
              <li key={district.name} className="district-row">
                <span className="district-name" title={district.name}>{district.name}</span>
                <span className="district-bar" aria-hidden="true">
                  <i style={{ width: `${(district.avgPricePerM2 / max) * 100}%` }} />
                </span>
                <span className="district-value tabular">{formatPricePerM2(district.avgPricePerM2)}</span>
                <span className="district-count tabular">
                  {district.count.toLocaleString('cs-CZ')} listings
                </span>
              </li>
            ))}
          </ol>
          {districts.length > COLLAPSED_COUNT && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show fewer' : `Show all ${districts.length} districts`}
            </Button>
          )}
        </>
      )}
    </div>
  );
};

export default DistrictPrices;
