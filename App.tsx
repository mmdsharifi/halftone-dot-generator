import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimationSettings, HalftoneSettings } from "./types";
import { ControlsPanel } from "./components/ControlsPanel";
import { CanvasDisplay } from "./components/CanvasDisplay";
import { useHalftone } from "./hooks/useHalftone";
import { Toast } from "./components/Toast";

/**
 * ============================================================================
 * MAIN APPLICATION COMPONENT
 * ============================================================================
 * Root component managing application state and user interactions.
 * Groups related functionality:
 * - Image upload and paste handling
 * - Settings state management (halftone and animation)
 * - Toast notification system
 * - Export functionality (SVG and Lottie)
 * - Event handlers for user interactions
 */

const App: React.FC = () => {
  // Image state: Track current image source
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Toast notification state: Manage user feedback messages
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({
    message: "",
    type: "success",
    show: false,
  });
  const toastTimeoutRef = useRef<number | null>(null);

  // Halftone settings state: Default configuration for halftone generation
  const [settings, setSettings] = useState<HalftoneSettings>({
    resolution: 100,
    dotSize: 1.0,
    dotShape: "round",
    imageBlur: 0,
    invert: false,
    useGradient: false,
    gradientDirection: "vertical",
    randomness: 0,
    color1: "#ffffff",
    color2: "#000000",
    customCharacter: "*",
    fillPattern: "solid",
    angle: 0,
  });

  // Animation settings state: Default configuration for animations
  const [animationSettings, setAnimationSettings] = useState<AnimationSettings>(
    {
      organicPulse: false,
      pulseStrength: 0.08,
      pulseTempo: 1,
      hoverParallax: 1,
      clickRippleSpeed: 1,
      uiHoverMotion: true,
    }
  );

  const { getSvgString, getLottieJson } = useHalftone(
    canvasRef,
    imageSrc,
    settings,
    animationSettings
  );

  // Settings change handlers: Update halftone and animation settings
  const handleSettingsChange = useCallback(
    <K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleAnimationChange = useCallback(
    <K extends keyof AnimationSettings>(
      key: K,
      value: AnimationSettings[K]
    ) => {
      setAnimationSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // Toast notification handler: Display temporary success/error messages
  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      setToast({ message, type, show: true });
      toastTimeoutRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Image processing: Validate and load image file
  const processImageFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("Invalid file type. Please use an image.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  // File upload handler: Handle file input change events
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processImageFile(event.target.files[0]);
    }
  };

  // Clipboard paste handler: Listen for paste events to load images from clipboard
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            event.preventDefault();
            processImageFile(file);
            showToast("Image pasted successfully!", "success");
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [processImageFile, showToast]);

  // SVG export handler: Copy SVG string to clipboard
  const handleCopySvg = useCallback(async () => {
    if (!imageSrc || !getSvgString) return;
    const svgString = getSvgString();
    if (svgString) {
      try {
        await navigator.clipboard.writeText(svgString);
        showToast("SVG copied to clipboard!", "success");
      } catch (err) {
        console.error("Failed to copy SVG: ", err);
        showToast("Failed to copy SVG.", "error");
      }
    }
  }, [getSvgString, imageSrc, showToast]);

  // Lottie export handler: Download Lottie JSON file
  const handleExportLottie = useCallback(() => {
    if (!imageSrc || !getLottieJson) return;
    const lottieData = getLottieJson();
    if (lottieData) {
      try {
        const jsonString = JSON.stringify(lottieData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "halftone-animation.json";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Lottie animation exported!", "success");
      } catch (err) {
        console.error("Failed to export Lottie: ", err);
        showToast("Failed to export Lottie animation.", "error");
      }
    }
  }, [getLottieJson, imageSrc, showToast]);

  return (
    <div className="h-screen bg-gray-900 text-gray-200 grid grid-cols-[1fr_384px] font-sans">
      <main className="flex items-center justify-center overflow-hidden">
        <div className="w-full h-full max-w-full max-h-full">
          <CanvasDisplay
            canvasRef={canvasRef}
            hasImage={!!imageSrc}
            onUpload={handleImageUpload}
            onFileDrop={processImageFile}
            animationSettings={animationSettings}
          />
        </div>
      </main>
      <aside className="border-l border-gray-700/50">
        <ControlsPanel
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onImageUpload={handleImageUpload}
          onCopySvg={handleCopySvg}
          onExportLottie={handleExportLottie}
          hasImage={!!imageSrc}
          animationSettings={animationSettings}
          onAnimationChange={handleAnimationChange}
        />
      </aside>
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  );
};

export default App;
