"use client";

/** Browser-side API client for the admin panel. Carries the JWT on every request. */

import { API_URL } from "./api";

const TOKEN_KEY = "renesola_admin_token";
const API = `${API_URL}/api/v1`;

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "sales";
  is_active: boolean;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API}${path}`, { ...init, headers, cache: "no-store" });

  // An expired token should drop you at the login screen, not a broken page.
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !window.location.pathname.endsWith("/login")) {
      window.location.href = "/admin/login";
    }
    throw new AdminApiError("Session expired", 401);
  }

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    throw new AdminApiError(detail?.detail ?? response.statusText, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export const adminApi = {
  async login(email: string, password: string): Promise<string> {
    const body = new URLSearchParams({ username: email, password });
    const response = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      throw new AdminApiError(detail?.detail ?? "Login failed", response.status);
    }
    const data = await response.json();
    setToken(data.access_token);
    return data.access_token;
  },

  me: () => request<AdminUser>("/auth/me"),

  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  remove: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  upload: async (file: File, prefix = "") => {
    const body = new FormData();
    body.append("file", file);
    if (prefix) body.append("prefix", prefix);
    return request<{ id: string; url: string; storage_backend: string }>("/media", {
      method: "POST",
      body,
    });
  },
};
