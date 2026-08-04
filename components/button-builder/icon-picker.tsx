"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  Icon,
  iconLoaded,
  loadIcons,
} from "@iconify/react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type CSSProperties,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { Cancel } from "pixelarticons/react/Cancel";
import { LetterXCircle } from "pixelarticons/react/LetterXCircle";
import { Search } from "pixelarticons/react/Search";
import { cn } from "@/lib/utils";
import styles from "./button-builder.module.css";
import {
  DEFAULT_ICONS,
  DEFAULT_ICON_STYLE,
  getIconName,
  getIconStrokeWidth,
  ICON_LIBRARIES,
  ICON_STYLES,
  type IconLibrary,
  LIBRARY_LABELS,
} from "./button-icons";

type IconPickerProps = {
  library: IconLibrary;
  style: string;
  value: string | null;
  onLibraryChange: (
    library: IconLibrary,
    style: string,
    icon: string,
  ) => void;
  onStyleChange: (style: string) => void;
  onChange: (icon: string | null) => void;
};

type IconResponse = {
  icons: string[];
  total: number;
  degraded?: boolean;
};

export function IconPicker({
  library,
  style,
  value,
  onLibraryChange,
  onStyleChange,
  onChange,
}: IconPickerProps) {
  const searchId = useId();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false);
  const [columns, setColumns] = useState(8);
  const [, refreshLoadedIcons] = useState(0);
  const [scrollParent, setScrollParent] =
    useState<HTMLDivElement | null>(null);
  const selectedName = getIconName(value);
  const strokeWidth = getIconStrokeWidth(library, style);
  const lucideStrokeStyle =
    library === "lucide" && strokeWidth
      ? ({
          "--lucide-stroke-width": strokeWidth,
        } as CSSProperties)
      : undefined;

  useEffect(() => {
    const controller = new AbortController();
    const search = new URLSearchParams({
      library,
      style,
    });

    setLoading(true);
    fetch(`/api/icons?${search.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Icon search failed.");
        return response.json() as Promise<IconResponse>;
      })
      .then((data) => {
        setIcons(data.icons);
        setDegraded(Boolean(data.degraded));
      })
      .catch((error: unknown) => {
        if (
          !(error instanceof DOMException && error.name === "AbortError")
        ) {
          setIcons([]);
          setDegraded(true);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [library, style]);

  useEffect(() => {
    function updateColumns() {
      setColumns(
        window.innerWidth < 480
          ? 4
          : window.innerWidth < 768
            ? 6
            : 8,
      );
    }

    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, []);

  const filteredIcons = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    if (!normalizedQuery) return icons;

    return icons.filter((icon) =>
      getIconName(icon).toLowerCase().includes(normalizedQuery),
    );
  }, [deferredQuery, icons]);

  const rowCount = Math.ceil(filteredIcons.length / columns);
  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollParent,
    estimateSize: () => 64,
    gap: 8,
    overscan: 2,
  });
  const virtualRows = rowVirtualizer.getVirtualItems();
  const visibleIconNames = virtualRows.flatMap((row) => {
    const start = row.index * columns;
    return filteredIcons.slice(start, start + columns);
  });
  const visibleIconKey = visibleIconNames.join("|");

  useEffect(() => {
    const missingIcons = visibleIconNames.filter(
      (icon) => !iconLoaded(icon),
    );
    if (missingIcons.length === 0) return;

    return loadIcons(missingIcons, (_loaded, _missing, pending) => {
      if (pending.length === 0) {
        refreshLoadedIcons((current) => current + 1);
      }
    });
  }, [visibleIconKey]);

  function updateQuery(nextQuery: string) {
    if (scrollParent) {
      scrollParent.scrollTop = 0;
    }
    setQuery(nextQuery);
  }

  return (
    <Dialog.Root>
      <div className="space-y-3">
        <div
          className="grid grid-cols-3 rounded-xl bg-neutral-50 p-1 dark:bg-neutral-900"
          role="group"
          aria-label="Icon library"
        >
          {ICON_LIBRARIES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={library === option}
              onClick={() =>
                onLibraryChange(
                  option,
                  DEFAULT_ICON_STYLE[option],
                  DEFAULT_ICONS[option],
                )
              }
              className={cn(
                "min-h-10 rounded-lg px-2 text-[11px] outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300",
                library === option
                  ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
                  : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
              )}
            >
              {LIBRARY_LABELS[option]}
            </button>
          ))}
        </div>

        {ICON_STYLES[library].length > 1 && (
          <div
            className={cn(
              "grid rounded-xl bg-neutral-50 p-1 dark:bg-neutral-900",
              ICON_STYLES[library].length === 2
                ? "grid-cols-2"
                : ICON_STYLES[library].length > 4
                  ? "grid-cols-3"
                  : "grid-cols-4",
            )}
            role="group"
            aria-label={`${LIBRARY_LABELS[library]} icon style`}
          >
            {ICON_STYLES[library].map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={style === option.value}
                onClick={() => onStyleChange(option.value)}
                className={cn(
                  "min-h-10 rounded-lg px-1 text-[10px] outline-none transition-[transform,background-color,color,box-shadow] duration-150 ease-out active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:focus-visible:ring-neutral-300",
                  style === option.value
                    ? "bg-white text-neutral-950 shadow-sm dark:bg-neutral-800 dark:text-white"
                    : "text-neutral-600 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <Dialog.Trigger className="flex min-h-12 min-w-0 items-center gap-3 rounded-xl px-3 text-left outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950">
            {value ? (
              <Icon
                icon={value}
                width={20}
                height={20}
                className={cn(
                  library === "lucide" &&
                    styles.lucideStrokeOverride,
                )}
                style={lucideStrokeStyle}
                aria-hidden
              />
            ) : (
              <span
                className="flex size-5 items-center justify-center"
                aria-hidden
              >
                —
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium capitalize">
                {selectedName}
              </span>
            </span>
          </Dialog.Trigger>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove icon"
            disabled={!value}
            className="flex size-12 items-center justify-center rounded-xl text-neutral-400 outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-50 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-35 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-900 dark:hover:text-white dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950"
          >
            <Cancel className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/25 dark:bg-black/55" />
        <Dialog.Popup
          initialFocus
          className="fixed left-1/2 top-1/2 z-50 flex h-[min(42rem,calc(100dvh-2rem))] w-[min(44rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_24px_80px_rgba(0,0,0,0.24)] outline-none dark:bg-neutral-950 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_24px_90px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-start justify-between gap-6 border-b border-neutral-100 p-5 dark:border-neutral-800">
            <div>
              <Dialog.Title className="text-balance text-base font-medium">
                Choose an icon
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-pretty text-xs text-neutral-400 dark:text-neutral-500">
                {loading
                  ? `Loading ${LIBRARY_LABELS[library]}…`
                  : `${icons.length} ${LIBRARY_LABELS[library]} icons. Only visible rows are rendered.`}
              </Dialog.Description>
            </div>
            <Dialog.Close
              aria-label="Close icon picker"
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-neutral-300"
            >
              <LetterXCircle className="size-5" aria-hidden />
            </Dialog.Close>
          </div>

          <div className="border-b border-neutral-100 p-5 dark:border-neutral-800">
            <label htmlFor={searchId} className="sr-only">
              Search icons
            </label>
            <div className="flex min-h-11 items-center gap-3 rounded-xl bg-neutral-50 px-3 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] focus-within:ring-2 focus-within:ring-neutral-500 dark:bg-neutral-900 dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.07)] dark:focus-within:ring-neutral-300">
              <Search
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden
              />
              <input
                id={searchId}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Search arrow, calendar, camera..."
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  aria-label="Clear icon search"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-200 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-neutral-300"
                >
                  <Cancel className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          <div
            ref={setScrollParent}
            className="min-h-0 flex-1 overflow-y-auto p-5"
            aria-busy={loading}
            aria-label={`${filteredIcons.length} available icons`}
          >
            {loading ? (
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                {Array.from({ length: 32 }, (_, index) => (
                  <div
                    key={index}
                    className="aspect-square animate-pulse rounded-xl bg-neutral-100 dark:bg-neutral-900"
                  />
                ))}
              </div>
            ) : filteredIcons.length > 0 ? (
              <div
                className="relative w-full"
                style={{ height: rowVirtualizer.getTotalSize() }}
              >
                {virtualRows.map((row) => {
                  const start = row.index * columns;
                  const rowIcons = filteredIcons.slice(
                    start,
                    start + columns,
                  );

                  return (
                    <div
                      key={row.key}
                      className="absolute left-0 top-0 grid w-full gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                        height: row.size,
                        transform: `translateY(${row.start}px)`,
                      }}
                    >
                      {rowIcons.map((icon) => {
                        const name = getIconName(icon);
                        return (
                          <Dialog.Close
                            key={icon}
                            type="button"
                            aria-label={`Use ${name} icon`}
                            aria-pressed={value === icon}
                            onClick={() => onChange(icon)}
                            className={cn(
                              "group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.06)] transition-[transform,background-color,color,box-shadow] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300",
                              value === icon &&
                                "bg-neutral-100 text-neutral-950 dark:bg-neutral-800 dark:text-white",
                            )}
                          >
                            {iconLoaded(icon) ? (
                              <Icon
                                icon={icon}
                                width={22}
                                height={22}
                                className={cn(
                                  library === "lucide" &&
                                    styles.lucideStrokeOverride,
                                )}
                                style={lucideStrokeStyle}
                                aria-hidden
                              />
                            ) : (
                              <span
                                className="size-[22px] animate-pulse rounded bg-neutral-100 dark:bg-neutral-800"
                                aria-hidden
                              />
                            )}
                            <span className="w-full truncate text-center text-[8px] capitalize text-neutral-400 group-hover:text-neutral-600 dark:text-neutral-500 dark:group-hover:text-neutral-300">
                              {name}
                            </span>
                          </Dialog.Close>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center text-center">
                <p className="text-sm font-medium">No icons found</p>
                <p className="mt-1 max-w-xs text-pretty text-xs text-neutral-400 dark:text-neutral-500">
                  Try a broader name or clear the search to see the full
                  collection again.
                </p>
                <button
                  type="button"
                  onClick={() => updateQuery("")}
                  className="mt-4 min-h-10 rounded-lg px-3 text-xs outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.1)] transition-[transform,background-color] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.12)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300"
                >
                  Clear search
                </button>
              </div>
            )}

            {degraded && filteredIcons.length > 0 && (
              <p
                className="mt-4 text-pretty text-xs text-amber-700 dark:text-amber-400"
                role="status"
              >
                The full collection is temporarily unavailable. Showing
                featured icons instead.
              </p>
            )}
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
