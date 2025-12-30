import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import EventosScreen from '../screens/EventosScreen';
import EventoDetailScreen from '../screens/EventoDetailScreen';
import { Event } from '../api/directus';

export type EventosStackParamList = {
  EventosList: undefined;
  EventoDetail: { event: Event };
};

const Stack = createNativeStackNavigator<EventosStackParamList>();

export default function EventosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventosList" component={EventosScreen} />
      <Stack.Screen name="EventoDetail" component={EventoDetailScreen} />
    </Stack.Navigator>
  );
}
