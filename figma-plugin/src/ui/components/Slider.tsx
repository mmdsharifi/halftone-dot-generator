import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, onChange }) => (
  <div className="slider">
    <div className="slider__row">
      <label className="controls__label">{label}</label>
      <span className="slider__value">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="slider__range"
    />
  </div>
);
