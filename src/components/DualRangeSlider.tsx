import React, { useState, useRef, useEffect } from 'react';

interface DualRangeSliderProps {
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step?: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  minValue,
  maxValue,
  min,
  max,
  step = 1,
  onChange,
  formatValue,
  className = '',
}) => {
  const [localMinValue, setLocalMinValue] = useState(minValue);
  const [localMaxValue, setLocalMaxValue] = useState(maxValue);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Update local values when props change
  useEffect(() => {
    setLocalMinValue(minValue);
    setLocalMaxValue(maxValue);
  }, [minValue, maxValue]);

  // Calculate percentage for positioning
  const calculatePercentage = (value: number) => {
    return ((value - min) / (max - min)) * 100;
  };

  // Format value for display
  const displayValue = (value: number) => {
    if (formatValue) {
      return formatValue(value);
    }
    return value.toString();
  };

  // Handle min value change
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin <= localMaxValue) {
      setLocalMinValue(newMin);
      onChange(newMin, localMaxValue);
    }
  };

  // Handle max value change
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= localMinValue) {
      setLocalMaxValue(newMax);
      onChange(localMinValue, newMax);
    }
  };

  return (
    <div className={`dual-slider-container ${className}`}>
      {/* Display values */}
      <div className="d-flex justify-content-between mb-2">
        <span className="text-white small">{displayValue(localMinValue)}</span>
        <span className="text-white small">{displayValue(localMaxValue)}</span>
      </div>
      
      {/* Slider track container with padding to prevent cutting off slider thumbs */}
      <div className="position-relative" style={{ padding: '10px 0' }}>
        {/* Slider track */}
        <div
          className="dual-slider-track position-relative"
          ref={sliderTrackRef}
          style={{ height: '6px', backgroundColor: 'rgba(255, 255, 255, 0.3)', borderRadius: '3px' }}
        >
          {/* Colored range between min and max */}
          <div
            className="dual-slider-range position-absolute"
            style={{
              left: `${calculatePercentage(localMinValue)}%`,
              width: `${calculatePercentage(localMaxValue) - calculatePercentage(localMinValue)}%`,
              height: '100%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '3px'
            }}
          />

          {/* Min input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMinValue}
            onChange={handleMinChange}
            className="dual-slider-input position-absolute"
            style={{
              width: '100%',
              height: '20px',
              top: '-7px',
              appearance: 'none',
              background: 'transparent',
              zIndex: localMinValue > localMaxValue - (max - min) * 0.1 ? 4 : 2,
              margin: 0
            }}
          />

          {/* Max input */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMaxValue}
            onChange={handleMaxChange}
            className="dual-slider-input position-absolute"
            style={{
              width: '100%',
              height: '20px',
              top: '-7px',
              appearance: 'none',
              background: 'transparent',
              zIndex: localMaxValue < localMinValue + (max - min) * 0.1 ? 4 : 2,
              margin: 0
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default DualRangeSlider;
