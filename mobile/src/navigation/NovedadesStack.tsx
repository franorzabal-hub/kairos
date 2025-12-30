import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import NovedadesScreen from '../screens/NovedadesScreen';
import NovedadDetailScreen from '../screens/NovedadDetailScreen';
import { Announcement } from '../api/directus';

export type NovedadesStackParamList = {
  NovedadesList: undefined;
  NovedadDetail: { announcement: Announcement };
};

const Stack = createNativeStackNavigator<NovedadesStackParamList>();

export default function NovedadesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="NovedadesList" component={NovedadesScreen} />
      <Stack.Screen name="NovedadDetail" component={NovedadDetailScreen} />
    </Stack.Navigator>
  );
}
