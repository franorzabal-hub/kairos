import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import RenderHtml from 'react-native-render-html';
import DirectusImage from '../components/DirectusImage';
import ScreenHeader from '../components/ScreenHeader';
import { Announcement } from '../api/directus';
import { markAsRead } from '../services/readStatusService';
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
  const { announcement } = route.params;
  const { width } = useWindowDimensions();

  // Mark as read when viewing
  useEffect(() => {
    markAsRead('announcements', announcement.id);
  }, [announcement.id]);

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
});
