import React from "react";
import {
  MousePointer,
  Hand,
  PenTool,
  Square,
  Circle,
  Minus,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Sparkles,
} from "lucide-react";
import type { ToolType } from "../../types/canvas";

interface ToolbarProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onOpenLibrary?: () => void;
  readOnly?: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onOpenLibrary,
  readOnly = false,
}) => {
  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: "select", label: "Select", icon: <MousePointer className="w-3.5 h-3.5" />, shortcut: "V" },
    { id: "hand", label: "Hand / Pan", icon: <Hand className="w-3.5 h-3.5" />, shortcut: "H" },
    { id: "freehand", label: "Pencil", icon: <PenTool className="w-3.5 h-3.5" />, shortcut: "P" },
    { id: "rect", label: "Rectangle", icon: <Square className="w-3.5 h-3.5" />, shortcut: "R" },
    { id: "circle", label: "Circle", icon: <Circle className="w-3.5 h-3.5" />, shortcut: "C" },
    { id: "line", label: "Line", icon: <Minus className="w-3.5 h-3.5" />, shortcut: "L" },
    { id: "arrow", label: "Arrow", icon: <ArrowRight className="w-3.5 h-3.5" />, shortcut: "A" },
    { id: "text", label: "Text", icon: <Type className="w-3.5 h-3.5" />, shortcut: "T" },
    { id: "eraser", label: "Eraser", icon: <Eraser className="w-3.5 h-3.5" />, shortcut: "E" },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--border-strong)] shadow-2xl backdrop-blur-md transition-all select-none">
      {/* Primary Tool Buttons */}
      <div className="flex items-center gap-1">
        {tools.map((t) => {
          const isActive = currentTool === t.id;
          const isDisabled = readOnly && t.id !== "select" && t.id !== "hand";

          return (
            <button
              key={t.id}
              onClick={() => !isDisabled && onSelectTool(t.id)}
              disabled={isDisabled}
              title={`${t.label} (${t.shortcut})`}
              className={`relative group flex items-center justify-center w-9 h-9 rounded-xl transition-all ${
                isActive
                  ? "bg-[var(--accent-primary)] text-white shadow-md scale-105"
                  : isDisabled
                  ? "opacity-30 cursor-not-allowed text-[var(--text-muted)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
              }`}
            >
              {t.icon}
              {/* Tooltip on hover */}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-surface-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md">
                {t.label} [{t.shortcut}]
              </span>
            </button>
          );
        })}
      </div>

      {onOpenLibrary && !readOnly && (
        <>
          <div className="w-[1px] h-5 bg-[var(--border-subtle)] mx-0.5" />
          <button
            onClick={onOpenLibrary}
            title="Library Templates"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--accent-primary)] hover:bg-[var(--border-subtle)] transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {!readOnly && (
        <>
          <div className="w-[1px] h-5 bg-[var(--border-subtle)] mx-0.5" />

          {/* History Controls */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              title="Undo (Ctrl/Cmd+Z)"
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-secondary)] transition-all ${
                canUndo
                  ? "hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] active:scale-98"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              title="Redo (Ctrl/Cmd+Y)"
              className={`flex items-center justify-center w-7 h-7 rounded-lg text-[var(--text-secondary)] transition-all ${
                canRedo
                  ? "hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] active:scale-98"
                  : "opacity-30 cursor-not-allowed"
              }`}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="w-[1px] h-5 bg-[var(--border-subtle)] mx-0.5" />

          {/* Clear Canvas */}
          <button
            onClick={onClear}
            title="Clear canvas"
            className="flex items-center justify-center w-7 h-7 rounded-lg text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
};
export default Toolbar;
