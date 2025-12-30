import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import DirectusImage from '../components/DirectusImage';
import ScreenHeader from '../components/ScreenHeader';
import Toast from '../components/Toast';
import { Announcement } from '../api/directus';
import { useContentReadStatus } from '../api/hooks';
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

type NovedadDetailRouteParams = {
  NovedadDetail: {
    announcement: Announcement;
  };
};

export default function NovedadDetailScreen() {
  const route = useRoute<RouteProp<NovedadDetailRouteParams, 'NovedadDetail'>>();
  const navigation = useNavigation();
  const { announcement } = route.params;
  const { width } = useWindowDimensions();
  const { markAsRead, markAsUnread, isRead } = useContentReadStatus('announcements');

  const [isMarkedRead, setIsMarkedRead] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Track if we've already marked this announcement as read to prevent loops
  const hasMarkedReadRef = useRef<string | null>(null);

  // Mark as read when viewing (only once per announcement)
  useEffect(() => {
    if (hasMarkedReadRef.current !== announcement.id) {
      hasMarkedReadRef.current = announcement.id;
      markAsRead(announcement.id);
      setIsMarkedRead(true);
    }
  }, [announcement.id, markAsRead]);

  const handleMarkAsUnread = async () => {
    await markAsUnread(announcement.id);
    setIsMarkedRead(false);
    setToastMessage('Marcado como no leído');
    setShowToast(true);
    // Navigate back after a short delay
    setTimeout(() => {
      navigation.goBack();
    }, 800);
  };

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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title={announcement.title} showBackButton />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image or Placeholder */}
        <View style={styles.imageContainer}>
          <DirectusImage
            fileId={announcement.image}
            style={styles.image}
            resizeMode="cover"
            fallback={
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="school-outline" size={64} color={COLORS.primary} />
                <Text style={styles.schoolName}>Colegio</Text>
              </View>
            }
          />

          {/* Priority Badge */}
          {announcement.priority === 'urgent' ? (
            <View style={styles.urgentBadge}>
              <Text style={styles.badgeText}>URGENTE</Text>
            </View>
          ) : announcement.priority === 'important' ? (
            <View style={[styles.urgentBadge, styles.importantBadge]}>
              <Text style={styles.badgeText}>IMPORTANTE</Text>
            </View>
          ) : null}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{announcement.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>
                {formatDate(announcement.published_at || announcement.created_at)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={COLORS.gray} />
              <Text style={styles.metaText}>
                {formatTime(announcement.published_at || announcement.created_at)}
              </Text>
            </View>
          </View>

          {announcement.target_type !== 'all' && (
            <View style={styles.targetBadge}>
              <Ionicons name="people-outline" size={14} color={COLORS.primary} />
              <Text style={styles.targetText}>
                {announcement.target_type === 'grade' ? 'Grado específico' : 'Sección específica'}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <RenderHtml
            contentWidth={width - 40}
            source={{ html: decodeHtmlEntities(announcement.content) }}
            baseStyle={styles.bodyText}
          />
        </View>
      </ScrollView>

      {/* Footer with Mark as Unread button */}
      {isMarkedRead && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.unreadButton} onPress={handleMarkAsUnread}>
            <Ionicons name="mail-unread-outline" size={20} color={COLORS.primary} />
            <Text style={styles.unreadButtonText}>Marcar como no leído</Text>
          </TouchableOpacity>
        </View>
      )}

      <Toast
        visible={showToast}
        message={toastMessage}
        type="success"
        onHide={() => setShowToast(false)}
      />
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
    paddingBottom: 100,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 220,
  },
  imagePlaceholder: {
    width: '100%',
    height: 220,
    backgroundColor: '#E8D5D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schoolName: {
    fontSize: 28,
    color: COLORS.primary,
    marginTop: 8,
  },
  urgentBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  importantBadge: {
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  title: {
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
    marginBottom: 16,
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
  targetBadge: {
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
  targetText: {
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  unreadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 8,
  },
  unreadButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
