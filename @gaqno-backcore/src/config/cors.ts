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
): {
  origin: (origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) => void;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  optionsSuccessStatus: number;
} {
  const corsOrigin =
    config.get<string>("CORS_ORIGIN") ??
    process.env.CORS_ORIGIN ??
    process.env.ALLOWED_ORIGINS ??
    (process.env.NODE_ENV === "production" ? "" : "*");

  const allowedList =
    corsOrigin === "*"
      ? null
      : new Set(
          corsOrigin
            .split(",")
            .map((item: string) => item.trim())
            .filter(Boolean)
        );

  const normalizeOrigin = (o: string | undefined): string =>
    (o ?? "").trim().replace(/\/+$/, "");

  const allowOrigin = (o: string | undefined): boolean => {
    if (corsOrigin === "*") return true;
    if (o === undefined || o === "") return true;
    const norm = normalizeOrigin(o);
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
    origin: (origin, cb) => cb(null, allowOrigin(origin)),
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders,
    exposedHeaders: ["Content-Length", "Content-Type"],
    optionsSuccessStatus: 204,
  };
}
