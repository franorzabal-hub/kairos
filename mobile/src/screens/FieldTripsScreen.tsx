/**
 * FieldTripsScreen
 *
 * List of field trips pending authorization for the parent's children.
 * Shows trip cards with status and deadline information.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../components/ScreenHeader';
import FrappeImage from '../components/FrappeImage';
import { useFieldTripsPendingAuthorization } from '../api/hooks';
import { FieldTripStudent } from '../api/frappe';
import { COLORS, SPACING, BORDERS, FONT_SIZES } from '../theme';

const SCREEN_COLORS = {
  successLight: '#E8F5E9',
  errorLight: '#FFEBEE',
  warningLight: '#FFF8E1',
};

export default function FieldTripsScreen() {
  const router = useRouter();
  const { data: trips, isLoading, refetch } = useFieldTripsPendingAuthorization();

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getDaysUntilDeadline = (deadlineStr: string) => {
    const deadline = new Date(deadlineStr);
    const today = new Date();
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderTripCard = ({ item }: { item: FieldTripStudent }) => {
    const trip = item.field_trip_details;
    if (!trip) return null;

    const daysLeft = getDaysUntilDeadline(trip.authorization_deadline);
    const isUrgent = daysLeft <= 3;
    const isExpired = daysLeft < 0;

    const isPending = item.authorization_status === 'Pending';
    const isAuthorized = item.authorization_status === 'Authorized';
    const isDeclined = item.authorization_status === 'Declined';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/salidas/${item.name}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardImageContainer}>
          <FrappeImage
            fileId={trip.image}
            style={styles.cardImage}
            resizeMode="cover"
            fallback={
              <View style={styles.cardImagePlaceholder}>
                <MaterialCommunityIcons name="bus-school" size={32} color={COLORS.primary} />
              </View>
            }
          />
          {/* Status Badge */}
          {isPending && !isExpired && (
            <View style={[styles.statusBadge, isUrgent && styles.urgentBadge]}>
              <Text style={styles.statusBadgeText}>
                {isUrgent ? `${daysLeft} días` : 'Pendiente'}
              </Text>
            </View>
          )}
          {isAuthorized && (
            <View style={[styles.statusBadge, styles.authorizedStatusBadge]}>
              <Ionicons name="checkmark" size={12} color={COLORS.white} />
            </View>
          )}
          {isDeclined && (
            <View style={[styles.statusBadge, styles.declinedStatusBadge]}>
              <Ionicons name="close" size={12} color={COLORS.white} />
            </View>
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {trip.trip_name}
          </Text>

          <View style={styles.cardInfo}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.gray} />
            <Text style={styles.cardInfoText}>
              {formatDate(trip.departure_date)}
              {trip.return_date !== trip.departure_date && ` - ${formatDate(trip.return_date)}`}
            </Text>
          </View>

          <View style={styles.cardInfo}>
            <Ionicons name="location-outline" size={14} color={COLORS.gray} />
            <Text style={styles.cardInfoText} numberOfLines={1}>
              {trip.destination}
            </Text>
          </View>

          {isPending && !isExpired && (
            <View style={[styles.deadlineBanner, isUrgent && styles.urgentDeadlineBanner]}>
              <Ionicons
                name="time-outline"
                size={14}
                color={isUrgent ? COLORS.error : COLORS.primary}
              />
              <Text style={[styles.deadlineText, isUrgent && styles.urgentDeadlineText]}>
                Autorizar antes del {formatDate(trip.authorization_deadline)}
              </Text>
            </View>
          )}

          {isExpired && isPending && (
            <View style={styles.expiredBanner}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.expiredText}>Plazo vencido</Text>
            </View>
          )}
        </View>

        <View style={styles.cardArrow}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="bus-school" size={64} color={COLORS.gray} />
      <Text style={styles.emptyTitle}>Sin salidas pendientes</Text>
      <Text style={styles.emptyText}>
        No hay salidas educativas que requieran autorización en este momento.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader title="Salidas Educativas" showBackButton={false} />

      <FlatList
        data={trips}
        keyExtractor={(item) => item.name}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={!isLoading ? EmptyState : null}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.tabBarOffset,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDERS.radius.lg,
    overflow: 'hidden',
    borderWidth: BORDERS.width.thin,
    borderColor: COLORS.border,
  },
  cardImageContainer: {
    position: 'relative',
    width: 100,
  },
  cardImage: {
    width: 100,
    height: '100%',
    minHeight: 120,
  },
  cardImagePlaceholder: {
    width: 100,
    height: '100%',
    minHeight: 120,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: SPACING.xs,
    left: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDERS.radius.sm,
  },
  urgentBadge: {
    backgroundColor: COLORS.error,
  },
  authorizedStatusBadge: {
    backgroundColor: COLORS.success,
  },
  declinedStatusBadge: {
    backgroundColor: COLORS.error,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.xs,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginBottom: SPACING.xs,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xxs,
  },
  cardInfoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.gray,
    flex: 1,
  },
  deadlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDERS.radius.sm,
    marginTop: SPACING.xs,
  },
  urgentDeadlineBanner: {
    backgroundColor: SCREEN_COLORS.errorLight,
  },
  deadlineText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontWeight: '500',
  },
  urgentDeadlineText: {
    color: COLORS.error,
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: SCREEN_COLORS.errorLight,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDERS.radius.sm,
    marginTop: SPACING.xs,
  },
  expiredText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.error,
    fontWeight: '500',
  },
  cardArrow: {
    justifyContent: 'center',
    paddingRight: SPACING.md,
  },
  separator: {
    height: SPACING.md,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
    paddingHorizontal: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES['4xl'],
    fontWeight: '600',
    color: COLORS.darkGray,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    fontSize: FONT_SIZES['2xl'],
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: FONT_SIZES['4xl'],
  },
});
