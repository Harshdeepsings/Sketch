import { Schema, model, Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  username: string;
  email: string;
  password?: string | undefined;
  googleId?: string | undefined;
  avatar?: string | undefined;
  provider?: "local" | "google" | undefined;
  name?: string | undefined;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: false },
    googleId: { type: String, sparse: true, index: true },
    avatar: { type: String },
    provider: { type: String, default: "local" },
    name: { type: String, trim: true },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("user", UserSchema);

export interface ICanvasElement {
  id: string;
  type: "rect" | "circle" | "line" | "arrow" | "freehand" | "text";
  x: number;
  y: number;
  width?: number | undefined;
  height?: number | undefined;
  radiusX?: number | undefined;
  radiusY?: number | undefined;
  points?: number[] | undefined;
  stroke?: string | undefined;
  strokeWidth?: number | undefined;
  strokeStyle?: "solid" | "dashed" | "dotted" | undefined;
  fill?: string | undefined;
  opacity?: number | undefined;
  rotation?: number | undefined;
  text?: string | undefined;
  fontSize?: number | undefined;
  fontFamily?: string | undefined;
  align?: string | undefined;
  zIndex?: number | undefined;
  groupId?: string | undefined;
  isLocked?: boolean | undefined;
}

export interface ICollaborator {
  user: Types.ObjectId;
  role: "editor" | "viewer";
  addedAt: Date;
}

export interface ICanvas {
  _id: Types.ObjectId;
  title: string;
  owner: Types.ObjectId;
  elements: ICanvasElement[];
  collaborators: ICollaborator[];
  isPublic: boolean;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
}

const CanvasElementSchema = new Schema<ICanvasElement>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["rect", "circle", "line", "arrow", "freehand", "text"],
    },
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    width: { type: Number },
    height: { type: Number },
    radiusX: { type: Number },
    radiusY: { type: Number },
    points: { type: [Number] },
    stroke: { type: String, default: "#E2E8F0" },
    strokeWidth: { type: Number, default: 2 },
    strokeStyle: { type: String, enum: ["solid", "dashed", "dotted"], default: "solid" },
    fill: { type: String, default: "transparent" },
    opacity: { type: Number, default: 1 },
    rotation: { type: Number, default: 0 },
    text: { type: String },
    fontSize: { type: Number, default: 18 },
    fontFamily: { type: String, default: "sans-serif" },
    align: { type: String, default: "left" },
    zIndex: { type: Number, default: 0 },
    groupId: { type: String },
    isLocked: { type: Boolean, default: false },
  },
  { _id: false }
);

const CollaboratorSchema = new Schema<ICollaborator>(
  {
    user: { type: Schema.Types.ObjectId, ref: "user", required: true },
    role: { type: String, enum: ["editor", "viewer"], default: "editor" },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const CanvasSchema = new Schema<ICanvas>(
  {
    title: { type: String, required: true, default: "Untitled Drawing", trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "user", required: true, index: true },
    elements: { type: [CanvasElementSchema], default: [] },
    collaborators: { type: [CollaboratorSchema], default: [] },
    isPublic: { type: Boolean, default: false },
    revision: { type: Number, default: 1 },
  },
  { timestamps: true }
);

CanvasSchema.index({ "collaborators.user": 1 });

export const CanvasModel = model<ICanvas>("canvas", CanvasSchema);

export interface IInvitation {
  _id: Types.ObjectId;
  drawingId: Types.ObjectId;
  inviterId: Types.ObjectId;
  inviteeEmail: string;
  role: "editor" | "viewer";
  status: "pending" | "accepted" | "declined" | "revoked";
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvitationSchema = new Schema<IInvitation>(
  {
    drawingId: { type: Schema.Types.ObjectId, ref: "canvas", required: true, index: true },
    inviterId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    inviteeEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    role: { type: String, enum: ["editor", "viewer"], default: "editor" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "revoked"],
      default: "pending",
      index: true,
    },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

export const InvitationModel = model<IInvitation>("invitation", InvitationSchema);
