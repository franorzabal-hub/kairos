/**
 * DateSeparator - Date label between messages
 *
 * Migrated to NativeWind (Tailwind CSS) for styling consistency.
 * Uses custom theme colors defined in tailwind.config.js.
 */
import React from 'react';
import { View, Text } from 'react-native';

interface DateSeparatorProps {
  date: string; // Formatted date string
}

function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View className="items-center my-4">
      <Text className="bg-white px-3 py-1 rounded-xl text-xs text-gray overflow-hidden">
        {date}
      </Text>
    </View>
  );
}

export default React.memo(DateSeparator);
