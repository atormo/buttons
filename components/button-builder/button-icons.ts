export type IconLibrary = "lucide" | "phosphor" | "pixelarticons";
export type IconPosition = "left" | "right";

export const ICON_LIBRARIES: readonly IconLibrary[] = [
  "lucide",
  "phosphor",
  "pixelarticons",
];

export const LIBRARY_LABELS: Record<IconLibrary, string> = {
  lucide: "Lucide",
  phosphor: "Phosphor",
  pixelarticons: "Pixelarticons",
};

export const ICON_STYLES = {
  lucide: [
    { value: "1", label: "Thin" },
    { value: "1.5", label: "Light" },
    { value: "2", label: "Regular" },
    { value: "2.5", label: "Bold" },
  ],
  phosphor: [
    { value: "regular", label: "Regular" },
    { value: "thin", label: "Thin" },
    { value: "light", label: "Light" },
    { value: "bold", label: "Bold" },
    { value: "fill", label: "Fill" },
    { value: "duotone", label: "Duotone" },
  ],
  pixelarticons: [{ value: "regular", label: "Regular" }],
} satisfies Record<
  IconLibrary,
  readonly { value: string; label: string }[]
>;

export const DEFAULT_ICON_STYLE: Record<IconLibrary, string> = {
  lucide: "2",
  phosphor: "regular",
  pixelarticons: "regular",
};

export const DEFAULT_ICONS: Record<IconLibrary, string> = {
  lucide: "lucide:arrow-right",
  phosphor: "ph:arrow-right",
  pixelarticons: "pixelarticons:arrow-right",
};

export function getIconName(icon: string | null) {
  return icon?.split(":").at(-1)?.replaceAll("-", " ") ?? "None";
}

export function getIconApiUrl(icon: string, color?: string) {
  const [prefix, name] = icon.split(":");
  const query = color
    ? `?color=${encodeURIComponent(color)}`
    : "";
  return `https://api.iconify.design/${prefix}/${name}.svg${query}`;
}

export function getIconStrokeWidth(
  library: IconLibrary,
  style: string,
) {
  return library === "lucide" ? Number(style) : undefined;
}

export function getStyledIcon(
  icon: string | null,
  library: IconLibrary,
  style: string,
) {
  if (!icon || library === "lucide") return icon;

  const [prefix, rawName] = icon.split(":");
  if (!prefix || !rawName) return icon;

  if (library === "phosphor") {
    const baseName = rawName.replace(
      /-(thin|light|bold|fill|duotone)$/,
      "",
    );
    return `ph:${style === "regular" ? baseName : `${baseName}-${style}`}`;
  }

  return `pixelarticons:${rawName.replace(/-sharp$/, "")}`;
}
