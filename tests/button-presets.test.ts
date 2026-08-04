import { describe, expect, it } from "vitest";
import { BUTTON_PRESETS } from "@/components/button-builder/button-presets";

describe("button style experiments", () => {
  it("offers distinct editable visual directions", () => {
    expect(BUTTON_PRESETS.map((preset) => preset.id)).toEqual([
      "clean",
      "skeuomorphic",
      "glass",
      "prism",
      "brutalist",
      "soft",
      "terminal",
      "candy",
    ]);

    expect(
      BUTTON_PRESETS.find((preset) => preset.id === "glass")
        ?.config,
    ).toMatchObject({
      fillOpacity: 56,
      fillMode: "gradient",
    });
    expect(
      BUTTON_PRESETS.find((preset) => preset.id === "prism")
        ?.config,
    ).toMatchObject({
      cornerStyle: "rounded",
      fill: "#0a0a0a",
      strokeMode: "gradient",
      strokeWidth: 3,
      shadowColor: "#8b5cf6",
    });
    expect(
      BUTTON_PRESETS.find((preset) => preset.id === "brutalist")
        ?.config,
    ).toMatchObject({
      cornerStyle: "rounded",
      fontId: "archivo",
    });
  });
});
