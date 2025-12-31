import React from 'react';
import { Platform } from 'react-native';
import MisHijosScreen from '../../../src/screens/MisHijosScreen';
import { WebMisHijosScreen } from '../../../src/screens/web';

export default function MisHijosTab() {
  // Use web-optimized layout on web platform
  if (Platform.OS === 'web') {
    return <WebMisHijosScreen />;
  }

  return <MisHijosScreen />;
}
