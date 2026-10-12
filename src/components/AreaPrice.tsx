import React from 'react';
import { AreaPriceComparison } from '../types/realEstate';
import { BuildingType } from '../types/property';
import { formatPricePerM2 } from '../utils/format';

// a couple of percent is noise between listings, not a deal
const NEUTRAL_PERCENT = 2;

const NOUNS: Record<BuildingType, string> = {
  APARTMENT: 'apartments',
  HOUSE: 'houses',
  LAND: 'plots',
};

const formatRadius = (meters: number) => (meters < 1000 ? `${meters} m` : `${meters / 1000} km`);

interface AreaPriceProps {
  comparison: AreaPriceComparison;
  buildingType: BuildingType;
  currency: string;
}

const AreaPrice: React.FC<AreaPriceProps> = ({ comparison, buildingType, currency }) => {
  const { differencePercent: difference } = comparison;
  const tone = difference <= -NEUTRAL_PERCENT ? ' chip-positive' : difference >= NEUTRAL_PERCENT ? ' chip-negative' : '';
  const sign = difference > 0 ? '+' : difference < 0 ? '−' : '±';

  return (
    <div className="area-price" title="Similar size, listed in the last 12 months. Lowest price across portals.">
      <div className="area-price-head">
        <span className={`chip${tone} tabular`}>{sign}{Math.abs(difference)}%</span>
        <span>vs. area average</span>
      </div>
      <div className="area-price-detail">
        {formatPricePerM2(comparison.pricePerM2, currency)} here, median {formatPricePerM2(comparison.areaPricePerM2, currency)} for{' '}
        {comparison.comparableCount} similar {NOUNS[buildingType]} within {formatRadius(comparison.radiusInMeters)}
      </div>
    </div>
  );
};

export default AreaPrice;
