/**
 * SwipeableCard Component
 *
 * Wraps content with swipe gestures for quick actions:
 * - Swipe Left: Archive/Unarchive
 * - Swipe Right: Mark Read/Unread, Pin/Unpin
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACTION_WIDTH = 80;

interface SwipeableCardProps {
  children: React.ReactNode;
  onArchive?: () => void;
  onMarkRead?: () => void;
  onPin?: () => void;
  isRead?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  onArchive,
  onMarkRead,
  onPin,
  isRead = false,
  isArchived = false,
  isPinned = false,
  disabled = false,
}: SwipeableCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const closeSwipeable = () => {
    swipeableRef.current?.close();
  };

  const handleArchive = () => {
    closeSwipeable();
    onArchive?.();
  };

  const handleMarkRead = () => {
    closeSwipeable();
    onMarkRead?.();
  };

  const handlePin = () => {
    closeSwipeable();
    onPin?.();
  };

  // Right actions (swipe left to reveal): Archive
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [-ACTION_WIDTH, 0],
      outputRange: [0, ACTION_WIDTH],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.rightActionsContainer,
          { transform: [{ translateX }, { scale }] },
        ]}
      >
        <TouchableOpacity
          style={[styles.actionButton, styles.archiveButton]}
          onPress={handleArchive}
        >
          <Ionicons
            name={isArchived ? 'arrow-undo' : 'archive'}
            size={22}
            color="#FFF"
          />
          <Text style={styles.actionText}>
            {isArchived ? 'Restaurar' : 'Archivar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Left actions (swipe right to reveal): Read, Pin
  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const translateX = dragX.interpolate({
      inputRange: [0, ACTION_WIDTH * 2],
      outputRange: [-ACTION_WIDTH * 2, 0],
      extrapolate: 'clamp',
    });

    const scale = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.leftActionsContainer,
          { transform: [{ translateX }, { scale }] },
        ]}
      >
        {/* Mark Read/Unread */}
        <TouchableOpacity
          style={[styles.actionButton, styles.readButton]}
          onPress={handleMarkRead}
        >
          <Ionicons
            name={isRead ? 'mail-unread' : 'mail-open'}
            size={22}
            color="#FFF"
          />
          <Text style={styles.actionText}>
            {isRead ? 'No leído' : 'Leído'}
          </Text>
        </TouchableOpacity>

        {/* Pin/Unpin */}
        <TouchableOpacity
          style={[styles.actionButton, styles.pinButton]}
          onPress={handlePin}
        >
          <Ionicons
            name={isPinned ? 'pin-outline' : 'pin'}
            size={22}
            color="#FFF"
          />
          <Text style={styles.actionText}>
            {isPinned ? 'Desfijar' : 'Fijar'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (disabled) {
    return <View>{children}</View>;
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={onArchive ? renderRightActions : undefined}
      renderLeftActions={onMarkRead || onPin ? renderLeftActions : undefined}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      rightThreshold={40}
      leftThreshold={40}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  leftActionsContainer: {
    flexDirection: 'row',
  },
  rightActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: ACTION_WIDTH,
    paddingVertical: 12,
  },
  archiveButton: {
    backgroundColor: '#FF9500',
  },
  readButton: {
    backgroundColor: '#007AFF',
  },
  pinButton: {
    backgroundColor: COLORS.primary,
  },
  actionText: {
    color: '#FFF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '600',
  },
});

export default SwipeableCard;
