import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { MapPin, Activity, Clock, TrendingUp } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { stats, useKmh } = useTrip();

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const achievements = [
    {
      id: '1',
      title: 'First Drive',
      description: 'Complete your first trip',
      unlocked: stats.totalTrips >= 1,
      icon: '🚗',
    },
    {
      id: '2',
      title: 'Road Warrior',
      description: 'Drive 100 km',
      unlocked: stats.totalDistance >= 100,
      icon: '🏁',
    },
    {
      id: '3',
      title: 'Marathon Driver',
      description: 'Drive 500 km',
      unlocked: stats.totalDistance >= 500,
      icon: '🎯',
    },
    {
      id: '4',
      title: 'Speed Demon',
      description: 'Reach 120 km/h',
      unlocked: stats.maxSpeedAllTime >= 120,
      icon: '⚡',
    },
    {
      id: '5',
      title: 'Explorer',
      description: 'Complete 10 trips',
      unlocked: stats.totalTrips >= 10,
      icon: '🗺️',
    },
    {
      id: '6',
      title: 'Century Club',
      description: 'Drive 1000 km',
      unlocked: stats.totalDistance >= 1000,
      icon: '💯',
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Stats</Text>
          <Text style={styles.subtitle}>Track your driving achievements</Text>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <MapPin size={24} color={theme.colors.dark.accent} />
            </View>
            <Text style={styles.statValue}>
              {stats.totalDistance.toFixed(1)}
            </Text>
            <Text style={styles.statLabel}>Total Distance (km)</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Activity size={24} color={theme.colors.dark.success} />
            </View>
            <Text style={styles.statValue}>
              {stats.totalTrips}
            </Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Clock size={24} color={theme.colors.dark.warning} />
            </View>
            <Text style={styles.statValue}>
              {formatDuration(stats.totalDuration)}
            </Text>
            <Text style={styles.statLabel}>Time Driving</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color={theme.colors.dark.accent} />
            </View>
            <Text style={styles.statValue}>
              {Math.round(useKmh ? stats.averageSpeed : stats.averageSpeed * 0.621371)}
            </Text>
            <Text style={styles.statLabel}>Avg Speed ({useKmh ? 'km/h' : 'mph'})</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubtitle}>
            {achievements.filter(a => a.unlocked).length} of {achievements.length} unlocked
          </Text>

          <View style={styles.achievementsList}>
            {achievements.map((achievement) => (
              <View
                key={achievement.id}
                style={[
                  styles.achievementCard,
                  !achievement.unlocked && styles.achievementLocked,
                ]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementContent}>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !achievement.unlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  <Text
                    style={[
                      styles.achievementDescription,
                      !achievement.unlocked && styles.achievementDescriptionLocked,
                    ]}
                  >
                    {achievement.description}
                  </Text>
                </View>
                {achievement.unlocked && (
                  <View style={styles.achievementBadge}>
                    <Text style={styles.achievementBadgeText}>✓</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>RoadQuest v1.0</Text>
          <Text style={styles.footerSubtext}>
            Keep driving to unlock more achievements
          </Text>
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
    paddingBottom: theme.spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
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
  statIcon: {
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
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
  },
  sectionSubtitle: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  achievementsList: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  achievementLocked: {
    opacity: 0.4,
  },
  achievementIcon: {
    fontSize: 40,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  achievementTitleLocked: {
    color: theme.colors.dark.textSecondary,
  },
  achievementDescription: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  achievementDescriptionLocked: {
    color: theme.colors.dark.textTertiary,
  },
  achievementBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.dark.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  achievementBadgeText: {
    color: theme.colors.dark.background,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  footer: {
    alignItems: 'center',
    marginTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
  },
  footerText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
  },
  footerSubtext: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
