import { describe, expect, it } from "vitest";
import {
  createSvgMarkup,
  getCssCode,
  getPngExportDimensions,
  getPrompt,
  getSvgTextBaseline,
  getTailwindClasses,
} from "@/components/button-builder/button-output";
import { DEFAULT_CONFIG } from "@/components/button-builder/button-builder-types";
import { colorToOklchCss } from "@/components/button-builder/button-color-utils";
import { BUTTON_PRESETS } from "@/components/button-builder/button-presets";

describe("gradient button strokes", () => {
  it("uses a numeric SVG baseline that centers the visible glyphs", () => {
    expect(
      getSvgTextBaseline(40, {
        ascent: 14,
        descent: 4,
      }),
    ).toBe(45);
  });

  it("exports Affinity-compatible text positioning", async () => {
    const svg = await createSvgMarkup(
      {
        ...DEFAULT_CONFIG,
        iconName: null,
        shadowEnabled: false,
      },
      {
        width: 58.25,
        ascent: 14,
        descent: 4,
      },
    );

    expect(svg).not.toContain("dominant-baseline");
    expect(svg).toContain('y="30.5"');
    expect(svg).toContain('textLength="58.25"');
    expect(svg).toContain('lengthAdjust="spacingAndGlyphs"');
    expect(svg).toContain('xml:space="preserve"');
  });

  it("keeps portable text geometry across every style experiment", async () => {
    for (const preset of BUTTON_PRESETS) {
      const svg = await createSvgMarkup(
        {
          ...DEFAULT_CONFIG,
          ...preset.config,
          iconName: null,
        },
        {
          width: 64,
          ascent: 15,
          descent: 4,
        },
      );

      expect(svg, preset.name).not.toContain("dominant-baseline");
      expect(svg, preset.name).toContain('textLength="64"');
      expect(svg, preset.name).toMatch(/<text[^>]+ y="\d+(?:\.\d+)?"/);
    }
  });

  it("calculates each selectable PNG export scale", () => {
    expect(getPngExportDimensions(120, 48, 1)).toEqual({
      scale: 1,
      width: 120,
      height: 48,
      filename: "button@1x.png",
    });
    expect(getPngExportDimensions(120, 48, 3)).toEqual({
      scale: 3,
      width: 360,
      height: 144,
      filename: "button@3x.png",
    });
    expect(getPngExportDimensions(120, 48, 4)).toEqual({
      scale: 4,
      width: 480,
      height: 192,
      filename: "button@4x.png",
    });
  });

  it("reserves the same border geometry as a solid stroke", () => {
    const config = {
      ...DEFAULT_CONFIG,
      strokeMode: "gradient" as const,
      strokeWidth: 4,
    };

    expect(getCssCode(config)).toContain(
      "border: 4px solid transparent",
    );
    expect(getCssCode(config)).toContain(
      "padding-box, linear-gradient(",
    );
    expect(getCssCode(config)).toContain("border-box");
    expect(getTailwindClasses(config)).toContain(
      "border-[4px] border-transparent",
    );
    expect(getTailwindClasses(config)).toContain(
      "before:-inset-[4px]",
    );
  });

  it("supports independent transparent and gradient fills", () => {
    const transparent = {
      ...DEFAULT_CONFIG,
      fillMode: "none" as const,
      strokeMode: "none" as const,
    };
    const gradient = {
      ...DEFAULT_CONFIG,
      fillMode: "gradient" as const,
    };

    expect(getCssCode(transparent)).toContain("border: 0");
    expect(getCssCode(transparent)).toContain(
      "background: transparent",
    );
    expect(getCssCode(gradient)).toContain(
      "background: linear-gradient(135deg",
    );
  });

  it("exports translucent surface values as portable CSS", () => {
    const glass = {
      ...DEFAULT_CONFIG,
      fillOpacity: 56,
    };

    expect(getCssCode(glass)).toContain(
      "background: oklch(1 0 0 / 0.56)",
    );
  });

  it("exports pixel corners as a stepped shape", () => {
    const pixel = {
      ...DEFAULT_CONFIG,
      cornerStyle: "pixel" as const,
      shadowEnabled: true,
    };

    expect(getCssCode(pixel)).toContain("clip-path: polygon(");
    expect(getCssCode(pixel)).toContain(
      "box-shadow: inset 0 4px",
    );
    expect(getCssCode(pixel)).toContain("filter: drop-shadow(");
    expect(getTailwindClasses(pixel)).toContain(
      "[clip-path:polygon(",
    );
    expect(getTailwindClasses(pixel)).toContain(
      "[box-shadow:inset_0_4px",
    );
  });

  it("exports an icon color independently from the text", () => {
    const coloredIcon = {
      ...DEFAULT_CONFIG,
      textColor: "#171717",
      iconColorMode: "custom" as const,
      iconColor: "#ef4444",
    };

    expect(getCssCode(coloredIcon)).toMatch(
      /\.button__icon .* background: oklch\(/,
    );
    expect(getTailwindClasses(coloredIcon)).toContain(
      "[&>svg]:text-[oklch(",
    );
    expect(getPrompt(coloredIcon)).toContain(
      "lucide:arrow-right from Lucide, 18px, oklch(",
    );
  });

  it("keeps the icon linked to the current text color", () => {
    const linkedIcon = {
      ...DEFAULT_CONFIG,
      textColor: "#22c55e",
      iconColorMode: "text" as const,
      iconColor: "#ef4444",
    };
    const linkedColor = colorToOklchCss(linkedIcon.textColor);

    expect(getCssCode(linkedIcon)).toContain(
      `background: ${linkedColor}`,
    );
    expect(getPrompt(linkedIcon)).toContain(
      `18px, ${linkedColor}`,
    );
  });
});
