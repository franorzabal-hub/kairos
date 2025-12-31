import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { Image, ImageProps as ExpoImageProps, ImageContentFit } from 'expo-image';
import { directus, DIRECTUS_URL } from '../api/directus';

// DEBUG FLAG - set to true to see debug info on screen
const DEBUG_MODE = false;

// Blur hash placeholder for loading state (soft gray gradient)
const DEFAULT_BLUR_HASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

interface DirectusImageProps extends Omit<ExpoImageProps, 'source' | 'contentFit'> {
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
 * Optimized image component for Directus assets with built-in caching.
 *
 * Uses expo-image which provides:
 * - Automatic memory + disk caching
 * - Blur hash placeholders for smooth loading
 * - Progressive loading with cross-fade transitions
 * - Better performance than React Native's Image
 *
 * @example
 * // Basic usage
 * <DirectusImage fileId={user.avatar} style={{ width: 40, height: 40 }} />
 *
 * // With custom placeholder
 * <DirectusImage
 *   fileId={announcement.image}
 *   blurhash="LGF5?xYk^6#M@-5c,1J5@[or[Q6."
 *   style={{ width: '100%', height: 200 }}
 * />
 *
 * // Disable caching for sensitive images
 * <DirectusImage fileId={document.file} cachePolicy="none" />
 */
function DirectusImage({
  fileId,
  fallback,
  style,
  contentFit = 'cover',
  blurhash = DEFAULT_BLUR_HASH,
  showPlaceholder = true,
  cachePolicy = 'memory-disk',
  ...props
}: DirectusImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
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
        const accessToken = await directus.getToken();
        setHasToken(!!accessToken);

        // Build URL with token
        const url = accessToken
          ? `${DIRECTUS_URL}/assets/${fileId}?access_token=${accessToken}`
          : `${DIRECTUS_URL}/assets/${fileId}`;

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
    setErrorMsg(String(errText).substring(0, 20));
    setError(true);
    setLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  // Debug overlay component
  const DebugOverlay = () => DEBUG_MODE ? (
    <View style={styles.debugOverlay}>
      <Text style={styles.debugText}>id: {fileId ? fileId.substring(0, 8) : 'NULL'}</Text>
      <Text style={styles.debugText}>token: {hasToken === null ? '?' : hasToken ? 'YES' : 'NO'}</Text>
      <Text style={styles.debugText}>err: {error ? errorMsg || 'YES' : 'no'}</Text>
      <Text style={styles.debugText}>cache: {cachePolicy}</Text>
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
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color="#8B1538" />
        <DebugOverlay />
      </View>
    );
  }

  // Map our cache policy to expo-image's cachePolicy
  const expoCachePolicy = cachePolicy === 'none' ? 'none' : cachePolicy;

  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri: imageUrl }}
        style={style}
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
export default React.memo(DirectusImage);
