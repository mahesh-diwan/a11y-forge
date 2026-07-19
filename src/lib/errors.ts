export function errorId(): string {
  return (
    crypto.randomUUID?.() ??
    `e_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

export interface AppErrorInit {
  code: string;
  status: number;
  safeMessage: string;
  details?: unknown;
  cause?: unknown;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly safeMessage: string;
  readonly details?: unknown;
  readonly errorId: string;

  constructor(init: AppErrorInit) {
    super(init.safeMessage);
    this.name = "AppError";
    this.code = init.code;
    this.status = init.status;
    this.safeMessage = init.safeMessage;
    this.details = init.details;
    this.errorId = errorId();
    if (init.cause) Object.defineProperty(this, "cause", { value: init.cause, enumerable: false, writable: true });
  }
}

export class ValidationError extends AppError {
  constructor(safeMessage: string, details?: unknown) {
    super({ code: "VALIDATION_ERROR", status: 400, safeMessage, details });
  }
}
export class RateLimitError extends AppError {
  constructor(safeMessage = "Too many requests. Try again later.") {
    super({ code: "RATE_LIMITED", status: 429, safeMessage });
  }
}
export class GitHubError extends AppError {
  constructor(
    safeMessage = "GitHub API request failed",
    details?: unknown,
    cause?: unknown,
  ) {
    super({ code: "GITHUB_ERROR", status: 502, safeMessage, details, cause });
  }
}
export class OpenAIError extends AppError {
  constructor(
    safeMessage = "AI fix generation failed",
    details?: unknown,
    cause?: unknown,
  ) {
    super({ code: "OPENAI_ERROR", status: 502, safeMessage, details, cause });
  }
}
export class ScanError extends AppError {
  constructor(safeMessage = "Scan failed", details?: unknown, cause?: unknown) {
    super({ code: "SCAN_FAILED", status: 500, safeMessage, details, cause });
  }
}
export class ConfigError extends AppError {
  constructor(safeMessage: string) {
    super({ code: "CONFIG_ERROR", status: 500, safeMessage });
  }
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}
