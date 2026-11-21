import { jsPDF } from "jspdf";
import type { CanvasElement, ExportOptions } from "../types/canvas";

export function computeDrawingBounds(elements: CanvasElement[], padding = 40): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  if (elements.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  elements.forEach((el) => {
    let elMinX = el.x;
    let elMinY = el.y;
    let elMaxX = el.x;
    let elMaxY = el.y;

    if (el.type === "rect" || el.type === "text") {
      const w = el.width || 100;
      const h = el.height || 40;
      elMaxX = el.x + w;
      elMaxY = el.y + h;
    } else if (el.type === "circle") {
      const rx = el.radiusX || 40;
      const ry = el.radiusY || rx;
      elMinX = el.x - rx;
      elMinY = el.y - ry;
      elMaxX = el.x + rx;
      elMaxY = el.y + ry;
    } else if (el.type === "line" || el.type === "arrow" || el.type === "freehand") {
      if (el.points && el.points.length >= 2) {
        for (let i = 0; i < el.points.length; i += 2) {
          const px = el.points[i] ?? 0;
          const py = el.points[i + 1] ?? 0;
          elMinX = Math.min(elMinX, el.x + px);
          elMinY = Math.min(elMinY, el.y + py);
          elMaxX = Math.max(elMaxX, el.x + px);
          elMaxY = Math.max(elMaxY, el.y + py);
        }
      }
    }

    minX = Math.min(minX, elMinX);
    minY = Math.min(minY, elMinY);
    maxX = Math.max(maxX, elMaxX);
    maxY = Math.max(maxY, elMaxY);
  });

  minX = Math.floor(minX - padding);
  minY = Math.floor(minY - padding);
  maxX = Math.ceil(maxX + padding);
  maxY = Math.ceil(maxY + padding);

  const width = Math.max(200, maxX - minX);
  const height = Math.max(200, maxY - minY);

  return { minX, minY, maxX, maxY, width, height };
}

// PNG Export using Konva stage rendering
export function exportToPNG(
  stage: any,
  elements: CanvasElement[],
  options: ExportOptions
): string {
  const bounds = computeDrawingBounds(elements, 40);

  // Remember previous stage transform
  const prevScale = stage.scaleX();
  const prevPos = stage.position();

  const pixelRatio = Math.max(1, Math.min(4, options.scale || 2));

  const dataUrl = stage.toDataURL({
    x: bounds.minX * prevScale + prevPos.x,
    y: bounds.minY * prevScale + prevPos.y,
    width: bounds.width * prevScale,
    height: bounds.height * prevScale,
    pixelRatio: pixelRatio / prevScale,
    mimeType: "image/png",
  });

  return dataUrl;
}

// Trigger browser download of a data URI or blob
export function triggerDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// SVG Vector Export
export function exportToSVG(
  elements: CanvasElement[],
  options: ExportOptions,
  isDark = true
): string {
  const bounds = computeDrawingBounds(elements, 40);
  const bgColor = options.transparentBg
    ? "none"
    : isDark
    ? "#0A0915"
    : "#F4F8FC";

  let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}" width="${bounds.width}" height="${bounds.height}">
  ${!options.transparentBg ? `<rect x="${bounds.minX}" y="${bounds.minY}" width="${bounds.width}" height="${bounds.height}" fill="${bgColor}" />` : ""}`;

  elements.forEach((el) => {
    const stroke = el.stroke || "#E2E8F0";
    const strokeWidth = el.strokeWidth || 2;
    const dashAttr =
      el.strokeStyle === "dashed"
        ? 'stroke-dasharray="8,8"'
        : el.strokeStyle === "dotted"
        ? 'stroke-dasharray="3,5"'
        : "";
    const fill = el.fill && el.fill !== "transparent" ? el.fill : "none";
    const opacity = el.opacity !== undefined ? el.opacity : 1;
    const transform = el.rotation ? `transform="rotate(${el.rotation} ${el.x} ${el.y})"` : "";

    if (el.type === "rect") {
      const w = el.width || 100;
      const h = el.height || 60;
      svgContent += `
  <rect x="${el.x}" y="${el.y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr} opacity="${opacity}" ${transform} />`;
    } else if (el.type === "circle") {
      const rx = el.radiusX || 40;
      const ry = el.radiusY || rx;
      svgContent += `
  <ellipse cx="${el.x}" cy="${el.y}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr} opacity="${opacity}" ${transform} />`;
    } else if (el.type === "line" && el.points && el.points.length >= 4) {
      const x1 = el.x + el.points[0]!;
      const y1 = el.y + el.points[1]!;
      const x2 = el.x + el.points[2]!;
      const y2 = el.y + el.points[3]!;
      svgContent += `
  <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr} stroke-linecap="round" opacity="${opacity}" ${transform} />`;
    } else if (el.type === "arrow" && el.points && el.points.length >= 4) {
      const x1 = el.x + el.points[0]!;
      const y1 = el.y + el.points[1]!;
      const x2 = el.x + el.points[2]!;
      const y2 = el.y + el.points[3]!;

      // Arrow head calculations
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 12;
      const arrowP1X = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const arrowP1Y = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const arrowP2X = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const arrowP2Y = y2 - headLen * Math.sin(angle + Math.PI / 6);

      svgContent += `
  <g opacity="${opacity}" ${transform}>
    <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${strokeWidth}" ${dashAttr} stroke-linecap="round" />
    <polygon points="${x2},${y2} ${arrowP1X},${arrowP1Y} ${arrowP2X},${arrowP2Y}" fill="${stroke}" />
  </g>`;
    } else if (el.type === "freehand" && el.points && el.points.length >= 2) {
      let d = `M ${el.x + el.points[0]!} ${el.y + el.points[1]!}`;
      for (let i = 2; i < el.points.length; i += 2) {
        d += ` L ${el.x + el.points[i]!} ${el.y + el.points[i + 1]!}`;
      }
      svgContent += `
  <path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}" ${transform} />`;
    } else if (el.type === "text" && el.text) {
      const fontSize = el.fontSize || 18;
      const fontFamily = el.fontFamily || "sans-serif";
      const sanitizedText = el.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      svgContent += `
  <text x="${el.x}" y="${el.y + fontSize}" font-size="${fontSize}" font-family="${fontFamily}" fill="${stroke}" opacity="${opacity}" ${transform}>${sanitizedText}</text>`;
    }
  });

  svgContent += `
</svg>`;

  return svgContent;
}

// PDF Export using jsPDF
export async function exportToPDF(
  stage: any,
  elements: CanvasElement[],
  options: ExportOptions,
  title = "Drawing"
): Promise<void> {
  const bounds = computeDrawingBounds(elements, 40);
  const pngDataUrl = exportToPNG(stage, elements, {
    ...options,
    format: "png",
    scale: 2,
    transparentBg: false,
  });

  const isLandscape = bounds.width > bounds.height;
  const pdf = new jsPDF({
    orientation: isLandscape ? "landscape" : "portrait",
    unit: "pt",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 36; // 0.5 inch margins
  const availWidth = pageWidth - margin * 2;
  const availHeight = pageHeight - margin * 2;

  const widthRatio = availWidth / bounds.width;
  const heightRatio = availHeight / bounds.height;
  const scale = Math.min(widthRatio, heightRatio, 1);

  const renderWidth = bounds.width * scale;
  const renderHeight = bounds.height * scale;

  const posX = margin + (availWidth - renderWidth) / 2;
  const posY = margin + (availHeight - renderHeight) / 2;

  pdf.addImage(pngDataUrl, "PNG", posX, posY, renderWidth, renderHeight);
  pdf.save(`${options.name || title}.pdf`);
}
