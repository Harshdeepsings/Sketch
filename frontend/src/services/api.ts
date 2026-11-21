const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

// Simple HTTP request wrapper that passes session cookies automatically
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Essential for session cookies!
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    const errorMsg = data?.message || data?.errors?.[0] || `Request failed (${res.status})`;
    throw new ApiError(errorMsg, res.status, data);
  }

  return data as T;
}

export const api = {
  // Auth & Profile Endpoints
  signup: (body: { username: string; email: string; password: string; name?: string }) =>
    request<{ user: any; message: string }>("/user/signup", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  login: (body: { username?: string; email?: string; password: string }) =>
    request<{ user: any; message: string }>("/user/login", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getMe: () =>
    request<{ user: any; stats?: { ownedDrawings: number; sharedDrawings: number; totalDrawings: number } }>("/user/me"),

  updateProfile: (body: { name?: string; username?: string; email?: string }) =>
    request<{ user: any; message: string }>("/user/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ message: string }>("/user/password", {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  deleteAccount: () =>
    request<{ message: string }>("/user/account", {
      method: "DELETE",
    }),

  logout: () =>
    request<{ message: string }>("/user/logout", {
      method: "POST",
    }),

  // Canvas / Drawings Endpoints
  getDrawings: () =>
    request<{ drawings: any[] }>("/canvas"),

  getDrawing: (id: string) =>
    request<{ drawing: any; role: "owner" | "editor" | "viewer" }>(`/canvas/${id}`),

  createDrawing: (title?: string) =>
    request<{ drawing: any; role: string }>("/canvas", {
      method: "POST",
      body: JSON.stringify({ title: title || "Untitled Drawing" }),
    }),

  updateDrawing: (id: string, updates: { title?: string; elements?: any[]; expectedRevision?: number }) =>
    request<{ drawing: any; revision?: number; conflict?: boolean }>(`/canvas/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    }),

  deleteDrawing: (id: string) =>
    request<{ message: string }>(`/canvas/${id}`, {
      method: "DELETE",
    }),

  duplicateDrawing: (id: string) =>
    request<{ drawing: any; message: string }>(`/canvas/${id}/duplicate`, {
      method: "POST",
    }),

  inviteCollaborator: (id: string, email: string, role: "editor" | "viewer") =>
    request<{ message: string; collaborator?: any; invitationToken?: string; inviteUrl?: string }>(
      `/canvas/${id}/invite`,
      {
        method: "POST",
        body: JSON.stringify({ email, role }),
      }
    ),

  getCollaborators: (id: string) =>
    request<{ owner: any; collaborators: any[]; pendingInvitations: any[]; isPublic: boolean }>(
      `/canvas/${id}/collaborators`
    ),

  removeCollaborator: (id: string, targetUserId: string) =>
    request<{ message: string }>(`/canvas/${id}/collaborators/${targetUserId}`, {
      method: "DELETE",
    }),

  acceptInvitation: (token: string) =>
    request<{ message: string; drawingId: string }>(`/canvas/invite/accept/${token}`, {
      method: "POST",
    }),

  togglePublic: (id: string) =>
    request<{ message: string; isPublic: boolean }>(`/canvas/${id}/toggle-public`, {
      method: "POST",
    }),
};
