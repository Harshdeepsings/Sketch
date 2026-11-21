import React, { useState } from "react";
import { X, Download, FileImage, Code, FileText } from "lucide-react";
import type { CanvasElement, ExportOptions } from "../../types/canvas";
import { exportToPNG, exportToSVG, exportToPDF, triggerDownload } from "../../services/export";
import { useTheme } from "../../context/ThemeContext";
import { Button } from "../UI/Button";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageRef: any;
  elements: CanvasElement[];
  drawingTitle: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  stageRef,
  elements,
  drawingTitle,
}) => {
  const { theme } = useTheme();
  const [format, setFormat] = useState<"png" | "svg" | "pdf">("png");
  const [scale, setScale] = useState<number>(2);
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>(
    drawingTitle ? drawingTitle.toLowerCase().replace(/\s+/g, "-") : "drawing"
  );
  const [exporting, setExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setExporting(true);
    const options: ExportOptions = {
      format,
      scale,
      transparentBg,
      quality: 1,
      name: filename || "drawing",
    };

    try {
      if (format === "png") {
        if (stageRef.current) {
          const dataUrl = exportToPNG(stageRef.current, elements, options);
          triggerDownload(dataUrl, `${options.name}.png`);
        }
      } else if (format === "svg") {
        const svgContent = exportToSVG(elements, options, theme === "dark");
        const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${options.name}.svg`);
        URL.revokeObjectURL(url);
      } else if (format === "pdf") {
        if (stageRef.current) {
          await exportToPDF(stageRef.current, elements, options, options.name);
        }
      }
      onClose();
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export drawing. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in select-none">
      <div className="w-full max-w-sm rounded-xl bg-(--bg-surface) border border-(--border-strong) shadow-2xl p-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded text-(--text-muted) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <span className="text-[10px] font-mono uppercase tracking-wider text-(--accent-primary) font-semibold">
            OUTPUT SPEC
          </span>
          <h3 className="text-base font-bold text-(--text-primary)">
            Export Drawing
          </h3>
        </div>

        {/* Format Selector Pills */}
        <div className="grid grid-cols-3 gap-2 mb-4 font-mono">
          <button
            type="button"
            onClick={() => setFormat("png")}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
              format === "png"
                ? "border-(--accent-primary) bg-(--accent-primary)/10 text-(--accent-primary) font-semibold"
                : "border-(--border-subtle) hover:bg-(--border-subtle) text-(--text-secondary)"
            }`}
          >
            <FileImage className="w-4 h-4 mb-1" />
            <span className="text-xs">PNG</span>
            <span className="text-[9px] text-(--text-muted)">Raster</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat("svg")}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
              format === "svg"
                ? "border-(--accent-primary) bg-(--accent-primary)/10 text-(--accent-primary) font-semibold"
                : "border-(--border-subtle) hover:bg-(--border-subtle) text-(--text-secondary)"
            }`}
          >
            <Code className="w-4 h-4 mb-1" />
            <span className="text-xs">SVG</span>
            <span className="text-[9px] text-(--text-muted)">Vector</span>
          </button>

          <button
            type="button"
            onClick={() => setFormat("pdf")}
            className={`flex flex-col items-center justify-center p-2.5 rounded-lg border transition-all ${
              format === "pdf"
                ? "border-(--accent-primary) bg-(--accent-primary)/10 text-(--accent-primary) font-semibold"
                : "border-(--border-subtle) hover:bg-(--border-subtle) text-(--text-secondary)"
            }`}
          >
            <FileText className="w-4 h-4 mb-1" />
            <span className="text-xs">PDF</span>
            <span className="text-[9px] text-(--text-muted)">Document</span>
          </button>
        </div>

        {/* Options Form */}
        <div className="space-y-3 mb-5 font-mono">
          <div>
            <label className="text-[10px] uppercase text-(--text-muted) block mb-1">
              File Name
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-(--bg-surface-elevated) border border-(--border-strong) rounded px-2.5 py-1.5 text-xs text-(--text-primary) focus-ring"
              placeholder="drawing-title"
            />
          </div>

          {format === "png" && (
            <div>
              <label className="text-[10px] uppercase text-(--text-muted) block mb-1">
                Resolution Factor
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setScale(s)}
                    className={`py-1 rounded text-[11px] border transition-all ${
                      scale === s
                        ? "border-(--accent-primary) bg-(--accent-primary) text-white font-semibold"
                        : "border-(--border-subtle) text-(--text-secondary) hover:bg-(--border-subtle)"
                    }`}
                  >
                    {s}x {s === 2 && "(Retina)"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(format === "png" || format === "svg") && (
            <label className="flex items-center gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={transparentBg}
                onChange={(e) => setTransparentBg(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-(--accent-primary)"
              />
              <span className="text-xs text-(--text-secondary)">
                Transparent background
              </span>
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-(--border-subtle)">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
            startIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download {format.toUpperCase()}
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ExportModal;
