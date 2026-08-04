import { describe, expect, it } from "vitest";
import {
  colorToOklch,
  oklchToCss,
} from "@/components/button-builder/button-color-utils";

describe("OKLCH button colors", () => {
  it("preserves slider extremes without clipping them through HEX", () => {
    const color = colorToOklch(
      oklchToCss({
        mode: "oklch",
        l: 1,
        c: 0.37,
        h: 360,
      }),
    );

    expect(color.l).toBe(1);
    expect(color.c).toBe(0.37);
    expect(color.h).toBe(360);
  });
});
