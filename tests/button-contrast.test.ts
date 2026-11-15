import { describe, expect, it } from "vitest";
import { DEFAULT_CONFIG } from "@/components/button-builder/button-builder-types";
import {
  CANVAS_BACKGROUND,
  formatRatio,
  getButtonContrast,
  isLargeText,
  textLevel,
} from "@/components/button-builder/button-contrast";

const config = (overrides: Partial<typeof DEFAULT_CONFIG>) => ({
  ...DEFAULT_CONFIG,
  ...overrides,
});

describe("button contrast", () => {
  it("rates black on white as AAA for text and icon", () => {
    const result = getButtonContrast(
      config({ fill: "#ffffff", textColor: "#000000", iconColorMode: "text" }),
      CANVAS_BACKGROUND.light,
    );
    expect(result.text.ratio).toBeCloseTo(21, 0);
    expect(result.text.level).toBe("AAA");
    expect(result.icon?.level).toBe("AA");
  });

  it("uses the worst gradient stop", () => {
    const result = getButtonContrast(
      config({
        fillMode: "gradient",
        fillGradientFrom: "#000000",
        fillGradientViaEnabled: false,
        fillGradientTo: "#ffffff",
        textColor: "#ffffff",
      }),
      CANVAS_BACKGROUND.light,
    );
    expect(result.text.ratio).toBeCloseTo(1, 1);
    expect(result.text.level).toBe("Fail");
  });

  it("blends a translucent fill with the canvas", () => {
    const opaque = getButtonContrast(
      config({ fill: "#000000", textColor: "#ffffff", fillOpacity: 100 }),
      CANVAS_BACKGROUND.light,
    );
    const faded = getButtonContrast(
      config({ fill: "#000000", textColor: "#ffffff", fillOpacity: 10 }),
      CANVAS_BACKGROUND.light,
    );
    expect(faded.text.ratio).toBeLessThan(opaque.text.ratio);
    expect(faded.text.level).toBe("Fail");
  });

  it("checks against the canvas when there is no fill", () => {
    const light = getButtonContrast(
      config({ fillMode: "none", textColor: "#ffffff" }),
      CANVAS_BACKGROUND.light,
    );
    const dark = getButtonContrast(
      config({ fillMode: "none", textColor: "#ffffff" }),
      CANVAS_BACKGROUND.dark,
    );
    expect(light.text.level).toBe("Fail");
    expect(dark.text.level).not.toBe("Fail");
  });

  it("skips the icon when there is none", () => {
    const result = getButtonContrast(
      config({ iconName: null }),
      CANVAS_BACKGROUND.light,
    );
    expect(result.icon).toBeNull();
  });

  it("relaxes thresholds for large text", () => {
    expect(isLargeText(24, 400)).toBe(true);
    expect(isLargeText(19, 700)).toBe(true);
    expect(isLargeText(19, 500)).toBe(false);
    expect(textLevel(3.2, true)).toBe("AA");
    expect(textLevel(3.2, false)).toBe("Fail");
  });

  it("never rounds a failing ratio up to a passing one", () => {
    expect(formatRatio(4.49)).toBe("4.4:1");
  });
});
