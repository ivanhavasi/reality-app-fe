import { Locality, RealEstate } from '../types/realEstate';

// price 0 means "price on request"; it must not win as the lowest price
export const getLowestPrice = (estate: RealEstate): number => {
  const duplicatePrices = (estate.duplicates || []).map(dup => dup.price).filter(price => price > 0);
  if (duplicatePrices.length === 0 || estate.price <= 0) {
    return estate.price;
  }
  return Math.min(estate.price, ...duplicatePrices);
};

export const getLowerPriceProviders = (estate: RealEstate): string[] =>
  (estate.duplicates || [])
    .filter(dup => dup.price > 0 && dup.price < estate.price)
    .map(dup => dup.provider);

export const localityToString = (locality: Locality | null | undefined, withStreetNumber = false): string => {
  if (!locality) return '';
  const street = withStreetNumber && locality.street && locality.streetNumber
    ? `${locality.street} ${locality.streetNumber}`
    : locality.street;
  return [street, locality.district, locality.city]
    .filter((part): part is string => !!part && part.trim() !== '')
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
};
