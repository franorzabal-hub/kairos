import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import RenderHtml from 'react-native-render-html';
import DirectusImage from '../components/DirectusImage';
import ScreenHeader from '../components/ScreenHeader';
import AttachmentGallery from '../components/AttachmentGallery';
import { Announcement } from '../api/directus';
import { queryKeys } from '../api/hooks';
import { useAppContext } from '../context/AppContext';
import {
  markAsRead,
  acknowledge,
  togglePinned,
} from '../services/contentStatusService';
import { COLORS, SPACING, BORDERS, TYPOGRAPHY } from '../theme';

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
  const { user } = useAppContext();
  const queryClient = useQueryClient();

  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isAcknowledged, setIsAcknowledged] = useState(
    announcement.user_read?.acknowledged ?? false
  );
  const [isUserPinned, setIsUserPinned] = useState(
    announcement.user_status?.is_pinned ?? false
  );

  // Mark as read when viewing
  useEffect(() => {
    if (user?.id && user?.organization_id) {
      markAsRead('announcement', announcement.id, user.id, user.organization_id);
    }
  }, [announcement.id, user]);

  const invalidateQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.announcements });
  }, [queryClient]);

  const handleAcknowledge = async () => {
    if (!user?.id || !user?.organization_id) return;

    setIsAcknowledging(true);
    try {
      await acknowledge('announcement', announcement.id, user.id, user.organization_id);
      setIsAcknowledged(true);
      invalidateQueries();
      Alert.alert('Confirmado', 'Has confirmado la lectura de esta novedad.');
    } catch (error) {
      console.error('Error acknowledging:', error);
      Alert.alert('Error', 'No se pudo confirmar la lectura. Intenta de nuevo.');
    } finally {
      setIsAcknowledging(false);
    }
  };

  const handleTogglePin = async () => {
    if (!user?.id || !user?.organization_id) return;

    try {
      await togglePinned('announcement', announcement.id, user.id, user.organization_id, !isUserPinned);
      setIsUserPinned(!isUserPinned);
      invalidateQueries();
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
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

  const isGlobalPinned = announcement.pinned ?? false;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        title={announcement.title}
        showBackButton
        rightComponent={
          <TouchableOpacity onPress={handleTogglePin} style={styles.pinButton}>
            <Ionicons
              name={isUserPinned ? 'pin' : 'pin-outline'}
              size={24}
              color={isUserPinned ? COLORS.primary : COLORS.gray}
            />
          </TouchableOpacity>
        }
      />

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

          {/* Badges Container */}
          <View style={styles.badgesContainer}>
            {/* Pinned Badge */}
            {isGlobalPinned && (
              <View style={styles.pinnedBadge}>
                <Ionicons name="pin" size={12} color="#FFF" />
                <Text style={styles.badgeText}>FIJADA</Text>
              </View>
            )}

            {/* Priority Badge */}
            {announcement.priority === 'urgent' && (
              <View style={styles.urgentBadge}>
                <Text style={styles.badgeText}>URGENTE</Text>
              </View>
            )}
            {announcement.priority === 'important' && (
              <View style={[styles.urgentBadge, styles.importantBadge]}>
                <Text style={styles.badgeText}>IMPORTANTE</Text>
              </View>
            )}
          </View>

          {/* Acknowledgment Required Badge */}
          {announcement.requires_acknowledgment && (
            <View style={[
              styles.ackRequiredBadge,
              isAcknowledged && styles.ackRequiredBadgeConfirmed
            ]}>
              <Ionicons
                name={isAcknowledged ? 'checkmark-circle' : 'alert-circle'}
                size={14}
                color="#FFF"
              />
              <Text style={styles.ackRequiredText}>
                {isAcknowledged ? 'CONFIRMADO' : 'REQUIERE CONFIRMACIÓN'}
              </Text>
            </View>
          )}
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

          {/* User Pinned indicator */}
          {isUserPinned && !isGlobalPinned && (
            <View style={styles.userPinnedBadge}>
              <Ionicons name="pin" size={14} color={COLORS.primary} />
              <Text style={styles.userPinnedText}>Fijada por ti</Text>
            </View>
          )}

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

          {/* Attachments Section */}
          {announcement.attachments && announcement.attachments.length > 0 && (
            <View style={styles.attachmentsSection}>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Archivos adjuntos</Text>
              <AttachmentGallery attachments={announcement.attachments} />
            </View>
          )}

          {/* Acknowledgment Section */}
          {announcement.requires_acknowledgment && !isAcknowledged && (
            <View style={styles.acknowledgmentSection}>
              <View style={styles.divider} />
              <View style={styles.ackCard}>
                <View style={styles.ackHeader}>
                  <Ionicons name="alert-circle" size={24} color={COLORS.warning} />
                  <Text style={styles.ackTitle}>Confirmación requerida</Text>
                </View>
                {announcement.acknowledgment_text && (
                  <Text style={styles.ackDescription}>
                    {announcement.acknowledgment_text}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.ackButton}
                  onPress={handleAcknowledge}
                  disabled={isAcknowledging}
                >
                  {isAcknowledging ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
                      <Text style={styles.ackButtonText}>Confirmar lectura</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Acknowledged confirmation */}
          {announcement.requires_acknowledgment && isAcknowledged && (
            <View style={styles.acknowledgedSection}>
              <View style={styles.divider} />
              <View style={styles.acknowledgedCard}>
                <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
                <View style={styles.acknowledgedContent}>
                  <Text style={styles.acknowledgedTitle}>Lectura confirmada</Text>
                  <Text style={styles.acknowledgedSubtitle}>
                    Has confirmado la lectura de esta novedad
                  </Text>
                </View>
              </View>
            </View>
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
  pinButton: {
    padding: SPACING.sm,
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
  badgesContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    gap: 8,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  urgentBadge: {
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
    fontSize: 11,
    fontWeight: '700',
  },
  ackRequiredBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
  ackRequiredBadgeConfirmed: {
    backgroundColor: COLORS.success,
  },
  ackRequiredText: {
    color: COLORS.white,
    fontSize: 10,
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
  userPinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  userPinnedText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
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
    marginVertical: 20,
  },
  bodyText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
  },
  attachmentsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  acknowledgmentSection: {
    marginTop: 8,
  },
  ackCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  ackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  ackTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  ackDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 16,
    lineHeight: 20,
  },
  ackButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: BORDERS.radius.md,
  },
  ackButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acknowledgedSection: {
    marginTop: 8,
  },
  acknowledgedCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: BORDERS.radius.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  acknowledgedContent: {
    flex: 1,
  },
  acknowledgedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 4,
  },
  acknowledgedSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
  },
});
