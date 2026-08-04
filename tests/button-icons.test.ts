import { describe, expect, it } from "vitest";
import {
  getIconStrokeWidth,
  getStyledIcon,
  ICON_STYLES,
} from "@/components/button-builder/button-icons";

describe("button icon styles", () => {
  it("maps each Lucide weight to its real SVG stroke width", () => {
    expect(getIconStrokeWidth("lucide", "1")).toBe(1);
    expect(getIconStrokeWidth("lucide", "1.5")).toBe(1.5);
    expect(getIconStrokeWidth("lucide", "2")).toBe(2);
    expect(getIconStrokeWidth("lucide", "2.5")).toBe(2.5);
  });

  it("keeps Phosphor variants and normalizes their suffixes", () => {
    expect(
      getStyledIcon("ph:arrow-right", "phosphor", "duotone"),
    ).toBe("ph:arrow-right-duotone");
    expect(
      getStyledIcon("ph:arrow-right-duotone", "phosphor", "bold"),
    ).toBe("ph:arrow-right-bold");
  });

  it("offers Pixelarticons only as its real regular style", () => {
    expect(ICON_STYLES.pixelarticons).toEqual([
      { value: "regular", label: "Regular" },
    ]);
    expect(
      getStyledIcon(
        "pixelarticons:arrow-right-sharp",
        "pixelarticons",
        "regular",
      ),
    ).toBe("pixelarticons:arrow-right");
  });
});
