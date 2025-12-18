import React, { useState } from "react";
import {
  HalftoneSettings,
  DotShape,
  FillPattern,
  AnimationSettings,
} from "../types";
import { Slider } from "./Slider";
import { ChevronDownIcon, ChevronRightIcon } from "./Icon";

interface ControlsPanelProps {
  settings: HalftoneSettings;
  animationSettings: AnimationSettings;
  onSettingsChange: <K extends keyof HalftoneSettings>(
    key: K,
    value: HalftoneSettings[K]
  ) => void;
  onAnimationChange: <K extends keyof AnimationSettings>(
    key: K,
    value: AnimationSettings[K]
  ) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCopySvg: () => void;
  onExportLottie?: () => void;
  hasImage: boolean;
}

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  headerActions?: React.ReactNode;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = true,
  headerActions,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-700/30">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2.5 px-3 hover:bg-gray-700/20 transition-colors group"
      >
        <div className="flex items-center gap-2">
          {isOpen ? (
            <ChevronDownIcon className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRightIcon className="w-3 h-3 text-gray-400" />
          )}
          <span className="text-xs font-medium text-gray-300 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {headerActions && (
          <div className="flex items-center gap-1">{headerActions}</div>
        )}
      </button>
      {isOpen && <div className="px-3 pb-3 space-y-2.5">{children}</div>}
    </div>
  );
};

const CompactInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string | number) => void;
  type?: "text" | "number";
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, type = "text", suffix, min, max, step }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-gray-400 w-8 flex-shrink-0">{label}</label>
      <div className="flex-1 flex items-center gap-1">
        <input
          type={type}
          value={value}
          onChange={(e) => {
            const newValue =
              type === "number"
                ? parseFloat(e.target.value) || 0
                : e.target.value;
            onChange(newValue);
          }}
          min={min}
          max={max}
          step={step}
          className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
        />
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
    </div>
  );
};

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}> = ({ checked, onChange, label }) => {
  return (
    <div className="flex items-center justify-between">
      {label && <span className="text-xs text-gray-300">{label}</span>}
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${
          checked ? "bg-indigo-500" : "bg-gray-600"
        }`}
      >
        <span
          className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
};

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  settings,
  animationSettings,
  onSettingsChange,
  onAnimationChange,
  onImageUpload,
  onCopySvg,
  onExportLottie,
  hasImage,
}) => {
  const [activeTab, setActiveTab] = useState<"basic" | "animation">("basic");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderShapeButton = (shape: DotShape, label: string) => (
    <button
      onClick={() => onSettingsChange("dotShape", shape)}
      className={`px-2.5 py-1.5 text-xs rounded transition-colors flex-1 ${
        settings.dotShape === shape
          ? "bg-indigo-500 text-white"
          : "bg-gray-700/50 hover:bg-gray-600 text-gray-300"
      }`}
    >
      {label}
    </button>
  );

  const renderFillPatternButton = (pattern: FillPattern, label: string) => (
    <button
      onClick={() => onSettingsChange("fillPattern", pattern)}
      className={`px-2.5 py-1.5 text-xs rounded transition-colors flex-1 ${
        settings.fillPattern === pattern
          ? "bg-indigo-500 text-white"
          : "bg-gray-700/50 hover:bg-gray-600 text-gray-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="h-screen bg-gray-800 flex flex-col border-l border-gray-700/50">
      {/* Header */}
      <div className="border-b border-gray-700/50">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold text-white">Halftone</span>
        </div>
        <div className="flex border-t border-gray-700/50" role="tablist">
          <button
            onClick={() => setActiveTab("basic")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "basic"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            role="tab"
            aria-selected={activeTab === "basic"}
          >
            Basic
          </button>
          <button
            onClick={() => setActiveTab("animation")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === "animation"
                ? "text-white border-b-2 border-white"
                : "text-gray-400 hover:text-gray-300"
            }`}
            role="tab"
            aria-selected={activeTab === "animation"}
          >
            Animation
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "basic" && (
          <>
            {/* Layout & Size */}
            <CollapsibleSection title="Layout & Size">
              <div className="space-y-2.5">
                <Slider
                  label="Resolution"
                  value={settings.resolution}
                  min={10}
                  max={150}
                  step={1}
                  onChange={(e) =>
                    onSettingsChange("resolution", parseInt(e.target.value))
                  }
                />
                <Slider
                  label="Max Dot Size"
                  value={settings.dotSize}
                  min={0.1}
                  max={2.5}
                  step={0.05}
                  onChange={(e) =>
                    onSettingsChange("dotSize", parseFloat(e.target.value))
                  }
                />
              </div>
            </CollapsibleSection>

            {/* Dot Shape */}
            <CollapsibleSection title="Dot Shape">
              <div className="grid grid-cols-4 gap-2">
                {renderShapeButton("round", "Round")}
                {renderShapeButton("square", "Square")}
                {renderShapeButton("plus", "+")}
                {renderShapeButton("custom", "Custom")}
              </div>
              {settings.dotShape === "custom" && (
                <div className="pt-2">
                  <input
                    type="text"
                    maxLength={2}
                    value={settings.customCharacter}
                    onChange={(e) =>
                      onSettingsChange(
                        "customCharacter",
                        e.target.value.slice(0, 2)
                      )
                    }
                    className="w-full bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1.5 text-center font-bold text-base text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                    placeholder="?"
                  />
                </div>
              )}
            </CollapsibleSection>

            {/* Effects */}
            <CollapsibleSection title="Effects">
              <div className="space-y-2.5">
                <Slider
                  label="Image Blur"
                  value={settings.imageBlur}
                  min={0}
                  max={10}
                  step={0.1}
                  onChange={(e) =>
                    onSettingsChange("imageBlur", parseFloat(e.target.value))
                  }
                />
                <Slider
                  label="Randomness"
                  value={settings.randomness}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(e) =>
                    onSettingsChange("randomness", parseFloat(e.target.value))
                  }
                />
                <Slider
                  label="Dot Angle"
                  value={settings.angle}
                  min={-180}
                  max={180}
                  step={1}
                  onChange={(e) =>
                    onSettingsChange("angle", parseInt(e.target.value))
                  }
                />
                <ToggleSwitch
                  checked={settings.invert}
                  onChange={(checked) => onSettingsChange("invert", checked)}
                  label="Invert Colors"
                />
              </div>
            </CollapsibleSection>

            {/* Fill Pattern */}
            <CollapsibleSection title="Fill Pattern">
              <div className="grid grid-cols-3 gap-2">
                {renderFillPatternButton("solid", "Solid")}
                {renderFillPatternButton("stripes", "Stripes")}
                {renderFillPatternButton("checkerboard", "Checker")}
              </div>
            </CollapsibleSection>

            {/* Fill */}
            <CollapsibleSection title="Fill">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded border border-gray-600"
                    style={{ backgroundColor: settings.color1 }}
                  />
                  <input
                    type="text"
                    value={settings.color1}
                    onChange={(e) => onSettingsChange("color1", e.target.value)}
                    className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                  />
                  <input
                    type="color"
                    value={settings.color1}
                    onChange={(e) => onSettingsChange("color1", e.target.value)}
                    className="w-5 h-5 p-0 border border-gray-600/50 rounded cursor-pointer bg-transparent"
                  />
                </div>
                {settings.useGradient && (
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: settings.color2 }}
                    />
                    <input
                      type="text"
                      value={settings.color2}
                      onChange={(e) =>
                        onSettingsChange("color2", e.target.value)
                      }
                      className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
                    />
                    <input
                      type="color"
                      value={settings.color2}
                      onChange={(e) =>
                        onSettingsChange("color2", e.target.value)
                      }
                      className="w-5 h-5 p-0 border border-gray-600/50 rounded cursor-pointer bg-transparent"
                    />
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Gradient */}
            <CollapsibleSection title="Gradient">
              <div className="space-y-2.5">
                <ToggleSwitch
                  checked={settings.useGradient}
                  onChange={(checked) =>
                    onSettingsChange("useGradient", checked)
                  }
                  label="Use Gradient"
                />
                {settings.useGradient && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() =>
                        onSettingsChange("gradientDirection", "vertical")
                      }
                      className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                        settings.gradientDirection === "vertical"
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-700/50 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      Vertical
                    </button>
                    <button
                      onClick={() =>
                        onSettingsChange("gradientDirection", "horizontal")
                      }
                      className={`px-2.5 py-1.5 text-xs rounded transition-colors ${
                        settings.gradientDirection === "horizontal"
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-700/50 hover:bg-gray-600 text-gray-300"
                      }`}
                    >
                      Horizontal
                    </button>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Export */}
            <CollapsibleSection title="Export">
              <div className="space-y-2">
                <button
                  onClick={onCopySvg}
                  disabled={!hasImage}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-xs transition-colors"
                >
                  Copy as SVG
                </button>
              </div>
            </CollapsibleSection>
          </>
        )}

        {activeTab === "animation" && (
          <>
            {/* Organic Pulse */}
            <CollapsibleSection title="Organic Pulse">
              <div className="space-y-2.5">
                <ToggleSwitch
                  checked={animationSettings.organicPulse}
                  onChange={(checked) =>
                    onAnimationChange("organicPulse", checked)
                  }
                  label="Organic breathing"
                />
                {animationSettings.organicPulse && (
                  <div className="space-y-2.5 pt-1">
                    <Slider
                      label="Pulse Strength"
                      value={Number(animationSettings.pulseStrength.toFixed(2))}
                      min={0}
                      max={0.35}
                      step={0.01}
                      onChange={(e) =>
                        onAnimationChange(
                          "pulseStrength",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                    <Slider
                      label="Pulse Speed"
                      value={Number(animationSettings.pulseTempo.toFixed(2))}
                      min={0.5}
                      max={2}
                      step={0.05}
                      onChange={(e) =>
                        onAnimationChange(
                          "pulseTempo",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                    <p className="text-xs text-gray-400 pt-1">
                      Controls the breathing rhythm for every dot in the SVG
                      export.
                    </p>
                  </div>
                )}
              </div>
            </CollapsibleSection>

            {/* Interactive Motion */}
            <CollapsibleSection title="Interactive Motion">
              <div className="space-y-2.5">
                <Slider
                  label="Hover Parallax"
                  value={Number(animationSettings.hoverParallax.toFixed(2))}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(e) =>
                    onAnimationChange(
                      "hoverParallax",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <p className="text-xs text-gray-400 -mt-1">
                  Set to 0 to disable hover push/pull.
                </p>
                <Slider
                  label="Click Ripple Speed"
                  value={Number(animationSettings.clickRippleSpeed.toFixed(2))}
                  min={0}
                  max={2}
                  step={0.05}
                  onChange={(e) =>
                    onAnimationChange(
                      "clickRippleSpeed",
                      parseFloat(e.target.value)
                    )
                  }
                />
                <p className="text-xs text-gray-400 -mt-1">
                  Higher values send pulses across the dots faster.
                </p>
              </div>
            </CollapsibleSection>

            {/* Panel UI */}
            <CollapsibleSection title="Panel UI">
              <div className="space-y-2.5">
                <ToggleSwitch
                  checked={animationSettings.uiHoverMotion}
                  onChange={(checked) =>
                    onAnimationChange("uiHoverMotion", checked)
                  }
                  label="Animate panel buttons"
                />
                <p className="text-xs text-gray-400">
                  Upload and copy buttons keep the gentle hover/press scaling
                  when enabled.
                </p>
              </div>
            </CollapsibleSection>

            {/* Export */}
            <CollapsibleSection title="Export">
              <div className="space-y-2">
                <button
                  onClick={onExportLottie}
                  disabled={!hasImage || !onExportLottie}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded text-xs transition-colors"
                >
                  Export as Lottie
                </button>
                <p className="text-xs text-gray-400">
                  Export the animated halftone as a Lottie JSON file for use in
                  Framer and other tools.
                </p>
              </div>
            </CollapsibleSection>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700/50 p-3 space-y-2 bg-gray-800">
        <button
          onClick={handleUploadClick}
          className={`w-full flex items-center justify-center gap-2 bg-gray-700/50 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded text-xs transition-colors ${
            animationSettings.uiHoverMotion
              ? "transform hover:scale-105 active:scale-95 transition-transform duration-150"
              : ""
          }`}
        >
          {hasImage ? "Change Image" : "Upload Image"}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={onImageUpload}
          className="hidden"
          accept="image/*"
        />
      </div>
    </div>
  );
};
