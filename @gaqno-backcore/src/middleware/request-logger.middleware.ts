import { Request, Response, NextFunction } from "express";

const PREFIX = "[Http]";

export function requestLoggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const debugHeaderName = process.env.DEBUGGER_HEADER?.trim();
  const hasDebugHeader =
    debugHeaderName && req.headers[debugHeaderName.toLowerCase()];
  const start = Date.now();
  res.on("finish", () => {
    const method = req.method;
    const path = req.url ?? req.path;
    const status = res.statusCode;
    const duration = Date.now() - start;
    const tag = hasDebugHeader ? " [debug]" : "";
    process.stdout.write(
      `${PREFIX} ${method} ${path} ${status} ${duration}ms${tag}\n`
    );
  });
  next();
}
