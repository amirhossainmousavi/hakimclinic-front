import { ApiError, type ApiErrorBody, type ApiSuccess } from "@/lib/api-error";

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

const TOKEN_KEY = "clinic_access_token";
const REFRESH_KEY = "clinic_refresh_token";

let refreshing: Promise<string> | null = null;

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<string> {
  const refresh = getRefreshToken();
  if (!refresh) throw new ApiError(401, {
    code: "UNAUTHORIZED",
    message: "نشست شما منقضی شده است",
    details: null,
  });

  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });

  if (!res.ok) {
    clearTokens();
    window.location.href = "/login";
    throw new ApiError(401, {
      code: "UNAUTHORIZED",
      message: "نشست شما منقضی شده است",
      details: null,
    });
  }

  const json = (await res.json()) as ApiSuccess<{ accessToken: string; refreshToken?: string }>;
  setTokens(json.data.accessToken, json.data.refreshToken);
  return json.data.accessToken;
}

export async function apiFetchRaw<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiSuccess<T>> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const url = `${BASE_URL}${path}`;
  let res = await fetch(url, { ...options, headers });

  // 401 → تلاش یک‌باره refresh
  if (res.status === 401 && !path.startsWith("/auth/")) {
    if (!refreshing) {
      refreshing = refreshAccessToken().finally(() => {
        refreshing = null;
      });
    }
    try {
      const newToken = await refreshing;
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(url, { ...options, headers });
    } catch {
      /* refresh شکست خورد؛ پاسخ اصلی 401 برگردانده می‌شود */
    }
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || (body && body.success === false)) {
    const errBody: ApiErrorBody =
      body?.error ??
      ({
        code: "INTERNAL_ERROR",
        message: "خطای غیرمنتظره رخ داد",
        details: null,
      } as ApiErrorBody);
    throw new ApiError(res.status, errBody);
  }

  return body as ApiSuccess<T>;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await apiFetchRaw<T>(path, options);
  return res.data;
}

export function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      search.set(k, String(v));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
