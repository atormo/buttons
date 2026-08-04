import type { IconLibrary } from "@/components/button-builder/button-icons";

export const dynamic = "force-dynamic";

const PREFIXES: Record<IconLibrary, string> = {
  lucide: "lucide",
  phosphor: "ph",
  pixelarticons: "pixelarticons",
};

const FEATURED = {
  lucide: [
    "arrow-right",
    "arrow-up-right",
    "plus",
    "check",
    "heart",
    "download",
    "upload",
    "sparkles",
    "play",
    "search",
    "mail",
    "settings",
  ],
  phosphor: [
    "arrow-right",
    "arrow-up-right",
    "plus",
    "check",
    "heart",
    "download-simple",
    "upload-simple",
    "sparkle",
    "play",
    "magnifying-glass",
    "envelope",
    "gear",
  ],
  pixelarticons: [
    "arrow-right",
    "arrow-up-right",
    "plus",
    "check",
    "heart",
    "download",
    "upload",
    "sparkles",
    "play",
    "search",
    "mail",
    "sliders",
  ],
} satisfies Record<IconLibrary, string[]>;

const PHOSPHOR_SUFFIXES = [
  "-thin",
  "-light",
  "-bold",
  "-fill",
  "-duotone",
];

type CollectionResponse = {
  uncategorized?: string[];
  categories?: Record<string, string[]>;
};

function isLibrary(value: string | null): value is IconLibrary {
  return (
    value === "lucide" ||
    value === "phosphor" ||
    value === "pixelarticons"
  );
}

function applyStyle(
  library: IconLibrary,
  name: string,
  style: string,
) {
  if (library === "lucide") return name;

  if (library === "phosphor") {
    return style === "regular" ? name : `${name}-${style}`;
  }

  return name;
}

function matchesStyle(
  library: IconLibrary,
  name: string,
  style: string,
) {
  if (library === "lucide") return true;

  if (library === "phosphor") {
    if (style === "regular") {
      return !PHOSPHOR_SUFFIXES.some((suffix) => name.endsWith(suffix));
    }
    return name.endsWith(`-${style}`);
  }

  return true;
}

function getFeatured(library: IconLibrary, style: string) {
  const prefix = PREFIXES[library];
  return FEATURED[library].map(
    (name) => `${prefix}:${applyStyle(library, name, style)}`,
  );
}

function getCollectionNames(data: CollectionResponse) {
  const names = new Set(data.uncategorized ?? []);
  Object.values(data.categories ?? {}).forEach((category) => {
    category.forEach((name) => names.add(name));
  });
  return [...names];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const libraryValue = url.searchParams.get("library");
  const library = isLibrary(libraryValue) ? libraryValue : "lucide";
  const style = (url.searchParams.get("style") ?? "regular").slice(0, 16);
  const prefix = PREFIXES[library];
  const collectionUrl = new URL(
    "https://api.iconify.design/collection",
  );
  collectionUrl.searchParams.set("prefix", prefix);

  try {
    const response = await fetch(collectionUrl, {
      next: { revalidate: 86_400 },
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      throw new Error(`Iconify responded with ${response.status}.`);
    }

    const data = (await response.json()) as CollectionResponse;
    const icons = getCollectionNames(data)
      .filter((name) => matchesStyle(library, name, style))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => `${prefix}:${name}`);

    return Response.json({
      icons,
      total: icons.length,
      source: "collection",
    });
  } catch {
    const icons = getFeatured(library, style);
    return Response.json({
      icons,
      total: icons.length,
      source: "featured",
      degraded: true,
    });
  }
}
