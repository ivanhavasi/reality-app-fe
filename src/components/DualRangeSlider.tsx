import React, { useState, useEffect } from 'react';

interface DualRangeSliderProps {
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step?: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (value: number) => string;
  label?: React.ReactNode;
  className?: string;
}

const DualRangeSlider: React.FC<DualRangeSliderProps> = ({
  minValue,
  maxValue,
  min,
  max,
  step = 1,
  onChange,
  formatValue = (value) => value.toString(),
  label,
  className = '',
}) => {
  const [localMinValue, setLocalMinValue] = useState(minValue);
  const [localMaxValue, setLocalMaxValue] = useState(maxValue);

  useEffect(() => {
    setLocalMinValue(minValue);
    setLocalMaxValue(maxValue);
  }, [minValue, maxValue]);

  const calculatePercentage = (value: number) => ((value - min) / (max - min)) * 100;

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Number(e.target.value);
    if (newMin <= localMaxValue) {
      setLocalMinValue(newMin);
      onChange(newMin, localMaxValue);
    }
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Number(e.target.value);
    if (newMax >= localMinValue) {
      setLocalMaxValue(newMax);
      onChange(localMinValue, newMax);
    }
  };

  // when both thumbs sit near the top, the min thumb must stay grabbable
  const minOnTop = localMinValue > localMaxValue - (max - min) * 0.1;

  return (
    <div className={`range ${className}`}>
      <div className="range-head">
        {label && <span className="range-label">{label}</span>}
        <span className="range-value">
          {formatValue(localMinValue)} – {formatValue(localMaxValue)}
        </span>
      </div>
      <div className="range-track-wrap">
        <div className="range-track">
          <div
            className="range-fill"
            style={{
              left: `${calculatePercentage(localMinValue)}%`,
              width: `${calculatePercentage(localMaxValue) - calculatePercentage(localMinValue)}%`,
            }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMinValue}
          onChange={handleMinChange}
          className="range-input"
          style={{ zIndex: minOnTop ? 4 : 2 }}
          aria-label="Minimum"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localMaxValue}
          onChange={handleMaxChange}
          className="range-input"
          style={{ zIndex: minOnTop ? 2 : 3 }}
          aria-label="Maximum"
        />
      </div>
    </div>
  );
};

export default DualRangeSlider;
