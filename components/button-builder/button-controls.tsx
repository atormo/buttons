"use client";

import { Switch } from "@base-ui/react/switch";
import { Tabs } from "@base-ui/react/tabs";
import { Reload } from "pixelarticons/react/Reload";
import { useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BUTTON_FONTS,
  getBunnyFontUrl,
  getButtonFont,
  getFontVariants,
  type ButtonFont,
  type FontStyle,
} from "./button-fonts";
import { getStyledIcon } from "./button-icons";
import {
  getEffectiveIconColor,
  type ButtonConfig,
  type PaintMode,
  type UpdateConfig,
} from "./button-builder-types";
import { IconPicker } from "./icon-picker";
import { OklchColorPicker } from "./oklch-color-picker";
import {
  BUTTON_PRESETS,
  type ButtonPreset,
} from "./button-presets";
import styles from "./button-builder.module.css";

const PANELS = [
  { value: "basic", label: "Basic" },
  { value: "text", label: "Text" },
  { value: "icon", label: "Icon" },
  { value: "shadow", label: "Shadow" },
  { value: "lab", label: "Lab" },
] as const;

const FILL_OPTIONS: readonly {
  value: Exclude<PaintMode, "none">;
  label: string;
}[] = [
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

const STROKE_OPTIONS: readonly {
  value: PaintMode;
  label: string;
}[] = [
  { value: "none", label: "No stroke" },
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

const FONT_LOAD_TIMEOUT = 2500;

function waitForStylesheet(link: HTMLLinkElement) {
  if (link.sheet) return Promise.resolve();

  return new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeout);
      link.removeEventListener("load", finish);
      link.removeEventListener("error", finish);
      resolve();
    };
    const timeout = window.setTimeout(
      finish,
      FONT_LOAD_TIMEOUT,
    );

    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
  });
}

async function preloadFontVariant(
  font: ButtonFont,
  weight: number,
  style: FontStyle,
) {
  const href = getBunnyFontUrl(font, weight, style);
  const absoluteHref = new URL(href, window.location.href).href;
  let link = Array.from(
    document.querySelectorAll<HTMLLinkElement>(
      'link[rel="stylesheet"]',
    ),
  ).find((candidate) => candidate.href === absoluteHref);

  if (!link) {
    link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.dataset.buttonFontVariant = `${font.id}-${weight}-${style}`;
    document.head.append(link);
  }

  await waitForStylesheet(link);
  await Promise.race([
    document.fonts
      .load(`${style} ${weight} 18px "${font.family}"`)
      .catch(() => []),
    new Promise<never>((resolve) => {
      window.setTimeout(resolve, FONT_LOAD_TIMEOUT);
    }),
  ]);
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = "px",
  disabled = false,
  compact = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  disabled?: boolean;
  compact?: boolean;
  onChange: (value: number) => void;
}) {
  const id = useId();

  return (
    <div
      className={cn(
        "grid items-center",
        compact
          ? "grid-cols-[1fr_auto] gap-x-3 gap-y-2"
          : "grid-cols-[5rem_1fr_3.25rem] gap-3",
      )}
    >
      <label
        htmlFor={id}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className={cn(
          styles.range,
          compact && "col-span-2 row-start-2",
          "disabled:cursor-not-allowed disabled:opacity-40",
        )}
      />
      <output
        htmlFor={id}
        className={cn(
          "text-right font-mono text-sm tabular-nums text-neutral-950 dark:text-white",
          compact && "col-start-2 row-start-1",
        )}
      >
        {value}
        {suffix}
      </output>
    </div>
  );
}

function ToggleGroup<T extends string>({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  disabled?: boolean;
  onChange: (value: T) => void;
}) {
  return (
    <div
      className={cn(
        "grid rounded-xl bg-neutral-50 p-1 dark:bg-neutral-900",
        options.length === 2
          ? "grid-cols-2"
          : options.length === 3
            ? "grid-cols-3"
            : "grid-cols-4",
      )}
      role="group"
      aria-label={label}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-10 rounded-lg px-1 text-xs capitalize outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 disabled:cursor-not-allowed disabled:opacity-40 dark:focus-visible:ring-neutral-300",
            value === option.value
              ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
              : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function GradientControls({
  from,
  via,
  to,
  viaEnabled,
  angle,
  onFromChange,
  onViaChange,
  onToChange,
  onViaEnabledChange,
  onAngleChange,
}: {
  from: string;
  via: string;
  to: string;
  viaEnabled: boolean;
  angle: number;
  onFromChange: (value: string) => void;
  onViaChange: (value: string) => void;
  onToChange: (value: string) => void;
  onViaEnabledChange: (value: boolean) => void;
  onAngleChange: (value: number) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <OklchColorPicker
          compact
          label="From"
          value={from}
          onChange={onFromChange}
        />
        <OklchColorPicker
          compact
          label="To"
          value={to}
          onChange={onToChange}
        />
      </div>
      <div className="flex min-h-10 items-center justify-between gap-3">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          Middle stop
        </span>
        <Switch.Root
          checked={viaEnabled}
          onCheckedChange={onViaEnabledChange}
          aria-label="Enable middle gradient color"
          className="relative h-7 w-12 shrink-0 rounded-full bg-neutral-200 p-1 outline-none transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] data-checked:bg-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:bg-neutral-700 dark:data-checked:bg-white dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
        >
          <Switch.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out data-checked:translate-x-5 dark:data-checked:bg-neutral-950" />
        </Switch.Root>
      </div>
      {viaEnabled && (
        <OklchColorPicker
          label="Middle color"
          value={via}
          onChange={onViaChange}
        />
      )}
      <RangeControl
        label="Angle"
        value={angle}
        min={0}
        max={360}
        suffix="°"
        onChange={onAngleChange}
      />
    </div>
  );
}

function ControlCard({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="min-w-0 rounded-xl p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
      aria-labelledby={id}
    >
      <h3
        id={id}
        className="text-balance text-sm font-medium text-neutral-950 dark:text-white"
      >
        {title}
      </h3>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function PresetPreview({ preset }: { preset: ButtonPreset["id"] }) {
  const prismPreviewStyle =
    preset === "prism"
      ? ({
          border: "3px solid transparent",
          background:
            "linear-gradient(#0a0a0a, #0a0a0a) padding-box, linear-gradient(120deg, #22d3ee, #a78bfa, #fb7185) border-box",
          boxShadow: "0 8px 18px rgba(139, 92, 246, 0.4)",
        } as React.CSSProperties)
      : undefined;

  return (
    <span
      className={cn(
        "flex h-20 items-center justify-center overflow-hidden rounded-lg",
        preset === "glass"
          ? styles.dotGrid
          : preset === "terminal"
            ? "bg-neutral-950"
            : preset === "prism" || preset === "brutalist"
              ? "bg-neutral-200 dark:bg-neutral-600"
              : "bg-neutral-100 dark:bg-neutral-800",
      )}
      aria-hidden
    >
      <span className="inline-flex">
        <span
          className={cn(
            "inline-flex min-h-8 items-center justify-center px-3 text-[9px]",
            preset === "clean" &&
              "rounded-lg bg-white text-neutral-800 shadow-sm dark:bg-neutral-700 dark:text-white",
            preset === "skeuomorphic" &&
              "rounded-lg border-2 border-white bg-gradient-to-b from-white via-slate-100 to-slate-300 font-semibold text-slate-800 shadow-[0_6px_10px_rgba(51,65,85,0.3)]",
            preset === "glass" &&
              "rounded-xl border border-white/80 bg-white/55 font-semibold text-slate-800 shadow-lg backdrop-blur-sm",
            preset === "prism" && "rounded-2xl font-bold text-white",
            preset === "brutalist" &&
              "border-[3px] border-neutral-950 bg-stone-100 font-black text-neutral-950 shadow-[5px_5px_0_#171717]",
            preset === "soft" &&
              "rounded-2xl bg-slate-100 font-semibold text-slate-700 shadow-[6px_8px_16px_rgba(148,163,184,0.4)]",
            preset === "terminal" &&
              "rounded-md border border-green-400 bg-gray-900 font-mono text-[7px] font-semibold text-green-400 shadow-[0_5px_14px_rgba(34,197,94,0.24)]",
            preset === "candy" &&
              "rounded-2xl border-2 border-white bg-gradient-to-br from-rose-400 via-orange-500 to-yellow-400 font-bold text-white shadow-lg",
          )}
          style={prismPreviewStyle}
        >
          Button
        </span>
      </span>
    </span>
  );
}

export function ButtonControls({
  config,
  update,
  applyConfig,
  applyFontVariant,
}: {
  config: ButtonConfig;
  update: UpdateConfig;
  applyConfig: (patch: Partial<ButtonConfig>) => void;
  applyFontVariant: (
    fontId: string,
    weight: number,
    style: FontStyle,
  ) => void;
}) {
  const [presetStatus, setPresetStatus] = useState("");
  const [experimentSnapshot, setExperimentSnapshot] =
    useState<ButtonConfig | null>(null);
  const [pendingFontVariant, setPendingFontVariant] = useState<{
    fontId: string;
    value: string;
  } | null>(null);
  const fontVariantRequest = useRef(0);
  const configuredFontVariant = `${config.fontWeight}:${config.fontStyle}`;
  const selectedFontVariant =
    pendingFontVariant?.fontId === config.fontId
      ? pendingFontVariant.value
      : configuredFontVariant;
  const effectiveIconColor = getEffectiveIconColor(config);

  async function selectFontVariant(value: string) {
    const [weightValue, styleValue] = value.split(":");
    const weight = Number(weightValue);
    const style = styleValue as FontStyle;
    const font = getButtonFont(config.fontId);
    const request = ++fontVariantRequest.current;

    setPendingFontVariant({ fontId: font.id, value });
    await preloadFontVariant(font, weight, style);

    if (request !== fontVariantRequest.current) return;

    applyFontVariant(font.id, weight, style);
    setPendingFontVariant(null);
  }

  function applyExperiment(preset: ButtonPreset) {
    setExperimentSnapshot((current) => current ?? { ...config });
    applyConfig(preset.config);
    setPresetStatus(`${preset.name} applied`);
  }

  function resetExperiments() {
    if (!experimentSnapshot) return;

    applyConfig(experimentSnapshot);
    setExperimentSnapshot(null);
    setPresetStatus("Style experiments reset");
  }

  return (
    <section
      className="overflow-hidden rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_1px_2px_-1px_rgba(0,0,0,0.08),0_2px_4px_rgba(0,0,0,0.04)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
      aria-labelledby="button-controls-title"
    >
      <div className="px-5 pb-3 pt-4">
        <h2
          id="button-controls-title"
          className="text-balance text-sm font-medium"
        >
          Customize
        </h2>
      </div>

      <Tabs.Root defaultValue="basic">
        <Tabs.List
          className="mx-3 grid grid-cols-5 rounded-xl bg-neutral-50 p-1 dark:bg-neutral-900"
          aria-label="Button settings"
        >
          {PANELS.map((panel) => (
            <Tabs.Tab
              key={panel.value}
              value={panel.value}
              className="min-h-10 rounded-lg px-1 text-[11px] text-neutral-600 outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out hover:text-neutral-950 active:scale-[0.96] data-active:bg-white data-active:text-neutral-950 data-active:shadow-sm focus-visible:ring-2 focus-visible:ring-neutral-500 dark:text-neutral-400 dark:hover:text-white dark:data-active:bg-neutral-800 dark:data-active:text-white dark:focus-visible:ring-neutral-300"
            >
              {panel.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        <div className="min-h-[22rem]">
          <Tabs.Panel
            value="basic"
            className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <div className="space-y-4">
              <ControlCard id="basic-geometry" title="Geometry">
                <RangeControl
                  label="Radius"
                  value={config.radius}
                  min={0}
                  max={40}
                  onChange={(value) => {
                    update("cornerStyle", "rounded");
                    update("radius", value);
                  }}
                />
                <RangeControl
                  label="Padding X"
                  value={config.paddingX}
                  min={8}
                  max={56}
                  onChange={(value) => update("paddingX", value)}
                />
                <RangeControl
                  label="Padding Y"
                  value={config.paddingY}
                  min={6}
                  max={28}
                  onChange={(value) => update("paddingY", value)}
                />
              </ControlCard>

              <ControlCard id="basic-fill" title="Fill">
                <ToggleGroup
                  label="Fill style"
                  value={config.fillMode}
                  options={FILL_OPTIONS}
                  onChange={(value) => update("fillMode", value)}
                />
                {config.fillMode !== "gradient" && (
                  <OklchColorPicker
                    label="Color"
                    value={config.fill}
                    allowNone
                    none={config.fillMode === "none"}
                    onNoneChange={(none) =>
                      update("fillMode", none ? "none" : "solid")
                    }
                    onChange={(value) => update("fill", value)}
                  />
                )}
                {config.fillMode === "gradient" && (
                  <GradientControls
                    from={config.fillGradientFrom}
                    via={config.fillGradientVia}
                    to={config.fillGradientTo}
                    viaEnabled={config.fillGradientViaEnabled}
                    angle={config.fillGradientAngle}
                    onFromChange={(value) =>
                      update("fillGradientFrom", value)
                    }
                    onViaChange={(value) =>
                      update("fillGradientVia", value)
                    }
                    onToChange={(value) =>
                      update("fillGradientTo", value)
                    }
                    onViaEnabledChange={(value) =>
                      update("fillGradientViaEnabled", value)
                    }
                    onAngleChange={(value) =>
                      update("fillGradientAngle", value)
                    }
                  />
                )}
                <RangeControl
                  label="Opacity"
                  value={config.fillOpacity}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={config.fillMode === "none"}
                  onChange={(value) =>
                    update("fillOpacity", value)
                  }
                />
              </ControlCard>

              <ControlCard id="basic-stroke" title="Stroke">
                <ToggleGroup
                  label="Stroke style"
                  value={config.strokeMode}
                  options={STROKE_OPTIONS}
                  onChange={(value) => update("strokeMode", value)}
                />
                {config.strokeMode === "solid" && (
                  <OklchColorPicker
                    label="Color"
                    value={config.strokeColor}
                    onChange={(value) =>
                      update("strokeColor", value)
                    }
                  />
                )}
                {config.strokeMode === "gradient" && (
                  <GradientControls
                    from={config.strokeGradientFrom}
                    via={config.strokeGradientVia}
                    to={config.strokeGradientTo}
                    viaEnabled={config.strokeGradientViaEnabled}
                    angle={config.strokeGradientAngle}
                    onFromChange={(value) =>
                      update("strokeGradientFrom", value)
                    }
                    onViaChange={(value) =>
                      update("strokeGradientVia", value)
                    }
                    onToChange={(value) =>
                      update("strokeGradientTo", value)
                    }
                    onViaEnabledChange={(value) =>
                      update("strokeGradientViaEnabled", value)
                    }
                    onAngleChange={(value) =>
                      update("strokeGradientAngle", value)
                    }
                  />
                )}
                {config.strokeMode !== "none" && (
                  <RangeControl
                    label="Width"
                    value={config.strokeWidth}
                    min={1}
                    max={8}
                    onChange={(value) =>
                      update("strokeWidth", value)
                    }
                  />
                )}
              </ControlCard>
            </div>
          </Tabs.Panel>

          <Tabs.Panel
            value="text"
            className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <div className="space-y-4">
              <ControlCard id="text-content" title="Content">
              <div className="space-y-2">
                <label
                  htmlFor="button-label"
                  className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
                >
                  Label
                </label>
                <input
                  id="button-label"
                  value={config.label}
                  maxLength={32}
                  onChange={(event) =>
                    update("label", event.target.value)
                  }
                  className="min-h-11 w-full rounded-xl bg-neutral-50 px-3 text-sm outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-[background-color,box-shadow] duration-150 focus:bg-white focus:ring-2 focus:ring-neutral-500 dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] dark:focus:bg-neutral-950 dark:focus:ring-neutral-300"
                />
              </div>
              </ControlCard>

              <ControlCard id="text-typography" title="Typography">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Font
                </span>
                <select
                  value={config.fontId}
                  onChange={(event) => {
                    const nextFont = getButtonFont(event.target.value);
                    const variants = getFontVariants(nextFont);
                    const currentVariant = variants.find(
                      (variant) =>
                        variant.weight === config.fontWeight &&
                        variant.style === config.fontStyle,
                    );
                    const fallback =
                      variants.find(
                        (variant) =>
                          variant.weight === 500 &&
                          variant.style === "normal",
                      ) ??
                      variants.find(
                        (variant) =>
                          variant.weight === 400 &&
                          variant.style === "normal",
                      ) ??
                      variants[0];

                    update("fontId", nextFont.id);
                    if (!currentVariant && fallback) {
                      update("fontWeight", fallback.weight);
                      update("fontStyle", fallback.style);
                    }
                  }}
                  className="min-h-11 w-full appearance-none rounded-xl bg-neutral-50 px-3 text-sm outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] dark:focus-visible:ring-neutral-300"
                >
                  {[
                    "Sans serif",
                    "Serif",
                    "Display",
                    "Monospace",
                  ].map((category) => (
                    <optgroup key={category} label={category}>
                      {BUTTON_FONTS.filter(
                        (option) => option.category === category,
                      ).map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.family}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Style
                </span>
                <select
                  value={selectedFontVariant}
                  aria-busy={
                    pendingFontVariant?.fontId === config.fontId
                  }
                  onChange={(event) =>
                    void selectFontVariant(event.target.value)
                  }
                  className="min-h-11 w-full appearance-none rounded-xl bg-neutral-50 px-3 text-sm outline-none shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] dark:focus-visible:ring-neutral-300"
                >
                  {getFontVariants(
                    getButtonFont(config.fontId),
                  ).map((variant) => (
                    <option
                      key={`${variant.weight}:${variant.style}`}
                      value={`${variant.weight}:${variant.style}`}
                    >
                      {variant.label} · {variant.weight}
                    </option>
                  ))}
                </select>
              </label>
              <OklchColorPicker
                label="Text color"
                value={config.textColor}
                onChange={(value) => update("textColor", value)}
              />
              <RangeControl
                label="Font size"
                value={config.fontSize}
                min={12}
                max={28}
                onChange={(value) => update("fontSize", value)}
              />
              </ControlCard>
            </div>
          </Tabs.Panel>

          <Tabs.Panel
            value="icon"
            className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <div className="space-y-4">
              <ControlCard id="icon-picker-card" title="Choose icon">
              <IconPicker
                library={config.iconLibrary}
                style={config.iconStyle}
                value={config.iconName}
                onLibraryChange={(library, style, icon) => {
                  update("iconLibrary", library);
                  update("iconStyle", style);
                  update("iconName", icon);
                }}
                onStyleChange={(style) => {
                  update("iconStyle", style);
                  update(
                    "iconName",
                    getStyledIcon(
                      config.iconName,
                      config.iconLibrary,
                      style,
                    ),
                  );
                }}
                onChange={(icon) => update("iconName", icon)}
              />
              </ControlCard>

              <ControlCard id="icon-layout-card" title="Layout">
              <div
                className={cn(
                  "space-y-5 transition-opacity duration-150",
                  config.iconName
                    ? "opacity-100"
                    : "pointer-events-none opacity-35",
                )}
                aria-disabled={!config.iconName}
              >
                <OklchColorPicker
                  label="Color"
                  value={effectiveIconColor}
                  disabled={!config.iconName}
                  allowSameAsText
                  sameAsText={config.iconColorMode === "text"}
                  sameAsTextValue={config.textColor}
                  onSameAsTextChange={(sameAsText) => {
                    if (!sameAsText) {
                      update("iconColor", config.textColor);
                    }
                    update(
                      "iconColorMode",
                      sameAsText ? "text" : "custom",
                    );
                  }}
                  onChange={(value) => {
                    update("iconColor", value);
                    update("iconColorMode", "custom");
                  }}
                />
                <ToggleGroup
                  label="Icon position"
                  value={config.iconPosition}
                  disabled={!config.iconName}
                  options={[
                    { value: "left", label: "Left" },
                    { value: "right", label: "Right" },
                  ]}
                  onChange={(value) =>
                    update("iconPosition", value)
                  }
                />
                <RangeControl
                  label="Size"
                  value={config.iconSize}
                  min={12}
                  max={36}
                  disabled={!config.iconName}
                  onChange={(value) => update("iconSize", value)}
                />
                <RangeControl
                  label="Gap"
                  value={config.iconGap}
                  min={0}
                  max={20}
                  disabled={!config.iconName}
                  onChange={(value) => update("iconGap", value)}
                />
              </div>
              </ControlCard>
            </div>
          </Tabs.Panel>

          <Tabs.Panel
            value="shadow"
            className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <ControlCard id="shadow-card" title="Drop shadow">
              <div className="flex min-h-10 items-center justify-between gap-4">
                <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  Enabled
                </span>
                <Switch.Root
                  checked={config.shadowEnabled}
                  onCheckedChange={(checked) =>
                    update("shadowEnabled", checked)
                  }
                  aria-label="Enable drop shadow"
                  className="relative h-7 w-12 shrink-0 rounded-full bg-neutral-200 p-1 outline-none transition-[transform,background-color] duration-150 ease-out active:scale-[0.96] data-checked:bg-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:bg-neutral-700 dark:data-checked:bg-white dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
                >
                  <Switch.Thumb className="block size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ease-out data-checked:translate-x-5 dark:data-checked:bg-neutral-950" />
                </Switch.Root>
              </div>

              <div
                className={cn(
                  "space-y-5 transition-opacity duration-150",
                  config.shadowEnabled
                    ? "opacity-100"
                    : "pointer-events-none opacity-35",
                )}
                aria-disabled={!config.shadowEnabled}
              >
                <OklchColorPicker
                  label="Color"
                  value={config.shadowColor}
                  disabled={!config.shadowEnabled}
                  onChange={(value) =>
                    update("shadowColor", value)
                  }
                />
                <RangeControl
                  label="Opacity"
                  value={config.shadowOpacity}
                  min={0}
                  max={100}
                  suffix="%"
                  disabled={!config.shadowEnabled}
                  onChange={(value) =>
                    update("shadowOpacity", value)
                  }
                />
                <RangeControl
                  label="Offset X"
                  value={config.shadowX}
                  min={-20}
                  max={20}
                  disabled={!config.shadowEnabled}
                  onChange={(value) => update("shadowX", value)}
                />
                <RangeControl
                  label="Offset Y"
                  value={config.shadowY}
                  min={-20}
                  max={20}
                  disabled={!config.shadowEnabled}
                  onChange={(value) => update("shadowY", value)}
                />
                <RangeControl
                  label="Blur"
                  value={config.shadowBlur}
                  min={0}
                  max={48}
                  disabled={!config.shadowEnabled}
                  onChange={(value) =>
                    update("shadowBlur", value)
                  }
                />
              </div>
            </ControlCard>
          </Tabs.Panel>

          <Tabs.Panel
            value="lab"
            className="p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300"
          >
            <div className="space-y-5">
              <div className="flex min-h-10 items-center justify-between gap-3">
                <h3 className="text-balance text-sm font-medium">
                  Style experiments
                </h3>
                {experimentSnapshot && (
                  <button
                    type="button"
                    onClick={resetExperiments}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-neutral-600 outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-neutral-300"
                  >
                    <Reload className="size-4" aria-hidden />
                    Reset
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {BUTTON_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyExperiment(preset)}
                    className="min-w-0 rounded-xl p-2 text-left outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transition-[transform,box-shadow] duration-150 ease-out hover:shadow-[0_0_0_1px_rgba(0,0,0,0.16),0_2px_4px_rgba(0,0,0,0.05)] active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
                  >
                    <PresetPreview preset={preset.id} />
                    <span className="mt-3 block truncate px-1 pb-1 text-sm font-medium text-neutral-950 dark:text-white">
                      {preset.name}
                    </span>
                  </button>
                ))}
              </div>

              <p className="sr-only" aria-live="polite">
                {presetStatus}
              </p>
            </div>
          </Tabs.Panel>
        </div>
      </Tabs.Root>
    </section>
  );
}
