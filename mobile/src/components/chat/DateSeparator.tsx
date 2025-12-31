/**
 * DateSeparator - Date label between messages
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../theme';

interface DateSeparatorProps {
  date: string; // Formatted date string
}

function DateSeparator({ date }: DateSeparatorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{date}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  text: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    color: COLORS.gray,
    overflow: 'hidden',
  },
});

export default React.memo(DateSeparator);
