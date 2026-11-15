import { converter, wcagContrast, type Rgb } from "culori";
import { getEffectiveIconColor, hasIcon, type ButtonConfig } from "./button-builder-types";

const toRgb = converter("rgb");

/** Canvas fills behind the button (Tailwind neutral-50 / neutral-800). */
export const CANVAS_BACKGROUND = {
  light: "oklch(98.5% 0 0)",
  dark: "oklch(26.9% 0 0)",
} as const;

export type ContrastLevel = "AAA" | "AA" | "Fail";

export type ContrastResult = {
  /** Worst ratio across the fill (every gradient stop counts). */
  ratio: number;
  level: ContrastLevel;
};

export type ButtonContrast = {
  text: ContrastResult;
  icon: ContrastResult | null;
  largeText: boolean;
};

function parse(color: string): Rgb {
  return toRgb(color) ?? { mode: "rgb", r: 0, g: 0, b: 0 };
}

/** Source-over compositing in sRGB, the way browsers paint it. */
function over(top: Rgb, bottom: Rgb, opacity = 1): Rgb {
  const a = (top.alpha ?? 1) * opacity;
  return {
    mode: "rgb",
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
  };
}

function fillStops(config: ButtonConfig) {
  if (config.fillMode === "none") return [];
  if (config.fillMode === "solid") return [config.fill];
  return config.fillGradientViaEnabled
    ? [config.fillGradientFrom, config.fillGradientVia, config.fillGradientTo]
    : [config.fillGradientFrom, config.fillGradientTo];
}

/** The colors the text actually sits on: each fill stop over the canvas. */
export function getButtonBackgrounds(config: ButtonConfig, canvas: string) {
  const base = parse(canvas);
  const stops = fillStops(config);
  if (stops.length === 0) return [base];
  return stops.map((stop) => over(parse(stop), base, config.fillOpacity / 100));
}

function worstRatio(foreground: string, backgrounds: Rgb[]) {
  const fg = parse(foreground);
  return Math.min(
    ...backgrounds.map((background) => wcagContrast(over(fg, background), background)),
  );
}

/**
 * WCAG 2.2 large text: at least 24px, or 18.66px (14pt) when bold.
 */
export function isLargeText(fontSize: number, fontWeight: number) {
  return fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
}

/** SC 1.4.3 / 1.4.6 thresholds, relaxed for large text. */
export function textLevel(ratio: number, largeText: boolean): ContrastLevel {
  const [aa, aaa] = largeText ? [3, 4.5] : [4.5, 7];
  if (ratio >= aaa) return "AAA";
  if (ratio >= aa) return "AA";
  return "Fail";
}

/** SC 1.4.11: icons are graphics and only need 3:1, there is no AAA tier. */
export function iconLevel(ratio: number): ContrastLevel {
  return ratio >= 3 ? "AA" : "Fail";
}

export function getButtonContrast(
  config: ButtonConfig,
  canvas: string,
): ButtonContrast {
  const backgrounds = getButtonBackgrounds(config, canvas);
  const largeText = isLargeText(config.fontSize, config.fontWeight);
  const textRatio = worstRatio(config.textColor, backgrounds);
  const iconRatio = hasIcon(config.iconName)
    ? worstRatio(getEffectiveIconColor(config), backgrounds)
    : null;

  return {
    text: { ratio: textRatio, level: textLevel(textRatio, largeText) },
    icon:
      iconRatio === null
        ? null
        : { ratio: iconRatio, level: iconLevel(iconRatio) },
    largeText,
  };
}

export function formatRatio(ratio: number) {
  return `${(Math.floor(ratio * 10) / 10).toFixed(1)}:1`;
}
