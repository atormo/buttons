export type ButtonFont = {
  id: string;
  family: string;
  category: "Sans serif" | "Serif" | "Display" | "Monospace";
  fallback: string;
  weights: readonly number[];
  styles: readonly FontStyle[];
};

export type FontStyle = "normal" | "italic";

export type FontVariant = {
  weight: number;
  style: FontStyle;
  label: string;
};

function font(
  id: string,
  family: string,
  category: ButtonFont["category"],
  fallback: string,
  weights: readonly number[],
  styles: readonly FontStyle[] = ["normal"],
): ButtonFont {
  return { id, family, category, fallback, weights, styles };
}

const W100_900 = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const W200_900 = [200, 300, 400, 500, 600, 700, 800, 900];
const W300_900 = [300, 400, 500, 600, 700, 800, 900];
const W100_800 = [100, 200, 300, 400, 500, 600, 700, 800];
const W200_800 = [200, 300, 400, 500, 600, 700, 800];
const W300_800 = [300, 400, 500, 600, 700, 800];
const W200_700 = [200, 300, 400, 500, 600, 700];
const W300_700 = [300, 400, 500, 600, 700];
const W400_700 = [400, 500, 600, 700];
const NORMAL_ITALIC: readonly FontStyle[] = ["normal", "italic"];

export const BUTTON_FONTS: readonly ButtonFont[] = [
  font("inter", "Inter", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("manrope", "Manrope", "Sans serif", "sans-serif", W200_800),
  font("instrument-sans", "Instrument Sans", "Sans serif", "sans-serif", W400_700, NORMAL_ITALIC),
  font("dm-sans", "DM Sans", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("space-grotesk", "Space Grotesk", "Sans serif", "sans-serif", W300_700),
  font("archivo", "Archivo", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("outfit", "Outfit", "Sans serif", "sans-serif", W100_900),
  font("sora", "Sora", "Sans serif", "sans-serif", W100_800),
  font("figtree", "Figtree", "Sans serif", "sans-serif", W300_900, NORMAL_ITALIC),
  font("ibm-plex-sans", "IBM Plex Sans", "Sans serif", "sans-serif", [100, 200, 300, 400, 500, 600, 700], NORMAL_ITALIC),
  font("plus-jakarta-sans", "Plus Jakarta Sans", "Sans serif", "sans-serif", W200_800, NORMAL_ITALIC),
  font("poppins", "Poppins", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("montserrat", "Montserrat", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("open-sans", "Open Sans", "Sans serif", "sans-serif", W300_800, NORMAL_ITALIC),
  font("roboto", "Roboto", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("nunito", "Nunito", "Sans serif", "sans-serif", W200_900, NORMAL_ITALIC),
  font("rubik", "Rubik", "Sans serif", "sans-serif", W300_900, NORMAL_ITALIC),
  font("work-sans", "Work Sans", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("urbanist", "Urbanist", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("raleway", "Raleway", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("karla", "Karla", "Sans serif", "sans-serif", W200_800, NORMAL_ITALIC),
  font("barlow", "Barlow", "Sans serif", "sans-serif", W100_900, NORMAL_ITALIC),
  font("lora", "Lora", "Serif", "serif", W400_700, NORMAL_ITALIC),
  font("source-serif-4", "Source Serif 4", "Serif", "serif", W200_900, NORMAL_ITALIC),
  font("merriweather", "Merriweather", "Serif", "serif", W300_900, NORMAL_ITALIC),
  font("libre-baskerville", "Libre Baskerville", "Serif", "serif", W400_700, NORMAL_ITALIC),
  font("eb-garamond", "EB Garamond", "Serif", "serif", [400, 500, 600, 700, 800], NORMAL_ITALIC),
  font("crimson-pro", "Crimson Pro", "Serif", "serif", W200_900, NORMAL_ITALIC),
  font("spectral", "Spectral", "Serif", "serif", W200_800, NORMAL_ITALIC),
  font("cormorant-garamond", "Cormorant Garamond", "Serif", "serif", W300_700, NORMAL_ITALIC),
  font("zilla-slab", "Zilla Slab", "Serif", "serif", W300_700, NORMAL_ITALIC),
  font("bitter", "Bitter", "Serif", "serif", W100_900, NORMAL_ITALIC),
  font("playfair-display", "Playfair Display", "Display", "serif", [400, 500, 600, 700, 800, 900], NORMAL_ITALIC),
  font("fraunces", "Fraunces", "Display", "serif", W100_900, NORMAL_ITALIC),
  font("oswald", "Oswald", "Display", "sans-serif", W200_700),
  font("bebas-neue", "Bebas Neue", "Display", "sans-serif", [400]),
  font("anton", "Anton", "Display", "sans-serif", [400]),
  font("press-start-2p", "Press Start 2P", "Display", "sans-serif", [400]),
  font("syne", "Syne", "Display", "sans-serif", [400, 500, 600, 700, 800]),
  font("unbounded", "Unbounded", "Display", "sans-serif", W200_900),
  font("righteous", "Righteous", "Display", "sans-serif", [400]),
  font("abril-fatface", "Abril Fatface", "Display", "serif", [400]),
  font("alfa-slab-one", "Alfa Slab One", "Display", "serif", [400]),
  font("jetbrains-mono", "JetBrains Mono", "Monospace", "monospace", W100_800, NORMAL_ITALIC),
  font("ibm-plex-mono", "IBM Plex Mono", "Monospace", "monospace", [100, 200, 300, 400, 500, 600, 700], NORMAL_ITALIC),
  font("space-mono", "Space Mono", "Monospace", "monospace", [400, 700], NORMAL_ITALIC),
  font("fira-code", "Fira Code", "Monospace", "monospace", W300_700),
  font("source-code-pro", "Source Code Pro", "Monospace", "monospace", W200_900, NORMAL_ITALIC),
  font("roboto-mono", "Roboto Mono", "Monospace", "monospace", [100, 200, 300, 400, 500, 600, 700], NORMAL_ITALIC),
  font("inconsolata", "Inconsolata", "Monospace", "monospace", W200_900),
  font("dm-mono", "DM Mono", "Monospace", "monospace", [300, 400, 500], NORMAL_ITALIC),
] as const;

export const DEFAULT_BUTTON_FONT = BUTTON_FONTS[1];

export function getButtonFont(id: string) {
  return (
    BUTTON_FONTS.find((font) => font.id === id) ??
    DEFAULT_BUTTON_FONT
  );
}

const WEIGHT_LABELS: Readonly<Record<number, string>> = {
  100: "Thin",
  200: "Extra Light",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "Semi Bold",
  700: "Bold",
  800: "Extra Bold",
  900: "Black",
};

export function getFontVariants(font: ButtonFont): readonly FontVariant[] {
  return font.weights.flatMap((weight) =>
    font.styles.map((style) => ({
      weight,
      style,
      label:
        style === "italic"
          ? weight === 400
            ? "Italic"
            : `${WEIGHT_LABELS[weight] ?? weight} Italic`
          : WEIGHT_LABELS[weight] ?? String(weight),
    })),
  );
}

export function getBunnyFontUrl(
  font: ButtonFont,
  weight?: number,
  style?: FontStyle,
) {
  const variants =
    weight === undefined
      ? getFontVariants(font)
      : [{ weight, style: style ?? "normal" }];
  const query = variants
    .map((variant) =>
      variant.style === "italic"
        ? `${variant.weight}italic`
        : String(variant.weight),
    )
    .join(",");

  return `https://fonts.bunny.net/css?family=${font.id}:${query}`;
}

export function getFontStack(font: ButtonFont) {
  return `"${font.family}", ${font.fallback}`;
}
