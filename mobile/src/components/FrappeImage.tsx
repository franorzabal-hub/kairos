import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Platform } from 'react-native';
import { Image, ImageProps as ExpoImageProps, ImageContentFit } from 'expo-image';
import { frappe, FRAPPE_URL } from '../api/frappe';
import { imageDebugger } from '../services/imageDebugger';

// DEBUG FLAG - set to true to see debug info on screen
const DEBUG_MODE = false;

// Blur hash placeholder for loading state (soft gray gradient)
const DEFAULT_BLUR_HASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

interface FrappeImageProps extends Omit<ExpoImageProps, 'source' | 'contentFit'> {
  fileId: string | null | undefined;
  fallback?: React.ReactNode;
  /** How to resize the image to fit the container (default: 'cover') */
  contentFit?: ImageContentFit;
  /** Blur hash for placeholder (default uses a soft gray) */
  blurhash?: string;
  /** Show placeholder while loading (default: true) */
  showPlaceholder?: boolean;
  /** Cache policy: 'memory-disk' (default), 'memory', 'disk', or 'none' */
  cachePolicy?: 'memory-disk' | 'memory' | 'disk' | 'none';
}

/**
 * Optimized image component for Frappe assets with built-in caching.
 *
 * Uses expo-image which provides:
 * - Automatic memory + disk caching
 * - Blur hash placeholders for smooth loading
 * - Progressive loading with cross-fade transitions
 * - Better performance than React Native's Image
 *
 * @example
 * // Basic usage
 * <FrappeImage fileId={user.avatar} style={{ width: 40, height: 40 }} />
 *
 * // With custom placeholder
 * <FrappeImage
 *   fileId={announcement.image}
 *   blurhash="LGF5?xYk^6#M@-5c,1J5@[or[Q6."
 *   style={{ width: '100%', height: 200 }}
 * />
 *
 * // Disable caching for sensitive images
 * <FrappeImage fileId={document.file} cachePolicy="none" />
 */
function FrappeImage({
  fileId,
  fallback,
  style,
  contentFit = 'cover',
  blurhash = DEFAULT_BLUR_HASH,
  showPlaceholder = true,
  cachePolicy = 'memory-disk',
  ...props
}: FrappeImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [authHeaders, setAuthHeaders] = useState<Record<string, string> | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [hasToken, setHasToken] = useState<boolean | null>(null);

  useEffect(() => {
    if (!fileId) {
      setLoading(false);
      return;
    }

    const loadImageUrl = async () => {
      setLoading(true);
      setError(false);
      setErrorMsg('');

      try {
        // Use SDK's getToken() which returns the current (potentially refreshed) token
        const accessToken = await frappe.getToken();
        setHasToken(!!accessToken);

        // Platform-specific auth strategy:
        // - Web: Use query string to avoid CORS preflight issues with custom headers
        // - Mobile: Use headers (more secure, no URL logging concerns)
        const isWeb = Platform.OS === 'web';

        let url: string;
        if (isWeb && accessToken) {
          // Web: token in query string avoids CORS preflight
          url = `${FRAPPE_URL}/assets/${fileId}?access_token=${accessToken}`;
          setAuthHeaders(undefined);
        } else if (accessToken) {
          // Mobile: token in header (more secure)
          url = `${FRAPPE_URL}/assets/${fileId}`;
          setAuthHeaders({ Authorization: `Bearer ${accessToken}` });
        } else {
          // No token - public access
          url = `${FRAPPE_URL}/assets/${fileId}`;
          setAuthHeaders(undefined);
        }

        // Log attempt to imageDebugger
        const authMethod = isWeb && accessToken ? 'QUERY' : accessToken ? 'HEADER' : 'NONE';
        imageDebugger.logAttempt(fileId, url, authMethod);

        if (DEBUG_MODE) {
          console.log('[FrappeImage] Loading:', {
            fileId,
            hasToken: !!accessToken,
            platform: Platform.OS,
            authMethod: isWeb ? 'query' : 'header',
          });
          // Log full URL separately so it's not truncated
          console.log('[FrappeImage] Full URL:', url);
        }

        // On web, test fetch to see actual HTTP response
        if (isWeb) {
          fetch(url, { method: 'HEAD' })
            .then(res => {
              imageDebugger.logFetchResult(
                fileId,
                res.status,
                res.statusText,
                res.headers.get('content-type'),
                res.headers.get('access-control-allow-origin')
              );
              if (DEBUG_MODE) {
                console.log('[FrappeImage] Fetch test:', {
                  status: res.status,
                  statusText: res.statusText,
                  contentType: res.headers.get('content-type'),
                  cors: res.headers.get('access-control-allow-origin'),
                });
              }
            })
            .catch(err => {
              imageDebugger.logFetchError(fileId, err.message);
              if (DEBUG_MODE) {
                console.error('[FrappeImage] Fetch error:', err.message);
              }
            });
        }
        setImageUrl(url);
      } catch (e: any) {
        setErrorMsg(`token: ${e.message?.substring(0, 15) || 'error'}`);
        setError(true);
        setLoading(false);
      }
    };

    loadImageUrl();
  }, [fileId]);

  const handleError = useCallback((e: { error: string }) => {
    const errText = e.error || 'unknown';
    if (fileId) {
      imageDebugger.logError(fileId, errText);
    }
    if (DEBUG_MODE) {
      console.error('[FrappeImage] Error loading:', { fileId, error: errText, url: imageUrl });
    }
    setErrorMsg(String(errText).substring(0, 20));
    setError(true);
    setLoading(false);
  }, [fileId, imageUrl]);

  const handleLoad = useCallback(() => {
    if (fileId) {
      imageDebugger.logSuccess(fileId);
    }
    setLoading(false);
    setError(false);
  }, [fileId]);

  // Debug overlay component
  const isWeb = Platform.OS === 'web';
  const authMethod = hasToken === null ? '?' : hasToken ? (isWeb ? 'QUERY' : 'HEADER') : 'NONE';
  // On web we use native <img>, on mobile we use expo-image
  const imgType = isWeb ? 'IMG' : 'EXPO';
  const DebugOverlay = () => DEBUG_MODE ? (
    <View style={styles.debugOverlay}>
      <Text style={styles.debugText}>id: {fileId ? fileId.substring(0, 8) : 'NULL'}</Text>
      <Text style={styles.debugText}>auth: {authMethod} | {imgType}</Text>
      <Text style={styles.debugText}>err: {error ? errorMsg || 'YES' : 'no'}</Text>
    </View>
  ) : null;

  if (!fileId) {
    return fallback ? <>{fallback}</> : null;
  }

  if (error && fallback) {
    return (
      <View style={{ position: 'relative' }}>
        {fallback}
        <DebugOverlay />
      </View>
    );
  }

  if (!imageUrl) {
    return (
      <View style={[styles.loadingContainer, { position: 'relative' }, style]}>
        <ActivityIndicator color="#8B1538" />
        <DebugOverlay />
      </View>
    );
  }

  // Map our cache policy to expo-image's cachePolicy
  const expoCachePolicy = cachePolicy === 'none' ? 'none' : cachePolicy;

  // On web, use native <img> element to avoid expo-image CORS/loading issues
  // expo-image has known issues on web with certain auth scenarios
  if (isWeb) {
    // Map contentFit to CSS object-fit
    const objectFit = contentFit === 'cover' ? 'cover' :
                      contentFit === 'contain' ? 'contain' :
                      contentFit === 'fill' ? 'fill' : 'cover';

    return (
      <View style={[{ position: 'relative', overflow: 'hidden' }, style]}>
        <img
          src={imageUrl}
          alt=""
          onLoad={handleLoad}
          onError={() => {
            if (fileId) {
              imageDebugger.logError(fileId, 'Native img failed to load');
            }
            if (DEBUG_MODE) {
              console.error('[FrappeImage] Native img error:', { fileId, url: imageUrl });
            }
            setErrorMsg('img failed');
            setError(true);
            setLoading(false);
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: loading ? 'none' : 'block',
          }}
        />
        {loading && showPlaceholder && (
          <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
            <ActivityIndicator color="#8B1538" size="small" />
          </View>
        )}
        <DebugOverlay />
      </View>
    );
  }

  // Mobile: use expo-image with headers for better performance and caching
  return (
    <View style={[{ position: 'relative' }, style]}>
      <Image
        source={{
          uri: imageUrl,
          headers: authHeaders,
        }}
        style={{ width: '100%', height: '100%' }}
        contentFit={contentFit}
        placeholder={showPlaceholder ? { blurhash } : undefined}
        transition={300}
        cachePolicy={expoCachePolicy}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
      <DebugOverlay />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D5D9',
  },
  debugOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 4,
    borderRadius: 4,
  },
  debugText: {
    color: '#00FF00',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

// Memoize to prevent redundant image fetches when parent re-renders
export default React.memo(FrappeImage);
