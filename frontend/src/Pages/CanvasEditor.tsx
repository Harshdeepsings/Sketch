import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { connectSocket } from "../services/socket";
import { DrawingCanvas } from "../Components/Canvas/DrawingCanvas";
import { Toolbar } from "../Components/Canvas/Toolbar";
import { PropertiesPanel } from "../Components/Canvas/PropertiesPanel";
import { ZoomControls } from "../Components/Canvas/ZoomControls";
import { ExportModal } from "../Components/Canvas/ExportModal";
import { ShareModal } from "../Components/Canvas/ShareModal";
import { LibraryModal } from "../Components/Canvas/LibraryModal";
import { Navbar } from "../Components/Navbar";
import type {
  CanvasElement,
  ToolType,
  MultiplayerCursor,
  Participant,
  HistoryStep,
} from "../types/canvas";
import { computeDrawingBounds } from "../services/export";

export const CanvasEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const stageRef = useRef<any>(null);

  // Drawing Document State
  const [drawingTitle, setDrawingTitle] = useState("Untitled Drawing");
  const [drawingRole, setDrawingRole] = useState<"owner" | "editor" | "viewer">("editor");
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [revision, setRevision] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Active Tool & Selection State
  const [currentTool, setCurrentTool] = useState<ToolType>("select");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<CanvasElement[]>([]);

  // Viewport Transform State
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Multiplayer State
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [remoteCursors, setRemoteCursors] = useState<MultiplayerCursor[]>([]);

  // History Stack (Undo / Redo)
  const historyRef = useRef<HistoryStep[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Push element snapshot to history
  const pushHistory = useCallback((newElements: CanvasElement[]) => {
    const curIndex = historyIndexRef.current;
    const newHistory = historyRef.current.slice(0, curIndex + 1);
    newHistory.push({ elements: JSON.parse(JSON.stringify(newElements)) });

    // Limit history stack size to 50
    if (newHistory.length > 50) {
      newHistory.shift();
    }

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;

    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  // Initial Load from REST API
  useEffect(() => {
    if (!id) return;

    let mounted = true;

    async function loadDrawing() {
      try {
        setLoading(true);
        const res = await api.getDrawing(id!);
        if (!mounted) return;

        if (res.drawing) {
          setDrawingTitle(res.drawing.title);
          setDrawingRole(res.drawing.role);
          setElements(res.drawing.elements || []);
          setRevision(res.drawing.revision || 1);

          // Initialize history
          historyRef.current = [{ elements: JSON.parse(JSON.stringify(res.drawing.elements || [])) }];
          historyIndexRef.current = 0;
          setCanUndo(false);
          setCanRedo(false);
        }
      } catch (err: any) {
        if (!mounted) return;
        if (err.status === 403 || err.status === 401) {
          setAccessDenied(true);
        } else {
          console.error("Error loading drawing:", err);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadDrawing();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Socket.IO Multiplayer Synchronization
  useEffect(() => {
    if (!id || accessDenied || loading) return;

    const socket = connectSocket();

    socket.emit("join-drawing", { drawingId: id });

    // Room joined initial sync
    socket.on("room-joined", (data: any) => {
      if (data.elements && data.elements.length > 0) {
        setElements(data.elements);
        historyRef.current = [{ elements: JSON.parse(JSON.stringify(data.elements)) }];
        historyIndexRef.current = 0;
      }
      if (data.role) setDrawingRole(data.role);
      if (data.revision) setRevision(data.revision);
      if (data.participants) setParticipants(data.participants);
    });

    // Remote element added
    socket.on("element-created", (newEl: CanvasElement) => {
      setElements((prev) => {
        if (prev.some((e) => e.id === newEl.id)) return prev;
        return [...prev, newEl];
      });
    });

    // Remote element updated
    socket.on("element-updated", (updatedEl: CanvasElement) => {
      setElements((prev) =>
        prev.map((el) => (el.id === updatedEl.id ? { ...el, ...updatedEl } : el))
      );
    });

    // Remote batch elements updated
    socket.on("elements-batch-updated", (batch: CanvasElement[]) => {
      const updateMap = new Map(batch.map((el) => [el.id, el]));
      setElements((prev) =>
        prev.map((el) => (updateMap.has(el.id) ? { ...el, ...updateMap.get(el.id)! } : el))
      );
    });

    // Remote element deleted
    socket.on("element-deleted", ({ id: deletedId }: { id: string }) => {
      setElements((prev) => prev.filter((el) => el.id !== deletedId));
      setSelectedIds((prev) => prev.filter((id) => id !== deletedId));
    });

    // Remote canvas clear
    socket.on("canvas-cleared", () => {
      setElements([]);
      setSelectedIds([]);
    });

    // Collaborator cursor update
    socket.on("cursor-update", (data: MultiplayerCursor) => {
      setRemoteCursors((prev) => {
        const index = prev.findIndex((c) => c.userId === data.userId);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = data;
          return updated;
        }
        return [...prev, data];
      });
    });

    // Collaborator joined
    socket.on("participant-joined", (participant: Participant) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.userId === participant.userId)) return prev;
        return [...prev, participant];
      });
    });

    // Collaborator left
    socket.on("participant-left", ({ userId }: { userId: string }) => {
      setParticipants((prev) => prev.filter((p) => p.userId !== userId));
      setRemoteCursors((prev) => prev.filter((c) => c.userId !== userId));
    });

    // Background persistence notification
    socket.on("drawing-saved", () => {
      setSaveStatus("saved");
    });

    return () => {
      socket.off("room-joined");
      socket.off("element-created");
      socket.off("element-updated");
      socket.off("elements-batch-updated");
      socket.off("element-deleted");
      socket.off("canvas-cleared");
      socket.off("cursor-update");
      socket.off("participant-joined");
      socket.off("participant-left");
      socket.off("drawing-saved");
    };
  }, [id, accessDenied, loading]);

  // Debounced HTTP Autosave
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerSave = useCallback(
    (newElements: CanvasElement[], newTitle?: string) => {
      if (drawingRole === "viewer") return;

      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await api.updateDrawing(id!, {
            elements: newElements,
            title: newTitle || drawingTitle,
            expectedRevision: revision,
          });
          if (res.revision !== undefined) {
            setRevision(res.revision);
          }
          setSaveStatus("saved");
        } catch (err) {
          console.error("Autosave error:", err);
          setSaveStatus("error");
        }
      }, 1500);
    },
    [id, drawingTitle, revision, drawingRole]
  );

  // Element Manipulation Handlers
  const handleAddElement = useCallback(
    (newEl: CanvasElement) => {
      if (drawingRole === "viewer") return;

      setElements((prev) => {
        const updated = [...prev, newEl];
        pushHistory(updated);
        triggerSave(updated);
        return updated;
      });

      const socket = connectSocket();
      socket.emit("element-create", newEl);
    },
    [drawingRole, pushHistory, triggerSave]
  );

  const handleUpdateElement = useCallback(
    (elId: string, updates: Partial<CanvasElement>) => {
      if (drawingRole === "viewer") return;

      let changedEl: CanvasElement | null = null;
      const updated = elements.map((el) => {
        if (el.id === elId) {
          changedEl = { ...el, ...updates };
          return changedEl;
        }
        return el;
      });

      setElements(updated);
      pushHistory(updated);
      triggerSave(updated);

      if (changedEl) {
        const socket = connectSocket();
        socket.emit("element-update", changedEl);
      }
    },
    [elements, drawingRole, pushHistory, triggerSave]
  );

  const handleBatchUpdateElements = useCallback(
    (updatedList: CanvasElement[]) => {
      if (drawingRole === "viewer" || updatedList.length === 0) return;

      const updatedMap = new Map(updatedList.map((el) => [el.id, el]));
      const updated = elements.map((el) => updatedMap.get(el.id) || el);

      setElements(updated);
      pushHistory(updated);
      triggerSave(updated);

      const socket = connectSocket();
      for (const el of updatedList) {
        socket.emit("element-update", el);
      }
    },
    [elements, drawingRole, pushHistory, triggerSave]
  );

  const handleDeleteElement = useCallback(
    (elId: string) => {
      if (drawingRole === "viewer") return;

      const updated = elements.filter((el) => el.id !== elId);
      setElements(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== elId));
      pushHistory(updated);
      triggerSave(updated);

      const socket = connectSocket();
      socket.emit("element-delete", { id: elId });
    },
    [elements, drawingRole, pushHistory, triggerSave]
  );

  const handleClearCanvas = useCallback(() => {
    if (drawingRole === "viewer") return;
    if (!window.confirm("Are you sure you want to clear the entire canvas?")) return;

    setElements([]);
    setSelectedIds([]);
    pushHistory([]);
    triggerSave([]);

    const socket = connectSocket();
    socket.emit("canvas-clear");
  }, [drawingRole, pushHistory, triggerSave]);

  // Undo / Redo Actions
  const handleUndo = useCallback(() => {
    if (drawingRole === "viewer" || historyIndexRef.current <= 0) return;

    const nextIndex = historyIndexRef.current - 1;
    const step = historyRef.current[nextIndex];
    if (step) {
      historyIndexRef.current = nextIndex;
      const newElements = JSON.parse(JSON.stringify(step.elements));
      setElements(newElements);
      triggerSave(newElements);
      setCanUndo(nextIndex > 0);
      setCanRedo(true);

      const socket = connectSocket();
      socket.emit("elements-batch-update", newElements);
    }
  }, [drawingRole, triggerSave]);

  const handleRedo = useCallback(() => {
    if (drawingRole === "viewer" || historyIndexRef.current >= historyRef.current.length - 1) return;

    const nextIndex = historyIndexRef.current + 1;
    const step = historyRef.current[nextIndex];
    if (step) {
      historyIndexRef.current = nextIndex;
      const newElements = JSON.parse(JSON.stringify(step.elements));
      setElements(newElements);
      triggerSave(newElements);
      setCanUndo(true);
      setCanRedo(nextIndex < historyRef.current.length - 1);

      const socket = connectSocket();
      socket.emit("elements-batch-update", newElements);
    }
  }, [drawingRole, triggerSave]);

  // Duplicate Selected
  const handleDuplicateSelected = useCallback(() => {
    if (drawingRole === "viewer" || selectedIds.length === 0) return;

    const newElementsToAdd: CanvasElement[] = [];
    const newSelectedIds: string[] = [];

    selectedIds.forEach((id) => {
      const orig = elements.find((el) => el.id === id);
      if (orig) {
        const cloned: CanvasElement = {
          ...JSON.parse(JSON.stringify(orig)),
          id: crypto.randomUUID(),
          x: orig.x + 20,
          y: orig.y + 20,
        };
        newElementsToAdd.push(cloned);
        newSelectedIds.push(cloned.id);
      }
    });

    const updated = [...elements, ...newElementsToAdd];
    setElements(updated);
    setSelectedIds(newSelectedIds);
    pushHistory(updated);
    triggerSave(updated);

    const socket = connectSocket();
    newElementsToAdd.forEach((el) => socket.emit("element-create", el));
  }, [drawingRole, selectedIds, elements, pushHistory, triggerSave]);

  // Grouping & Locking Handlers
  const handleToggleLock = () => {
    if (selectedIds.length === 0) return;
    const firstSelected = elements.find((el) => el.id === selectedIds[0]);
    const nextLocked = !(firstSelected?.isLocked === true);

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, isLocked: nextLocked };
      }
      return el;
    });

    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);

    const socket = connectSocket();
    socket.emit("elements-batch-update", updated.filter((el) => selectedIds.includes(el.id)));
  };

  const handleGroup = () => {
    if (selectedIds.length <= 1) return;
    const groupId = crypto.randomUUID();

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        return { ...el, groupId };
      }
      return el;
    });

    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);

    const socket = connectSocket();
    socket.emit("elements-batch-update", updated.filter((el) => selectedIds.includes(el.id)));
  };

  const handleUngroup = () => {
    if (selectedIds.length === 0) return;

    const updated = elements.map((el) => {
      if (selectedIds.includes(el.id)) {
        const { groupId: _, ...rest } = el;
        return rest;
      }
      return el;
    });

    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);

    const socket = connectSocket();
    socket.emit("elements-batch-update", updated.filter((el) => selectedIds.includes(el.id)));
  };

  const handleInsertLibraryElements = (newElements: CanvasElement[]) => {
    const updated = [...elements, ...newElements];
    setElements(updated);
    setSelectedIds(newElements.map((el) => el.id));
    pushHistory(updated);
    triggerSave(updated);

    const socket = connectSocket();
    newElements.forEach((el) => socket.emit("element-create", el));
  };
  const handleBringForward = () => {
    if (selectedIds.length === 0) return;
    const updated = [...elements];
    selectedIds.forEach((id) => {
      const idx = updated.findIndex((el) => el.id === id);
      if (idx !== -1 && idx < updated.length - 1) {
        const temp = updated[idx]!;
        updated[idx] = updated[idx + 1]!;
        updated[idx + 1] = temp;
      }
    });
    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);
  };

  const handleSendBackward = () => {
    if (selectedIds.length === 0) return;
    const updated = [...elements];
    selectedIds.forEach((id) => {
      const idx = updated.findIndex((el) => el.id === id);
      if (idx > 0) {
        const temp = updated[idx]!;
        updated[idx] = updated[idx - 1]!;
        updated[idx - 1] = temp;
      }
    });
    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);
  };

  const handleBringToFront = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    const rest = elements.filter((el) => !selectedIds.includes(el.id));
    const updated = [...rest, ...selected];
    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);
  };

  const handleSendToBack = () => {
    if (selectedIds.length === 0) return;
    const selected = elements.filter((el) => selectedIds.includes(el.id));
    const rest = elements.filter((el) => !selectedIds.includes(el.id));
    const updated = [...selected, ...rest];
    setElements(updated);
    pushHistory(updated);
    triggerSave(updated);
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input or textarea
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl/Cmd + Z
      if (cmdOrCtrl && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((cmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z") || (cmdOrCtrl && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate: Ctrl/Cmd + D
      if (cmdOrCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      // Copy: Ctrl/Cmd + C
      if (cmdOrCtrl && e.key.toLowerCase() === "c") {
        if (selectedIds.length > 0) {
          const selected = elements.filter((el) => selectedIds.includes(el.id));
          setClipboard(selected);
        }
        return;
      }

      // Paste: Ctrl/Cmd + V
      if (cmdOrCtrl && e.key.toLowerCase() === "v") {
        if (clipboard.length > 0) {
          e.preventDefault();
          const pasted: CanvasElement[] = clipboard.map((el) => ({
            ...JSON.parse(JSON.stringify(el)),
            id: crypto.randomUUID(),
            x: el.x + 30,
            y: el.y + 30,
          }));
          const updated = [...elements, ...pasted];
          setElements(updated);
          setSelectedIds(pasted.map((p) => p.id));
          pushHistory(updated);
          triggerSave(updated);
        }
        return;
      }

      // Delete: Delete or Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          e.preventDefault();
          selectedIds.forEach((id) => handleDeleteElement(id));
        }
        return;
      }

      // Tool shortcut keys
      if (!cmdOrCtrl && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case "v":
            setCurrentTool("select");
            break;
          case "h":
            setCurrentTool("hand");
            break;
          case "p":
            setCurrentTool("freehand");
            break;
          case "r":
            setCurrentTool("rect");
            break;
          case "c":
            setCurrentTool("circle");
            break;
          case "l":
            setCurrentTool("line");
            break;
          case "a":
            setCurrentTool("arrow");
            break;
          case "t":
            setCurrentTool("text");
            break;
          case "e":
            setCurrentTool("eraser");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleUndo,
    handleRedo,
    handleDuplicateSelected,
    selectedIds,
    elements,
    clipboard,
    handleDeleteElement,
    pushHistory,
    triggerSave,
  ]);

  // Zoom Helpers
  const handleZoomIn = () => setScale((s) => Math.min(5, s * 1.2));
  const handleZoomOut = () => setScale((s) => Math.max(0.1, s / 1.2));
  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };
  const handleFitContent = () => {
    const bounds = computeDrawingBounds(elements, 60);
    const availWidth = window.innerWidth;
    const availHeight = window.innerHeight - 56;
    const scaleX = availWidth / bounds.width;
    const scaleY = availHeight / bounds.height;
    const newScale = Math.min(scaleX, scaleY, 1.5);

    setScale(newScale);
    setPosition({
      x: (availWidth - bounds.width * newScale) / 2 - bounds.minX * newScale,
      y: (availHeight - bounds.height * newScale) / 2 - bounds.minY * newScale,
    });
  };

  const handleCursorBroadcast = (x: number, y: number) => {
    const socket = connectSocket();
    socket.emit("cursor-move", { x, y });
  };

  const handleTitleUpdate = (newTitle: string) => {
    setDrawingTitle(newTitle);
    triggerSave(elements, newTitle);
  };

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-xs text-(--text-muted) max-w-sm mb-6">
          This drawing is private. You do not have permission to view or edit this document.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-5 py-2.5 rounded-full bg-(--accent-primary) text-white text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-main) text-(--text-primary) flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mb-3" />
        <span className="text-xs text-(--text-muted) font-medium">Loading Sketch Canvas...</span>
      </div>
    );
  }

  const selectedElements = elements.filter((el) => selectedIds.includes(el.id));

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-(--bg-main) select-none">
      <Navbar
        title={drawingTitle}
        onTitleChange={handleTitleUpdate}
        saveStatus={saveStatus}
        onShareClick={() => setIsShareOpen(true)}
        onExportClick={() => setIsExportOpen(true)}
        participants={participants}
        drawingRole={drawingRole}
        showCanvasControls={true}
      />

      <DrawingCanvas
        elements={elements}
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        selectedIds={selectedIds}
        onSelectElements={setSelectedIds}
        onAddElement={handleAddElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onBatchUpdateElements={handleBatchUpdateElements}
        scale={scale}
        setScale={setScale}
        position={position}
        setPosition={setPosition}
        cursors={remoteCursors}
        onCursorMove={handleCursorBroadcast}
        stageRef={stageRef}
        readOnly={drawingRole === "viewer"}
      />

      {/* Floating Toolbar */}
      <Toolbar
        currentTool={currentTool}
        onSelectTool={setCurrentTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onClear={handleClearCanvas}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        readOnly={drawingRole === "viewer"}
      />

      {/* Contextual Properties Panel */}
      <PropertiesPanel
        selectedElements={selectedElements}
        onUpdateElement={(updates) => {
          selectedIds.forEach((id) => handleUpdateElement(id, updates));
        }}
        onDuplicate={handleDuplicateSelected}
        onDelete={() => selectedIds.forEach((id) => handleDeleteElement(id))}
        onBringForward={handleBringForward}
        onSendBackward={handleSendBackward}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onToggleLock={handleToggleLock}
        onGroup={handleGroup}
        onUngroup={handleUngroup}
        readOnly={drawingRole === "viewer"}
      />

      {/* Zoom & Pan Controls */}
      <ZoomControls
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitContent={handleFitContent}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        stageRef={stageRef}
        elements={elements}
        drawingTitle={drawingTitle}
      />

      {/* Share & Collaborator Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        drawingId={id!}
        isOwner={drawingRole === "owner"}
      />

      {/* Component Library & Templates Modal */}
      <LibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onInsertElements={handleInsertLibraryElements}
        viewportCenter={{
          x: (window.innerWidth / 2 - position.x) / scale,
          y: ((window.innerHeight - 56) / 2 - position.y) / scale,
        }}
      />
    </div>
  );
};
export default CanvasEditor;
