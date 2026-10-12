import { BUILDING_TYPE_META, isBuildingType, LAND_SUB_TYPE_LABELS } from '../types/property';

const cz = (v: number) => Math.round(v).toLocaleString('cs-CZ');

export const formatCurrency = (v: number | null | undefined, cur = 'CZK') =>
  v == null ? '—' : `${cz(v)} ${cur === 'CZK' ? 'Kč' : cur}`;

// price 0 means "price on request"
export const formatPrice = (v: number | null | undefined, cur = 'CZK') =>
  v != null && v <= 0 ? 'Price on request' : formatCurrency(v, cur);

export const formatCompactPrice = (v: number | null | undefined, cur = 'CZK') => {
  if (v == null || v <= 0) return '—';
  const unit = cur === 'CZK' ? 'Kč' : cur;
  if (v >= 1_000_000) return `${(v / 1_000_000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })}M ${unit}`;
  if (v >= 10_000) return `${Math.round(v / 1_000)}K ${unit}`;
  return `${cz(v)} ${unit}`;
};

export const formatPricePerM2 = (v: number | null | undefined, cur = 'CZK') =>
  v == null ? '—' : `${formatCurrency(v, cur)}/m²`;

// short distances to 10 m, longer ones in km
export const formatDistance = (meters: number) =>
  meters < 100
    ? `${Math.round(meters)} m`
    : meters < 1000
      ? `${Math.round(meters / 10) * 10} m`
      : `${(meters / 1000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} km`;

export const formatArea = (m2: number | null | undefined) =>
  m2 == null
    ? '—'
    : m2 >= 10_000
      ? `${(m2 / 10_000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ha`
      : `${cz(m2)} m²`;

export const subCategoryLabel = (type: string | null | undefined, sub: string | null | undefined) =>
  !sub ? '' : type === 'LAND' ? LAND_SUB_TYPE_LABELS[sub] ?? sub : sub;

export const buildingTypeLabel = (type: string | null | undefined) =>
  isBuildingType(type) ? BUILDING_TYPE_META[type].label : type ?? '';

// "Land · Building plot", "Apartment · 2+kk"
export const typeLabel = (type: string | null | undefined, sub: string | null | undefined) =>
  [buildingTypeLabel(type), subCategoryLabel(type, sub)].filter(Boolean).join(' · ');

export const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
