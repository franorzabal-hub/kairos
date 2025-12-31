/**
 * MapPreview.web.tsx - Web-specific map preview component
 *
 * Uses OpenStreetMap iframe for web platform (no API key needed)
 * Separate file to prevent react-native-maps from being bundled on web
 */
import React from 'react';
import { View, StyleSheet, Pressable, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS } from '../theme';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  style?: any;
}

export default function MapPreview({ latitude, longitude, title, style }: MapPreviewProps) {
  const handleOpenMap = () => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Use OpenStreetMap static tiles (free, no API key needed)
  const staticMapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;

  return (
    <Pressable
      onPress={handleOpenMap}
      style={[styles.webContainer, style]}
    >
      <iframe
        src={staticMapUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: BORDERS.radius.lg,
          pointerEvents: 'none',
        }}
        title={title || 'Map location'}
      />
      <View style={styles.webOverlay}>
        <Ionicons name="location" size={24} color={COLORS.primary} />
        <Text style={styles.webText}>Ver en Google Maps</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  webContainer: {
    height: 200,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
  } as any,
  webOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  webText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
