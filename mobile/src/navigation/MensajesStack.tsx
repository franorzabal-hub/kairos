import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MensajesScreen from '../screens/MensajesScreen';
import MessageDetailScreen from '../screens/MessageDetailScreen';
import ConversationListScreen from '../screens/ConversationListScreen';
import ConversationChatScreen from '../screens/ConversationChatScreen';
import { MensajesStackParamList } from './types';

export type { MensajesStackParamList };

const Stack = createNativeStackNavigator<MensajesStackParamList>();

export default function MensajesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* New conversation-based messaging (WhatsApp-style) */}
      <Stack.Screen name="ConversationList" component={ConversationListScreen} />
      <Stack.Screen name="ConversationChat" component={ConversationChatScreen} />
      {/* Legacy broadcast messaging (for backwards compatibility) */}
      <Stack.Screen name="MensajesList" component={MensajesScreen} />
      <Stack.Screen name="MessageDetail" component={MessageDetailScreen} />
    </Stack.Navigator>
  );
}
