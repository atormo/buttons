import {
  converter,
  formatCss,
  formatHex,
  type Oklch,
} from "culori";

const toOklch = converter("oklch");

export function colorToOklch(color: string): Oklch {
  return (
    toOklch(color) ?? {
      mode: "oklch",
      l: 0,
      c: 0,
      h: 0,
    }
  );
}

export function colorToOklchCss(color: string) {
  return oklchToCss(colorToOklch(color));
}

export function colorToOklchCssWithAlpha(
  color: string,
  opacity: number,
) {
  return oklchToCss({
    ...colorToOklch(color),
    alpha: Math.max(0, Math.min(100, opacity)) / 100,
  });
}

export function oklchToCss(color: Oklch) {
  return formatCss({
    ...color,
    l: Number(color.l.toFixed(4)),
    c: Number(color.c.toFixed(4)),
    h: Number((color.h ?? 0).toFixed(2)),
  });
}

export function oklchToHex(color: Oklch) {
  return formatHex(color) ?? "#000000";
}

export function colorToShortOklch(color: string) {
  const converted = colorToOklch(color);
  return `oklch(${Math.round(converted.l * 100)}% ${converted.c.toFixed(3)} ${Math.round(converted.h ?? 0)})`;
}
