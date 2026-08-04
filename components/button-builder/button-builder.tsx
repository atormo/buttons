"use client";

import { Tabs } from "@base-ui/react/tabs";
import { Icon } from "@iconify/react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { useTheme } from "next-themes";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Braces } from "pixelarticons/react/Braces";
import { ChevronDown } from "pixelarticons/react/ChevronDown";
import { Copy } from "pixelarticons/react/Copy";
import { Download } from "pixelarticons/react/Download";
import { Image } from "pixelarticons/react/Image";
import { Monitor } from "pixelarticons/react/Monitor";
import { Moon } from "pixelarticons/react/Moon";
import { ZoomIn } from "pixelarticons/react/ZoomIn";
import { ZoomOut } from "pixelarticons/react/ZoomOut";
import { setThemeManualOverride } from "@/lib/auto-theme";
import { cn } from "@/lib/utils";
import {
  colorToOklchCss,
  colorToOklchCssWithAlpha,
} from "./button-color-utils";
import { ButtonControls } from "./button-controls";
import {
  DEFAULT_CONFIG,
  getEffectiveIconColor,
  hasIcon,
  type ButtonConfig,
  type ThemeMode,
} from "./button-builder-types";
import {
  getBunnyFontUrl,
  getButtonFont,
  getFontStack,
} from "./button-fonts";
import {
  getIconStrokeWidth,
} from "./button-icons";
import {
  exportPng,
  exportSvg,
  getBoxShadow,
  getCssCode,
  getGradient,
  getPrompt,
  PNG_EXPORT_SCALES,
  rgba,
  getStroke,
  getTailwindClasses,
  type PngExportScale,
} from "./button-output";
import styles from "./button-builder.module.css";

const THEME_OPTIONS: readonly {
  value: ThemeMode;
  label: string;
  Icon: typeof Monitor;
}[] = [
  { value: "system", label: "System theme", Icon: Monitor },
  { value: "light", label: "Light theme", Icon: SunIcon },
  { value: "dark", label: "Dark theme", Icon: Moon },
];

const subscribeToHydration = () => () => {};

function getPreviewPositionBounds(
  canvas: HTMLElement,
  preview: HTMLElement,
  currentX: number,
  currentY: number,
) {
  const canvasBounds = canvas.getBoundingClientRect();
  const previewBounds = preview.getBoundingClientRect();
  const baseLeft = previewBounds.left - currentX;
  const baseTop = previewBounds.top - currentY;

  return {
    minX: canvasBounds.left - baseLeft,
    maxX: canvasBounds.right - previewBounds.width - baseLeft,
    minY: canvasBounds.top - baseTop,
    maxY: canvasBounds.bottom - previewBounds.height - baseTop,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function SunIcon({ className }: { className?: string }) {
  return (
    <img
      src="/sun.svg"
      width={16}
      height={16}
      alt=""
      aria-hidden
      className={cn("dark:invert", className)}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

type OutputFormat = "prompt" | "css" | "tailwind";

const OUTPUT_FORMATS: readonly {
  value: OutputFormat;
  label: string;
  copyLabel: string;
}[] = [
  {
    value: "prompt",
    label: "Prompt",
    copyLabel: "Copy prompt",
  },
  { value: "css", label: "CSS", copyLabel: "Copy CSS" },
  {
    value: "tailwind",
    label: "Tailwind",
    copyLabel: "Copy Tailwind",
  },
];

function CopyButton({
  value,
  label = "Copy",
}: {
  value: string;
  label?: string;
}) {
  const [status, setStatus] = useState<
    "idle" | "copied" | "error"
  >("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 1400);
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm text-neutral-500 outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
    >
      <Copy className="size-4" aria-hidden />
      <span aria-live="polite">
        {status === "copied"
          ? "Copied"
          : status === "error"
            ? "Try again"
            : label}
      </span>
    </button>
  );
}

function ButtonOutputSection({
  config,
  outputFormat,
  outputs,
  activeOutput,
  activeCopyLabel,
  onOutputFormatChange,
}: {
  config: ButtonConfig;
  outputFormat: OutputFormat;
  outputs: Readonly<Record<OutputFormat, string>>;
  activeOutput: string;
  activeCopyLabel: string;
  onOutputFormatChange: (value: OutputFormat) => void;
}) {
  const [pngScale, setPngScale] =
    useState<PngExportScale>(4);

  return (
    <section
      className="mt-8 grid min-w-0 items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]"
      aria-labelledby="button-output-title"
    >
      <h2 id="button-output-title" className="sr-only">
        Button code and export
      </h2>

      <Tabs.Root
        value={outputFormat}
        onValueChange={(value) =>
          onOutputFormatChange(value as OutputFormat)
        }
        className="flex min-w-0 flex-col overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-2 py-2 dark:border-neutral-800">
          <Tabs.List
            className="flex min-w-0 gap-1 overflow-x-auto"
            aria-label="Live button output"
          >
            {OUTPUT_FORMATS.map((format) => (
              <Tabs.Tab
                key={format.value}
                value={format.value}
                className="min-h-9 shrink-0 rounded-lg px-3 text-xs text-neutral-400 outline-none transition-[background-color,color] duration-150 hover:text-neutral-700 data-active:bg-neutral-100 data-active:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-200 dark:data-active:bg-neutral-800 dark:data-active:text-white dark:focus-visible:ring-neutral-300"
              >
                {format.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>
          <CopyButton
            value={activeOutput}
            label={activeCopyLabel}
          />
        </div>
        {OUTPUT_FORMATS.map((format) => (
          <Tabs.Panel
            key={format.value}
            value={format.value}
            className="min-h-0 flex-1 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <pre className="h-full min-h-52 overflow-auto whitespace-pre-wrap break-words p-4 font-mono text-xs leading-5 text-neutral-600 dark:text-neutral-300">
              <code>{outputs[format.value]}</code>
            </pre>
          </Tabs.Panel>
        ))}
      </Tabs.Root>

      <section
        className="flex min-w-0 flex-col rounded-2xl p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] lg:aspect-square dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
        aria-labelledby="button-export-title"
      >
        <h3
          id="button-export-title"
          className="text-balance text-sm font-medium"
        >
          Export
        </h3>
        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => void exportSvg(config)}
            className="flex min-h-12 items-center justify-between rounded-xl px-4 text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.1)] outline-none transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
          >
            <span className="flex items-center gap-2">
              <Braces className="size-4" aria-hidden />
              Save SVG
            </span>
            <Download
              className="size-4 text-neutral-400"
              aria-hidden
            />
          </button>
          <div className="grid grid-cols-[minmax(0,1fr)_5rem] overflow-hidden rounded-xl shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]">
            <button
              type="button"
              onClick={() => void exportPng(config, pngScale)}
              className="flex min-h-12 min-w-0 items-center justify-between px-4 text-sm outline-none transition-[transform,background-color] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300"
            >
              <span className="flex min-w-0 items-center gap-2">
                <Image className="size-4 shrink-0" aria-hidden />
                <span className="truncate">Save PNG</span>
              </span>
              <Download
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden
              />
            </button>
            <label className="relative flex min-h-12 items-center shadow-[inset_1px_0_0_rgba(0,0,0,0.08)] dark:shadow-[inset_1px_0_0_rgba(255,255,255,0.12)]">
              <span className="sr-only">PNG export scale</span>
              <select
                value={pngScale}
                onChange={(event) =>
                  setPngScale(
                    Number(event.target.value) as PngExportScale,
                  )
                }
                className="min-h-12 w-full appearance-none bg-transparent pl-4 pr-8 font-mono text-xs tabular-nums outline-none transition-colors duration-150 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300"
              >
                {PNG_EXPORT_SCALES.map((scale) => (
                  <option key={scale} value={scale}>
                    {scale}x
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 size-4 text-neutral-400"
                aria-hidden
              />
            </label>
          </div>
        </div>

        <footer className="mt-auto pt-8 text-sm text-neutral-400 dark:text-neutral-500">
          Created by{" "}
          <a
            href="https://tormo.at"
            className="rounded-sm text-neutral-600 underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-neutral-500 dark:text-neutral-300 dark:focus-visible:ring-neutral-300"
          >
            tormo.at
          </a>
        </footer>
      </section>
    </section>
  );
}

export function ButtonBuilder() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const previewButtonRef = useRef<HTMLSpanElement>(null);
  const previewX = useMotionValue(0);
  const previewY = useMotionValue(0);
  const reduceMotion = useReducedMotion();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [config, setConfig] =
    useState<ButtonConfig>(DEFAULT_CONFIG);
  const [outputFormat, setOutputFormat] =
    useState<OutputFormat>("prompt");
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewPositionReady, setPreviewPositionReady] =
    useState(false);
  const font = getButtonFont(config.fontId);

  function update<Key extends keyof ButtonConfig>(
    key: Key,
    value: ButtonConfig[Key],
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
  }

  function applyConfig(patch: Partial<ButtonConfig>) {
    setConfig((current) => ({ ...current, ...patch }));
  }

  function applyFontVariant(
    fontId: string,
    weight: number,
    style: ButtonConfig["fontStyle"],
  ) {
    setConfig((current) =>
      current.fontId === fontId
        ? {
            ...current,
            fontWeight: weight,
            fontStyle: style,
          }
        : current,
    );
  }

  function selectTheme(nextTheme: ThemeMode) {
    setThemeManualOverride();
    setTheme(nextTheme);
  }

  function stepPreviewZoom(step: number) {
    setPreviewZoom((current) =>
      clamp(
        Number((current + step).toFixed(2)),
        0.8,
        1.4,
      ),
    );
  }

  function movePreviewWithKeyboard(
    event: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    const canvas = previewCanvasRef.current;
    const preview = previewButtonRef.current;
    const isArrowKey = [
      "ArrowUp",
      "ArrowRight",
      "ArrowDown",
      "ArrowLeft",
    ].includes(event.key);

    if (!canvas || !preview || (!isArrowKey && event.key !== "Home")) {
      return;
    }

    event.preventDefault();

    const transition = reduceMotion
      ? { duration: 0 }
      : {
          type: "spring" as const,
          stiffness: 520,
          damping: 36,
          mass: 0.65,
    };

    if (event.key === "Home") {
      const canvasBounds = canvas.getBoundingClientRect();
      const previewBounds = preview.getBoundingClientRect();

      animate(
        previewX,
        (canvasBounds.width - previewBounds.width) / 2,
        transition,
      );
      animate(
        previewY,
        (canvasBounds.height - previewBounds.height) / 2,
        transition,
      );
      return;
    }

    const currentX = previewX.get();
    const currentY = previewY.get();
    const { minX, maxX, minY, maxY } =
      getPreviewPositionBounds(
        canvas,
        preview,
        currentX,
        currentY,
      );
    const step = event.shiftKey ? 24 : 12;
    const nextX =
      currentX +
      (event.key === "ArrowLeft"
        ? -step
        : event.key === "ArrowRight"
          ? step
          : 0);
    const nextY =
      currentY +
      (event.key === "ArrowUp"
        ? -step
        : event.key === "ArrowDown"
          ? step
          : 0);

    animate(
      previewX,
      clamp(nextX, minX, maxX),
      transition,
    );
    animate(
      previewY,
      clamp(nextY, minY, maxY),
      transition,
    );
  }

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const zoomWithWheel = (event: WheelEvent) => {
      if (event.deltaY === 0) return;

      event.preventDefault();

      const deltaMultiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? 100
            : 1;
      const normalizedDelta = clamp(
        event.deltaY * deltaMultiplier,
        -120,
        120,
      );
      const sensitivity = event.ctrlKey ? 0.004 : 0.001;

      setPreviewZoom((current) =>
        clamp(
          Number(
            (
              current *
              Math.exp(-normalizedDelta * sensitivity)
            ).toFixed(3),
          ),
          0.8,
          1.4,
        ),
      );
    };

    canvas.addEventListener("wheel", zoomWithWheel, {
      passive: false,
    });

    return () => canvas.removeEventListener("wheel", zoomWithWheel);
  }, []);

  useLayoutEffect(() => {
    const canvas = previewCanvasRef.current;
    const preview = previewButtonRef.current;
    if (!canvas || !preview) return;

    const frame = window.requestAnimationFrame(() => {
      const canvasBounds = canvas.getBoundingClientRect();
      const previewBounds = preview.getBoundingClientRect();
      previewX.set(
        (canvasBounds.width - previewBounds.width) / 2,
      );
      previewY.set(
        (canvasBounds.height - previewBounds.height) / 2,
      );
      setPreviewPositionReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [previewX, previewY]);

  const boxShadow = getBoxShadow(config);
  const stroke = getStroke(config);
  const strokeGradient = getGradient(config);
  const fillGradient = getGradient(config, "fill");
  const tailwindClasses = getTailwindClasses(config);
  const cssCode = getCssCode(config);
  const prompt = getPrompt(config);
  const outputs: Readonly<Record<OutputFormat, string>> = {
    prompt,
    css: cssCode,
    tailwind: tailwindClasses,
  };
  const activeOutput = outputs[outputFormat];
  const activeOutputFormat =
    OUTPUT_FORMATS.find(
      (format) => format.value === outputFormat,
    ) ?? OUTPUT_FORMATS[0];
  const activeTheme = (
    mounted ? theme ?? "light" : "light"
  ) as ThemeMode;
  const isDark = mounted && resolvedTheme === "dark";
  const iconStrokeWidth = getIconStrokeWidth(
    config.iconLibrary,
    config.iconStyle,
  );
  const effectiveIconColor = getEffectiveIconColor(config);

  const previewStyle = useMemo(
    () => {
      const fill =
        config.fillMode === "none"
          ? "transparent"
          : config.fillMode === "gradient"
            ? fillGradient
            : colorToOklchCssWithAlpha(
                config.fill,
                config.fillOpacity,
              );
      const hasGradientStroke =
        config.strokeMode === "gradient" &&
        config.strokeWidth > 0;
      const hasStroke =
        config.strokeMode !== "none" &&
        config.strokeWidth > 0;
      const fillLayer =
        config.fillMode === "gradient"
          ? fill
          : `linear-gradient(${fill}, ${fill})`;

      return {
        padding: `${config.paddingY}px ${config.paddingX}px`,
        border:
          config.cornerStyle === "pixel"
            ? "none"
            : hasStroke
              ? hasGradientStroke
                ? `${config.strokeWidth}px solid transparent`
                : stroke
              : "none",
        borderRadius: config.radius,
        background:
          hasGradientStroke && config.cornerStyle !== "pixel"
            ? `${fillLayer} padding-box, ${strokeGradient} border-box`
            : fill,
        color: colorToOklchCss(config.textColor),
        boxShadow:
          config.cornerStyle === "pixel"
            ? "inset 0 4px 0 rgb(255 255 255 / 0.62), inset 0 -6px 0 rgb(15 23 42 / 0.24)"
            : boxShadow,
        textShadow:
          config.cornerStyle === "pixel"
            ? "1px 1px 0 rgb(255 255 255 / 0.55)"
            : undefined,
        fontFamily: getFontStack(font),
        fontSize: config.fontSize,
        fontWeight: config.fontWeight,
        fontStyle: config.fontStyle,
        lineHeight: 1.25,
        gap: config.iconGap,
      } as React.CSSProperties;
    },
    [
      boxShadow,
      config,
      fillGradient,
      font,
      stroke,
      strokeGradient,
    ],
  );
  const pixelFrameStyle = useMemo(() => {
    if (config.cornerStyle !== "pixel") return undefined;

    const hasStroke =
      config.strokeMode !== "none" && config.strokeWidth > 0;
    const framePaint =
      config.strokeMode === "gradient"
        ? strokeGradient
        : colorToOklchCss(config.strokeColor);

    return {
      "--pixel-stroke-width": hasStroke
        ? `${config.strokeWidth}px`
        : "0px",
      "--pixel-frame-paint": hasStroke
        ? framePaint
        : "transparent",
      filter: config.shadowEnabled
        ? `drop-shadow(${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${rgba(config.shadowColor, config.shadowOpacity)})`
        : undefined,
    } as React.CSSProperties;
  }, [config, strokeGradient]);

  return (
    <>
      <link
        rel="stylesheet"
        href={getBunnyFontUrl(
          font,
          config.fontWeight,
          config.fontStyle,
        )}
      />
    <main
      data-standalone-tool="buttons"
      className={cn(
          "min-h-dvh w-full px-4 py-8 text-neutral-950 [overflow-anchor:none] sm:px-6 sm:py-10 dark:text-neutral-50",
          isDark ? "bg-neutral-950" : "bg-white",
        )}
        style={
          {
            "--button-builder-track": isDark
              ? "#3f3f46"
              : "#e5e5e5",
            "--button-builder-thumb": isDark
              ? "#fafafa"
              : "#ffffff",
            "--button-builder-thumb-border": isDark
              ? "#18181b"
              : "#ffffff",
            "--button-builder-thumb-ring": isDark
              ? "rgb(255 255 255 / 0.42)"
              : "rgb(0 0 0 / 0.28)",
            "--button-builder-surface": isDark
              ? "#0a0a0a"
              : "#ffffff",
            "--button-builder-focus": isDark
              ? "#d4d4d8"
              : "#737373",
          } as React.CSSProperties
        }
      >
        <div className="mx-auto w-full max-w-7xl">
          <header className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-balance text-3xl font-medium sm:text-4xl">
                Buttons
              </h1>
              <p className="mt-3 max-w-2xl text-pretty text-sm text-neutral-500 dark:text-neutral-400">
                Welcome. This is Buttons, but if you were looking for{" "}
                <a
                  href="https://tonsofbutts.absurd.farm"
                  className="rounded-sm text-neutral-950 outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:text-white dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
                >
                  Tons of butts is{" "}
                  <span className="underline decoration-neutral-950 underline-offset-4 dark:decoration-white">
                    here
                  </span>
                </a>
                .
              </p>
            </div>

            <div className="flex shrink-0 items-center">
              <fieldset>
                <legend className="sr-only">Theme</legend>
                <div className="flex rounded-full bg-neutral-100 p-1 dark:bg-neutral-900">
                  {THEME_OPTIONS.map(
                    ({ value, label, Icon: ThemeIcon }) => (
                      <label
                        key={value}
                        className={cn(
                          "flex size-10 cursor-pointer items-center justify-center rounded-full outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96]",
                          activeTheme === value
                            ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
                            : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                        )}
                      >
                        <input
                          type="radio"
                          name="button-builder-theme"
                          value={value}
                          checked={activeTheme === value}
                          onChange={() => selectTheme(value)}
                          className="sr-only"
                        />
                        <ThemeIcon
                          className="size-4"
                          aria-hidden
                        />
                        <span className="sr-only">{label}</span>
                      </label>
                    ),
                  )}
                </div>
              </fieldset>
            </div>
          </header>

          <div className="mt-8 grid min-w-0 grid-cols-[minmax(0,1fr)] items-start gap-8 [overflow-anchor:none] lg:grid-cols-[minmax(0,1fr)_22rem]">
            <section
              className="relative min-h-[30rem] min-w-0 self-stretch lg:min-h-0"
              aria-labelledby="button-preview-title"
            >
              <h2 id="button-preview-title" className="sr-only">
                Button preview
              </h2>
              <p id="button-preview-instructions" className="sr-only">
                Drag the button to position it anywhere within the
                canvas. Use the arrow keys for precise movement, hold
                Shift for larger steps, or press Home to recenter it.
                Scroll over the canvas with a mouse or trackpad to
                zoom.
              </p>
              <div
                ref={previewCanvasRef}
                role="group"
                aria-label="Button canvas"
                aria-describedby="button-preview-instructions"
                className={cn(
                  "relative flex min-h-[30rem] items-center justify-center overflow-hidden rounded-2xl bg-neutral-50 p-8 lg:absolute lg:inset-0 lg:min-h-0 dark:bg-neutral-800",
                  styles.dotGrid,
                )}
              >
                <div
                  className="absolute bottom-4 left-4 z-10 flex items-center rounded-full bg-white p-1 text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.08)] dark:bg-neutral-950 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.3)]"
                  role="group"
                  aria-label="Canvas zoom"
                >
                  <button
                    type="button"
                    aria-label="Zoom out"
                    disabled={previewZoom <= 0.8}
                    onClick={() => stepPreviewZoom(-0.1)}
                    className="flex size-10 items-center justify-center rounded-full outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-300"
                  >
                    <ZoomOut className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Reset zoom to 100%"
                    onClick={() => setPreviewZoom(1)}
                    className="min-h-10 min-w-14 rounded-full px-2 font-mono text-xs tabular-nums outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-300"
                  >
                    {Math.round(previewZoom * 100)}%
                  </button>
                  <button
                    type="button"
                    aria-label="Zoom in"
                    disabled={previewZoom >= 1.4}
                    onClick={() => stepPreviewZoom(0.1)}
                    className="flex size-10 items-center justify-center rounded-full outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-neutral-800 dark:focus-visible:ring-neutral-300"
                  >
                    <ZoomIn className="size-4" aria-hidden />
                  </button>
                </div>

                <motion.span
                  ref={previewButtonRef}
                  drag
                  dragMomentum={false}
                  onDragEnd={() => {
                    const canvas = previewCanvasRef.current;
                    const preview = previewButtonRef.current;
                    if (!canvas || !preview) return;

                    const currentX = previewX.get();
                    const currentY = previewY.get();
                    const { minX, maxX, minY, maxY } =
                      getPreviewPositionBounds(
                        canvas,
                        preview,
                        currentX,
                        currentY,
                      );
                    const transition = reduceMotion
                      ? { duration: 0 }
                      : {
                          type: "spring" as const,
                          duration: 0.2,
                          bounce: 0,
                        };

                    animate(
                      previewX,
                      clamp(currentX, minX, maxX),
                      transition,
                    );
                    animate(
                      previewY,
                      clamp(currentY, minY, maxY),
                      transition,
                    );
                  }}
                  whileHover={
                    reduceMotion ? undefined : { scale: 1.015 }
                  }
                  whileDrag={
                    reduceMotion ? undefined : { scale: 1.04 }
                  }
                  style={{ x: previewX, y: previewY }}
                  className={cn(
                    "absolute left-0 top-0 inline-flex max-w-full cursor-grab touch-none select-none active:cursor-grabbing",
                    previewPositionReady
                      ? "opacity-100"
                      : "opacity-0",
                  )}
                >
                  <motion.span
                    animate={{ scale: previewZoom }}
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            type: "spring",
                            duration: 0.2,
                            bounce: 0,
                          }
                    }
                    className={cn(
                      "inline-flex max-w-full origin-center",
                      config.cornerStyle === "pixel" &&
                        styles.pixelFrame,
                    )}
                    style={pixelFrameStyle}
                  >
                    <button
                      type="button"
                      aria-describedby="button-preview-instructions"
                      aria-label={
                        config.label
                          ? `${config.label} button preview`
                          : "Button preview"
                      }
                      onKeyDown={movePreviewWithKeyboard}
                      className={cn(
                        "inline-flex min-h-10 max-w-full cursor-inherit items-center justify-center truncate outline-none transition-[background-color,border-color,color,box-shadow] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-4 focus-visible:ring-offset-neutral-50 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-800",
                        styles.pressablePreview,
                        config.cornerStyle === "pixel" &&
                          styles.pixelShape,
                      )}
                      style={previewStyle}
                    >
                      {config.iconPosition === "left" &&
                        hasIcon(config.iconName) && (
                          <Icon
                            icon={config.iconName}
                            width={config.iconSize}
                            height={config.iconSize}
                            className={cn(
                              config.iconLibrary === "lucide" &&
                                styles.lucideStrokeOverride,
                            )}
                            style={
                              {
                                color: colorToOklchCss(
                                  effectiveIconColor,
                                ),
                                ...(config.iconLibrary ===
                                  "lucide" &&
                                iconStrokeWidth
                                  ? {
                                      "--lucide-stroke-width":
                                        iconStrokeWidth,
                                    }
                                  : {}),
                              } as React.CSSProperties
                            }
                            aria-hidden
                          />
                        )}
                      {config.label}
                      {config.iconPosition === "right" &&
                        hasIcon(config.iconName) && (
                          <Icon
                            icon={config.iconName}
                            width={config.iconSize}
                            height={config.iconSize}
                            className={cn(
                              config.iconLibrary === "lucide" &&
                                styles.lucideStrokeOverride,
                            )}
                            style={
                              {
                                color: colorToOklchCss(
                                  effectiveIconColor,
                                ),
                                ...(config.iconLibrary ===
                                  "lucide" &&
                                iconStrokeWidth
                                  ? {
                                      "--lucide-stroke-width":
                                        iconStrokeWidth,
                                    }
                                  : {}),
                              } as React.CSSProperties
                            }
                            aria-hidden
                          />
                        )}
                    </button>
                  </motion.span>
                </motion.span>
              </div>
            </section>

            <aside className="min-w-0 lg:col-start-2 lg:row-start-1">
              <ButtonControls
                config={config}
                update={update}
                applyConfig={applyConfig}
                applyFontVariant={applyFontVariant}
              />
            </aside>
          </div>

          <ButtonOutputSection
            config={config}
            outputFormat={outputFormat}
            outputs={outputs}
            activeOutput={activeOutput}
            activeCopyLabel={activeOutputFormat.copyLabel}
            onOutputFormatChange={setOutputFormat}
          />
        </div>
      </main>
    </>
  );
}
