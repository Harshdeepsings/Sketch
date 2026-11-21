import React, { useState } from "react";
import {
  X,
  Plus,
  Server,
  Database,
  Cloud,
  Layers,
  MessageSquare,
  Layout,
  Workflow,
  Sparkles,
} from "lucide-react";
import type { CanvasElement } from "../../types/canvas";
import { useTheme } from "../../context/ThemeContext";

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertElements: (elements: CanvasElement[]) => void;
  viewportCenter: { x: number; y: number };
}

export const LibraryModal: React.FC<LibraryModalProps> = ({
  isOpen,
  onClose,
  onInsertElements,
  viewportCenter,
}) => {
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<"all" | "architecture" | "flowchart" | "ui" | "notes">("all");

  if (!isOpen) return null;

  const defaultStroke = theme === "dark" ? "#F8FAFC" : "#153446";

  const libraryItems = [
    // Architecture
    {
      id: "cloud-service",
      name: "Cloud Gateway / API",
      category: "architecture",
      icon: <Cloud className="w-5 h-5 text-sky-400" />,
      description: "Cloud boundary with API gateway title",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 100,
          y: cy - 60,
          width: 200,
          height: 120,
          stroke: "#38BDF8",
          strokeWidth: 2,
          strokeStyle: "dashed",
          fill: theme === "dark" ? "rgba(56, 189, 248, 0.08)" : "rgba(56, 189, 248, 0.12)",
          opacity: 1,
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 80,
          y: cy - 40,
          text: "API Gateway (Cloud)",
          fontSize: 16,
          stroke: defaultStroke,
        },
      ],
    },
    {
      id: "database-node",
      name: "Database / Store",
      category: "architecture",
      icon: <Database className="w-5 h-5 text-violet-400" />,
      description: "Cylinder database representation with label",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "circle",
          x: cx,
          y: cy - 25,
          radiusX: 60,
          radiusY: 20,
          stroke: "#8B5CF6",
          strokeWidth: 2,
          fill: theme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.2)",
        },
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 60,
          y: cy - 25,
          width: 120,
          height: 70,
          stroke: "#8B5CF6",
          strokeWidth: 2,
          fill: theme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.2)",
        },
        {
          id: crypto.randomUUID(),
          type: "circle",
          x: cx,
          y: cy + 45,
          radiusX: 60,
          radiusY: 20,
          stroke: "#8B5CF6",
          strokeWidth: 2,
          fill: theme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.2)",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 40,
          y: cy,
          text: "MongoDB Store",
          fontSize: 14,
          stroke: defaultStroke,
        },
      ],
    },
    {
      id: "server-microservice",
      name: "Microservice Node",
      category: "architecture",
      icon: <Server className="w-5 h-5 text-emerald-400" />,
      description: "Service box with port & protocol annotation",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 80,
          y: cy - 45,
          width: 160,
          height: 90,
          stroke: "#10B981",
          strokeWidth: 2,
          fill: theme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.15)",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 65,
          y: cy - 25,
          text: "Backend Service\n:5000 (Express/IO)",
          fontSize: 14,
          stroke: defaultStroke,
        },
      ],
    },

    // Flowchart
    {
      id: "flow-process",
      name: "Process Block",
      category: "flowchart",
      icon: <Workflow className="w-5 h-5 text-sky-400" />,
      description: "Step in business process or logic",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 75,
          y: cy - 35,
          width: 150,
          height: 70,
          stroke: "#445C9B",
          strokeWidth: 2,
          fill: theme === "dark" ? "#16152F" : "#E2ECF7",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 50,
          y: cy - 10,
          text: "Process Step",
          fontSize: 15,
          stroke: defaultStroke,
        },
      ],
    },
    {
      id: "flow-decision",
      name: "Decision Node",
      category: "flowchart",
      icon: <Layers className="w-5 h-5 text-amber-400" />,
      description: "Diamond branching condition",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 45,
          y: cy - 45,
          width: 90,
          height: 90,
          rotation: 45,
          stroke: "#F59E0B",
          strokeWidth: 2,
          fill: theme === "dark" ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.15)",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 35,
          y: cy - 10,
          text: "Condition?",
          fontSize: 14,
          stroke: defaultStroke,
        },
      ],
    },

    // UI Wireframes
    {
      id: "ui-card",
      name: "Card Container",
      category: "ui",
      icon: <Layout className="w-5 h-5 text-indigo-400" />,
      description: "Wireframe content card with button",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 110,
          y: cy - 80,
          width: 220,
          height: 160,
          stroke: "#6366F1",
          strokeWidth: 1.5,
          fill: theme === "dark" ? "#0E0D1F" : "#FFFFFF",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 90,
          y: cy - 60,
          text: "Feature Card Title",
          fontSize: 16,
          stroke: defaultStroke,
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 90,
          y: cy - 30,
          text: "Card description\nand diagram details.",
          fontSize: 12,
          stroke: "#94A3B8",
        },
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 90,
          y: cy + 30,
          width: 100,
          height: 32,
          stroke: "#6366F1",
          strokeWidth: 1,
          fill: "#6366F1",
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 70,
          y: cy + 38,
          text: "Action CTA",
          fontSize: 12,
          stroke: "#FFFFFF",
        },
      ],
    },

    // Sticky Notes
    {
      id: "note-cosmic",
      name: "Cosmic Violet Note",
      category: "notes",
      icon: <MessageSquare className="w-5 h-5 text-violet-400" />,
      description: "Collaborative post-it style sticky note",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 80,
          y: cy - 80,
          width: 160,
          height: 160,
          stroke: "#8B5CF6",
          strokeWidth: 1,
          fill: theme === "dark" ? "#1E1B4B" : "#EDE9FE",
          opacity: 0.95,
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 65,
          y: cy - 60,
          text: "💡 Key Idea:\nSynchronize states via\nSocket.IO without latency.",
          fontSize: 13,
          stroke: theme === "dark" ? "#E0E7FF" : "#312E81",
        },
      ],
    },
    {
      id: "note-pastel-blue",
      name: "Pastel Blue Note",
      category: "notes",
      icon: <MessageSquare className="w-5 h-5 text-sky-400" />,
      description: "Coolors pastel blue note",
      create: (cx: number, cy: number): CanvasElement[] => [
        {
          id: crypto.randomUUID(),
          type: "rect",
          x: cx - 80,
          y: cy - 80,
          width: 160,
          height: 160,
          stroke: "#225A7B",
          strokeWidth: 1,
          fill: theme === "dark" ? "#0F263B" : "#E2ECF7",
          opacity: 0.95,
        },
        {
          id: crypto.randomUUID(),
          type: "text",
          x: cx - 65,
          y: cy - 60,
          text: "📌 Team Note:\nBrainstorm ideas and share.",
          fontSize: 13,
          stroke: theme === "dark" ? "#BAE6FD" : "#153446",
        },
      ],
    },
  ];

  const filteredItems = libraryItems.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  const handleSelect = (item: typeof libraryItems[0]) => {
    const newElements = item.create(viewportCenter.x, viewportCenter.y);
    onInsertElements(newElements);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl rounded-3xl bg-(--bg-surface) border border-(--border-strong) shadow-2xl p-6 relative max-h-[85vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-(--text-muted) hover:text-(--text-primary) hover:bg-(--border-subtle) transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-(--accent-primary)" />
          <h3 className="text-lg font-semibold text-(--text-primary)">
            Component Library & Templates
          </h3>
        </div>
        <p className="text-xs text-(--text-muted) mb-5">
          Insert pre-crafted architecture nodes, flowchart blocks, and wireframes into your canvas.
        </p>

        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-(--bg-surface-elevated) border border-(--border-subtle) text-xs mb-5 overflow-x-auto">
          {[
            { id: "all", label: "All Items" },
            { id: "architecture", label: "Architecture" },
            { id: "flowchart", label: "Flowchart" },
            { id: "ui", label: "UI Wireframes" },
            { id: "notes", label: "Sticky Notes" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? "bg-(--bg-surface) text-(--text-primary) font-semibold shadow-sm"
                  : "text-(--text-muted) hover:text-(--text-primary)"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Library Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3 pr-1">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="group p-4 rounded-2xl border border-(--border-subtle) hover:border-(--accent-primary)/50 bg-(--bg-surface-elevated)/40 hover:bg-(--bg-surface-elevated) transition-all cursor-pointer flex items-start gap-3.5"
            >
              <div className="p-2.5 rounded-xl bg-(--bg-surface) border border-(--border-subtle) group-hover:scale-105 transition-transform">
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-semibold text-(--text-primary) mb-0.5 group-hover:text-(--accent-primary) transition-colors">
                  {item.name}
                </h4>
                <p className="text-[11px] text-(--text-muted) line-clamp-2">
                  {item.description}
                </p>
              </div>
              <Plus className="w-4 h-4 text-(--text-muted) group-hover:text-(--accent-primary) mt-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default LibraryModal;
