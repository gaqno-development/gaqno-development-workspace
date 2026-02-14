import { ConfigService } from "@nestjs/config";
import { appendFileSync } from "fs";

function debugLog(payload: Record<string, unknown>): void {
  const full = { ...payload, timestamp: Date.now() };
  const line = JSON.stringify(full) + "\n";
  const fallbackPath =
    process.env.CORS_DEBUG_LOG ||
    "/home/gaqno/coding/gaqno/gaqno-development-workspace/.cursor/debug.log";
  fetch(
    "http://127.0.0.1:7242/ingest/160bfd4b-ead9-47ae-a8af-90cbab183254",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(full),
    }
  ).catch(() => {
    try {
      appendFileSync(fallbackPath, line);
    } catch {
      // ignore
    }
  });
}

const DEFAULT_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Referer",
  "User-Agent",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
  "Origin",
  "Accept",
  "newrelic",
  "traceparent",
  "tracestate",
];

const gaqnoHttpsOriginRegex =
  /^https:\/\/([\w-]+\.)*gaqno\.com(\.br)?(:\d+)?$/;
const gaqnoHttpOriginRegex =
  /^http:\/\/([\w-]+\.)*gaqno\.com(\.br)?(:\d+)?$/;
const localhostOriginRegex =
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

export interface GetCorsOptionsOverrides {
  allowedHeaders?: string[];
}

export function getCorsOptions(
  config: ConfigService,
  overrides?: GetCorsOptionsOverrides
) {
  const corsOrigin =
    config.get<string>("CORS_ORIGIN") ??
    process.env.CORS_ORIGIN ??
    process.env.ALLOWED_ORIGINS ??
    (process.env.NODE_ENV === "production" ? "" : "*");

  const allowedList =
    corsOrigin && corsOrigin !== "*"
      ? new Set(
          corsOrigin
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        )
      : null;

  // #region agent log
  debugLog({
    location: "cors.ts:getCorsOptions:bootstrap",
    message: "CORS config resolved",
    data: {
      corsOrigin: corsOrigin === "" ? "(empty)" : corsOrigin,
      nodeEnv: process.env.NODE_ENV,
      allowedListSize: allowedList?.size ?? 0,
      allowedListSample: allowedList ? Array.from(allowedList).slice(0, 5) : null,
    },
    hypothesisId: "H1",
  });
  // #endregion

  const normalizeOrigin = (o?: string): string =>
    (o ?? "").trim().replace(/\/+$/, "");

  const allowOrigin = (origin?: string): boolean => {
    if (!origin) return true;
    const norm = normalizeOrigin(origin);
    if (corsOrigin === "*") return true;
    if (!norm) return true;
    return (
      (allowedList?.has(norm) ?? false) ||
      gaqnoHttpsOriginRegex.test(norm) ||
      gaqnoHttpOriginRegex.test(norm) ||
      localhostOriginRegex.test(norm)
    );
  };

  const allowedHeaders =
    overrides?.allowedHeaders ?? DEFAULT_ALLOWED_HEADERS;

  return {
    origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean | string) => void) => {
      // #region agent log
      const norm = origin ? normalizeOrigin(origin) : "";
      const inList = allowedList?.has(norm) ?? false;
      const matchGaqnoHttps = norm ? gaqnoHttpsOriginRegex.test(norm) : false;
      const matchGaqnoHttp = norm ? gaqnoHttpOriginRegex.test(norm) : false;
      const matchLocalhost = norm ? localhostOriginRegex.test(norm) : false;
      const allowed = !origin || allowOrigin(origin);
      debugLog({
        location: "cors.ts:origin-callback",
        message: allowed ? "CORS allow" : "CORS deny",
        data: {
          origin: origin ?? "(none)",
          normalized: norm || "(empty)",
          inList,
          matchGaqnoHttps,
          matchGaqnoHttp,
          matchLocalhost,
          allowed,
        },
        hypothesisId: "H2",
      });
      // #endregion
      if (!origin) {
        return cb(null, true);
      }
      if (allowOrigin(origin)) {
        return cb(null, origin);
      }
      return cb(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders,
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 204,
  };
}
