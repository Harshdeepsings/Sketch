import React, { useRef, useState, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Ellipse,
  Line,
  Arrow,
  Text,
  Transformer,
  Group,
} from "react-konva";
import type { CanvasElement, ToolType, MultiplayerCursor } from "../../types/canvas";
import { useTheme } from "../../context/ThemeContext";
import { getConnectedCluster } from "../../utils/connectionMetrics";

interface DrawingCanvasProps {
  elements: CanvasElement[];
  currentTool: ToolType;
  onSelectTool?: (tool: ToolType) => void;
  selectedIds: string[];
  onSelectElements: (ids: string[]) => void;
  onAddElement: (element: CanvasElement) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onBatchUpdateElements?: (elements: CanvasElement[]) => void;
  scale: number;
  setScale: React.Dispatch<React.SetStateAction<number>>;
  position: { x: number; y: number };
  setPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  cursors?: MultiplayerCursor[];
  onCursorMove?: (x: number, y: number) => void;
  stageRef: React.RefObject<any>;
  readOnly?: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  elements,
  currentTool,
  onSelectTool,
  selectedIds,
  onSelectElements,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onBatchUpdateElements,
  scale,
  setScale,
  position,
  setPosition,
  cursors = [],
  onCursorMove,
  stageRef,
  readOnly = false,
}) => {
  const { theme } = useTheme();
  const transformerRef = useRef<any>(null);
  const isDrawing = useRef(false);
  const currentElementId = useRef<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [textInputPos, setTextInputPos] = useState<{
    id: string;
    isNew: boolean;
    worldX: number;
    worldY: number;
    screenX: number;
    screenY: number;
    text: string;
    fontSize: number;
    fontFamily: string;
    stroke: string;
  } | null>(null);
  const [draftTextValue, setDraftTextValue] = useState("");
  const textInputRef = useRef<HTMLTextAreaElement | null>(null);
  const textInputOpenedAtRef = useRef<number>(0);

  // Sleek, high-precision SVG drawing crosshair (replaces clunky default OS plus sign)
  const prettyCrosshairCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M12 2v7m0 6v7M2 12h7m6 0h7' stroke='%23000' stroke-width='2.5' stroke-linecap='round' stroke-opacity='0.35'/%3E%3Cpath d='M12 3v6m0 6v6M3 12h6m6 0h6' stroke='%236366F1' stroke-width='1.5' stroke-linecap='round'/%3E%3Ccircle cx='12' cy='12' r='1.5' fill='%236366F1' stroke='%23FFFFFF' stroke-width='0.75'/%3E%3C/svg%3E") 12 12, crosshair`;

  const prettyTextCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M6 4h12M12 4v16M8 20h8' stroke='%23000' stroke-width='2.5' stroke-linecap='round' stroke-opacity='0.35'/%3E%3Cpath d='M6 4h12M12 4v16M8 20h8' stroke='%236366F1' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E") 12 12, text`;

  const getCanvasCursor = () => {
    if (currentTool === "text") return prettyTextCursor;
    if (currentTool === "hand") return "grab";
    if (currentTool === "select") return "default";
    return prettyCrosshairCursor;
  };

  // Connected figures cluster dragging ref
  const dragClusterRef = useRef<{
    draggedId: string;
    initialPositions: Map<string, { x: number; y: number }>;
    cluster: CanvasElement[];
  } | null>(null);

  // High-performance live draft element rendered on local animation frame
  const [draftElement, setDraftElement] = useState<CanvasElement | null>(null);
  const draftElementRef = useRef<CanvasElement | null>(null);
  const draftRafRef = useRef<number | null>(null);
  const lastCursorEmitRef = useRef<number>(0);

  // HUD coordinate DOM refs to eliminate React re-render overhead during drawing
  const hudXRef = useRef<HTMLElement | null>(null);
  const hudYRef = useRef<HTMLElement | null>(null);

  // Default drawing colors according to theme
  const defaultStroke = theme === "dark" ? "#F8FAFC" : "#153446";

  // Convert pointer event to world coordinates independent of pan & zoom
  const getWorldPointer = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pointer = stage.getPointerPosition();
    if (!pointer) return { x: 0, y: 0 };

    return {
      x: (pointer.x - position.x) / scale,
      y: (pointer.y - position.y) / scale,
    };
  };

  // Attach Konva Transformer to selected node(s)
  useEffect(() => {
    if (readOnly || !transformerRef.current || !stageRef.current) return;

    if (currentTool !== "select" || selectedIds.length === 0) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
      return;
    }

    const stage = stageRef.current;
    const selectedNodes = selectedIds
      .map((id) => stage.findOne(`#${id}`))
      .filter((node) => Boolean(node));

    transformerRef.current.nodes(selectedNodes);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedIds, currentTool, elements, readOnly]);

  // Synchronize canvas container cursor with active tool (ensure I-beam text cursor for text tool and pretty crosshair for drawing)
  useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      if (container) {
        container.style.cursor = getCanvasCursor();
      }
    }
  }, [currentTool]);

  // Forcefully autofocus textarea whenever textInputPos opens, preventing mouseup blur
  useEffect(() => {
    if (textInputPos && textInputRef.current) {
      textInputOpenedAtRef.current = Date.now();
      const el = textInputRef.current;
      el.focus();
      const timer = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
          const val = textInputRef.current.value;
          textInputRef.current.setSelectionRange(val.length, val.length);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [textInputPos?.id]);

  // Stage Mouse Down
  const handleMouseDown = (e: any) => {
    // Clicked empty background
    const isStage = e.target === e.target.getStage();
    const stage = stageRef.current;
    if (!stage) return;

    const { x, y } = getWorldPointer();

    if (readOnly || currentTool === "hand") {
      // Hand tool handles panning naturally
      return;
    }

    // If there's an active text input open and user clicks elsewhere, commit it!
    if (textInputPos) {
      if (draftTextValue.trim()) {
        handleTextSave(draftTextValue);
      } else {
        setEditingTextId(null);
        setTextInputPos(null);
        setDraftTextValue("");
      }
    }

    // Text tool: directly launch transparent inline typing at any clicked location
    if (currentTool === "text") {
      const pointer = stage?.getPointerPosition() || { x: x * scale + position.x, y: y * scale + position.y };
      const id = crypto.randomUUID();
      textInputOpenedAtRef.current = Date.now();
      setEditingTextId(id);
      setDraftTextValue("");
      setTextInputPos({
        id,
        isNew: true,
        worldX: x,
        worldY: y,
        screenX: pointer.x,
        screenY: pointer.y,
        text: "",
        fontSize: 22,
        fontFamily: "'Architects Daughter', cursive",
        stroke: defaultStroke,
      });
      return;
    }

    // Tapping on empty canvas when elements are selected makes the option go away (elements become static)
    if (isStage && selectedIds.length > 0) {
      onSelectElements([]);
      return;
    }

    if (currentTool === "select") {
      if (isStage) {
        onSelectElements([]);
      }
      return;
    }

    if (currentTool === "eraser") {
      // If clicking directly on an element, delete it
      if (!isStage && e.target.id()) {
        onDeleteElement(e.target.id());
      }
      isDrawing.current = true;
      return;
    }

    // Shape / Line / Pencil tools
    isDrawing.current = true;
    const id = crypto.randomUUID();
    currentElementId.current = id;

    let draft: CanvasElement | null = null;

    if (currentTool === "freehand") {
      draft = {
        id,
        type: "freehand",
        x: 0,
        y: 0,
        points: [x, y],
        stroke: defaultStroke,
        strokeWidth: 2,
        fill: "transparent",
        opacity: 1,
        rotation: 0,
      };
    } else if (currentTool === "rect") {
      draft = {
        id,
        type: "rect",
        x,
        y,
        width: 1,
        height: 1,
        stroke: defaultStroke,
        strokeWidth: 2,
        fill: "transparent",
        opacity: 1,
        rotation: 0,
      };
    } else if (currentTool === "circle") {
      draft = {
        id,
        type: "circle",
        x,
        y,
        radiusX: 1,
        radiusY: 1,
        stroke: defaultStroke,
        strokeWidth: 2,
        fill: "transparent",
        opacity: 1,
        rotation: 0,
      };
    } else if (currentTool === "line") {
      draft = {
        id,
        type: "line",
        x: 0,
        y: 0,
        points: [x, y, x, y],
        stroke: defaultStroke,
        strokeWidth: 2,
        fill: "transparent",
        opacity: 1,
        rotation: 0,
      };
    } else if (currentTool === "arrow") {
      draft = {
        id,
        type: "arrow",
        x: 0,
        y: 0,
        points: [x, y, x, y],
        stroke: defaultStroke,
        strokeWidth: 2,
        fill: "transparent",
        opacity: 1,
        rotation: 0,
      };
    }

    if (draft) {
      draftElementRef.current = draft;
      setDraftElement(draft);
    }
  };

  // Stage Mouse Move
  const handleMouseMove = (e: any) => {
    const { x, y } = getWorldPointer();

    // Directly update HUD text via DOM ref to avoid re-rendering DrawingCanvas on every pixel
    if (hudXRef.current) hudXRef.current.textContent = String(Math.round(x));
    if (hudYRef.current) hudYRef.current.textContent = String(Math.round(y));

    // Broadcast cursor position to collaborators (throttled at ~25fps)
    const now = performance.now();
    if (onCursorMove && now - lastCursorEmitRef.current > 40) {
      lastCursorEmitRef.current = now;
      onCursorMove(x, y);
    }

    if (!isDrawing.current || readOnly) return;

    if (currentTool === "eraser") {
      // If hovering over an element while erasing, delete it
      if (e.target !== e.target.getStage() && e.target.id()) {
        onDeleteElement(e.target.id());
      }
      return;
    }

    const draft = draftElementRef.current;
    if (!draft) return;

    if (currentTool === "freehand") {
      draft.points = [...(draft.points || []), x, y];
    } else if (currentTool === "rect") {
      draft.width = x - draft.x;
      draft.height = y - draft.y;
    } else if (currentTool === "circle") {
      draft.radiusX = Math.abs(x - draft.x);
      draft.radiusY = Math.abs(y - draft.y);
    } else if (currentTool === "line" || currentTool === "arrow") {
      if (draft.points && draft.points.length >= 2) {
        draft.points = [draft.points[0]!, draft.points[1]!, x, y];
      }
    }

    // Schedule RAF render of live in-progress draft layer
    if (!draftRafRef.current) {
      draftRafRef.current = requestAnimationFrame(() => {
        draftRafRef.current = null;
        if (draftElementRef.current) {
          setDraftElement({ ...draftElementRef.current });
        }
      });
    }
  };

  // Stage Mouse Up
  const handleMouseUp = () => {
    if (draftRafRef.current) {
      cancelAnimationFrame(draftRafRef.current);
      draftRafRef.current = null;
    }

    if (isDrawing.current && draftElementRef.current) {
      const finalDraft = { ...draftElementRef.current };
      draftElementRef.current = null;
      setDraftElement(null);
      isDrawing.current = false;
      currentElementId.current = null;

      // Filter out accidental 0px / 1px micro-taps
      const isSignificant =
        (finalDraft.type === "rect" && Math.abs(finalDraft.width || 0) > 3 && Math.abs(finalDraft.height || 0) > 3) ||
        (finalDraft.type === "circle" && ((finalDraft.radiusX || 0) > 3 || (finalDraft.radiusY || 0) > 3)) ||
        (finalDraft.type === "freehand" && (finalDraft.points?.length || 0) > 2) ||
        (finalDraft.type === "line" && (finalDraft.points?.length || 0) >= 4) ||
        (finalDraft.type === "arrow" && (finalDraft.points?.length || 0) >= 4) ||
        finalDraft.type === "text";

      if (isSignificant) {
        // Commit element ONCE to parent state, undo history, and backend/socket
        onAddElement(finalDraft);
        // Automatically select the newly created figure so user gets the option to move it
        onSelectElements([finalDraft.id]);
        if (onSelectTool) {
          onSelectTool("select");
        }
      }
      return;
    }

    isDrawing.current = false;
    currentElementId.current = null;
  };

  // Wheel Zoom around pointer
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.08;
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    const clampedScale = Math.max(0.1, Math.min(5, newScale));

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setScale(clampedScale);
    setPosition(newPos);
  };

  // Double click text to edit inline
  const handleTextDblClick = (el: CanvasElement) => {
    if (readOnly) return;
    setEditingTextId(el.id);
    setDraftTextValue(el.text || "");
    setTextInputPos({
      id: el.id,
      isNew: false,
      worldX: el.x,
      worldY: el.y,
      screenX: el.x * scale + position.x,
      screenY: el.y * scale + position.y,
      text: el.text || "",
      fontSize: el.fontSize || 22,
      fontFamily: el.fontFamily || "'Architects Daughter', cursive",
      stroke: el.stroke || defaultStroke,
    });
  };

  const handleTextSave = (newText?: string) => {
    if (!textInputPos) {
      setEditingTextId(null);
      setDraftTextValue("");
      return;
    }

    const textToSave = newText !== undefined ? newText : draftTextValue;
    const trimmed = textToSave.trim();

    if (textInputPos.isNew) {
      if (trimmed) {
        const newEl: CanvasElement = {
          id: textInputPos.id,
          type: "text",
          x: textInputPos.worldX,
          y: textInputPos.worldY,
          text: trimmed,
          fontSize: textInputPos.fontSize,
          fontFamily: textInputPos.fontFamily,
          stroke: textInputPos.stroke,
          fill: "transparent",
          opacity: 1,
          rotation: 0,
        };
        onAddElement(newEl);
        onSelectElements([newEl.id]);
      }
    } else {
      if (trimmed) {
        onUpdateElement(textInputPos.id, { text: trimmed });
      } else {
        onDeleteElement(textInputPos.id);
      }
    }

    setEditingTextId(null);
    setTextInputPos(null);
    setDraftTextValue("");
  };

  // Connected figures movement cluster tracking
  const handleElementDragStart = (elId: string, _e: any) => {
    // Discover the entire connected component (Figure A <-> Arrow <-> Figure B)
    const cluster = getConnectedCluster(elId, elements, 28);
    const initialPositions = new Map<string, { x: number; y: number }>();

    for (const item of cluster) {
      initialPositions.set(item.id, { x: item.x, y: item.y });
    }

    dragClusterRef.current = {
      draggedId: elId,
      initialPositions,
      cluster,
    };
  };

  const handleElementDragMove = (elId: string, e: any) => {
    if (!dragClusterRef.current || dragClusterRef.current.draggedId !== elId) return;

    const node = e.target;
    const initialPos = dragClusterRef.current.initialPositions.get(elId);
    if (!initialPos) return;

    const dx = node.x() - initialPos.x;
    const dy = node.y() - initialPos.y;

    const stage = stageRef.current;
    if (!stage) return;

    // Real-time synchronization: move all connected figures and arrows alongside
    for (const item of dragClusterRef.current.cluster) {
      if (item.id === elId) continue;
      const itemInit = dragClusterRef.current.initialPositions.get(item.id);
      if (!itemInit) continue;

      const otherNode = stage.findOne("#" + item.id);
      if (otherNode) {
        otherNode.x(itemInit.x + dx);
        otherNode.y(itemInit.y + dy);
      }
    }

    stage.getLayer()?.batchDraw();
  };

  const handleElementDragEnd = (elId: string, e: any) => {
    if (!dragClusterRef.current || dragClusterRef.current.draggedId !== elId) {
      onUpdateElement(elId, {
        x: e.target.x(),
        y: e.target.y(),
      });
      return;
    }

    const node = e.target;
    const initialPos = dragClusterRef.current.initialPositions.get(elId);
    const dx = initialPos ? node.x() - initialPos.x : 0;
    const dy = initialPos ? node.y() - initialPos.y : 0;

    const updatedCluster: CanvasElement[] = [];

    for (const item of dragClusterRef.current.cluster) {
      if (item.id === elId) {
        updatedCluster.push({
          ...item,
          x: node.x(),
          y: node.y(),
        });
      } else {
        const itemInit = dragClusterRef.current.initialPositions.get(item.id);
        if (itemInit) {
          updatedCluster.push({
            ...item,
            x: itemInit.x + dx,
            y: itemInit.y + dy,
          });
        }
      }
    }

    dragClusterRef.current = null;

    if (onBatchUpdateElements && updatedCluster.length > 1) {
      onBatchUpdateElements(updatedCluster);
    } else {
      for (const updatedEl of updatedCluster) {
        onUpdateElement(updatedEl.id, { x: updatedEl.x, y: updatedEl.y });
      }
    }
  };

  return (
    <div
      className="relative w-full h-[calc(100vh-3.5rem)] overflow-hidden bg-(--canvas-bg) select-none"
      style={{
        cursor: getCanvasCursor(),
      }}
    >
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40 transition-opacity"
        style={{
          backgroundImage: `radial-gradient(var(--canvas-grid) 1.5px, transparent 1.5px)`,
          backgroundSize: `${24 * scale}px ${24 * scale}px`,
          backgroundPosition: `${position.x}px ${position.y}px`,
        }}
      />

      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight - 56}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={currentTool === "hand"}
        onDragEnd={(e) => {
          if (e.target === stageRef.current) {
            setPosition({ x: e.target.x(), y: e.target.y() });
          }
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
        onDblClick={(e) => {
          const isStage = e.target === e.target.getStage();
          if (isStage && currentTool === "select" && !readOnly) {
            const { x, y } = getWorldPointer();
            const stage = stageRef.current;
            const pointer = stage?.getPointerPosition() || { x: x * scale + position.x, y: y * scale + position.y };
            const id = crypto.randomUUID();
            textInputOpenedAtRef.current = Date.now();
            setEditingTextId(id);
            setDraftTextValue("");
            setTextInputPos({
              id,
              isNew: true,
              worldX: x,
              worldY: y,
              screenX: pointer.x,
              screenY: pointer.y,
              text: "",
              fontSize: 22,
              fontFamily: "'Architects Daughter', cursive",
              stroke: defaultStroke,
            });
          }
        }}
        style={{
          cursor: getCanvasCursor(),
        }}
      >
        <Layer>
          {elements.map((el) => {
            const isSelected = selectedIds.includes(el.id);
            const isDraggable = currentTool === "select" && isSelected && !readOnly && !el.isLocked;
            const dashArray =
              el.strokeStyle === "dashed" ? [8, 8] : el.strokeStyle === "dotted" ? [3, 5] : undefined;

            if (el.type === "rect") {
              return (
                <Rect
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  width={el.width}
                  height={el.height}
                  stroke={el.stroke || defaultStroke}
                  strokeWidth={el.strokeWidth || 2}
                  dash={dashArray}
                  fill={el.fill === "transparent" ? undefined : el.fill}
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation ?? 0}
                  cornerRadius={6}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      width: Math.max(5, (el.width || 100) * scaleX),
                      height: Math.max(5, (el.height || 60) * scaleY),
                      rotation: node.rotation(),
                    });
                  }}
                />
              );
            }

            if (el.type === "circle") {
              return (
                <Ellipse
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  radiusX={el.radiusX || 40}
                  radiusY={el.radiusY || 40}
                  stroke={el.stroke || defaultStroke}
                  strokeWidth={el.strokeWidth || 2}
                  dash={dashArray}
                  fill={el.fill === "transparent" ? undefined : el.fill}
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation ?? 0}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                  onTransformEnd={(e) => {
                    const node = e.target;
                    const scaleX = node.scaleX();
                    const scaleY = node.scaleY();
                    node.scaleX(1);
                    node.scaleY(1);
                    onUpdateElement(el.id, {
                      x: node.x(),
                      y: node.y(),
                      radiusX: Math.max(5, (el.radiusX || 40) * scaleX),
                      radiusY: Math.max(5, (el.radiusY || 40) * scaleY),
                      rotation: node.rotation(),
                    });
                  }}
                />
              );
            }

            if (el.type === "line") {
              return (
                <Line
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  points={el.points || []}
                  stroke={el.stroke || defaultStroke}
                  strokeWidth={el.strokeWidth || 2}
                  dash={dashArray}
                  lineCap="round"
                  lineJoin="round"
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation ?? 0}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                />
              );
            }

            if (el.type === "arrow") {
              return (
                <Arrow
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  points={el.points || []}
                  stroke={el.stroke || defaultStroke}
                  fill={el.stroke || defaultStroke}
                  strokeWidth={el.strokeWidth || 2}
                  pointerLength={12}
                  pointerWidth={10}
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation ?? 0}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                />
              );
            }

            if (el.type === "freehand") {
              return (
                <Line
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  points={el.points || []}
                  stroke={el.stroke || defaultStroke}
                  strokeWidth={el.strokeWidth || 2}
                  tension={0.4}
                  lineCap="round"
                  lineJoin="round"
                  opacity={el.opacity ?? 1}
                  rotation={el.rotation ?? 0}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      onSelectElements([el.id]);
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                />
              );
            }

            if (el.type === "text") {
              return (
                <Text
                  key={el.id}
                  id={el.id}
                  x={el.x}
                  y={el.y}
                  text={el.text}
                  fontSize={el.fontSize || 22}
                  fontFamily={el.fontFamily || "'Architects Daughter', cursive"}
                  fill={el.stroke || defaultStroke}
                  opacity={editingTextId === el.id ? 0 : (el.opacity ?? 1)}
                  rotation={el.rotation ?? 0}
                  draggable={isDraggable}
                  onClick={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      if (selectedIds.includes(el.id)) {
                        handleTextDblClick(el);
                      } else {
                        onSelectElements([el.id]);
                      }
                    } else if (currentTool === "text") {
                      e.cancelBubble = true;
                      handleTextDblClick(el);
                    }
                  }}
                  onTap={(e) => {
                    if (currentTool === "select") {
                      e.cancelBubble = true;
                      if (selectedIds.includes(el.id)) {
                        handleTextDblClick(el);
                      } else {
                        onSelectElements([el.id]);
                      }
                    } else if (currentTool === "text") {
                      e.cancelBubble = true;
                      handleTextDblClick(el);
                    }
                  }}
                  onDblClick={() => handleTextDblClick(el)}
                  onMouseEnter={(e) => {
                    if (currentTool === "text" || currentTool === "select") {
                      const stage = e.target.getStage();
                      if (stage) stage.container().style.cursor = "text";
                    }
                  }}
                  onMouseLeave={() => {
                    if (stageRef.current) {
                      const toolCursor =
                        currentTool === "text"
                          ? "text"
                          : currentTool === "hand"
                          ? "grab"
                          : currentTool === "select"
                          ? "default"
                          : "crosshair";
                      stageRef.current.container().style.cursor = toolCursor;
                    }
                  }}
                  onDragStart={(e) => handleElementDragStart(el.id, e)}
                  onDragMove={(e) => handleElementDragMove(el.id, e)}
                  onDragEnd={(e) => handleElementDragEnd(el.id, e)}
                />
              );
            }

            return null;
          })}

          {/* High-speed local draft preview (listening=false for maximum performance) */}
          {draftElement && (
            <>
              {draftElement.type === "freehand" && draftElement.points && (
                <Line
                  points={draftElement.points}
                  stroke={draftElement.stroke || defaultStroke}
                  strokeWidth={draftElement.strokeWidth || 2}
                  tension={0.4}
                  lineCap="round"
                  lineJoin="round"
                  opacity={draftElement.opacity ?? 1}
                  listening={false}
                />
              )}
              {draftElement.type === "rect" && (
                <Rect
                  x={draftElement.width! < 0 ? draftElement.x + draftElement.width! : draftElement.x}
                  y={draftElement.height! < 0 ? draftElement.y + draftElement.height! : draftElement.y}
                  width={Math.abs(draftElement.width!)}
                  height={Math.abs(draftElement.height!)}
                  stroke={draftElement.stroke || defaultStroke}
                  strokeWidth={draftElement.strokeWidth || 2}
                  fill={draftElement.fill === "transparent" ? undefined : draftElement.fill}
                  opacity={draftElement.opacity ?? 1}
                  cornerRadius={6}
                  listening={false}
                />
              )}
              {draftElement.type === "circle" && (
                <Ellipse
                  x={draftElement.x}
                  y={draftElement.y}
                  radiusX={draftElement.radiusX || 1}
                  radiusY={draftElement.radiusY || 1}
                  stroke={draftElement.stroke || defaultStroke}
                  strokeWidth={draftElement.strokeWidth || 2}
                  fill={draftElement.fill === "transparent" ? undefined : draftElement.fill}
                  opacity={draftElement.opacity ?? 1}
                  listening={false}
                />
              )}
              {draftElement.type === "line" && draftElement.points && (
                <Line
                  points={draftElement.points}
                  stroke={draftElement.stroke || defaultStroke}
                  strokeWidth={draftElement.strokeWidth || 2}
                  lineCap="round"
                  lineJoin="round"
                  opacity={draftElement.opacity ?? 1}
                  listening={false}
                />
              )}
              {draftElement.type === "arrow" && draftElement.points && (
                <Arrow
                  points={draftElement.points}
                  stroke={draftElement.stroke || defaultStroke}
                  strokeWidth={draftElement.strokeWidth || 2}
                  fill={draftElement.stroke || defaultStroke}
                  pointerLength={10}
                  pointerWidth={8}
                  opacity={draftElement.opacity ?? 1}
                  listening={false}
                />
              )}
            </>
          )}

          {/* Konva Selection Transformer */}
          {!readOnly && (
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                // Minimum size limit
                if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                  return oldBox;
                }
                return newBox;
              }}
              borderStroke="var(--accent-primary)"
              borderStrokeWidth={1.5}
              anchorStroke="var(--accent-primary)"
              anchorFill="#FFFFFF"
              anchorSize={8}
              anchorCornerRadius={2}
            />
          )}

          {/* Multiplayer Remote Cursors */}
          {cursors.map((c) => (
            <Group key={c.userId} x={c.x} y={c.y}>
              <Line
                points={[0, 0, 0, 16, 4, 12, 10, 12, 0, 0]}
                fill={c.color || "#8B5CF6"}
                stroke="#FFFFFF"
                strokeWidth={1}
                closed
              />
              <Text
                x={12}
                y={8}
                text={c.username}
                fontSize={11}
                fontFamily="sans-serif"
                fill="#FFFFFF"
                padding={3}
              />
            </Group>
          ))}
        </Layer>
      </Stage>

      {/* Architectural Viewport Top Ruler */}
      <div className="absolute top-0 left-0 right-0 h-4 bg-(--bg-surface-elevated) border-b border-(--border-subtle) z-10 pointer-events-none select-none overflow-hidden opacity-60">
        <div className="w-full h-full ruler-ticks-top" />
      </div>

      {/* Architectural Viewport Left Ruler */}
      <div className="absolute top-4 left-0 bottom-0 w-4 bg-(--bg-surface-elevated) border-r border-(--border-subtle) z-10 pointer-events-none select-none overflow-hidden opacity-60">
        <div className="w-full h-full ruler-ticks-left" />
      </div>

      {/* Drafting HUD Overlay */}
      <div className="absolute bottom-5 left-7 z-20 pointer-events-none px-3 py-1.5 rounded-lg bg-(--bg-surface) border border-(--border-strong) text-[11px] font-mono text-(--text-muted) flex items-center gap-3 shadow-md select-none">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>X: <strong ref={hudXRef} className="text-(--text-primary)">0</strong></span>
        </span>
        <span>Y: <strong ref={hudYRef} className="text-(--text-primary)">0</strong></span>
        <span>ZOOM: <strong className="text-(--text-primary)">{Math.round(scale * 100)}%</strong></span>
        <span>ITEMS: <strong className="text-(--text-primary)">{elements.length}</strong></span>
      </div>

      {/* Transparent Inline Text Editor Overlay */}
      {textInputPos && (
        <textarea
          ref={textInputRef}
          autoFocus
          className="select-text pointer-events-auto"
          placeholder="Type here..."
          value={draftTextValue}
          onChange={(e) => {
            setDraftTextValue(e.target.value);
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.max(34, el.scrollHeight)}px`;
            el.style.width = "auto";
            el.style.width = `${Math.max(160, el.scrollWidth + 14)}px`;
          }}
          onFocus={(e) => {
            const val = e.currentTarget.value;
            e.currentTarget.setSelectionRange(val.length, val.length);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onBlur={() => {
            // Prevent premature blur from mouse-up right after opening
            if (Date.now() - textInputOpenedAtRef.current < 350) {
              textInputRef.current?.focus();
              return;
            }
            handleTextSave(draftTextValue);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleTextSave(draftTextValue);
            } else if (e.key === "Escape") {
              setEditingTextId(null);
              setTextInputPos(null);
              setDraftTextValue("");
            }
          }}
          style={{
            position: "absolute",
            top: `${textInputPos.screenY}px`,
            left: `${textInputPos.screenX}px`,
            fontSize: `${textInputPos.fontSize * scale}px`,
            fontFamily: textInputPos.fontFamily,
            color: textInputPos.stroke,
            background: "transparent",
            border: "1.5px dashed var(--accent-primary)",
            borderRadius: "6px",
            outline: "none",
            resize: "none",
            padding: "4px 8px",
            lineHeight: "1.25",
            zIndex: 40,
            minWidth: "160px",
            minHeight: `${Math.max(34, textInputPos.fontSize * scale * 1.3)}px`,
            caretColor: textInputPos.stroke || "var(--accent-primary)",
            boxShadow: "none",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            userSelect: "text",
            cursor: "text",
          }}
        />
      )}
    </div>
  );
};
