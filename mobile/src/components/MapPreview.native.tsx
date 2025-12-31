/**
 * MapPreview.native.tsx - Native-specific map preview component
 *
 * Uses react-native-maps for iOS and Android
 * Separate file to prevent this from being bundled on web
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { BORDERS } from '../theme';

interface MapPreviewProps {
  latitude: number;
  longitude: number;
  title?: string;
  style?: any;
}

export default function MapPreview({ latitude, longitude, title, style }: MapPreviewProps) {
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
});
