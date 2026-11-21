import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  PenTool,
  RotateCcw,
  Download,
  Share2,
  Compass,
  Square,
  Circle,
  Layers,
  ShieldCheck,
  Maximize2,
  Library,
  ZoomIn,
  ZoomOut,
  MousePointer,
} from "lucide-react";
import { motion } from "framer-motion";
import { Navbar } from "../Components/Navbar";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Button } from "../Components/UI/Button";
import { SketchParticles } from "../Components/UI/SketchParticles";
import { Magnetic } from "../Components/Motion/Magnetic";
import { DraftingDock, type DockTool } from "../Components/Motion/DraftingDock";

interface DummyElement {
  id: string;
  type: "pencil" | "rect" | "circle" | "line" | "text";
  points?: number[];
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  r?: number;
  text?: string;
  fontSize?: number;
  color: string;
  width: number;
}

// Isolated Top Ribbon Coordinate Display (prevents re-rendering the whole Landing Page on mousemove)
const TopRibbonCoords: React.FC = () => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 420, y: 180 });

  useEffect(() => {
    let rafId: number | null = null;
    const onMove = (e: MouseEvent) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        setCoords({ x: Math.round(e.clientX), y: Math.round(e.clientY) });
      });
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <span className="hidden lg:inline">
      COORDS: X={coords.x}mm Y={coords.y}mm
    </span>
  );
};

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();

  // Dummy Board State
  const miniCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement | null>(null);
  const [activeTool, setActiveTool] = useState<string>("select");
  const [leadWidth, setLeadWidth] = useState<number>(2.5);
  const [doodleColor, setDoodleColor] = useState<string>(theme === "dark" ? "#818cf8" : "#064D91");

  // Dynamic World Zoom & Pan for the Dummy Board
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Committed Elements and Active Draft
  const [elements, setElements] = useState<DummyElement[]>([]);
  const currentDraftRef = useRef<DummyElement | null>(null);
  const isDoodlingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  // Shape Selection & Cursor-Hold Dragging State (Just like main application)
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isHoveringShape, setIsHoveringShape] = useState<boolean>(false);
  const isDraggingShapeRef = useRef(false);
  const draggedElementIdRef = useRef<string | null>(null);
  const lastMouseWorldPosRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setDoodleColor(theme === "dark" ? "#818cf8" : "#064D91");
  }, [theme]);

  // Generate initial friendly whiteboard elements
  const getInitialElements = useCallback((): DummyElement[] => {
    const stroke = theme === "dark" ? "#A5B4FC" : "#153446";
    const accent = theme === "dark" ? "#38BDF8" : "#064D91";

    return [
      // Box 1: Brainstorm Ideas
      { id: "box-1", type: "rect", x: 30, y: 40, w: 120, h: 65, color: stroke, width: 2 },
      // Box 2: Design & Plan
      { id: "box-2", type: "rect", x: 200, y: 40, w: 130, h: 65, color: stroke, width: 2 },
      // Box 3: Share with Team
      { id: "box-3", type: "rect", x: 380, y: 40, w: 120, h: 65, color: stroke, width: 2 },

      // Connector 1 + Arrow
      { id: "line-1", type: "line", points: [150, 72, 200, 72, 192, 68, 200, 72, 192, 76], color: stroke, width: 2 },
      // Connector 2 + Arrow
      { id: "line-2", type: "line", points: [330, 72, 380, 72, 372, 68, 380, 72, 372, 76], color: stroke, width: 2 },

      // Friendly Human Labels
      { id: "txt-1", type: "text", text: "Brainstorm\nIdeas", x: 50, y: 68, color: stroke, fontSize: 13, width: 1 },
      { id: "txt-2", type: "text", text: "Design &\nDiagram", x: 230, y: 68, color: stroke, fontSize: 13, width: 1 },
      { id: "txt-3", type: "text", text: "Share with\nTeam", x: 400, y: 68, color: stroke, fontSize: 13, width: 1 },
      { id: "txt-hint", type: "text", text: "✨ Click & drag any card to move it, or pick a tool below to sketch!", x: 45, y: 155, color: accent, fontSize: 13, width: 1 },
    ];
  }, [theme]);

  // Point to segment distance calculation for lines and pencil strokes
  const distToSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  };

  // Precise hit testing for cursor hold & drag on any shape
  const getElementAtPosition = useCallback((coords: { x: number; y: number }, list: DummyElement[]): DummyElement | null => {
    for (let i = list.length - 1; i >= 0; i--) {
      const el = list[i]!;
      if (el.type === "rect" && el.x !== undefined && el.y !== undefined && el.w !== undefined && el.h !== undefined) {
        const minX = Math.min(el.x, el.x + el.w);
        const maxX = Math.max(el.x, el.x + el.w);
        const minY = Math.min(el.y, el.y + el.h);
        const maxY = Math.max(el.y, el.y + el.h);
        if (coords.x >= minX - 6 && coords.x <= maxX + 6 && coords.y >= minY - 6 && coords.y <= maxY + 6) {
          return el;
        }
      } else if (el.type === "circle" && el.x !== undefined && el.y !== undefined && el.r !== undefined) {
        const dist = Math.hypot(coords.x - el.x, coords.y - el.y);
        if (dist <= el.r + 6) {
          return el;
        }
      } else if (el.type === "text" && el.x !== undefined && el.y !== undefined) {
        const textWidth = (el.text || "").length * 8 + 24;
        const textHeight = (el.text || "").split("\n").length * 20 + 10;
        if (coords.x >= el.x - 6 && coords.x <= el.x + textWidth + 6 && coords.y >= el.y - 16 && coords.y <= el.y + textHeight) {
          return el;
        }
      } else if (el.type === "line" && el.points && el.points.length >= 4) {
        for (let p = 0; p < el.points.length - 2; p += 2) {
          const dist = distToSegment(coords.x, coords.y, el.points[p]!, el.points[p + 1]!, el.points[p + 2]!, el.points[p + 3]!);
          if (dist <= 8) return el;
        }
      } else if (el.type === "pencil" && el.points && el.points.length >= 2) {
        for (let p = 0; p < el.points.length - 2; p += 2) {
          const dist = distToSegment(coords.x, coords.y, el.points[p]!, el.points[p + 1]!, el.points[p + 2]!, el.points[p + 3]!);
          if (dist <= 8) return el;
        }
      }
    }
    return null;
  }, []);

  // Load initial elements on mount or theme change
  useEffect(() => {
    setElements(getInitialElements());
  }, [getInitialElements]);

  // Convert client cursor to world canvas coordinates with high precision
  const toWorldCoords = useCallback((clientX: number, clientY: number) => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenX = clientX - rect.left;
    const screenY = clientY - rect.top;
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan.x, pan.y, zoom]);

  // Redraw canvas with high-DPI, infinite zoom, and pan
  const redraw = useCallback(() => {
    const canvas = miniCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const targetW = Math.round(rect.width * dpr);
    const targetH = Math.round(rect.height * dpr);

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    // Apply pan and zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Render Infinite Precision Grid in World Space (Batched into one stroke)
    const isDark = theme === "dark";
    ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(34, 90, 123, 0.09)";
    ctx.lineWidth = 1 / zoom;

    const step = 20;
    const minX = Math.floor((-pan.x / zoom) / step) * step - step;
    const maxX = Math.ceil(((rect.width - pan.x) / zoom) / step) * step + step;
    const minY = Math.floor((-pan.y / zoom) / step) * step - step;
    const maxY = Math.ceil(((rect.height - pan.y) / zoom) / step) * step + step;

    ctx.beginPath();
    for (let x = minX; x <= maxX; x += step) {
      ctx.moveTo(x, minY);
      ctx.lineTo(x, maxY);
    }
    for (let y = minY; y <= maxY; y += step) {
      ctx.moveTo(minX, y);
      ctx.lineTo(maxX, y);
    }
    ctx.stroke();

    // Helper to render an element
    const renderElement = (el: DummyElement) => {
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (el.type === "pencil" && el.points && el.points.length >= 2) {
        ctx.beginPath();
        ctx.moveTo(el.points[0]!, el.points[1]!);
        for (let i = 2; i < el.points.length; i += 2) {
          ctx.lineTo(el.points[i]!, el.points[i + 1]!);
        }
        ctx.stroke();
      } else if (el.type === "rect" && el.x !== undefined && el.y !== undefined && el.w !== undefined && el.h !== undefined) {
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      } else if (el.type === "circle" && el.x !== undefined && el.y !== undefined && el.r !== undefined) {
        ctx.beginPath();
        ctx.arc(el.x, el.y, Math.max(0.1, el.r), 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === "line" && el.points && el.points.length >= 4) {
        ctx.beginPath();
        ctx.moveTo(el.points[0]!, el.points[1]!);
        ctx.lineTo(el.points[2]!, el.points[3]!);
        ctx.stroke();
        if (el.points.length >= 10) {
          ctx.beginPath();
          ctx.moveTo(el.points[4]!, el.points[5]!);
          ctx.lineTo(el.points[6]!, el.points[7]!);
          ctx.lineTo(el.points[8]!, el.points[9]!);
          ctx.stroke();
        }
      } else if (el.type === "text" && el.text && el.x !== undefined && el.y !== undefined) {
        ctx.font = `${el.fontSize || 13}px 'Architects Daughter', cursive, sans-serif`;
        const lines = el.text.split("\n");
        lines.forEach((line, idx) => {
          ctx.fillText(line, el.x!, el.y! + idx * 18);
        });
      }
    };

    // Render committed elements
    for (const el of elements) {
      renderElement(el);
    }

    // Render current in-progress draft (shape or stroke)
    if (currentDraftRef.current) {
      renderElement(currentDraftRef.current);
    }

    // Render Architectural Transformer Selection Box (Just like in the main application)
    if (selectedElementId) {
      const selectedEl = elements.find((e) => e.id === selectedElementId);
      if (selectedEl) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        if (selectedEl.type === "rect" && selectedEl.x !== undefined && selectedEl.y !== undefined && selectedEl.w !== undefined && selectedEl.h !== undefined) {
          minX = Math.min(selectedEl.x, selectedEl.x + selectedEl.w);
          maxX = Math.max(selectedEl.x, selectedEl.x + selectedEl.w);
          minY = Math.min(selectedEl.y, selectedEl.y + selectedEl.h);
          maxY = Math.max(selectedEl.y, selectedEl.y + selectedEl.h);
        } else if (selectedEl.type === "circle" && selectedEl.x !== undefined && selectedEl.y !== undefined && selectedEl.r !== undefined) {
          minX = selectedEl.x - selectedEl.r;
          maxX = selectedEl.x + selectedEl.r;
          minY = selectedEl.y - selectedEl.r;
          maxY = selectedEl.y + selectedEl.r;
        } else if (selectedEl.type === "text" && selectedEl.x !== undefined && selectedEl.y !== undefined) {
          const lines = (selectedEl.text || "").split("\n");
          const maxLen = Math.max(...lines.map((l) => l.length), 6);
          minX = selectedEl.x - 4;
          maxX = selectedEl.x + maxLen * 8.5 + 8;
          minY = selectedEl.y - 14;
          maxY = selectedEl.y + lines.length * 18 + 4;
        } else if ((selectedEl.type === "pencil" || selectedEl.type === "line") && selectedEl.points && selectedEl.points.length >= 2) {
          for (let i = 0; i < selectedEl.points.length; i += 2) {
            minX = Math.min(minX, selectedEl.points[i]!);
            maxX = Math.max(maxX, selectedEl.points[i]!);
            minY = Math.min(minY, selectedEl.points[i + 1]!);
            maxY = Math.max(maxY, selectedEl.points[i + 1]!);
          }
        }

        if (minX !== Infinity && isFinite(minX)) {
          const pad = 6;
          const boxX = minX - pad;
          const boxY = minY - pad;
          const boxW = maxX - minX + pad * 2;
          const boxH = maxY - minY + pad * 2;

          ctx.save();
          ctx.strokeStyle = theme === "dark" ? "#38BDF8" : "#0284C7";
          ctx.lineWidth = 1.5 / zoom;
          ctx.setLineDash([4 / zoom, 4 / zoom]);
          ctx.strokeRect(boxX, boxY, boxW, boxH);
          ctx.setLineDash([]);

          // 4 Corner grips (Konva Transformer style)
          const gripSize = 6 / zoom;
          ctx.fillStyle = "#FFFFFF";
          ctx.strokeStyle = theme === "dark" ? "#38BDF8" : "#0284C7";
          ctx.lineWidth = 1.5 / zoom;

          const grips = [
            [boxX, boxY],
            [boxX + boxW, boxY],
            [boxX, boxY + boxH],
            [boxX + boxW, boxY + boxH],
          ];

          for (const [gx, gy] of grips) {
            ctx.fillRect(gx - gripSize / 2, gy - gripSize / 2, gripSize, gripSize);
            ctx.strokeRect(gx - gripSize / 2, gy - gripSize / 2, gripSize, gripSize);
          }
          ctx.restore();
        }
      }
    }

    ctx.restore();
  }, [elements, zoom, pan, theme, selectedElementId]);

  // Request Animation Frame redraw throttle
  const requestRedraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      redraw();
    });
  }, [redraw]);

  // Re-draw whenever elements, zoom, pan, or theme change
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => redraw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [redraw]);

  // Native Wheel Event Listener on Canvas Container ({ passive: false })
  // Prevents whole page scrolling when wheeling inside the dummy board boundary!
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;

      setZoom((prevZoom) => {
        const nextZoom = Math.min(Math.max(0.4, Number((prevZoom * zoomFactor).toFixed(2))), 4.0);
        setPan((prevPan) => ({
          x: mouseX - (mouseX - prevPan.x) * (nextZoom / prevZoom),
          y: mouseY - (mouseY - prevPan.y) * (nextZoom / prevZoom),
        }));
        return nextZoom;
      });
    };

    container.addEventListener("wheel", handleNativeWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  // Discover all figures and connectors in a connected cluster
  const getConnectedClusterLanding = (
    targetId: string,
    allElements: DummyElement[],
    tolerance: number = 28
  ): Set<string> => {
    const adj = new Map<string, Set<string>>();
    for (const el of allElements) {
      adj.set(el.id, new Set());
    }

    const lines = allElements.filter((el) => el.type === "line" || el.type === "pencil");
    const figures = allElements.filter((el) => el.type !== "line" && el.type !== "pencil");

    const isPtInEl = (px: number, py: number, el: DummyElement): boolean => {
      if (el.type === "rect" && el.x !== undefined && el.y !== undefined) {
        const w = el.w || 100;
        const h = el.h || 60;
        return (
          px >= Math.min(el.x, el.x + w) - tolerance &&
          px <= Math.max(el.x, el.x + w) + tolerance &&
          py >= Math.min(el.y, el.y + h) - tolerance &&
          py <= Math.max(el.y, el.y + h) + tolerance
        );
      }
      if (el.type === "circle" && el.x !== undefined && el.y !== undefined) {
        const r = (el.r || 40) + tolerance;
        return Math.hypot(px - el.x, py - el.y) <= r;
      }
      if (el.type === "text" && el.x !== undefined && el.y !== undefined) {
        const lines = (el.text || "").split("\n");
        const maxLen = Math.max(...lines.map((l) => l.length), 1);
        const w = maxLen * 8.5 + 24;
        const h = lines.length * 18 + 12;
        return (
          px >= el.x - tolerance &&
          px <= el.x + w + tolerance &&
          py >= el.y - tolerance &&
          py <= el.y + h + tolerance
        );
      }
      return false;
    };

    for (const line of lines) {
      if (!line.points || line.points.length < 4) continue;
      const startX = line.points[0]!;
      const startY = line.points[1]!;
      const endX = line.points[line.points.length - 2]!;
      const endY = line.points[line.points.length - 1]!;

      let startFig: DummyElement | null = null;
      let endFig: DummyElement | null = null;

      for (const fig of figures) {
        if (!startFig && isPtInEl(startX, startY, fig)) startFig = fig;
        if (!endFig && isPtInEl(endX, endY, fig)) endFig = fig;
      }

      if (startFig) {
        adj.get(line.id)?.add(startFig.id);
        adj.get(startFig.id)?.add(line.id);
      }
      if (endFig) {
        adj.get(line.id)?.add(endFig.id);
        adj.get(endFig.id)?.add(line.id);
      }
      if (startFig && endFig && startFig.id !== endFig.id) {
        adj.get(startFig.id)?.add(endFig.id);
        adj.get(endFig.id)?.add(startFig.id);
      }
    }

    // Connect text labels to containers if inside
    for (const fig of figures) {
      if (fig.type === "text" && fig.x !== undefined && fig.y !== undefined) {
        for (const container of figures) {
          if (container.type === "rect" && container.id !== fig.id) {
            if (isPtInEl(fig.x, fig.y, container)) {
              adj.get(fig.id)?.add(container.id);
              adj.get(container.id)?.add(fig.id);
            }
          }
        }
      }
    }

    const visited = new Set<string>();
    const queue = [targetId];
    visited.add(targetId);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const nbrs = adj.get(curr);
      if (nbrs) {
        for (const n of nbrs) {
          if (!visited.has(n)) {
            visited.add(n);
            queue.push(n);
          }
        }
      }
    }

    return visited;
  };

  // Mouse Down: Cursor Hold on Shape to Move OR Start Drawing New Element
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = toWorldCoords(e.clientX, e.clientY);
    lastMouseWorldPosRef.current = coords;

    // Check if clicking directly on an existing shape
    const hit = getElementAtPosition(coords, elements);

    if (hit) {
      // Shape is tapped on: gives option to move it!
      setSelectedElementId(hit.id);
      setActiveTool("select");
      isDraggingShapeRef.current = true;
      draggedElementIdRef.current = hit.id;
      setIsHoveringShape(true);
      redraw();
      return;
    }

    // Tapping on empty canvas when a shape was selected:
    // Option goes away, and the figure becomes static!
    if (selectedElementId) {
      setSelectedElementId(null);
      isDraggingShapeRef.current = false;
      draggedElementIdRef.current = null;
      redraw();
      return;
    }

    // If select tool is active and clicked on empty canvas, deselect
    if (activeTool === "select") {
      setSelectedElementId(null);
      redraw();
      return;
    }

    // Otherwise, start drawing with the active tool
    setSelectedElementId(null);
    isDoodlingRef.current = true;
    startPosRef.current = coords;

    if (activeTool.startsWith("pencil")) {
      const draft: DummyElement = {
        id: crypto.randomUUID(),
        type: "pencil",
        points: [coords.x, coords.y],
        color: doodleColor,
        width: leadWidth,
      };
      currentDraftRef.current = draft;
    } else if (activeTool === "rect") {
      const draft: DummyElement = {
        id: crypto.randomUUID(),
        type: "rect",
        x: coords.x,
        y: coords.y,
        w: 0,
        h: 0,
        color: doodleColor,
        width: leadWidth,
      };
      currentDraftRef.current = draft;
    } else if (activeTool === "circle") {
      const draft: DummyElement = {
        id: crypto.randomUUID(),
        type: "circle",
        x: coords.x,
        y: coords.y,
        r: 0,
        color: doodleColor,
        width: leadWidth,
      };
      currentDraftRef.current = draft;
    }
    redraw();
  };

  // Mouse Move: Drag Shape across Canvas OR Live Draw Preview
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = toWorldCoords(e.clientX, e.clientY);

    // 1. Moving connected shapes on cursor hold (Real-time delta update)
    if (isDraggingShapeRef.current && draggedElementIdRef.current && lastMouseWorldPosRef.current) {
      const dx = coords.x - lastMouseWorldPosRef.current.x;
      const dy = coords.y - lastMouseWorldPosRef.current.y;
      lastMouseWorldPosRef.current = coords;

      // Discover connected cluster (if Figure A is connected to Figure B via an arrow, move both together)
      const clusterIds = getConnectedClusterLanding(draggedElementIdRef.current, elements);

      setElements((prev) =>
        prev.map((el) => {
          if (clusterIds.has(el.id)) {
            if (el.type === "rect" || el.type === "circle" || el.type === "text") {
              return {
                ...el,
                x: (el.x ?? 0) + dx,
                y: (el.y ?? 0) + dy,
              };
            } else if ((el.type === "pencil" || el.type === "line") && el.points) {
              return {
                ...el,
                points: el.points.map((val, idx) => (idx % 2 === 0 ? val + dx : val + dy)),
              };
            }
          }
          return el;
        })
      );
      requestRedraw();
      return;
    }

    // 2. In-progress drawing preview (Pencil, Rect, Circle)
    if (isDoodlingRef.current && startPosRef.current && currentDraftRef.current) {
      if (activeTool.startsWith("pencil")) {
        currentDraftRef.current.points = [...(currentDraftRef.current.points || []), coords.x, coords.y];
      } else if (activeTool === "rect") {
        const startX = startPosRef.current.x;
        const startY = startPosRef.current.y;
        currentDraftRef.current.x = Math.min(startX, coords.x);
        currentDraftRef.current.y = Math.min(startY, coords.y);
        currentDraftRef.current.w = Math.abs(coords.x - startX);
        currentDraftRef.current.h = Math.abs(coords.y - startY);
      } else if (activeTool === "circle") {
        const startX = startPosRef.current.x;
        const startY = startPosRef.current.y;
        currentDraftRef.current.x = startX;
        currentDraftRef.current.y = startY;
        currentDraftRef.current.r = Math.hypot(coords.x - startX, coords.y - startY);
      }

      requestRedraw();
      return;
    }

    // 3. Passive hover detection: set grab cursor if hovering over an existing shape
    const hit = getElementAtPosition(coords, elements);
    setIsHoveringShape(Boolean(hit));
  };

  // Mouse Up: Commit Moved Shape OR Commit Drawn Shape
  const handleMouseUp = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (isDraggingShapeRef.current) {
      isDraggingShapeRef.current = false;
      draggedElementIdRef.current = null;
      lastMouseWorldPosRef.current = null;
      redraw();
      return;
    }

    if (isDoodlingRef.current && currentDraftRef.current) {
      const newEl = currentDraftRef.current;
      const isSignificant =
        (newEl.type === "rect" && (newEl.w ?? 0) > 3 && (newEl.h ?? 0) > 3) ||
        (newEl.type === "circle" && (newEl.r ?? 0) > 3) ||
        (newEl.type === "pencil" && (newEl.points?.length ?? 0) > 2);

      if (isSignificant) {
        setElements((prev) => [...prev, newEl]);
        // On drawing a figure, give the option to move it
        setSelectedElementId(newEl.id);
        setActiveTool("select");
      }
    }
    isDoodlingRef.current = false;
    currentDraftRef.current = null;
    startPosRef.current = null;
    redraw();
  };

  // Reset scratchpad
  const clearMiniScratchpad = () => {
    setElements(getInitialElements());
    setSelectedElementId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Tools for the Spring Drafting Dock
  const dockTools: DockTool[] = [
    {
      id: "select",
      label: "Select / Move",
      sublabel: "Click & hold any shape to move",
      icon: <MousePointer className="w-5 h-5 text-(--accent-primary)" />,
    },
    {
      id: "pencil-05",
      label: "0.5mm Standard Lead",
      sublabel: "Freehand drawing",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      id: "pencil-03",
      label: "0.3mm Fine Lead",
      sublabel: "Crisp technical sketches",
      icon: <PenTool className="w-5 h-5" />,
    },
    {
      id: "rect",
      label: "Square / Rectangle",
      sublabel: "Click & drag to draw box",
      icon: <Square className="w-5 h-5" />,
    },
    {
      id: "circle",
      label: "Compass Circle",
      sublabel: "Click & drag to draw circle",
      icon: <Circle className="w-5 h-5" />,
    },
  ];

  const handleToolSelect = (id: string) => {
    setActiveTool(id);
    if (id === "pencil-03") setLeadWidth(1.5);
    else if (id === "pencil-05") setLeadWidth(2.5);
    else if (id === "rect" || id === "circle") setLeadWidth(2.5);
  };

  // Highlights for what makes Sketchh great
  const projectHighlights = [
    {
      id: "01",
      title: "Real-Time Collaboration",
      desc: "See teammates' cursors move live on the canvas. Brainstorm together, add feedback, and sketch side-by-side with zero lag.",
      tag: "LIVE COLLABORATION",
      icon: <Share2 className="w-6 h-6 text-(--accent-primary)" />,
    },
    {
      id: "02",
      title: "Crisp Infinite Canvas",
      desc: "Zoom in as far as you want with sharp, infinite vector precision. Every line and shape stays crystal clear on any screen.",
      tag: "INFINITE CANVAS",
      icon: <Layers className="w-6 h-6 text-emerald-500" />,
    },
    {
      id: "03",
      title: "Hand-Drawn Pencil Feel",
      desc: "Tactile sketch tools with warm handwriting fonts and variable line weights that feel as natural and free as pen on paper.",
      tag: "NATURAL SKETCHING",
      icon: <PenTool className="w-6 h-6 text-amber-500" />,
    },
    {
      id: "04",
      title: "Easy Sharing & Permissions",
      desc: "Share your drawing with a quick link. Invite collaborators as editors or viewers, and keep private projects protected.",
      tag: "SIMPLE SHARING",
      icon: <ShieldCheck className="w-6 h-6 text-indigo-500" />,
    },
    {
      id: "05",
      title: "Fast PNG, SVG & PDF Exports",
      desc: "Download high-res PNGs, scalable SVG graphics, or ready-to-print multi-page PDFs with a single click right from the browser.",
      tag: "ONE-CLICK EXPORT",
      icon: <Download className="w-6 h-6 text-cyan-500" />,
    },
    {
      id: "06",
      title: "Ready Shapes & Flowcharts",
      desc: "Quickly insert rectangles, circles, connector arrows, and diagram blocks to speed up your system designs and thoughts.",
      tag: "DIAGRAM TOOLS",
      icon: <Library className="w-6 h-6 text-purple-500" />,
    },
  ];

  return (
    <div
      className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col relative selection:bg-(--accent-primary) selection:text-white transition-colors overflow-x-hidden"
    >
      {/* Interactive Floating Graphite Particles */}
      <SketchParticles />

      {/* Top Banner Scale Ribbon */}
      <div className="h-7 border-b border-(--border-subtle) bg-(--bg-surface-elevated) px-4 flex items-center justify-between text-[11px] font-mono text-(--text-muted) select-none z-20">
        <div className="flex items-center gap-4">
          <span className="font-semibold text-(--text-primary) flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-(--accent-primary)" />
            <span>Sketchh — Real-time Visual Collaboration</span>
          </span>
          <span className="hidden lg:inline text-(--border-strong)">|</span>
          <TopRibbonCoords />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-emerald-500 font-mono flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live multiplayer active</span>
          </span>
          <span className="border-l border-(--border-subtle) pl-3 hidden sm:inline text-(--text-muted)">
            v2.4
          </span>
        </div>
      </div>

      <Navbar />

      {/* WORKBENCH HERO */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* LEFT WING: Command & Headline */}
          <div className="lg:col-span-5 flex flex-col items-start text-left">
            {/* Friendly Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-(--border-strong) bg-(--bg-surface) text-[12px] text-(--text-secondary) mb-5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">Simple, fast collaborative whiteboard</span>
            </div>

            {/* Hand-Drafted Pencil Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-pencil text-(--text-primary) tracking-tight leading-[1.08] mb-4">
              Draw together, <br />
              <span className="text-(--accent-primary) underline decoration-(--border-strong) decoration-wavy decoration-2">
                think out loud.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-(--text-muted) font-normal leading-relaxed mb-6 max-w-lg">
              A clean, responsive canvas built for teams to brainstorm, sketch diagrams, and design in real time.
              No complex clutter — just pick up a pen and create together.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Magnetic strength={0.25}>
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="shadow-lg shadow-(--accent-glow) text-sm font-semibold"
                    endIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {user ? "Open Canvas Workspace" : "Start Drawing — It's Free"}
                  </Button>
                </Link>
              </Magnetic>

              <Magnetic strength={0.2}>
                <Link to={user ? "/dashboard" : "/login"}>
                  <Button variant="outline" size="lg" className="text-sm font-mono">
                    {user ? "My Drawings" : "Log In to Studio"}
                  </Button>
                </Link>
              </Magnetic>
            </div>

            {/* Draggable Note */}
            <motion.div
              drag
              dragConstraints={{ left: -30, right: 100, top: -40, bottom: 60 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-xl border-2 border-amber-400/40 bg-amber-50 dark:bg-amber-950/20 shadow-md cursor-grab active:cursor-grabbing max-w-sm relative select-none"
            >
              <div className="drafting-tape-tl" />
              <div className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase mb-1 flex items-center justify-between">
                <span>HANDY NOTE</span>
                <span className="text-[9px] opacity-70">DRAG ME</span>
              </div>
              <p className="text-xs font-pencil text-amber-900 dark:text-amber-200 leading-snug">
                "Instant, lightweight, and clutter-free. Feels like a real whiteboard on your wall, but connected to your entire team."
              </p>
            </motion.div>
          </div>

          {/* RIGHT WING: The Solid Static Interactive Blueprint Workbench */}
          <div className="lg:col-span-7 flex flex-col items-center">
            {/* 100% Solid Static Board Container */}
            <div className="w-full rounded-2xl border-2 border-(--border-strong) bg-(--bg-surface) shadow-2xl relative overflow-hidden transition-all">
              {/* Physical Drafting Tape in Corners */}
              <div className="drafting-tape-tl" />
              <div className="drafting-tape-tr" />

              {/* Blueprint Sheet Top Bar with Live Zoom Indicator */}
              <div className="h-10 border-b border-(--border-subtle) bg-(--bg-surface-elevated) px-4 flex items-center justify-between text-xs font-mono select-none">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-sm bg-(--accent-primary)" />
                  <span className="font-semibold text-(--text-primary)">
                    Interactive Canvas Preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Zoom Controls */}
                  <div className="flex items-center bg-(--bg-surface) border border-(--border-subtle) rounded px-1.5 py-0.5 gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.15).toFixed(2))))}
                      title="Zoom Out"
                      className="hover:text-(--accent-primary) transition-colors p-0.5"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                      title="Reset Zoom to 100%"
                      className="font-bold px-1 hover:text-(--accent-primary) transition-colors"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom((z) => Math.min(4.0, Number((z + 0.15).toFixed(2))))}
                      title="Zoom In"
                      className="hover:text-(--accent-primary) transition-colors p-0.5"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Active Tool Badge */}
                  <span className="text-[10px] font-mono font-bold text-(--accent-primary) bg-(--bg-surface) px-2 py-0.5 rounded border border-(--border-subtle) uppercase">
                    TOOL: {activeTool === "select" ? "SELECT / MOVE" : activeTool.toUpperCase()}
                  </span>

                  {/* Reset Blueprint */}
                  <button
                    type="button"
                    onClick={clearMiniScratchpad}
                    title="Reset Preview"
                    className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono text-(--text-muted) hover:text-rose-500 hover:bg-rose-500/10 border border-(--border-subtle) transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Interactive Drawing Canvas (Accurate Coordinates + Zoom Supported + Movable Shapes on Cursor Hold) */}
              <div
                ref={canvasContainerRef}
                className="relative w-full h-80 sm:h-96 bg-(--canvas-bg) overflow-hidden select-none"
              >
                <canvas
                  ref={miniCanvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={(e) => {
                    if (e.touches.length === 1) {
                      const t = e.touches[0];
                      handleMouseDown({ clientX: t.clientX, clientY: t.clientY } as any);
                    }
                  }}
                  onTouchMove={(e) => {
                    if (e.touches.length === 1) {
                      const t = e.touches[0];
                      handleMouseMove({ clientX: t.clientX, clientY: t.clientY } as any);
                    }
                  }}
                  onTouchEnd={handleMouseUp}
                  style={{
                    cursor: isDraggingShapeRef.current
                      ? "grabbing"
                      : isHoveringShape && selectedElementId
                      ? "grab"
                      : isHoveringShape
                      ? "pointer"
                      : activeTool === "select"
                      ? "default"
                      : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 2v7m0 6v7M2 12h7m6 0h7' stroke='%23000' stroke-width='2.5' stroke-linecap='round' stroke-opacity='0.35'/%3E%3Cpath d='M12 3v6m0 6v6M3 12h6m6 0h6' stroke='%236366F1' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%236366F1' stroke='%23FFFFFF' stroke-width='0.75'/%3E%3C/svg%3E") 12 12, crosshair`,
                  }}
                  className="w-full h-full block"
                />

                {/* Title Block Box in Bottom Right */}
                <div className="absolute bottom-3 right-3 border border-(--border-strong) bg-(--bg-surface-translucent) backdrop-blur-sm p-2 text-[10px] font-mono text-(--text-secondary) rounded pointer-events-none select-none shadow-sm hidden sm:block">
                  <div className="font-bold text-(--text-primary) border-b border-(--border-subtle) pb-0.5 mb-1">
                    Live Canvas
                  </div>
                  <div>Zoom: {Math.round(zoom * 100)}%</div>
                  <div>Cloud Saved</div>
                </div>
              </div>

              {/* Footing Bar with Dynamic Action Hints */}
              <div className="h-8 border-t border-(--border-subtle) bg-(--bg-surface-elevated) px-4 flex items-center justify-between text-[11px] font-mono text-(--text-muted)">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>
                    {isDraggingShapeRef.current
                      ? "Moving shape... release cursor to place"
                      : selectedElementId
                      ? "Tap empty canvas to place as static, or drag to move"
                      : isHoveringShape
                      ? "Tap shape to select & move"
                      : activeTool === "select"
                      ? "Tap any shape to move, or choose a drawing tool"
                      : activeTool === "rect"
                      ? "Rectangle tool: drag to draw"
                      : activeTool === "circle"
                      ? "Circle tool: drag to draw"
                      : "Pencil tool: draw freehand"}
                  </span>
                </div>
                <Link
                  to={user ? "/dashboard" : "/signup"}
                  className="text-(--accent-primary) hover:underline font-semibold flex items-center gap-1"
                >
                  <span>Full Canvas</span>
                  <Maximize2 className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* SPRING DRAFTING DOCK (Functional Tools: Pencil, Square, Circle) */}
            <div className="mt-5 w-full flex justify-center">
              <DraftingDock
                tools={dockTools}
                activeId={activeTool}
                onSelect={handleToolSelect}
              />
            </div>
          </div>
        </div>

        {/* PROJECT HIGHLIGHT FEATURES SECTION */}
        <section className="mt-24 w-full">
          <div className="border-2 border-(--border-strong) rounded-2xl bg-(--bg-surface) p-6 sm:p-10 relative shadow-xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-(--border-subtle)">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-(--accent-primary) font-bold">
                  WHY YOU'LL LOVE SKETCHH
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold font-pencil text-(--text-primary) mt-1">
                  Built for how teams actually create
                </h2>
              </div>
              <div className="text-xs text-(--text-muted)">
                Everything you need to bring your ideas to life
              </div>
            </div>

            {/* 6 Feature Highlight Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projectHighlights.map((feat) => (
                <div
                  key={feat.id}
                  className="p-6 rounded-xl border border-(--border-strong) bg-(--bg-surface-elevated) hover:border-(--accent-primary) transition-all flex flex-col justify-between group shadow-sm hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-lg bg-(--bg-surface) border border-(--border-subtle) group-hover:scale-110 transition-transform shadow-sm">
                        {feat.icon}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-(--bg-surface) border border-(--border-subtle) text-(--text-muted) font-bold">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold font-pencil text-(--text-primary) mb-2 group-hover:text-(--accent-primary) transition-colors">
                      {feat.title}
                    </h3>

                    <p className="text-xs text-(--text-muted) leading-relaxed">
                      {feat.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-(--border-subtle) flex items-center justify-between text-[10px] font-mono text-(--text-secondary) font-semibold">
                    <span>Feature 0{feat.id}</span>
                    <span className="text-emerald-500 font-bold">Included</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Handcrafted Studio Invitation Callout */}
        <div className="w-full mt-20 p-10 rounded-2xl border-2 border-dashed border-(--border-strong) bg-(--bg-surface-elevated) text-center relative overflow-hidden">
          <div className="max-w-xl mx-auto">
            <h3 className="text-3xl sm:text-4xl font-bold font-pencil text-(--text-primary) mb-3">
              Ready to start sketching?
            </h3>
            <p className="text-xs sm:text-sm text-(--text-muted) mb-6 font-mono">
              Create a free account or start drawing right away.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Magnetic strength={0.25}>
                <Link to={user ? "/dashboard" : "/signup"}>
                  <Button variant="primary" size="lg" endIcon={<ArrowRight className="w-4 h-4" />}>
                    {user ? "Go to My Dashboard" : "Start Sketching Now"}
                  </Button>
                </Link>
              </Magnetic>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-(--border-subtle) bg-(--bg-surface) py-8 px-6 text-xs font-mono text-(--text-muted) relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-(--text-primary) text-(--bg-main) flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-(--text-primary)">SKETCHH</span>
            <span className="text-(--border-strong)">|</span>
            <span>SIMPLE COLLABORATIVE WHITEBOARD</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/terms" className="hover:text-(--text-primary) transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-(--text-primary) transition-colors">
              Privacy Policy
            </Link>
          </div>

          <div>
            <span>© 2026 SKETCHH. ALL RIGHTS RESERVED.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
