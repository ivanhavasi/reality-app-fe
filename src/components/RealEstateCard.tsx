import React from 'react';
import { Link } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { RealEstate } from '../types/realEstate';
import { formatArea, formatPrice, formatPricePerM2, subCategoryLabel } from '../utils/format';
import { getLowerPriceProviders, getLowestPrice, localityToString } from '../utils/realEstate';
import { ListingImage } from './ui';
import FavoriteButton from './FavoriteButton';

interface RealEstateCardProps {
  estate: RealEstate;
}

const RealEstateCard: React.FC<RealEstateCardProps> = ({ estate }) => {
  const isLand = estate.mainCategory === 'LAND';
  const lowestPrice = getLowestPrice(estate);
  const subLabel = subCategoryLabel(estate.mainCategory, estate.subCategory);
  const address = localityToString(estate.locality);
  const sourceCount = estate.duplicates.length + 1;
  const meta = [
    subLabel,
    estate.sizeInM2 ? formatArea(estate.sizeInM2) : null,
    isLand && estate.pricePerM2 ? formatPricePerM2(estate.pricePerM2, estate.currency) : null,
  ].filter(Boolean);

  return (
    <div className="listing-card-wrap">
      <Link to={`/real-estates/${estate.id}`} className="listing-card">
        <ListingImage src={estate.images?.[0]} alt={estate.name}>
          <div className="listing-tags">
            <span className="media-tag">{estate.provider}</span>
            {sourceCount > 1 && (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    {getLowerPriceProviders(estate).length > 0
                      ? `Cheaper on ${getLowerPriceProviders(estate).join(', ')}`
                      : `Also listed on ${estate.duplicates.map(dup => dup.provider).join(', ')}`}
                  </Tooltip>
                }
              >
                <span className="media-tag">{sourceCount} sources</span>
              </OverlayTrigger>
            )}
          </div>
        </ListingImage>

        <div className="listing-body">
          <div className="listing-price">
            <span>{formatPrice(lowestPrice, estate.currency)}</span>
            {lowestPrice < estate.price && (
              <>
                <span className="listing-price-old">{formatPrice(estate.price, estate.currency)}</span>
                <span className="saving">−{Math.round((1 - lowestPrice / estate.price) * 100)}%</span>
              </>
            )}
          </div>
          <div className="listing-title line-clamp-1" title={estate.name}>{estate.name}</div>
          {meta.length > 0 && (
            <div className="listing-meta">
              {meta.map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="dot">·</span>}
                  {item}
                </React.Fragment>
              ))}
            </div>
          )}
          {address && <div className="listing-meta text-3 line-clamp-1">{address}</div>}
        </div>
      </Link>
      <FavoriteButton listingId={estate.id} />
    </div>
  );
};

export default RealEstateCard;
