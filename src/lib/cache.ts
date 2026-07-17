const store = new Map<string, { value: unknown; exp: number }>();
const TTL = 10 * 60 * 1000;

export function cacheGet(key: string): unknown | undefined {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (Date.now() > hit.exp) {
    store.delete(key);
    return undefined;
  }
  return hit.value;
}

export function cacheSet(key: string, value: unknown): void {
  store.set(key, { value, exp: Date.now() + TTL });
}

export function cacheClear(): void {
  store.clear();
}
