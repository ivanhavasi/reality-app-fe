import React, { useState } from 'react';
import type { Icon } from 'react-bootstrap-icons';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div className="page-header">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: Icon;
}

interface SegmentedProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  size?: 'sm';
  block?: boolean;
  disabled?: boolean;
}

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  size,
  block,
  disabled,
}: SegmentedProps<T>) => (
  <div
    role="radiogroup"
    aria-label={ariaLabel}
    className={`segmented${size ? ` segmented-${size}` : ''}${block ? ' segmented-block' : ''}`}
  >
    {options.map(({ value: optionValue, label, icon: OptionIcon }) => (
      <button
        key={optionValue}
        type="button"
        role="radio"
        aria-checked={optionValue === value}
        className="segmented-option"
        disabled={disabled}
        onClick={() => optionValue !== value && onChange(optionValue)}
      >
        {OptionIcon && <OptionIcon size={14} />}
        {label}
      </button>
    ))}
  </div>
);

interface EmptyStateProps {
  icon: Icon;
  title: string;
  text?: React.ReactNode;
  actions?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: StateIcon, title, text, actions }) => (
  <div className="empty-state">
    <div className="empty-state-icon">
      <StateIcon size={20} />
    </div>
    <h2 className="empty-state-title">{title}</h2>
    {text && <p className="empty-state-text">{text}</p>}
    {actions && <div className="empty-state-actions">{actions}</div>}
  </div>
);

interface ListingImageProps {
  src?: string | null;
  alt: string;
  fallbackIcon: Icon;
  children?: React.ReactNode;
}

export const ListingImage: React.FC<ListingImageProps> = ({ src, alt, fallbackIcon: FallbackIcon, children }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="listing-media">
      <FallbackIcon size={28} />
      {src && !failed && <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />}
      {children}
    </div>
  );
};

export const ListingSkeletonGrid: React.FC<{ count?: number }> = ({ count = 8 }) => (
  <div className="listing-grid" aria-hidden="true">
    {Array.from({ length: count }, (_, i) => (
      <div key={i}>
        <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 14 }} />
        <div className="skeleton mt-3" style={{ height: 16, width: '45%' }} />
        <div className="skeleton mt-2" style={{ height: 12, width: '85%' }} />
        <div className="skeleton mt-2" style={{ height: 12, width: '60%' }} />
      </div>
    ))}
  </div>
);

export const BrandMark: React.FC<{ size?: number }> = ({ size = 28 }) => (
  <span className="brand-mark" style={{ width: size, height: size }} aria-hidden="true">
    <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 16 16" fill="none">
      <path
        d="M2.5 7.25 8 2.75l5.5 4.5v6a.75.75 0 0 1-.75.75H3.25a.75.75 0 0 1-.75-.75v-6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M6.25 14V9.75h3.5V14" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  </span>
);

export const initials = (name?: string | null) =>
  (name || '?')
    .split(/[\s._@-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');
