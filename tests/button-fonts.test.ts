import { describe, expect, it } from "vitest";
import {
  getBunnyFontUrl,
  getButtonFont,
  getFontVariants,
} from "@/components/button-builder/button-fonts";

describe("button font variants", () => {
  it("only exposes styles present in the selected family", () => {
    const manrope = getFontVariants(getButtonFont("manrope"));
    const inter = getFontVariants(getButtonFont("inter"));

    expect(manrope).toHaveLength(7);
    expect(manrope.every((variant) => variant.style === "normal")).toBe(
      true,
    );
    expect(inter).toContainEqual({
      weight: 700,
      style: "italic",
      label: "Bold Italic",
    });
    expect(
      getBunnyFontUrl(getButtonFont("inter"), 700, "italic"),
    ).toContain("inter:700italic");
    expect(
      getFontVariants(getButtonFont("press-start-2p")),
    ).toEqual([
      { weight: 400, style: "normal", label: "Regular" },
    ]);
  });
});
