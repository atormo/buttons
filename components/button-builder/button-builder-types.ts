import {
  DEFAULT_ICONS,
  DEFAULT_ICON_STYLE,
  type IconLibrary,
  type IconPosition,
} from "./button-icons";
import { DEFAULT_BUTTON_FONT } from "./button-fonts";
import type { FontStyle } from "./button-fonts";

export type ThemeMode = "system" | "light" | "dark";
export type PaintMode = "none" | "solid" | "gradient";
export type CornerStyle = "rounded" | "pixel";
export type IconColorMode = "text" | "custom";

export type ButtonConfig = {
  label: string;
  cornerStyle: CornerStyle;
  fillMode: PaintMode;
  fill: string;
  fillOpacity: number;
  fillGradientFrom: string;
  fillGradientVia: string;
  fillGradientTo: string;
  fillGradientViaEnabled: boolean;
  fillGradientAngle: number;
  textColor: string;
  iconColorMode: IconColorMode;
  iconColor: string;
  strokeColor: string;
  strokeMode: PaintMode;
  strokeWidth: number;
  strokeGradientFrom: string;
  strokeGradientVia: string;
  strokeGradientTo: string;
  strokeGradientViaEnabled: boolean;
  strokeGradientAngle: number;
  radius: number;
  paddingX: number;
  paddingY: number;
  fontSize: number;
  fontWeight: number;
  fontStyle: FontStyle;
  fontId: string;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowOpacity: number;
  shadowX: number;
  shadowY: number;
  shadowBlur: number;
  iconLibrary: IconLibrary;
  iconStyle: string;
  iconName: string | null;
  iconPosition: IconPosition;
  iconSize: number;
  iconGap: number;
};

export type UpdateConfig = <Key extends keyof ButtonConfig>(
  key: Key,
  value: ButtonConfig[Key],
) => void;

export const DEFAULT_CONFIG: ButtonConfig = {
  label: "Button",
  cornerStyle: "rounded",
  fillMode: "solid",
  fill: "#ffffff",
  fillOpacity: 100,
  fillGradientFrom: "#fff7ed",
  fillGradientVia: "#fef3c7",
  fillGradientTo: "#ffffff",
  fillGradientViaEnabled: true,
  fillGradientAngle: 135,
  textColor: "#171717",
  iconColorMode: "text",
  iconColor: "#171717",
  strokeColor: "#e5e5e5",
  strokeMode: "solid",
  strokeWidth: 1,
  strokeGradientFrom: "#38bdf8",
  strokeGradientVia: "#8b5cf6",
  strokeGradientTo: "#f472b6",
  strokeGradientViaEnabled: true,
  strokeGradientAngle: 90,
  radius: 14,
  paddingX: 28,
  paddingY: 14,
  fontSize: 18,
  fontWeight: 500,
  fontStyle: "normal",
  fontId: DEFAULT_BUTTON_FONT.id,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowOpacity: 14,
  shadowX: 0,
  shadowY: 8,
  shadowBlur: 24,
  iconLibrary: "lucide",
  iconStyle: DEFAULT_ICON_STYLE.lucide,
  iconName: DEFAULT_ICONS.lucide,
  iconPosition: "right",
  iconSize: 18,
  iconGap: 8,
};

export function hasIcon(icon: string | null): icon is string {
  return Boolean(icon);
}

export function getEffectiveIconColor(config: ButtonConfig) {
  return config.iconColorMode === "text"
    ? config.textColor
    : config.iconColor;
}
