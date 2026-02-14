import { ConfigService } from "@nestjs/config";

const DEFAULT_ALLOWED_HEADERS = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Referer",
  "User-Agent",
  "sec-ch-ua",
  "sec-ch-ua-mobile",
  "sec-ch-ua-platform",
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
      if (!origin) {
        return cb(null, true);
      }
      if (allowOrigin(origin)) {
        return cb(null, origin);
      }
      return cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders,
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 204,
  };
}
