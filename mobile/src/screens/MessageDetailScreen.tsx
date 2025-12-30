import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import RenderHtml from 'react-native-render-html';
import { MessageWithReadStatus } from '../api/hooks';
import { COLORS, SPACING, BORDERS } from '../theme';

// Decode HTML entities
const decodeHtmlEntities = (text: string) => {
  if (!text) return '';
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

type MessageDetailRouteParams = {
  MessageDetail: {
    message: MessageWithReadStatus;
  };
};

export default function MessageDetailScreen() {
  const route = useRoute<RouteProp<MessageDetailRouteParams, 'MessageDetail'>>();
  const { message } = route.params;
  const { width } = useWindowDimensions();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check if content is HTML
  const isHtml = message.content?.includes('<') && message.content?.includes('>');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={message.subject} showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Message Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={48} color={COLORS.primary} />
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.subject}>{message.subject}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>
                {formatDate(message.created_at)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          </View>

          {/* Read status */}
          <View style={styles.statusRow}>
            <Ionicons
              name={message.read_at ? 'checkmark-done' : 'checkmark'}
              size={16}
              color={message.read_at ? COLORS.success : COLORS.gray}
            />
            <Text style={[styles.statusText, message.read_at && styles.statusTextRead]}>
              {message.read_at
                ? `Leído el ${formatDate(message.read_at)} a las ${formatTime(message.read_at)}`
                : 'No leído'
              }
            </Text>
          </View>

          {/* Audience type badge */}
          {message.target_type && message.target_type !== 'all' && (
            <View style={styles.audienceBadge}>
              <Ionicons name="people-outline" size={14} color={COLORS.primary} />
              <Text style={styles.audienceText}>
                {message.target_type === 'grade' ? 'Mensaje para tu grado' :
                 message.target_type === 'section' ? 'Mensaje para tu sección' :
                 message.target_type === 'user' ? 'Mensaje personal' :
                 'Mensaje general'}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Message body */}
          {isHtml ? (
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: decodeHtmlEntities(message.content) }}
              baseStyle={styles.bodyText}
            />
          ) : (
            <Text style={styles.bodyText}>{message.content}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: COLORS.primaryLight,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 20,
  },
  subject: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.gray,
  },
  statusTextRead: {
    color: COLORS.success,
  },
  audienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  audienceText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
});
