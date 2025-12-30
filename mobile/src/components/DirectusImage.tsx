import React, { useState, useEffect } from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { directus } from '../api/directus';

// DEBUG FLAG - set to true to see debug info on screen
const DEBUG_MODE = false;

const DIRECTUS_URL = 'https://kairos-directus-684614817316.us-central1.run.app';

interface DirectusImageProps extends Omit<ImageProps, 'source'> {
  fileId: string | null | undefined;
  fallback?: React.ReactNode;
}

/**
 * Image component that automatically handles Directus authentication
 * Uses access_token query parameter for authenticated asset access
 */
export default function DirectusImage({ fileId, fallback, style, ...props }: DirectusImageProps) {
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

      // Use SDK's getToken() which returns the current (potentially refreshed) token
      const accessToken = await directus.getToken();
      setHasToken(!!accessToken);

      // Build URL with token
      const url = accessToken
        ? `${DIRECTUS_URL}/assets/${fileId}?access_token=${accessToken}`
        : `${DIRECTUS_URL}/assets/${fileId}`;

      // Test the URL first to get status code
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          setErrorMsg(`HTTP ${response.status}`);
          setError(true);
          setLoading(false);
          return;
        }
      } catch (e: any) {
        setErrorMsg(`fetch: ${e.message?.substring(0, 15) || 'error'}`);
        setError(true);
        setLoading(false);
        return;
      }

      setImageUrl(url);
    };

    loadImageUrl();
  }, [fileId]);

  // Debug overlay component
  const DebugOverlay = () => DEBUG_MODE ? (
    <View style={styles.debugOverlay}>
      <Text style={styles.debugText}>id: {fileId ? fileId.substring(0, 8) : 'NULL'}</Text>
      <Text style={styles.debugText}>token: {hasToken === null ? '?' : hasToken ? 'YES' : 'NO'}</Text>
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
      <View style={[styles.loadingContainer, style]}>
        <ActivityIndicator color="#8B1538" />
        <DebugOverlay />
      </View>
    );
  }

  return (
    <View style={{ position: 'relative' }}>
      <Image
        source={{ uri: imageUrl }}
        style={style}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          const errText = e.nativeEvent?.error || 'unknown';
          setErrorMsg(String(errText).substring(0, 20));
          setError(true);
          setLoading(false);
        }}
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
