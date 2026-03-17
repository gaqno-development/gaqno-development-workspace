type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export function createLogger(prefix: string) {
  const logLevel = (process.env.LOG_LEVEL ?? 'info') as LogLevel;
  const minPriority = LEVEL_PRIORITY[logLevel];

  function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= minPriority;
  }

  function formatMessage(level: string, message: string, data?: unknown): string {
    const payload: Record<string, unknown> = {
      level,
      prefix,
      message,
      timestamp: new Date().toISOString(),
    };
    if (data !== undefined) {
      payload.data = data;
    }
    return JSON.stringify(payload);
  }

  return {
    debug(message: string, data?: unknown): void {
      if (shouldLog('debug')) {
        process.stderr.write(formatMessage('debug', message, data) + '\n');
      }
    },
    info(message: string, data?: unknown): void {
      if (shouldLog('info')) {
        process.stderr.write(formatMessage('info', message, data) + '\n');
      }
    },
    warn(message: string, data?: unknown): void {
      if (shouldLog('warn')) {
        process.stderr.write(formatMessage('warn', message, data) + '\n');
      }
    },
    error(message: string, data?: unknown): void {
      if (shouldLog('error')) {
        process.stderr.write(formatMessage('error', message, data) + '\n');
      }
    },
  };
}
