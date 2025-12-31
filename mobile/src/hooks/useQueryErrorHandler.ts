import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../context/ToastContext';

/**
 * Global query error handler that shows toast notifications for API errors.
 * This hook should be mounted once at the app root level.
 *
 * Note: TanStack Query v5 removed global onError, so we use the MutationCache
 * and QueryCache onError callbacks instead.
 */
export function useQueryErrorHandler() {
  const queryClient = useQueryClient();
  const { showError } = useToast();

  useEffect(() => {
    // Get the caches from queryClient
    const queryCache = queryClient.getQueryCache();
    const mutationCache = queryClient.getMutationCache();

    // Subscribe to query cache errors
    const unsubscribeQuery = queryCache.subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'error') {
        const error = event.query.state.error;
        // Only show error for non-background queries (those triggered by user action)
        // Skip if the query has its own error handling (meta.skipGlobalError)
        const meta = event.query.options.meta as { skipGlobalError?: boolean } | undefined;
        if (!meta?.skipGlobalError) {
          console.error('[Query Error]', event.query.queryKey, error);
          // Don't show toast for every background refetch failure
          // Only show if it's the first failure or manual refetch
          if (event.query.state.fetchFailureCount === 1) {
            showError(error);
          }
        }
      }
    });

    // Subscribe to mutation cache errors
    const unsubscribeMutation = mutationCache.subscribe((event) => {
      if (event.type === 'updated' && event.mutation?.state.status === 'error') {
        const error = event.mutation.state.error;
        const meta = event.mutation.options.meta as { skipGlobalError?: boolean } | undefined;
        if (!meta?.skipGlobalError) {
          console.error('[Mutation Error]', error);
          showError(error);
        }
      }
    });

    return () => {
      unsubscribeQuery();
      unsubscribeMutation();
    };
  }, [queryClient, showError]);
}
