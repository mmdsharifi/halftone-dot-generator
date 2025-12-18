import React, { useState, useRef, useCallback, useEffect } from "react";
import { AnimationSettings, HalftoneSettings } from "../../core/src/types";
import { ControlsPanel } from "../../components/ControlsPanel";
import { CanvasDisplay } from "../../components/CanvasDisplay";
import { useHalftone } from "./hooks/useHalftone";
import { Toast } from "../../components/Toast";

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    show: boolean;
  }>({
    message: "",
    type: "success",
    show: false,
  });

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

  const [zoom, setZoom] = useState<number>(1);

  const showToast = useCallback(
    (message: string, type: "success" | "error" = "success") => {
      setToast({ message, type, show: true });
      setTimeout(() => {
        setToast((prev) => ({ ...prev, show: false }));
      }, 3000);
    },
    []
  );

  const handleImageError = useCallback(
    (message: string) => {
      showToast(message, "error");
      setImageSrc(null);
    },
    [showToast]
  );

  const { getSvgString, getLottieJson, svgString } = useHalftone(
    canvasRef,
    imageSrc,
    settings,
    animationSettings,
    handleImageError
  );

  const handleSettingsChange = useCallback(
    <K extends keyof HalftoneSettings>(key: K, value: HalftoneSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleZoomChange = useCallback((nextZoom: number) => {
    // Clamp zoom between 25% and 400%
    const clamped = Math.min(4, Math.max(0.25, nextZoom));
    setZoom(clamped);
  }, []);

  const handleAnimationChange = useCallback(
    <K extends keyof AnimationSettings>(
      key: K,
      value: AnimationSettings[K]
    ) => {
      setAnimationSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const processImageFile = useCallback(
    (file: File) => {
      if (!file || !file.type.startsWith("image/")) {
        showToast("Unsupported file type. Please select an image.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImageSrc(result);
        } else {
          showToast("Failed to read the image file.", "error");
        }
      };
      reader.onerror = () => {
        showToast("Error reading file. The file may be corrupt.", "error");
      };
      reader.readAsDataURL(file);
    },
    [showToast]
  );

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      processImageFile(event.target.files[0]);
    }
  };

  // Reset zoom when a new image is loaded or cleared
  useEffect(() => {
    setZoom(1);
  }, [imageSrc]);

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
  }, [processImageFile]);

  const handleCopySvg = async () => {
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
  };

  const handleExportLottie = useCallback(() => {
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "App.tsx:171",
        message: "handleExportLottie called",
        data: { hasImageSrc: !!imageSrc, hasGetLottieJson: !!getLottieJson },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion

    if (!imageSrc || !getLottieJson) return;
    const lottieData = getLottieJson();
    // #region agent log
    fetch("http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: "App.tsx:176",
        message: "lottie data retrieved",
        data: {
          hasLottieData: !!lottieData,
          layersCount: lottieData?.layers?.length,
        },
        timestamp: Date.now(),
        sessionId: "debug-session",
        runId: "run1",
        hypothesisId: "D",
      }),
    }).catch(() => {});
    // #endregion

    if (lottieData) {
      try {
        const jsonString = JSON.stringify(lottieData, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const fileSizeMB = blob.size / (1024 * 1024);
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "App.tsx:183",
              message: "file size calculated",
              data: {
                fileSizeMB: fileSizeMB.toFixed(2),
                fileSizeBytes: blob.size,
              },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "A",
            }),
          }
        ).catch(() => {});
        // #endregion

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
        // #region agent log
        fetch(
          "http://127.0.0.1:7243/ingest/21c232fd-26c5-4764-b154-b9e39ee6344b",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              location: "App.tsx:194",
              message: "export error",
              data: { error: String(err) },
              timestamp: Date.now(),
              sessionId: "debug-session",
              runId: "run1",
              hypothesisId: "D",
            }),
          }
        ).catch(() => {});
        // #endregion

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
            svgMarkup={svgString}
            zoom={zoom}
            onZoomChange={handleZoomChange}
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
