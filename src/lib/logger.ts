type Meta = Record<string, unknown> | undefined;

export function logRequest(
  route: string,
  status: number,
  ms: number,
  meta?: Meta,
): void {
  console.log(
    JSON.stringify({
      t: new Date().toISOString(),
      level: "info",
      route,
      status,
      ms,
      ...meta,
    }),
  );
}
export function logError(errorId: string, err: unknown, meta?: Meta): void {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(
    JSON.stringify({
      t: new Date().toISOString(),
      level: "error",
      errorId,
      message: msg,
      ...meta,
    }),
  );
}
