import React from 'react';
import { Platform } from 'react-native';
import EventoDetailScreen from '../../../src/screens/EventoDetailScreen';
import EventoDetailScreenWeb from '../../../src/screens/EventoDetailScreen.web';

export default function EventoDetail() {
  // Use web-optimized layout on web platform
  if (Platform.OS === 'web') {
    return <EventoDetailScreenWeb />;
  }
  return <EventoDetailScreen />;
}
