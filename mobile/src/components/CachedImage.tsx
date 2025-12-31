import React, { useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Image, ImageProps as ExpoImageProps, ImageContentFit } from 'expo-image';
import { COLORS } from '../theme';

// Blur hash placeholder for loading state (soft gray gradient)
const DEFAULT_BLUR_HASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I';

interface CachedImageProps extends Omit<ExpoImageProps, 'source' | 'contentFit'> {
  /** Image URL (external or any valid URI) */
  uri: string | null | undefined;
  /** Fallback component to show if image fails to load or URI is null */
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
 * Cached image component for external URLs with built-in caching.
 *
 * Uses expo-image which provides:
 * - Automatic memory + disk caching
 * - Blur hash placeholders for smooth loading
 * - Progressive loading with cross-fade transitions
 * - Better performance than React Native's Image
 *
 * @example
 * // Basic usage
 * <CachedImage uri={thumbnailUrl} style={{ width: '100%', height: 200 }} />
 *
 * // With custom placeholder
 * <CachedImage
 *   uri="https://example.com/image.jpg"
 *   blurhash="LGF5?xYk^6#M@-5c,1J5@[or[Q6."
 *   style={{ width: 100, height: 100 }}
 * />
 *
 * // Disable caching
 * <CachedImage uri={url} cachePolicy="none" />
 */
function CachedImage({
  uri,
  fallback,
  style,
  contentFit = 'cover',
  blurhash = DEFAULT_BLUR_HASH,
  showPlaceholder = true,
  cachePolicy = 'memory-disk',
  ...props
}: CachedImageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleError = useCallback(() => {
    setError(true);
    setLoading(false);
  }, []);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
  }, []);

  if (!uri) {
    return fallback ? <>{fallback}</> : null;
  }

  if (error && fallback) {
    return <>{fallback}</>;
  }

  if (error && !fallback) {
    return (
      <View style={[styles.errorContainer, style]}>
        <ActivityIndicator color={COLORS.gray} size="small" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit={contentFit}
      placeholder={showPlaceholder ? { blurhash } : undefined}
      transition={300}
      cachePolicy={cachePolicy}
      onLoad={handleLoad}
      onError={handleError}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E8D5D9',
  },
});

// Memoize to prevent redundant image fetches when parent re-renders
export default React.memo(CachedImage);
