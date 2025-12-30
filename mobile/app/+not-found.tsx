import React from 'react';
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-lg font-semibold text-black">Pantalla no encontrada</Text>
        <Link href="/" className="mt-4 text-primary">
          Volver al inicio
        </Link>
      </View>
    </>
  );
}
