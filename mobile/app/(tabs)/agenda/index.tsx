import React from 'react';
import { Platform } from 'react-native';
import AgendaScreen from '../../../src/screens/AgendaScreen';
import { WebAgendaScreen } from '../../../src/screens/web';

export default function AgendaTab() {
  // Use web-optimized layout on web platform
  if (Platform.OS === 'web') {
    return <WebAgendaScreen />;
  }

  return <AgendaScreen />;
}
