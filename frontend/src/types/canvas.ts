export type ToolType =
  | "select"
  | "hand"
  | "freehand"
  | "rect"
  | "circle"
  | "line"
  | "arrow"
  | "text"
  | "eraser";

export interface CanvasElement {
  id: string;
  type: "rect" | "circle" | "line" | "arrow" | "freehand" | "text";
  x: number;
  y: number;
  width?: number;
  height?: number;
  radiusX?: number;
  radiusY?: number;
  points?: number[];
  stroke?: string;
  strokeWidth?: number;
  strokeStyle?: "solid" | "dashed" | "dotted";
  fill?: string;
  opacity?: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  align?: "left" | "center" | "right";
  zIndex?: number;
  groupId?: string;
  isLocked?: boolean;
}

export interface LibraryTemplate {
  id: string;
  name: string;
  category: "architecture" | "flowchart" | "ui" | "notes";
  iconName: string;
  elements: Omit<CanvasElement, "id">[];
}

export interface CollaboratorUser {
  id: string;
  username: string;
  email: string;
  name?: string;
}

export interface CollaboratorInfo {
  user: CollaboratorUser;
  role: "editor" | "viewer";
  addedAt?: string;
}

export interface DrawingDocument {
  id: string;
  title: string;
  owner: CollaboratorUser;
  elements: CanvasElement[];
  collaborators: CollaboratorInfo[];
  isPublic: boolean;
  role: "owner" | "editor" | "viewer";
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface MultiplayerCursor {
  userId: string;
  username: string;
  x: number;
  y: number;
  color: string;
}

export interface Participant {
  userId: string;
  username: string;
  name: string;
  color: string;
  role: "owner" | "editor" | "viewer";
  cursor?: { x: number; y: number } | null;
}

export interface HistoryStep {
  elements: CanvasElement[];
  description?: string;
}

export interface ExportOptions {
  format: "png" | "svg" | "pdf";
  scale: number;
  transparentBg: boolean;
  quality: number;
  name: string;
}
