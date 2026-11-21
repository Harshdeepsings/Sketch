import React from "react";
import {
  BringToFront,
  SendToBack,
  Copy,
  Trash2,
  ChevronsUp,
  ChevronsDown,
  Layers,
  Lock,
  Unlock,
  Group,
  Ungroup,
} from "lucide-react";
import type { CanvasElement } from "../../types/canvas";
import { useTheme } from "../../context/ThemeContext";

interface PropertiesPanelProps {
  selectedElements: CanvasElement[];
  onUpdateElement: (updates: Partial<CanvasElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
  onToggleLock?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
  readOnly?: boolean;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedElements,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onBringForward,
  onSendBackward,
  onBringToFront,
  onSendToBack,
  onToggleLock,
  onGroup,
  onUngroup,
  readOnly = false,
}) => {
  const { theme } = useTheme();

  if (selectedElements.length === 0 || readOnly) return null;

  const first = selectedElements[0]!;
  const currentStroke = first.stroke || (theme === "dark" ? "#F8FAFC" : "#153446");
  const currentFill = first.fill || "transparent";
  const currentStrokeWidth = first.strokeWidth || 2;
  const currentStrokeStyle = first.strokeStyle || "solid";
  const isLocked = first.isLocked === true;
  const isGrouped =
    selectedElements.length > 1 &&
    selectedElements.every((el) => el.groupId && el.groupId === first.groupId);
  const currentOpacity = Math.round((first.opacity ?? 1) * 100);

  const colorSwatches = [
    { label: "Default", value: theme === "dark" ? "#F8FAFC" : "#153446" },
    { label: "Pastel Blue", value: "#445C9B" },
    { label: "Teal", value: "#225A7B" },
    { label: "Cobalt", value: "#064D91" },
    { label: "Violet", value: "#8B5CF6" },
    { label: "Cyan", value: "#06B6D4" },
    { label: "Emerald", value: "#10B981" },
    { label: "Amber", value: "#F59E0B" },
    { label: "Rose", value: "#F43F5E" },
  ];

  const strokeWidths = [1, 2, 4, 8];

  return (
    <div className="fixed top-18 left-5 z-20 w-60 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-xl backdrop-blur-md transition-all select-none flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
        <span className="text-[11px] font-mono font-semibold text-[var(--text-primary)] uppercase tracking-wider">
          Properties {selectedElements.length > 1 && `(${selectedElements.length})`}
        </span>
        <div className="flex items-center gap-0.5">
          {onToggleLock && (
            <button
              onClick={onToggleLock}
              className={`p-1 rounded transition-colors ${
                isLocked
                  ? "text-amber-400 bg-amber-500/10"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]"
              }`}
              title={isLocked ? "Unlock selection" : "Lock selection"}
            >
              {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
          )}

          {selectedElements.length > 1 && (
            <button
              onClick={isGrouped ? onUngroup : onGroup}
              className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
              title={isGrouped ? "Ungroup elements" : "Group elements"}
            >
              {isGrouped ? <Ungroup className="w-3.5 h-3.5" /> : <Group className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={onDuplicate}
            className="p-1 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] transition-colors"
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Delete (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stroke Color */}
      <div>
        <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
          Stroke Color
        </label>
        <div className="flex items-center gap-1.5 flex-wrap">
          {colorSwatches.map((c) => (
            <button
              key={c.value}
              onClick={() => onUpdateElement({ stroke: c.value })}
              className={`w-4 h-4 rounded-full border border-black/10 transition-transform ${
                currentStroke.toLowerCase() === c.value.toLowerCase()
                  ? "scale-125 ring-2 ring-[var(--accent-primary)] ring-offset-1"
                  : "hover:scale-110"
              }`}
              style={{ backgroundColor: c.value }}
              title={c.label}
            />
          ))}
          <input
            type="color"
            value={currentStroke.startsWith("#") ? currentStroke : "#FFFFFF"}
            onChange={(e) => onUpdateElement({ stroke: e.target.value })}
            className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0"
            title="Custom stroke color"
          />
        </div>
      </div>

      {/* Fill Color */}
      {(first.type === "rect" || first.type === "circle") && (
        <div>
          <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
            Fill Color
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onUpdateElement({ fill: "transparent" })}
              className={`w-4 h-4 rounded-full border border-[var(--border-strong)] flex items-center justify-center text-[9px] text-rose-500 font-bold ${
                currentFill === "transparent" ? "ring-2 ring-[var(--accent-primary)] ring-offset-1" : ""
              }`}
              title="Transparent"
            >
              /
            </button>
            {colorSwatches.map((c) => (
              <button
                key={c.value}
                onClick={() => onUpdateElement({ fill: c.value })}
                className={`w-4 h-4 rounded-full border border-black/10 transition-transform ${
                  currentFill.toLowerCase() === c.value.toLowerCase()
                    ? "scale-125 ring-2 ring-[var(--accent-primary)] ring-offset-1"
                    : "hover:scale-110"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
            <input
              type="color"
              value={currentFill !== "transparent" && currentFill.startsWith("#") ? currentFill : "#FFFFFF"}
              onChange={(e) => onUpdateElement({ fill: e.target.value })}
              className="w-4 h-4 rounded-full cursor-pointer bg-transparent border-0"
              title="Custom fill color"
            />
          </div>
        </div>
      )}

      {/* Stroke Width & Style */}
      {first.type !== "text" && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
              Stroke Width
            </label>
            <div className="flex items-center gap-1">
              {strokeWidths.map((w) => (
                <button
                  key={w}
                  onClick={() => onUpdateElement({ strokeWidth: w })}
                  className={`flex-1 py-0.5 rounded text-[11px] font-mono border border-[var(--border-subtle)] transition-colors ${
                    currentStrokeWidth === w
                      ? "bg-[var(--accent-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
              Stroke Style
            </label>
            <div className="flex items-center gap-1">
              {(["solid", "dashed", "dotted"] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdateElement({ strokeStyle: style })}
                  className={`flex-1 py-0.5 rounded text-[10px] font-mono capitalize border border-[var(--border-subtle)] transition-colors ${
                    currentStrokeStyle === style
                      ? "bg-[var(--accent-primary)] text-white"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Font Settings (if text element) */}
      {first.type === "text" && (
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
              Typography Font
            </label>
            <div className="flex flex-col gap-1">
              {[
                { label: "Pencil (Architect)", val: "'Architects Daughter', cursive", preview: "font-pencil" },
                { label: "Drafting Mono", val: "'JetBrains Mono', monospace", preview: "font-mono" },
                { label: "Clean Sans", val: "'Plus Jakarta Sans', sans-serif", preview: "font-sans" },
              ].map((f) => (
                <button
                  key={f.val}
                  onClick={() => onUpdateElement({ fontFamily: f.val })}
                  className={`text-left px-2 py-1 rounded text-xs border border-[var(--border-subtle)] transition-colors ${
                    (first.fontFamily || "'Architects Daughter', cursive") === f.val
                      ? "bg-[var(--accent-primary)] text-white font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]"
                  } ${f.preview}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1">
              Font Size ({first.fontSize || 20}px)
            </label>
            <input
              type="range"
              min="12"
              max="64"
              step="2"
              value={first.fontSize || 20}
              onChange={(e) => onUpdateElement({ fontSize: Number(e.target.value) })}
              className="w-full accent-[var(--accent-primary)]"
            />
          </div>
        </div>
      )}

      {/* Opacity */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[10px] font-mono uppercase text-[var(--text-muted)]">Opacity</label>
          <span className="text-[10px] text-[var(--text-secondary)] font-mono">{currentOpacity}%</span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          step="5"
          value={currentOpacity}
          onChange={(e) => onUpdateElement({ opacity: Number(e.target.value) / 100 })}
          className="w-full accent-[var(--accent-primary)]"
        />
      </div>

      {/* Layer Order */}
      <div className="border-t border-[var(--border-subtle)] pt-2">
        <label className="text-[10px] font-mono uppercase text-[var(--text-muted)] block mb-1 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          <span>Layers</span>
        </label>
        <div className="grid grid-cols-4 gap-1">
          <button
            onClick={onBringToFront}
            className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] flex items-center justify-center transition-colors"
            title="Bring to Front"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onBringForward}
            className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] flex items-center justify-center transition-colors"
            title="Bring Forward"
          >
            <BringToFront className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSendBackward}
            className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] flex items-center justify-center transition-colors"
            title="Send Backward"
          >
            <SendToBack className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onSendToBack}
            className="p-1 rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)] flex items-center justify-center transition-colors"
            title="Send to Back"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default PropertiesPanel;
