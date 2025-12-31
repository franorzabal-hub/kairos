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
 * Type for aggregate field results.
 * Directus returns aggregates as objects when using field-specific aggregates.
 */
export interface AggregateFieldResult {
  [fieldName: string]: number | string | undefined;
}

/**
 * Type for Directus aggregate query results.
 * Used when querying with aggregate functions like count.
 */
export interface AggregateResult {
  count?: number | string | AggregateFieldResult;
  countDistinct?: number | string | AggregateFieldResult;
  sum?: number | string | AggregateFieldResult;
  avg?: number | string | AggregateFieldResult;
  min?: number | string | AggregateFieldResult;
  max?: number | string | AggregateFieldResult;
}

/**
 * Aggregate result with grouped data (used for groupBy queries)
 */
export interface GroupedAggregateResult extends AggregateResult {
  conversation_id?: string;
  [key: string]: string | number | AggregateFieldResult | undefined;
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

// ============================================
// Directus Filter Types
// ============================================

/**
 * Base filter operators for string fields
 */
export interface StringFilterOperators {
  _eq?: string;
  _neq?: string;
  _in?: string[];
  _nin?: string[];
  _null?: boolean;
  _nnull?: boolean;
  _contains?: string;
  _icontains?: string;
  _ncontains?: string;
  _starts_with?: string;
  _nstarts_with?: string;
  _ends_with?: string;
  _nends_with?: string;
  _empty?: boolean;
  _nempty?: boolean;
}

/**
 * Filter operators for boolean fields
 */
export interface BooleanFilterOperators {
  _eq?: boolean;
  _neq?: boolean;
  _null?: boolean;
  _nnull?: boolean;
}

/**
 * Filter operators for date/datetime fields
 */
export interface DateFilterOperators {
  _eq?: string;
  _neq?: string;
  _gt?: string;
  _gte?: string;
  _lt?: string;
  _lte?: string;
  _null?: boolean;
  _nnull?: boolean;
  _between?: [string, string];
  _nbetween?: [string, string];
}

// ============================================
// Collection-specific Filter Types
// ============================================

/**
 * Filter type for announcements collection
 */
export interface AnnouncementFilter {
  status?: StringFilterOperators;
  organization_id?: StringFilterOperators;
  target_type?: StringFilterOperators;
  target_id?: StringFilterOperators;
  priority?: StringFilterOperators;
  is_pinned?: BooleanFilterOperators;
  created_at?: DateFilterOperators;
  published_at?: DateFilterOperators;
  _and?: AnnouncementFilter[];
  _or?: AnnouncementFilter[];
}

/**
 * Filter type for events collection
 */
export interface EventFilter {
  status?: StringFilterOperators;
  organization_id?: StringFilterOperators;
  target_type?: StringFilterOperators;
  target_id?: StringFilterOperators;
  start_date?: DateFilterOperators;
  end_date?: DateFilterOperators;
  all_day?: BooleanFilterOperators;
  requires_confirmation?: BooleanFilterOperators;
  _and?: EventFilter[];
  _or?: EventFilter[];
}

/**
 * Filter type for conversation_participants collection
 */
export interface ConversationParticipantFilter {
  user_id?: StringFilterOperators;
  conversation_id?: StringFilterOperators;
  is_blocked?: BooleanFilterOperators;
  is_muted?: BooleanFilterOperators;
  can_reply?: BooleanFilterOperators;
  last_read_at?: DateFilterOperators;
  date_created?: DateFilterOperators;
  _and?: ConversationParticipantFilter[];
  _or?: ConversationParticipantFilter[];
}

/**
 * Filter type for conversation_messages collection
 */
export interface ConversationMessageFilter {
  conversation_id?: StringFilterOperators;
  sender_id?: StringFilterOperators;
  content_type?: StringFilterOperators;
  is_urgent?: BooleanFilterOperators;
  deleted_at?: DateFilterOperators;
  date_created?: DateFilterOperators;
  _and?: ConversationMessageFilter[];
  _or?: ConversationMessageFilter[];
}

/**
 * Filter type for message_recipients collection
 */
export interface MessageRecipientFilter {
  user_id?: StringFilterOperators;
  message_id?: StringFilterOperators;
  read_at?: DateFilterOperators;
  delivered_at?: DateFilterOperators;
  date_created?: DateFilterOperators;
  _and?: MessageRecipientFilter[];
  _or?: MessageRecipientFilter[];
}

// ============================================
// Error Types
// ============================================

/**
 * Directus API error structure
 */
export interface DirectusError {
  message?: string;
  errors?: Array<{
    message?: string;
    extensions?: {
      code?: string | number;
    };
  }>;
  response?: {
    status?: number;
  };
  status?: number | string;
}

/**
 * Type guard to check if an error is a Directus error
 */
export function isDirectusError(error: unknown): error is DirectusError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('message' in error || 'errors' in error)
  );
}
