import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Trash2, ChevronRight, TrendingUp, Route, Clock, Zap, Car as CarIcon, BarChart3 } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';

export default function HistoryScreen() {
  const { trips, deleteTrip, useKmh } = useTrip();
  const { userProfile } = useUser();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  const filteredTrips = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    let filtered = trips;

    switch (selectedPeriod) {
      case 'daily':
        filtered = trips.filter(trip => trip.startTime >= startOfDay);
        break;
      case 'weekly':
        filtered = trips.filter(trip => trip.startTime >= startOfWeek);
        break;
      case 'monthly':
        filtered = trips.filter(trip => trip.startTime >= startOfMonth);
        break;
      default:
        filtered = trips;
    }

    if (selectedCarId) {
      filtered = filtered.filter(trip => trip.carId === selectedCarId);
    }

    return filtered;
  }, [trips, selectedPeriod, selectedCarId]);

  const periodStats = useMemo(() => {
    const totalDistance = filteredTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const totalDuration = filteredTrips.reduce((sum, trip) => sum + trip.duration, 0);
    const avgSpeed = filteredTrips.length > 0
      ? filteredTrips.reduce((sum, trip) => sum + trip.avgSpeed, 0) / filteredTrips.length
      : 0;
    const maxSpeed = filteredTrips.length > 0
      ? Math.max(...filteredTrips.map(trip => trip.maxSpeed))
      : 0;

    return { totalDistance, totalDuration, avgSpeed, maxSpeed, tripCount: filteredTrips.length };
  }, [filteredTrips]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleDelete = (tripId: string) => {
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to delete this trip?')) {
        deleteTrip(tripId);
      }
    } else {
      Alert.alert(
        'Delete Trip',
        'Are you sure you want to delete this trip?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => deleteTrip(tripId),
          },
        ]
      );
    }
  };

  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'Week' },
    { key: 'monthly', label: 'Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Trip History</Text>
            <Text style={styles.subtitle}>{trips.length} trips recorded</Text>
          </View>
          <Pressable
            style={styles.statsButton}
            onPress={() => router.push('/(tabs)/stats')}
          >
            <BarChart3 size={18} color={theme.colors.dark.accent} />
            <Text style={styles.statsButtonText}>Lifetime Stats</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.periodSelector}
          style={styles.periodSelectorScroll}
        >
          {periods.map((period) => (
            <Pressable
              key={period.key}
              style={[
                styles.periodTab,
                selectedPeriod === period.key && styles.periodTabActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === period.key && styles.periodTabTextActive,
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {userProfile && userProfile.cars.length > 0 && (
          <View style={styles.carFilterContainer}>
            <View style={styles.carFilterHeader}>
              <CarIcon size={16} color={theme.colors.dark.textSecondary} />
              <Text style={styles.carFilterLabel}>Filter by car</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carFilterScroll}
            >
              {userProfile.cars.map((car) => (
                <Pressable
                  key={car.id}
                  style={[
                    styles.carFilterChip,
                    selectedCarId === car.id && styles.carFilterChipActive,
                  ]}
                  onPress={() => setSelectedCarId(selectedCarId === car.id ? null : car.id)}
                >
                  <Text style={styles.carFilterIcon}>{car.icon}</Text>
                  <Text
                    style={[
                      styles.carFilterText,
                      selectedCarId === car.id && styles.carFilterTextActive,
                    ]}
                  >
                    {car.brand}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.periodStatsContainer}>
          <View style={styles.periodStatItem}>
            <Route size={16} color={theme.colors.dark.accent} />
            <Text style={styles.periodStatValue}>{periodStats.totalDistance.toFixed(1)} km</Text>
          </View>
          <View style={styles.periodStatItem}>
            <Clock size={16} color={theme.colors.dark.success} />
            <Text style={styles.periodStatValue}>{formatDuration(periodStats.totalDuration)}</Text>
          </View>
          <View style={styles.periodStatItem}>
            <Zap size={16} color={theme.colors.dark.warning} />
            <Text style={styles.periodStatValue}>
              {Math.round(useKmh ? periodStats.maxSpeed : periodStats.maxSpeed * 0.621371)} {useKmh ? 'km/h' : 'mph'}
            </Text>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={64} color={theme.colors.dark.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Trips {selectedPeriod !== 'all' ? 'This Period' : 'Yet'}</Text>
            <Text style={styles.emptyText}>
              {selectedPeriod !== 'all' 
                ? 'No trips recorded for this time period'
                : 'Start your first drive to begin tracking your journeys'}
            </Text>
          </View>
        ) : (
          filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <Pressable
                style={styles.tripContent}
                onPress={() => router.push({ pathname: '/trip-summary/[id]', params: { id: trip.id } })}
              >
                <View style={styles.tripHeader}>
                  <View style={styles.tripHeaderLeft}>
                    {trip.carIcon && <Text style={styles.tripCarIcon}>{trip.carIcon}</Text>}
                    <Text style={styles.tripDate}>{formatDate(trip.startTime)}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.dark.textSecondary} />
                </View>

                <View style={styles.tripStats}>
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatValue}>
                      {trip.distance.toFixed(1)} km
                    </Text>
                    <Text style={styles.tripStatLabel}>Distance</Text>
                  </View>
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatValue}>
                      {formatDuration(trip.duration)}
                    </Text>
                    <Text style={styles.tripStatLabel}>Duration</Text>
                  </View>
                  <View style={styles.tripStatItem}>
                    <Text style={styles.tripStatValue}>
                      {Math.round(useKmh ? trip.avgSpeed : trip.avgSpeed * 0.621371)} {useKmh ? 'km/h' : 'mph'}
                    </Text>
                    <Text style={styles.tripStatLabel}>Avg Speed</Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDelete(trip.id)}
              >
                <Trash2 size={20} color={theme.colors.dark.danger} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  safeArea: {
    backgroundColor: theme.colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  statsButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
  },
  subtitle: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  periodSelectorScroll: {
    marginBottom: theme.spacing.md,
  },
  periodSelector: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  periodTab: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(28, 28, 30, 0.6)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  periodTabActive: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  periodTabText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
    fontSize: 15,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  periodStatsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.lg,
    justifyContent: 'space-around',
  },
  periodStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  periodStatValue: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl * 2,
  },
  emptyTitle: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    marginTop: theme.spacing.lg,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
  },
  tripCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  tripContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  tripHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tripCarIcon: {
    fontSize: 18,
  },
  tripDate: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
  },
  carFilterContainer: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  carFilterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  carFilterLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  carFilterScroll: {
    gap: theme.spacing.sm,
  },
  carFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  carFilterChipActive: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  carFilterIcon: {
    fontSize: 16,
  },
  carFilterText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  carFilterTextActive: {
    color: '#FFFFFF',
  },
  tripStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  tripStatItem: {
    flex: 1,
  },
  tripStatValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  tripStatLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  deleteButton: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.dark.cardElevated,
  },
});
