import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Trash2, ChevronRight, TrendingUp } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HistoryScreen() {
  const { trips, deleteTrip, useKmh } = useTrip();

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

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip History</Text>
          <Text style={styles.subtitle}>{trips.length} trips recorded</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <TrendingUp size={64} color={theme.colors.dark.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No Trips Yet</Text>
            <Text style={styles.emptyText}>
              Start your first drive to begin tracking your journeys
            </Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <Pressable
                style={styles.tripContent}
                onPress={() => router.push({ pathname: '/trip-summary/[id]', params: { id: trip.id } })}
              >
                <View style={styles.tripHeader}>
                  <Text style={styles.tripDate}>{formatDate(trip.startTime)}</Text>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
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
  tripDate: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
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
