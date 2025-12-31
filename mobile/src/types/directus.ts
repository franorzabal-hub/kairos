/**
 * Type utilities for Directus SDK
 *
 * The Directus SDK's TypeScript types don't fully support the nested field
 * syntax used for relational queries. These utilities provide type-safe
 * workarounds for common patterns.
 */

/**
 * Type for nested field selections in Directus queries.
 * Note: This type is kept for documentation but not used in practice.
 * The SDK's strict collection-specific typing conflicts with this general type.
 * We use `as any` for nested fields as the community-standard workaround.
 *
 * @example
 * const fields: NestedFields = ['*', { file: ['*'] }];
 */
export type NestedFields = (string | Record<string, string[]>)[];

/**
 * Type for Directus aggregate query results.
 * Used when querying with aggregate functions like count.
 */
export interface AggregateResult {
  count?: number | string;
  countDistinct?: number | string;
  sum?: number | string;
  avg?: number | string;
  min?: number | string;
  max?: number | string;
}

/**
 * Helper to safely extract count from aggregate results
 */
export function getAggregateCount(result: unknown): number {
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0] as AggregateResult;
    return Number(first?.count ?? 0);
  }
  return 0;
}
