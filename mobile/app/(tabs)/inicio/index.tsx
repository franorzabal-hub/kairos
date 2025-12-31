import React from 'react';
import { Platform } from 'react-native';
import InicioScreen from '../../../src/screens/InicioScreen';
import { WebInicioScreen } from '../../../src/screens/web';

export default function InicioTab() {
  // Use web-optimized layout on web platform
  if (Platform.OS === 'web') {
    return <WebInicioScreen />;
  }

  return <InicioScreen />;
}
