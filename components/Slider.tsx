import React from "react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-xs text-gray-300">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const numValue = parseFloat(e.target.value) || 0;
          const clampedValue = Math.max(min, Math.min(max, numValue));
          onChange({
            target: { value: clampedValue.toString() },
          } as React.ChangeEvent<HTMLInputElement>);
        }}
        className="w-16 bg-gray-700/50 border border-gray-600/50 rounded px-1.5 py-0.5 text-xs text-white font-mono text-right focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
        step={step}
      />
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className="w-full h-1 bg-gray-700/50 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
    />
  </div>
);
