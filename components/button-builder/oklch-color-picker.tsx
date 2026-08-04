"use client";

import { Popover } from "@base-ui/react/popover";
import { type Oklch } from "culori";
import { useId, useState } from "react";
import { Check } from "pixelarticons/react/Check";
import { LetterXCircle } from "pixelarticons/react/LetterXCircle";
import { cn } from "@/lib/utils";
import {
  colorToOklch,
  colorToShortOklch,
  oklchToCss,
  oklchToHex,
} from "./button-color-utils";
import styles from "./button-builder.module.css";

type OklchColorPickerProps = {
  label: string;
  value: string;
  disabled?: boolean;
  compact?: boolean;
  allowNone?: boolean;
  none?: boolean;
  onNoneChange?: (none: boolean) => void;
  allowSameAsText?: boolean;
  sameAsText?: boolean;
  sameAsTextValue?: string;
  onSameAsTextChange?: (sameAsText: boolean) => void;
  onChange: (value: string) => void;
};

function updateChannel(
  current: Oklch,
  channel: "l" | "c" | "h",
  value: number,
) {
  return oklchToCss({
    ...current,
    [channel]: value,
  });
}

export function OklchColorPicker({
  label,
  value,
  disabled = false,
  compact = false,
  allowNone = false,
  none = false,
  onNoneChange,
  allowSameAsText = false,
  sameAsText = false,
  sameAsTextValue,
  onSameAsTextChange,
  onChange,
}: OklchColorPickerProps) {
  const labelId = useId();
  const valueId = useId();
  const lightnessId = useId();
  const chromaId = useId();
  const hueId = useId();
  const [hexError, setHexError] = useState(false);
  const color = colorToOklch(value);
  const hue = color.h ?? 0;
  const oklchValue = colorToShortOklch(value);
  const hexValue = oklchToHex(color);

  function commitHex(input: HTMLInputElement) {
    const nextValue = input.value.trim();
    if (/^#[0-9a-f]{6}$/i.test(nextValue)) {
      setHexError(false);
      onChange(nextValue.toLowerCase());
      return;
    }

    setHexError(true);
    input.value = hexValue.toUpperCase();
  }

  return (
    <div
      className={cn(
        "min-w-0",
        compact
          ? "flex flex-col gap-2"
          : "flex items-center justify-between gap-3",
      )}
    >
      <span
        id={labelId}
        className="text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        {label}
      </span>

      <Popover.Root>
        <Popover.Trigger
          disabled={disabled}
          aria-labelledby={`${labelId} ${valueId}`}
          className={cn(
            "flex min-h-10 max-w-[13.5rem] items-center gap-2 rounded-lg px-2 outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[background-color,box-shadow] duration-150 ease-out hover:bg-neutral-50 focus-visible:ring-2 focus-visible:ring-neutral-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300 dark:focus-visible:ring-offset-neutral-950",
            compact && "w-full max-w-none",
          )}
        >
          <span
            className={cn(
              "relative size-5 shrink-0 overflow-hidden rounded-full bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:bg-neutral-950 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.22)]",
              none && styles.transparencyGrid,
            )}
            style={none ? undefined : { backgroundColor: value }}
            aria-hidden
          />
          <span
            id={valueId}
            className="truncate font-mono text-[10px] tabular-nums text-neutral-600 dark:text-neutral-300"
          >
            {none
              ? "No fill"
              : sameAsText
                ? "Same as text"
                : oklchValue}
          </span>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Positioner
            sideOffset={8}
            align="end"
            collisionPadding={12}
            className="z-50"
          >
            <Popover.Popup className="w-[19rem] max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white p-4 text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.14)] outline-none dark:bg-neutral-950 dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.14),0_16px_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between gap-4">
                <Popover.Title className="text-balance text-sm font-medium">
                  {label}
                </Popover.Title>
                <Popover.Close
                  aria-label="Close color picker"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full text-neutral-400 outline-none transition-[transform,background-color,color] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-white dark:focus-visible:ring-neutral-300"
                >
                  <LetterXCircle className="size-5" aria-hidden />
                </Popover.Close>
              </div>

              {allowNone && (
                <button
                  type="button"
                  aria-pressed={none}
                  onClick={() => onNoneChange?.(!none)}
                  className={cn(
                    "mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,background-color,color,box-shadow] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300",
                    none &&
                      "bg-neutral-950 text-white shadow-none hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-lg text-neutral-950 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:text-white dark:shadow-[0_0_0_1px_rgba(255,255,255,0.16)]",
                      styles.transparencyGrid,
                    )}
                    aria-hidden
                  >
                    {none && (
                      <span className="flex size-5 items-center justify-center rounded-md bg-white/90 dark:bg-neutral-950/90">
                        <Check className="size-4" />
                      </span>
                    )}
                  </span>
                  No fill
                </button>
              )}

              {allowSameAsText && (
                <button
                  type="button"
                  aria-pressed={sameAsText}
                  onClick={() =>
                    onSameAsTextChange?.(!sameAsText)
                  }
                  className={cn(
                    "mt-4 flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium outline-none shadow-[0_0_0_1px_rgba(0,0,0,0.08)] transition-[transform,background-color,color,box-shadow] duration-150 ease-out hover:bg-neutral-50 active:scale-[0.96] focus-visible:ring-2 focus-visible:ring-neutral-500 dark:shadow-[0_0_0_1px_rgba(255,255,255,0.1)] dark:hover:bg-neutral-900 dark:focus-visible:ring-neutral-300",
                    sameAsText &&
                      "bg-neutral-950 text-white shadow-none hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200",
                  )}
                >
                  <span
                    className="flex size-7 shrink-0 items-center justify-center rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.2)]"
                    style={{
                      backgroundColor: sameAsTextValue ?? value,
                    }}
                    aria-hidden
                  >
                    {sameAsText && (
                      <span className="flex size-5 items-center justify-center rounded-md bg-white/90 text-neutral-950 dark:bg-neutral-950/90 dark:text-white">
                        <Check className="size-4" />
                      </span>
                    )}
                  </span>
                  Same as text
                </button>
              )}

              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
                  <label
                    htmlFor={lightnessId}
                    className="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    Lightness
                  </label>
                  <input
                    id={lightnessId}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={color.l}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        updateChannel(
                          color,
                          "l",
                          Number(event.target.value),
                        ),
                      )
                    }
                    className={cn(styles.range, styles.colorRange)}
                    style={{
                      background: `linear-gradient(to right, oklch(0 0 ${hue}), oklch(0.65 ${color.c} ${hue}), oklch(1 0 ${hue}))`,
                    }}
                  />
                  <output
                    htmlFor={lightnessId}
                    className="text-right font-mono text-[10px] tabular-nums"
                  >
                    {Math.round(color.l * 100)}%
                  </output>
                </div>

                <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
                  <label
                    htmlFor={chromaId}
                    className="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    Chroma
                  </label>
                  <input
                    id={chromaId}
                    type="range"
                    min={0}
                    max={0.37}
                    step={0.005}
                    value={color.c}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        updateChannel(
                          color,
                          "c",
                          Number(event.target.value),
                        ),
                      )
                    }
                    className={cn(styles.range, styles.colorRange)}
                    style={{
                      background: `linear-gradient(to right, oklch(${color.l} 0 ${hue}), oklch(${color.l} 0.37 ${hue}))`,
                    }}
                  />
                  <output
                    htmlFor={chromaId}
                    className="text-right font-mono text-[10px] tabular-nums"
                  >
                    {color.c.toFixed(2)}
                  </output>
                </div>

                <div className="grid grid-cols-[4.5rem_1fr_3rem] items-center gap-3">
                  <label
                    htmlFor={hueId}
                    className="text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    Hue
                  </label>
                  <input
                    id={hueId}
                    type="range"
                    min={0}
                    max={360}
                    step={1}
                    value={hue}
                    disabled={disabled}
                    onChange={(event) =>
                      onChange(
                        updateChannel(
                          color,
                          "h",
                          Number(event.target.value),
                        ),
                      )
                    }
                    className={cn(styles.range, styles.colorRange)}
                    style={{
                      background:
                        "linear-gradient(to right, oklch(0.65 0.2 0), oklch(0.65 0.2 60), oklch(0.65 0.2 120), oklch(0.65 0.2 180), oklch(0.65 0.2 240), oklch(0.65 0.2 300), oklch(0.65 0.2 360))",
                    }}
                  />
                  <output
                    htmlFor={hueId}
                    className="text-right font-mono text-[10px] tabular-nums"
                  >
                    {Math.round(hue)}°
                  </output>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_6.5rem] gap-3">
                <label className="space-y-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    OKLCH
                  </span>
                  <input
                    readOnly
                    disabled={disabled}
                    value={oklchValue}
                    className="min-h-10 w-full rounded-lg bg-neutral-50 px-3 font-mono text-[10px] tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 dark:bg-neutral-900 dark:focus-visible:ring-neutral-300"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    HEX
                  </span>
                  <input
                    key={hexValue}
                    disabled={disabled}
                    defaultValue={hexValue.toUpperCase()}
                    aria-invalid={hexError}
                    onBlur={(event) => commitHex(event.currentTarget)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        commitHex(event.currentTarget);
                      }
                    }}
                    className="min-h-10 w-full rounded-lg bg-neutral-50 px-3 font-mono text-xs uppercase tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 aria-invalid:ring-2 aria-invalid:ring-red-500 dark:bg-neutral-900 dark:focus-visible:ring-neutral-300"
                  />
                </label>
              </div>
              {hexError && (
                <p
                  className="mt-2 text-pretty text-xs text-red-600 dark:text-red-400"
                  role="alert"
                >
                  Use a six-digit HEX value.
                </p>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
