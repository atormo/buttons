import { loadIcon } from "@iconify/react";
import {
  colorToOklch,
  colorToOklchCss,
  colorToOklchCssWithAlpha,
  oklchToHex,
} from "./button-color-utils";
import {
  getBunnyFontUrl,
  getButtonFont,
  getFontStack,
} from "./button-fonts";
import {
  getIconApiUrl,
  getIconStrokeWidth,
  LIBRARY_LABELS,
} from "./button-icons";
import {
  getEffectiveIconColor,
  hasIcon,
  type ButtonConfig,
} from "./button-builder-types";

type GradientKind = "fill" | "stroke";

export const PNG_EXPORT_SCALES = [1, 2, 3, 4] as const;
export type PngExportScale =
  (typeof PNG_EXPORT_SCALES)[number];

const PIXEL_CLIP_PATH =
  "polygon(8px 0, calc(100% - 8px) 0, calc(100% - 8px) 4px, 100% 4px, 100% calc(100% - 4px), calc(100% - 8px) calc(100% - 4px), calc(100% - 8px) 100%, 8px 100%, 8px calc(100% - 4px), 0 calc(100% - 4px), 0 4px, 8px 4px)";

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    red: Number.parseInt(value.slice(0, 2), 16),
    green: Number.parseInt(value.slice(2, 4), 16),
    blue: Number.parseInt(value.slice(4, 6), 16),
  };
}

function colorToHex(color: string) {
  return oklchToHex(colorToOklch(color));
}

export function rgba(hex: string, opacity: number) {
  const { red, green, blue } = hexToRgb(colorToHex(hex));
  return `rgba(${red}, ${green}, ${blue}, ${opacity / 100})`;
}

function alphaHex(opacity: number) {
  return Math.round((opacity / 100) * 255)
    .toString(16)
    .padStart(2, "0");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function getGradientValues(config: ButtonConfig, kind: GradientKind) {
  return kind === "fill"
    ? {
        from: config.fillGradientFrom,
        via: config.fillGradientVia,
        to: config.fillGradientTo,
        viaEnabled: config.fillGradientViaEnabled,
        angle: config.fillGradientAngle,
      }
    : {
        from: config.strokeGradientFrom,
        via: config.strokeGradientVia,
        to: config.strokeGradientTo,
        viaEnabled: config.strokeGradientViaEnabled,
        angle: config.strokeGradientAngle,
      };
}

export function getGradient(
  config: ButtonConfig,
  kind: GradientKind = "stroke",
) {
  const values = getGradientValues(config, kind);
  const color = (value: string) =>
    kind === "fill"
      ? colorToOklchCssWithAlpha(value, config.fillOpacity)
      : colorToOklchCss(value);
  const stops = values.viaEnabled
    ? `${color(values.from)}, ${color(values.via)}, ${color(values.to)}`
    : `${color(values.from)}, ${color(values.to)}`;
  return `linear-gradient(${values.angle}deg in oklch, ${stops})`;
}

function getFillPaint(config: ButtonConfig) {
  if (config.fillMode === "none") return "transparent";
  if (config.fillMode === "gradient") {
    return getGradient(config, "fill");
  }
  return colorToOklchCssWithAlpha(
    config.fill,
    config.fillOpacity,
  );
}

function hasStroke(config: ButtonConfig) {
  return config.strokeMode !== "none" && config.strokeWidth > 0;
}

function getEffectiveStrokeWidth(config: ButtonConfig) {
  return hasStroke(config) ? config.strokeWidth : 0;
}

export function getBoxShadow(config: ButtonConfig) {
  return config.shadowEnabled
    ? `${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${rgba(config.shadowColor, config.shadowOpacity)}`
    : "none";
}

export function getStroke(config: ButtonConfig) {
  return config.strokeMode === "solid" && config.strokeWidth > 0
    ? `${config.strokeWidth}px solid ${colorToOklchCss(config.strokeColor)}`
    : "none";
}

function getTextWidth(config: ButtonConfig) {
  if (!config.label) return 0;
  const weightFactor = 1 + (config.fontWeight - 400) / 4000;
  const italicFactor = config.fontStyle === "italic" ? 1.03 : 1;
  return (
    config.label.length *
    config.fontSize *
    0.56 *
    weightFactor *
    italicFactor
  );
}

export type ButtonTextMetrics = {
  width: number;
  ascent: number;
  descent: number;
};

function getEstimatedTextMetrics(
  config: ButtonConfig,
): ButtonTextMetrics {
  return {
    width: getTextWidth(config),
    ascent: config.fontSize * 0.8,
    descent: config.fontSize * 0.2,
  };
}

async function measureButtonText(
  config: ButtonConfig,
): Promise<ButtonTextMetrics> {
  const estimated = getEstimatedTextMetrics(config);
  if (!config.label) return estimated;

  const font = getButtonFont(config.fontId);

  try {
    await document.fonts.load(
      `${config.fontStyle} ${config.fontWeight} ${config.fontSize}px "${font.family}"`,
    );

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) return estimated;

    context.font = `${config.fontStyle} ${config.fontWeight} ${config.fontSize}px ${getFontStack(font)}`;
    const measured = context.measureText(config.label);

    return {
      width: measured.width || estimated.width,
      ascent:
        measured.actualBoundingBoxAscent || estimated.ascent,
      descent:
        measured.actualBoundingBoxDescent || estimated.descent,
    };
  } catch {
    return estimated;
  }
}

export function getSvgTextBaseline(
  centerY: number,
  metrics: Pick<ButtonTextMetrics, "ascent" | "descent">,
) {
  return centerY + (metrics.ascent - metrics.descent) / 2;
}

export function getPngExportDimensions(
  width: number,
  height: number,
  requestedScale: number,
) {
  const scale = PNG_EXPORT_SCALES.includes(
    requestedScale as PngExportScale,
  )
    ? (requestedScale as PngExportScale)
    : 4;

  return {
    scale,
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    filename: `button@${scale}x.png`,
  };
}

function getButtonMetrics(
  config: ButtonConfig,
  textMetrics = getEstimatedTextMetrics(config),
) {
  const textWidth = textMetrics.width;
  const iconWidth = hasIcon(config.iconName) ? config.iconSize : 0;
  const gap = textWidth > 0 && iconWidth > 0 ? config.iconGap : 0;
  const contentWidth = textWidth + iconWidth + gap;
  const contentHeight = Math.max(
    config.fontSize * 1.25,
    hasIcon(config.iconName) ? config.iconSize : 0,
  );

  return {
    width: Math.ceil(Math.max(24, contentWidth) + config.paddingX * 2),
    height: Math.ceil(contentHeight + config.paddingY * 2),
    textWidth,
    contentWidth,
  };
}

function getPixelPoints(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const cut = Math.min(8, width / 8, height / 3);
  const step = Math.min(4, cut / 2);

  return [
    [x + cut, y],
    [x + width - cut, y],
    [x + width - cut, y + step],
    [x + width, y + step],
    [x + width, y + height - step],
    [x + width - cut, y + height - step],
    [x + width - cut, y + height],
    [x + cut, y + height],
    [x + cut, y + height - step],
    [x, y + height - step],
    [x, y + step],
    [x + cut, y + step],
  ] as const;
}

function getPixelCornerRects(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  return [
    { x: x - 4, y: y - 4, width: 4, height: 4 },
    { x, y: y - 4, width: 8, height: 4 },
    { x: x - 4, y, width: 4, height: 8 },
    { x: x + width, y: y - 4, width: 4, height: 4 },
    { x: x + width - 8, y: y - 4, width: 8, height: 4 },
    { x: x + width, y, width: 4, height: 8 },
    { x: x - 4, y: y + height, width: 4, height: 4 },
    { x, y: y + height, width: 8, height: 4 },
    { x: x - 4, y: y + height - 8, width: 4, height: 8 },
    {
      x: x + width,
      y: y + height,
      width: 4,
      height: 4,
    },
    {
      x: x + width - 8,
      y: y + height,
      width: 8,
      height: 4,
    },
    {
      x: x + width,
      y: y + height - 8,
      width: 4,
      height: 8,
    },
  ] as const;
}

function traceButtonPath(
  context: CanvasRenderingContext2D,
  config: ButtonConfig,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  if (config.cornerStyle === "rounded") {
    context.roundRect(x, y, width, height, radius);
    return;
  }

  const points = getPixelPoints(x, y, width, height);
  const first = points[0];
  context.moveTo(first[0], first[1]);
  for (const point of points.slice(1)) {
    context.lineTo(point[0], point[1]);
  }
  context.closePath();
}

function getContentPositions(
  config: ButtonConfig,
  buttonX: number,
  buttonY: number,
  width: number,
  height: number,
  textMetrics?: ButtonTextMetrics,
) {
  const { textWidth, contentWidth } = getButtonMetrics(
    config,
    textMetrics,
  );
  const contentLeft = buttonX + (width - contentWidth) / 2;
  const gap =
    textWidth > 0 && hasIcon(config.iconName)
      ? config.iconGap
      : 0;

  return {
    iconX:
      config.iconPosition === "left"
        ? contentLeft
        : contentLeft + textWidth + gap,
    iconY: buttonY + (height - config.iconSize) / 2,
    textX:
      config.iconPosition === "left" && hasIcon(config.iconName)
        ? contentLeft + config.iconSize + gap
        : contentLeft,
  };
}

function getGradientCoordinates(
  angle: number,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const radians = ((angle - 90) * Math.PI) / 180;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const radius =
    Math.abs(width * Math.cos(radians)) / 2 +
    Math.abs(height * Math.sin(radians)) / 2;
  const offsetX = Math.cos(radians) * radius;
  const offsetY = Math.sin(radians) * radius;

  return {
    x1: centerX - offsetX,
    y1: centerY - offsetY,
    x2: centerX + offsetX,
    y2: centerY + offsetY,
  };
}

function createCanvasGradient(
  context: CanvasRenderingContext2D,
  config: ButtonConfig,
  kind: GradientKind,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const values = getGradientValues(config, kind);
  const coordinates = getGradientCoordinates(
    values.angle,
    x,
    y,
    width,
    height,
  );
  const gradient = context.createLinearGradient(
    coordinates.x1,
    coordinates.y1,
    coordinates.x2,
    coordinates.y2,
  );
  const color = (value: string) =>
    kind === "fill"
      ? rgba(value, config.fillOpacity)
      : colorToHex(value);
  gradient.addColorStop(0, color(values.from));
  if (values.viaEnabled) {
    gradient.addColorStop(0.5, color(values.via));
  }
  gradient.addColorStop(1, color(values.to));
  return gradient;
}

async function createIconMarkup(
  config: ButtonConfig,
  x: number,
  y: number,
) {
  if (!hasIcon(config.iconName)) return "";

  try {
    const icon = await loadIcon(config.iconName);
    const iconWidth = icon.width ?? 16;
    const iconHeight = icon.height ?? 16;
    const strokeWidth = getIconStrokeWidth(
      config.iconLibrary,
      config.iconStyle,
    );
    const iconColor = getEffectiveIconColor(config);
    const body = icon.body
      .replaceAll("currentColor", colorToHex(iconColor))
      .replace(
        /stroke-width="[^"]+"/g,
        strokeWidth ? `stroke-width="${strokeWidth}"` : "$&",
      );

    return `<svg xmlns="http://www.w3.org/2000/svg" x="${x}" y="${y}" width="${config.iconSize}" height="${config.iconSize}" viewBox="0 0 ${iconWidth} ${iconHeight}" aria-hidden="true">${body}</svg>`;
  } catch {
    return "";
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function createSvgGradientDefinition(
  config: ButtonConfig,
  kind: GradientKind,
  id: string,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const values = getGradientValues(config, kind);
  const coordinates = getGradientCoordinates(
    values.angle,
    x,
    y,
    width,
    height,
  );
  const stopOpacity =
    kind === "fill"
      ? ` stop-opacity="${config.fillOpacity / 100}"`
      : "";
  return `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${coordinates.x1}" y1="${coordinates.y1}" x2="${coordinates.x2}" y2="${coordinates.y2}"><stop offset="0%" stop-color="${colorToHex(values.from)}"${stopOpacity}/>${values.viaEnabled ? `<stop offset="50%" stop-color="${colorToHex(values.via)}"${stopOpacity}/>` : ""}<stop offset="100%" stop-color="${colorToHex(values.to)}"${stopOpacity}/></linearGradient>`;
}

export async function createSvgMarkup(
  config: ButtonConfig,
  providedTextMetrics?: ButtonTextMetrics,
) {
  const textMetrics =
    providedTextMetrics ?? (await measureButtonText(config));
  const { width, height, textWidth } = getButtonMetrics(
    config,
    textMetrics,
  );
  const font = getButtonFont(config.fontId);
  const strokeWidth = getEffectiveStrokeWidth(config);
  const shadowMargin = Math.max(
    config.cornerStyle === "pixel" ? 4 : 0,
    config.shadowEnabled
      ? Math.ceil(
          config.shadowBlur +
            Math.max(
              Math.abs(config.shadowX),
              Math.abs(config.shadowY),
            ),
        )
      : 0,
  );
  const canvasWidth = width + shadowMargin * 2;
  const canvasHeight = height + shadowMargin * 2;
  const rectX = shadowMargin + strokeWidth / 2;
  const rectY = shadowMargin + strokeWidth / 2;
  const rectWidth = width - strokeWidth;
  const rectHeight = height - strokeWidth;
  const { iconX, iconY, textX } = getContentPositions(
    config,
    shadowMargin,
    shadowMargin,
    width,
    height,
    textMetrics,
  );
  const icon = await createIconMarkup(config, iconX, iconY);
  const fillGradient =
    config.fillMode === "gradient"
      ? createSvgGradientDefinition(
          config,
          "fill",
          "fillGradient",
          rectX,
          rectY,
          rectWidth,
          rectHeight,
        )
      : "";
  const strokeGradient =
    config.strokeMode === "gradient" && strokeWidth > 0
      ? createSvgGradientDefinition(
          config,
          "stroke",
          "strokeGradient",
          rectX,
          rectY,
          rectWidth,
          rectHeight,
        )
      : "";
  const filter = config.shadowEnabled
    ? `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%"><feDropShadow dx="${config.shadowX}" dy="${config.shadowY}" stdDeviation="${config.shadowBlur / 2}" flood-color="${colorToHex(config.shadowColor)}" flood-opacity="${config.shadowOpacity / 100}"/></filter>`
    : "";
  const fill =
    config.fillMode === "none"
      ? "none"
      : config.fillMode === "gradient"
        ? "url(#fillGradient)"
        : colorToHex(config.fill);
  const stroke =
    config.strokeMode === "none" || strokeWidth === 0
      ? "none"
      : config.strokeMode === "gradient"
        ? "url(#strokeGradient)"
        : colorToHex(config.strokeColor);
  const fillOpacity =
    config.fillMode === "solid" && config.fillOpacity < 100
      ? ` fill-opacity="${config.fillOpacity / 100}"`
      : "";
  const pixelCorners =
    config.cornerStyle === "pixel"
      ? `<g fill="#0f172a">${getPixelCornerRects(shadowMargin, shadowMargin, width, height).map((rect) => `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}"/>`).join("")}</g>`
      : "";
  const innerPixelX = rectX + strokeWidth / 2;
  const innerPixelY = rectY + strokeWidth / 2;
  const innerPixelWidth = Math.max(0, rectWidth - strokeWidth);
  const innerPixelHeight = Math.max(0, rectHeight - strokeWidth);
  const pixelClip =
    config.cornerStyle === "pixel"
      ? `<clipPath id="pixelSurface"><polygon points="${getPixelPoints(innerPixelX, innerPixelY, innerPixelWidth, innerPixelHeight).map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ")}"/></clipPath>`
      : "";
  const pixelDetail =
    config.cornerStyle === "pixel" && config.fillMode !== "none"
      ? `<g clip-path="url(#pixelSurface)"><rect x="${innerPixelX}" y="${innerPixelY}" width="${innerPixelWidth}" height="4" fill="#ffffff" fill-opacity="0.62"/><rect x="${innerPixelX}" y="${innerPixelY + Math.max(0, innerPixelHeight - 6)}" width="${innerPixelWidth}" height="6" fill="#0f172a" fill-opacity="0.24"/></g>`
      : "";
  const shape =
    config.cornerStyle === "pixel"
      ? `<polygon points="${getPixelPoints(rectX, rectY, rectWidth, rectHeight).map(([pointX, pointY]) => `${pointX},${pointY}`).join(" ")}" fill="${fill}"${fillOpacity} stroke="${stroke}" stroke-width="${strokeWidth}"${config.shadowEnabled ? ' filter="url(#shadow)"' : ""}/>`
      : `<rect x="${rectX}" y="${rectY}" width="${rectWidth}" height="${rectHeight}" rx="${Math.max(0, config.radius - strokeWidth / 2)}" fill="${fill}"${fillOpacity} stroke="${stroke}" stroke-width="${strokeWidth}"${config.shadowEnabled ? ' filter="url(#shadow)"' : ""}/>`;
  const textBaseline = getSvgTextBaseline(
    canvasHeight / 2,
    textMetrics,
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}">
  <defs><style>@import url('${getBunnyFontUrl(font, config.fontWeight, config.fontStyle)}');</style>${filter}${fillGradient}${strokeGradient}${pixelClip}</defs>
  ${pixelCorners}
  ${shape}
  ${pixelDetail}
  ${icon}
  ${textWidth > 0 ? `<text x="${hasIcon(config.iconName) ? textX : canvasWidth / 2}" y="${textBaseline}" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs" text-anchor="${hasIcon(config.iconName) ? "start" : "middle"}" fill="${colorToHex(config.textColor)}" font-family="${escapeXml(font.family)}, ${font.fallback}" font-size="${config.fontSize}" font-style="${config.fontStyle}" font-weight="${config.fontWeight}" xml:space="preserve">${escapeXml(config.label)}</text>` : ""}
</svg>`;
}

export async function exportSvg(config: ButtonConfig) {
  downloadBlob(
    new Blob([await createSvgMarkup(config)], {
      type: "image/svg+xml;charset=utf-8",
    }),
    "button.svg",
  );
}

async function loadIconImage(markup: string) {
  const blob = new Blob([markup], {
    type: "image/svg+xml;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const image = new window.Image();

  return new Promise<HTMLImageElement>((resolve, reject) => {
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("The selected icon could not be rendered."));
    };
    image.src = url;
  });
}

export async function exportPng(
  config: ButtonConfig,
  requestedScale: PngExportScale = 4,
) {
  const textMetrics = await measureButtonText(config);
  const { width, height, textWidth } = getButtonMetrics(
    config,
    textMetrics,
  );
  const font = getButtonFont(config.fontId);
  const strokeWidth = getEffectiveStrokeWidth(config);
  const shadowMargin = Math.max(
    config.cornerStyle === "pixel" ? 4 : 0,
    config.shadowEnabled
      ? Math.ceil(
          config.shadowBlur +
            Math.max(
              Math.abs(config.shadowX),
              Math.abs(config.shadowY),
            ),
        )
      : 0,
  );
  const canvasWidth = width + shadowMargin * 2;
  const canvasHeight = height + shadowMargin * 2;
  const exportDimensions = getPngExportDimensions(
    canvasWidth,
    canvasHeight,
    requestedScale,
  );
  const canvas = document.createElement("canvas");
  canvas.width = exportDimensions.width;
  canvas.height = exportDimensions.height;

  const context = canvas.getContext("2d");
  if (!context) return;

  context.scale(exportDimensions.scale, exportDimensions.scale);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  const x = shadowMargin + strokeWidth / 2;
  const y = shadowMargin + strokeWidth / 2;
  const rectWidth = width - strokeWidth;
  const rectHeight = height - strokeWidth;
  const { iconX, iconY, textX } = getContentPositions(
    config,
    shadowMargin,
    shadowMargin,
    width,
    height,
    textMetrics,
  );

  if (config.shadowEnabled) {
    context.shadowColor = rgba(
      config.shadowColor,
      config.shadowOpacity,
    );
    context.shadowBlur = config.shadowBlur;
    context.shadowOffsetX = config.shadowX;
    context.shadowOffsetY = config.shadowY;
  }

  if (config.cornerStyle === "pixel") {
    context.save();
    context.shadowColor = "transparent";
    context.fillStyle = "#0f172a";
    for (const rect of getPixelCornerRects(
      shadowMargin,
      shadowMargin,
      width,
      height,
    )) {
      context.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    context.restore();
  }

  traceButtonPath(
    context,
    config,
    x,
    y,
    rectWidth,
    rectHeight,
    Math.max(0, config.radius - strokeWidth / 2),
  );
  if (config.fillMode !== "none") {
    context.fillStyle =
      config.fillMode === "gradient"
        ? createCanvasGradient(
            context,
            config,
            "fill",
            x,
            y,
            rectWidth,
            rectHeight,
          )
        : rgba(config.fill, config.fillOpacity);
    context.fill();
    context.shadowColor = "transparent";
  }

  if (
    config.cornerStyle === "pixel" &&
    config.fillMode !== "none"
  ) {
    context.save();
    traceButtonPath(
      context,
      config,
      x,
      y,
      rectWidth,
      rectHeight,
      0,
    );
    context.clip();
    context.fillStyle = "rgba(255, 255, 255, 0.62)";
    context.fillRect(x, y, rectWidth, 4);
    context.fillStyle = "rgba(15, 23, 42, 0.24)";
    context.fillRect(x, y + rectHeight - 6, rectWidth, 6);
    context.restore();
  }

  if (strokeWidth > 0) {
    context.strokeStyle =
      config.strokeMode === "gradient"
        ? createCanvasGradient(
            context,
            config,
            "stroke",
            x,
            y,
            rectWidth,
            rectHeight,
          )
        : colorToHex(config.strokeColor);
    context.lineWidth = strokeWidth;
    context.stroke();
  }
  context.shadowColor = "transparent";

  if (hasIcon(config.iconName)) {
    const iconMarkup = await createIconMarkup(config, 0, 0);
    if (iconMarkup) {
      try {
        const iconImage = await loadIconImage(iconMarkup);
        context.drawImage(
          iconImage,
          iconX,
          iconY,
          config.iconSize,
          config.iconSize,
        );
      } catch {
        // Keep the text and button export usable if the icon API fails.
      }
    }
  }

  if (textWidth > 0) {
    context.fillStyle = colorToHex(config.textColor);
    context.font = `${config.fontStyle} ${config.fontWeight} ${config.fontSize}px ${getFontStack(font)}`;
    context.textAlign = hasIcon(config.iconName) ? "left" : "center";
    context.textBaseline = "middle";
    context.fillText(
      config.label,
      hasIcon(config.iconName) ? textX : canvasWidth / 2,
      canvasHeight / 2,
    );
  }

  canvas.toBlob((blob) => {
    if (blob) downloadBlob(blob, exportDimensions.filename);
  }, "image/png");
}

export function getTailwindClasses(config: ButtonConfig) {
  const iconColor = getEffectiveIconColor(config);
  const fillPaint = getFillPaint(config);
  const fillClass =
    config.fillMode === "none"
      ? "bg-transparent"
      : `bg-[${fillPaint.replaceAll(" ", "_")}]`;
  const shadowClass =
    config.cornerStyle === "pixel"
      ? `[box-shadow:inset_0_4px_0_rgb(255_255_255_/_0.62),inset_0_-6px_0_rgb(15_23_42_/_0.24)]${config.shadowEnabled ? ` [filter:drop-shadow(${`${config.shadowX}px ${config.shadowY}px ${config.shadowBlur}px ${rgba(config.shadowColor, config.shadowOpacity)}`.replaceAll(" ", "_")})]` : ""}`
      : config.shadowEnabled
        ? `shadow-[${config.shadowX}px_${config.shadowY}px_${config.shadowBlur}px_${colorToHex(config.shadowColor)}${alphaHex(config.shadowOpacity)}]`
        : "shadow-none";
  const strokeClass =
    config.strokeMode === "none" || config.strokeWidth === 0
      ? "border-0"
      : config.strokeMode === "gradient"
        ? `relative border-[${config.strokeWidth}px] border-transparent before:pointer-events-none before:absolute before:-inset-[${config.strokeWidth}px] before:rounded-[inherit] before:p-[${config.strokeWidth}px] before:bg-[${getGradient(config).replaceAll(" ", "_")}] before:[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)] before:[mask-composite:exclude]`
        : `border-[${config.strokeWidth}px] border-[${colorToOklchCss(config.strokeColor)}]`;
  const italicClass =
    config.fontStyle === "italic" ? "italic" : "not-italic";
  const iconColorClass = hasIcon(config.iconName)
    ? `[&>svg]:text-[${colorToOklchCss(iconColor)}]`
    : "";
  const cornerClass =
    config.cornerStyle === "pixel"
      ? `rounded-none [clip-path:${PIXEL_CLIP_PATH.replaceAll(" ", "_")}]`
      : `rounded-[${config.radius}px]`;

  return `inline-flex items-center justify-center gap-[${config.iconGap}px] ${cornerClass} ${strokeClass} ${fillClass} px-[${config.paddingX}px] py-[${config.paddingY}px] text-[${config.fontSize}px] font-[${config.fontWeight}] ${italicClass} text-[${colorToOklchCss(config.textColor)}] ${iconColorClass} [font-family:'${getButtonFont(config.fontId).family}'] ${shadowClass}`;
}

export function getCssCode(config: ButtonConfig) {
  const font = getButtonFont(config.fontId);
  const fillPaint = getFillPaint(config);
  const iconColor = getEffectiveIconColor(config);
  const boxShadow = getBoxShadow(config);
  const strokeWidth = getEffectiveStrokeWidth(config);
  const border =
    config.strokeMode === "none" || strokeWidth === 0
      ? "border: 0;"
      : config.strokeMode === "gradient"
        ? `border: ${strokeWidth}px solid transparent;`
        : `border: ${getStroke(config)};`;
  const background =
    config.strokeMode === "gradient" && strokeWidth > 0
      ? `background: ${fillPaint} padding-box, ${getGradient(config)} border-box;`
      : `background: ${fillPaint};`;
  const iconCss = hasIcon(config.iconName)
    ? `\n.button__icon { width: ${config.iconSize}px; height: ${config.iconSize}px; flex: none; background: ${colorToOklchCss(iconColor)}; -webkit-mask: url("${getIconApiUrl(config.iconName)}") center / contain no-repeat; mask: url("${getIconApiUrl(config.iconName)}") center / contain no-repeat; }`
    : "";
  const cornerCss =
    config.cornerStyle === "pixel"
      ? `border-radius: 0;
  clip-path: ${PIXEL_CLIP_PATH};`
      : `border-radius: ${config.radius}px;`;
  const shadowCss =
    config.cornerStyle === "pixel"
      ? `box-shadow: inset 0 4px 0 rgb(255 255 255 / 0.62), inset 0 -6px 0 rgb(15 23 42 / 0.24);${config.shadowEnabled ? `\n  filter: drop-shadow(${boxShadow});` : ""}`
      : `box-shadow: ${boxShadow};`;

  return `@import url("${getBunnyFontUrl(font, config.fontWeight, config.fontStyle)}");

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${config.iconGap}px;
  padding: ${config.paddingY}px ${config.paddingX}px;
  ${border}
  ${cornerCss}
  ${background}
  color: ${colorToOklchCss(config.textColor)};
  ${shadowCss}
  font-family: ${getFontStack(font)};
  font-size: ${config.fontSize}px;
  font-style: ${config.fontStyle};
  font-weight: ${config.fontWeight};
  line-height: 1.25;
}${iconCss}`;
}

export function getReactCode(config: ButtonConfig) {
  const iconColor = getEffectiveIconColor(config);
  const iconJsx = hasIcon(config.iconName)
    ? `<Icon icon="${config.iconName}" width={${config.iconSize}} height={${config.iconSize}} style={{ color: "${colorToOklchCss(iconColor)}"${config.iconLibrary === "lucide" ? `, strokeWidth: ${config.iconStyle}` : ""} }} aria-hidden />`
    : "";
  const content =
    config.iconPosition === "left"
      ? `${iconJsx}{${JSON.stringify(config.label)}}`
      : `{${JSON.stringify(config.label)}}${iconJsx}`;
  const iconImport = hasIcon(config.iconName)
    ? 'import { Icon } from "@iconify/react";\n\n'
    : "";

  return `${iconImport}export function CustomButton() {\n  return <button type="button" className="button">${content}</button>;\n}`;
}

export function getHtmlCode(config: ButtonConfig) {
  const icon = hasIcon(config.iconName)
    ? '<span class="button__icon" aria-hidden="true"></span>'
    : "";
  const content =
    config.iconPosition === "left"
      ? `${icon}${escapeXml(config.label)}`
      : `${escapeXml(config.label)}${icon}`;

  return `<button class="button" type="button">${content}</button>`;
}

export function getPrompt(config: ButtonConfig) {
  const font = getButtonFont(config.fontId);
  const iconColor = getEffectiveIconColor(config);
  const fill =
    config.fillMode === "none"
      ? "transparent"
      : config.fillMode === "solid"
        ? colorToOklchCss(config.fill)
        : getGradient(config, "fill");
  const stroke =
    config.strokeMode === "none"
      ? "none"
      : config.strokeMode === "solid"
        ? `${config.strokeWidth}px ${colorToOklchCss(config.strokeColor)}`
        : `${config.strokeWidth}px ${getGradient(config)}`;
  const icon = hasIcon(config.iconName)
    ? `${config.iconName} from ${LIBRARY_LABELS[config.iconLibrary]}, ${config.iconSize}px, ${colorToOklchCss(iconColor)}, on the ${config.iconPosition}, with a ${config.iconGap}px gap`
    : "none";
  const corners =
    config.cornerStyle === "pixel"
      ? "pixel-stepped corners with black corner pixels protruding 4px, a hard 4px top highlight, and a 6px lower shade"
      : `${config.radius}px radius`;

  return `Create an accessible button component with these exact visual settings:
- Label: "${config.label}"
- Fill: ${fill}
- Stroke: ${stroke}
- Corners: ${corners}
- Padding: ${config.paddingY}px vertical and ${config.paddingX}px horizontal
- Type: ${font.family}, ${config.fontWeight} ${config.fontStyle}, ${config.fontSize}px, ${colorToOklchCss(config.textColor)}
- Icon: ${icon}
- Shadow: ${getBoxShadow(config)}

Use semantic button markup, preserve keyboard focus states, and return reusable HTML and plain CSS first. If a framework is already present, adapt the same values without changing the design.`;
}
