import { vi } from "vitest";

export type QueryResult = { data?: unknown; error?: unknown; count?: number | null };

/** A chainable, awaitable fake query builder: every method returns itself, and
 * awaiting it at any point resolves to `result`. Matches how supabase-js
 * query builders are both chainable AND thenable. */
export function makeChain(result: QueryResult) {
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(result)),
    maybeSingle: vi.fn(() => Promise.resolve(result)),
    then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return chain;
}

/** A fake `createClient()` return value whose `.from()` yields one queued chain
 * per call, in call order (the last entry repeats if there are more calls than
 * queued results). */
export function makeSupabaseWithQueue(results: QueryResult[]) {
  let i = 0;
  return {
    from: vi.fn(() => makeChain(results[Math.min(i++, results.length - 1)])),
  };
}
