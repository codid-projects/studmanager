"use client";

import {
  AUTH_COOKIE,
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
  AUTH_VALUE,
} from "@/lib/auth";
import {
  getFriendlyApiErrorMessage,
  getPayloadMessage,
  localizeApiMessage,
} from "./errors";
import { API_BASE_URL, API_TRANSPORT_MODE } from "./transport";
import type { ApiResult, AuthResponseDto, LocaleCode } from "./types";

const TOKEN_STORAGE_KEY = "studmanager-token";
const NOT_FOUND_RETRY_DELAYS_MS = [250, 500];

type QueryValue = string | number | boolean | null | undefined;

interface ClientApiOptions {
  method?: string;
  backendPath: string;
  nextPath: string;
  query?: Record<string, QueryValue>;
  backendQuery?: Record<string, QueryValue>;
  nextQuery?: Record<string, QueryValue>;
  body?: unknown;
  backendBody?: unknown;
  nextBody?: unknown;
  locale?: LocaleCode;
  authRequest?: boolean;
}

function setCookie(name: string, value: string, rememberMe = true) {
  const base = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
  document.cookie = rememberMe ? `${base}; Max-Age=${60 * 60 * 24 * 30}` : base;
}

function getCookie(name: string) {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

export function clearClientSession() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);

  for (const name of [AUTH_COOKIE, AUTH_TOKEN_COOKIE, AUTH_USER_COOKIE]) {
    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
  }
}

export function persistClientSession(
  auth: AuthResponseDto,
  rememberMe: boolean,
) {
  if (auth.accessToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, auth.accessToken);
    setCookie(AUTH_TOKEN_COOKIE, auth.accessToken, rememberMe);
  }

  setCookie(AUTH_COOKIE, AUTH_VALUE, rememberMe);
  setCookie(
    AUTH_USER_COOKIE,
    JSON.stringify({
      userId: auth.userId,
      username: auth.username,
      fullName: auth.fullName,
      roles: auth.roles,
    }),
    rememberMe,
  );
}

function buildUrl(
  base: string,
  path: string,
  query?: Record<string, QueryValue>,
) {
  const url = new URL(path, base);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function wait(milliseconds: number) {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export function getClientApiErrorStatus(error: unknown) {
  if (!error || typeof error !== "object" || !("status" in error))
    return undefined;

  const status = Number((error as { status?: unknown }).status);
  return Number.isFinite(status) ? status : undefined;
}

export function isClientApiNotFound(error: unknown) {
  return getClientApiErrorStatus(error) === 404;
}

export async function clientApiFetch<T>({
  method = "GET",
  backendPath,
  nextPath,
  query,
  backendQuery,
  nextQuery,
  body,
  backendBody,
  nextBody,
  locale = "ar",
  authRequest = false,
}: ClientApiOptions): Promise<T> {
  const normalizedMethod = method.toUpperCase();
  const direct = API_TRANSPORT_MODE === "direct";
  const requestBody = direct ? (backendBody ?? body) : (nextBody ?? body);
  const url = direct
    ? buildUrl(API_BASE_URL, backendPath, backendQuery ?? query)
    : buildUrl(window.location.origin, nextPath, nextQuery ?? query);
  const headers = new Headers({ Accept: "application/json" });
  headers.set("Accept-Language", locale);
  const token =
    window.localStorage.getItem(TOKEN_STORAGE_KEY) ??
    (getCookie(AUTH_TOKEN_COOKIE)
      ? decodeURIComponent(getCookie(AUTH_TOKEN_COOKIE) as string)
      : null);
  const isFormData =
    typeof FormData !== "undefined" && requestBody instanceof FormData;

  if (requestBody !== undefined && !isFormData)
    headers.set("Content-Type", "application/json");
  if (direct && token) headers.set("Authorization", `Bearer ${token}`);

  for (let attempt = 0; ; attempt += 1) {
    let response: Response;

    try {
      response = await fetch(url, {
        method: normalizedMethod,
        headers,
        body:
          requestBody === undefined
            ? undefined
            : isFormData
              ? requestBody
              : JSON.stringify(requestBody),
      });
    } catch (error) {
      throw Object.assign(new Error(getFriendlyApiErrorMessage(locale)), {
        status: 0,
        cause: error,
      });
    }

    const payload = await parseResponse(response);

    if (response.ok) return payload as T;

    const retryDelay = NOT_FOUND_RETRY_DELAYS_MS[attempt];
    if (response.status === 404 && retryDelay !== undefined) {
      await wait(retryDelay);
      continue;
    }

    if (response.status === 401 && !authRequest) {
      clearClientSession();
      window.location.assign(`/${locale}/login?session=expired`);
    }

    const payloadMessage = getPayloadMessage(payload);
    const message =
      response.status >= 400
        ? localizeApiMessage(payloadMessage ?? response.statusText, locale)
        : (payloadMessage ?? response.statusText);

    throw Object.assign(new Error(String(message)), {
      status: response.status,
      payload,
    });
  }
}

export async function loginClient(payload: {
  username: string;
  password: string;
  rememberMe: boolean;
  locale: LocaleCode;
}) {
  if (API_TRANSPORT_MODE === "server") {
    let response: Response;

    try {
      response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      throw Object.assign(
        new Error(getFriendlyApiErrorMessage(payload.locale)),
        {
          status: 0,
          cause: error,
        },
      );
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        response.status === 401
          ? data?.message || response.statusText
          : getFriendlyApiErrorMessage(payload.locale);

      throw Object.assign(new Error(message), {
        status: response.status,
        payload: data,
      });
    }

    return data;
  }

  const result = await clientApiFetch<ApiResult<AuthResponseDto>>({
    method: "POST",
    backendPath: "/api/users/login",
    nextPath: "/api/auth/login",
    authRequest: true,
    locale: payload.locale,
    body: {
      username: payload.username,
      password: payload.password,
    },
  });

  if (!result.succeeded || !result.data?.accessToken) {
    throw new Error(result.message || "Invalid credentials.");
  }

  persistClientSession(result.data, payload.rememberMe);

  return {
    user: {
      userId: result.data.userId,
      username: result.data.username,
      fullName: result.data.fullName,
      userProfileImage: result.data.userProfileImage,
      roles: result.data.roles,
    },
    message: result.message,
  };
}
