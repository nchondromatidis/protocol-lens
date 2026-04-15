export function serializeBigInt<T>(value: T): T {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return String(value) as T;
  if (typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => serializeBigInt(item)) as T;
  }

  const result: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>)) {
    result[key] = serializeBigInt((value as Record<string, unknown>)[key]);
  }
  return result as T;
}
