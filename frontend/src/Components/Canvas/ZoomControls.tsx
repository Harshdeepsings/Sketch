import React from "react";
import { Plus, Minus, Maximize } from "lucide-react";

interface ZoomControlsProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitContent: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitContent,
}) => {
  const zoomPercentage = Math.round(scale * 100);

  return (
    <div className="fixed bottom-5 right-5 z-20 flex items-center gap-0.5 p-1 rounded-lg bg-(--bg-surface) border border-(--border-strong) shadow-md backdrop-blur-md transition-all select-none text-xs font-mono">
      <button
        onClick={onZoomOut}
        className="w-6 h-6 flex items-center justify-center rounded text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors active:translate-y-px"
        title="Zoom Out (Ctrl+-)"
      >
        <Minus className="w-3 h-3" />
      </button>

      <button
        onClick={onResetZoom}
        className="px-2 py-0.5 rounded text-[11px] font-mono text-(--text-primary) hover:bg-(--border-subtle) transition-colors min-w-[48px] text-center"
        title="Reset Zoom to 100%"
      >
        {zoomPercentage}%
      </button>

      <button
        onClick={onZoomIn}
        className="w-6 h-6 flex items-center justify-center rounded text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors active:translate-y-px"
        title="Zoom In (Ctrl++)"
      >
        <Plus className="w-3 h-3" />
      </button>

      <div className="w-[1px] h-3.5 bg-(--border-subtle) mx-0.5" />

      <button
        onClick={onFitContent}
        className="w-6 h-6 flex items-center justify-center rounded text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors active:translate-y-px"
        title="Fit Drawing to Screen"
      >
        <Maximize className="w-3 h-3" />
      </button>
    </div>
  );
};
export default ZoomControls;
