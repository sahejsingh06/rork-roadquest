import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { BarChart3, Clock, Route, Zap, Gauge, Timer, TrendingUp, Calendar, Globe } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

export default function StatsScreen() {
  const { stats, trips, useKmh } = useTrip();
  const router = useRouter();

  const highSpeedThreshold = 100;

  const totalDrivenTime = useMemo(() => {
    return stats.totalDuration;
  }, [stats]);

  const highSpeedTime = useMemo(() => {
    let totalHighSpeedTime = 0;
    trips.forEach(trip => {
      let tripHighSpeedTime = 0;
      trip.locations.forEach((loc, index) => {
        if (index > 0 && (loc.speed || 0) >= highSpeedThreshold) {
          const timeDiff = loc.timestamp - trip.locations[index - 1].timestamp;
          tripHighSpeedTime += timeDiff;
        }
      });
      totalHighSpeedTime += tripHighSpeedTime;
    });
    return totalHighSpeedTime;
  }, [trips, highSpeedThreshold]);

  const monthlyDistance = useMemo(() => {
    const now = new Date();
    const monthlyData: { [key: string]: number } = {};

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyData[key] = 0;
    }

    trips.forEach(trip => {
      const tripDate = new Date(trip.startTime);
      const key = tripDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (monthlyData.hasOwnProperty(key)) {
        monthlyData[key] += trip.distance;
      }
    });

    return Object.entries(monthlyData).map(([month, distance]) => ({
      month,
      distance,
    }));
  }, [trips]);

  const maxMonthlyDistance = Math.max(...monthlyDistance.map(m => m.distance), 1);

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <BarChart3 size={28} color={theme.colors.dark.accent} />
          <Text style={styles.title}>All-Time Stats</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Pressable 
          style={styles.worldMapButton}
          onPress={() => router.push('/world-map')}
        >
          <Globe size={24} color={theme.colors.dark.accent} />
          <View style={styles.worldMapButtonText}>
            <Text style={styles.worldMapButtonTitle}>World Coverage Map</Text>
            <Text style={styles.worldMapButtonSubtitle}>View your explored roads</Text>
          </View>
        </Pressable>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Route size={24} color={theme.colors.dark.accent} />
              </View>
              <Text style={styles.statValue}>
                {stats.totalDistance.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>Total Distance (km)</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Clock size={24} color={theme.colors.dark.success} />
              </View>
              <Text style={styles.statValue}>
                {formatDuration(totalDrivenTime)}
              </Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Zap size={24} color={theme.colors.dark.danger} />
              </View>
              <Text style={styles.statValue}>
                {Math.round(useKmh ? stats.maxSpeedAllTime : stats.maxSpeedAllTime * 0.621371)}
              </Text>
              <Text style={styles.statLabel}>Top Speed ({useKmh ? 'km/h' : 'mph'})</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Gauge size={24} color={theme.colors.dark.warning} />
              </View>
              <Text style={styles.statValue}>
                {Math.round(useKmh ? stats.averageSpeed : stats.averageSpeed * 0.621371)}
              </Text>
              <Text style={styles.statLabel}>Avg Speed ({useKmh ? 'km/h' : 'mph'})</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Timer size={20} color={theme.colors.dark.text} />
            <Text style={styles.sectionTitle}>High Speed Time</Text>
          </View>
          <View style={styles.highSpeedCard}>
            <Text style={styles.highSpeedValue}>{formatDuration(highSpeedTime)}</Text>
            <Text style={styles.highSpeedLabel}>
              Time spent at {highSpeedThreshold}+ {useKmh ? 'km/h' : 'mph'}
            </Text>
            <View style={styles.highSpeedDivider} />
            <Text style={styles.highSpeedNote}>
              Threshold: {highSpeedThreshold} {useKmh ? 'km/h' : 'mph'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={theme.colors.dark.text} />
            <Text style={styles.sectionTitle}>Monthly Distance</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.monthlyChart}>
              {monthlyDistance.map((item, index) => {
                const height = (item.distance / maxMonthlyDistance) * 120;
                return (
                  <View key={index} style={styles.monthlyBar}>
                    <View style={styles.barContainer}>
                      <View 
                        style={[
                          styles.bar,
                          { 
                            height: Math.max(height, 4),
                          }
                        ]} 
                      />
                    </View>
                    <Text style={styles.monthLabel}>{item.month.split(' ')[0]}</Text>
                    <Text style={styles.distanceLabel}>{item.distance.toFixed(0)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={theme.colors.dark.text} />
            <Text style={styles.sectionTitle}>Trip Summary</Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Trips</Text>
              <Text style={styles.summaryValue}>{stats.totalTrips}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Avg Distance per Trip</Text>
              <Text style={styles.summaryValue}>
                {stats.totalTrips > 0 ? (stats.totalDistance / stats.totalTrips).toFixed(1) : 0} km
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Avg Duration per Trip</Text>
              <Text style={styles.summaryValue}>
                {stats.totalTrips > 0 ? formatDuration(stats.totalDuration / stats.totalTrips) : '0m'}
              </Text>
            </View>
          </View>
        </View>
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
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  worldMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    marginBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  worldMapButtonText: {
    flex: 1,
  },
  worldMapButtonTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  worldMapButtonSubtitle: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: 2,
  },
  section: {
    marginTop: theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  statValue: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  highSpeedCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  highSpeedValue: {
    ...theme.typography.largeTitle,
    color: theme.colors.dark.accent,
    fontWeight: '700' as const,
    fontSize: 48,
  },
  highSpeedLabel: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
  highSpeedDivider: {
    width: 60,
    height: 2,
    backgroundColor: theme.colors.dark.border,
    marginVertical: theme.spacing.md,
  },
  highSpeedNote: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
  chartCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  monthlyChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
  },
  monthlyBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  barContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 120,
  },
  bar: {
    width: '70%',
    backgroundColor: theme.colors.dark.accent,
    borderRadius: theme.borderRadius.sm,
    minHeight: 4,
  },
  monthLabel: {
    ...theme.typography.caption2,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  distanceLabel: {
    ...theme.typography.caption2,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  summaryCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  summaryLabel: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
  },
  summaryValue: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: theme.colors.dark.border,
  },
});
