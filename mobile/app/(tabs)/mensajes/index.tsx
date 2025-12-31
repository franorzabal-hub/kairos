import React from 'react';
import { Platform } from 'react-native';
import ConversationListScreen from '../../../src/screens/ConversationListScreen';
import { WebMensajesScreen } from '../../../src/screens/web';

export default function MensajesTab() {
  // Use web-optimized layout on web platform
  if (Platform.OS === 'web') {
    return <WebMensajesScreen />;
  }

  return <ConversationListScreen />;
}
