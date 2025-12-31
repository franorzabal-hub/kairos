/**
 * MapPreview - Cross-platform map preview component
 *
 * On native (iOS/Android): Uses react-native-maps with MapView
 * On web: Shows a static Google Maps image with link to open full map
 */
import React from 'react';
import { View, StyleSheet, Pressable, Text, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDERS } from '../theme';

// Only import react-native-maps on native platforms
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
}

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  style?: any;
}

export default function MapPreview({ latitude, longitude, title, style }: MapPreviewProps) {
  const handleOpenMap = () => {
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
      web: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
    });
    if (url) {
      Linking.openURL(url);
    }
  };

  // Web: Show static map preview with link
  if (Platform.OS === 'web') {
    // Use OpenStreetMap static tiles (free, no API key needed)
    const zoom = 15;
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

  // Native: Use MapView
  if (!MapView) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'ios' ? PROVIDER_DEFAULT : undefined}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        region={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} title={title} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
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
