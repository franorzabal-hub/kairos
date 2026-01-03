import { useState, useEffect } from 'react';
import { getTokens, FRAPPE_URL } from '../api/frappe';

/**
 * Hook to get an authenticated Frappe asset URL
 * Frappe assets require authentication, so we append the access_token as a query parameter
 */
export function useFrappeAsset(fileId: string | null | undefined): string | null {
  const [assetUrl, setAssetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) {
      setAssetUrl(null);
      return;
    }

    const buildUrl = async () => {
      const { accessToken } = await getTokens();
      if (accessToken) {
        setAssetUrl(`${FRAPPE_URL}/assets/${fileId}?access_token=${accessToken}`);
      } else {
        // Fallback without token (will likely 403)
        setAssetUrl(`${FRAPPE_URL}/assets/${fileId}`);
      }
    };

    buildUrl();
  }, [fileId]);

  return assetUrl;
}

/**
 * Helper function to build authenticated asset URL (for use outside of hooks)
 */
export async function getFrappeAssetUrl(fileId: string): Promise<string> {
  const { accessToken } = await getTokens();
  if (accessToken) {
    return `${FRAPPE_URL}/assets/${fileId}?access_token=${accessToken}`;
  }
  return `${FRAPPE_URL}/assets/${fileId}`;
}

/**
 * Synchronous version when token is already available
 */
export function buildFrappeAssetUrl(fileId: string, accessToken: string | null): string {
  if (accessToken) {
    return `${FRAPPE_URL}/assets/${fileId}?access_token=${accessToken}`;
  }
  return `${FRAPPE_URL}/assets/${fileId}`;
}

// Backward compatibility aliases
export const getDirectusAssetUrl = getFrappeAssetUrl;
export const buildDirectusAssetUrl = buildFrappeAssetUrl;
