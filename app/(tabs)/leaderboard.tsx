import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useUser } from '@/contexts/UserContext';
import { useTrip } from '@/contexts/TripContext';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';
import type {
  LeaderboardType,
  LeaderboardPeriod,
  LeaderboardEntry,
} from '@/types/leaderboard';
import type { Trip } from '@/types/trip';

export default function LeaderboardScreen() {
  const { userProfile } = useUser();
  const { trips } = useTrip();
  const { user: authUser } = useAuth();
  
  const [selectedType, setSelectedType] = useState<LeaderboardType>('distance');
  const [selectedPeriod, setSelectedPeriod] = useState<LeaderboardPeriod>('weekly');
  const [selectedScope, setSelectedScope] = useState<'global' | 'friends'>('global');


  const localStats = useMemo(() => {
    let totalDistance = 0;
    let totalGPSPoints = 0;
    let totalTrips = 0;

    if (trips && trips.length > 0) {
      trips.forEach((trip: Trip) => {
        totalDistance += trip.distance;
        totalTrips += 1;
      });
      totalGPSPoints = Math.floor(totalDistance);
    }

    return {
      totalDistance: Math.round(totalDistance),
      totalGPSPoints,
      totalTrips,
      roadCoveragePercent: 0.8,
    };
  }, [trips]);

  const { syncToBackend } = useUser();

  useEffect(() => {
    if (authUser && userProfile) {
      console.log('Syncing stats to backend:', localStats);
      syncToBackend({
        totalDistance: localStats.totalDistance,
        totalTrips: localStats.totalTrips,
        totalGPSPoints: localStats.totalGPSPoints,
        roadCoveragePercent: localStats.roadCoveragePercent,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser?.id, localStats.totalDistance, localStats.totalTrips, localStats.totalGPSPoints]);

  const leaderboardQuery = trpc.leaderboard.get.useQuery(
    {
      type: selectedType,
      period: selectedPeriod,
      scope: selectedScope,
    },
    {
      enabled: !!authUser,
      refetchInterval: 10000,
    }
  );

  const leaderboardData = useMemo(() => {
    if (leaderboardQuery.data) {
      return {
        entries: leaderboardQuery.data.entries,
        currentUserEntry: leaderboardQuery.data.currentUserEntry,
      };
    }

    let currentUserValue = 0;
    if (selectedType === 'distance') {
      currentUserValue = localStats.totalDistance;
    } else if (selectedType === 'gpsPoints') {
      currentUserValue = localStats.totalGPSPoints;
    } else if (selectedType === 'trips') {
      currentUserValue = localStats.totalTrips;
    } else if (selectedType === 'coverage') {
      currentUserValue = localStats.roadCoveragePercent;
    }

    const currentUserEntry: LeaderboardEntry = {
      rank: 1,
      userId: userProfile?.id || 'current',
      username: userProfile?.username || 'You',
      photoUrl: userProfile?.photoUrl,
      region: userProfile?.region,
      value: currentUserValue,
      change: 0,
    };

    return {
      entries: [],
      currentUserEntry,
    };
  }, [leaderboardQuery.data, selectedType, localStats, userProfile]);

  const getValueLabel = (type: LeaderboardType): string => {
    switch (type) {
      case 'distance':
        return 'km';
      case 'coverage':
        return '%';
      case 'gpsPoints':
        return 'GP';
      case 'trips':
        return 'trips';
    }
  };

  const formatValue = (value: number, type: LeaderboardType): string => {
    if (type === 'coverage') {
      return value.toFixed(2);
    }
    return value.toLocaleString();
  };

  const renderRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <View style={[styles.rankBadge, styles.goldBadge]}>
          <Crown size={20} color="#FFD700" fill="#FFD700" />
        </View>
      );
    } else if (rank === 2) {
      return (
        <View style={[styles.rankBadge, styles.silverBadge]}>
          <Text style={styles.rankNumber}>{rank}</Text>
        </View>
      );
    } else if (rank === 3) {
      return (
        <View style={[styles.rankBadge, styles.bronzeBadge]}>
          <Text style={styles.rankNumber}>{rank}</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.rankBadge}>
          <Text style={styles.rankNumber}>{rank}</Text>
        </View>
      );
    }
  };

  const renderChangeIndicator = (change?: number) => {
    if (!change || change === 0) {
      return (
        <View style={styles.changeContainer}>
          <Minus size={14} color={theme.colors.dark.textTertiary} />
        </View>
      );
    }
    if (change > 0) {
      return (
        <View style={styles.changeContainer}>
          <TrendingUp size={14} color={theme.colors.dark.success} />
          <Text style={[styles.changeText, { color: theme.colors.dark.success }]}>
            +{change}
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.changeContainer}>
        <TrendingDown size={14} color={theme.colors.dark.danger} />
        <Text style={[styles.changeText, { color: theme.colors.dark.danger }]}>
          {change}
        </Text>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, isCurrentUser: boolean = false) => (
    <View
      key={entry.userId}
      style={[
        styles.entryCard,
        isCurrentUser && styles.currentUserCard,
      ]}
    >
      <View style={styles.entryLeft}>
        {renderRankBadge(entry.rank)}
        
        <View style={styles.avatar}>
          {entry.photoUrl ? (
            <Image source={{ uri: entry.photoUrl }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {entry.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.entryInfo}>
          <Text style={styles.entryUsername} numberOfLines={1}>
            {entry.username}
            {isCurrentUser && ' (You)'}
          </Text>
          {entry.region && (
            <Text style={styles.entryRegion} numberOfLines={1}>
              {entry.region}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.entryRight}>
        {renderChangeIndicator(entry.change)}
        <Text style={styles.entryValue}>
          {formatValue(entry.value, selectedType)}
          <Text style={styles.entryUnit}> {getValueLabel(selectedType)}</Text>
        </Text>
      </View>
    </View>
  );

  const getPeriodLabel = (period: LeaderboardPeriod): string => {
    switch (period) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'season':
        return 'Season 1';
      case 'allTime':
        return 'All Time';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Trophy size={32} color={theme.colors.dark.accent} />
            <Text style={styles.title}>Leaderboard</Text>
          </View>
          <Text style={styles.subtitle}>Compete with drivers worldwide</Text>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Leaderboard Type</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'distance' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType('distance')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === 'distance' && styles.filterChipTextActive,
                ]}
              >
                Distance
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'gpsPoints' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType('gpsPoints')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === 'gpsPoints' && styles.filterChipTextActive,
                ]}
              >
                GPS Points
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'coverage' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType('coverage')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === 'coverage' && styles.filterChipTextActive,
                ]}
              >
                Road Coverage
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedType === 'trips' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType('trips')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === 'trips' && styles.filterChipTextActive,
                ]}
              >
                Trips
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Time Period</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPeriod === 'weekly' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPeriod('weekly')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeriod === 'weekly' && styles.filterChipTextActive,
                ]}
              >
                Weekly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPeriod === 'monthly' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPeriod('monthly')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeriod === 'monthly' && styles.filterChipTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPeriod === 'season' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPeriod('season')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeriod === 'season' && styles.filterChipTextActive,
                ]}
              >
                Season
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedPeriod === 'allTime' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedPeriod('allTime')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedPeriod === 'allTime' && styles.filterChipTextActive,
                ]}
              >
                All Time
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Scope</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedScope === 'global' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedScope('global')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedScope === 'global' && styles.filterChipTextActive,
                ]}
              >
                Global
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedScope === 'friends' && styles.filterChipActive,
              ]}
              onPress={() => setSelectedScope('friends')}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedScope === 'friends' && styles.filterChipTextActive,
                ]}
              >
                Friends
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.currentPeriodBanner}>
          <Text style={styles.currentPeriodText}>
            {getPeriodLabel(selectedPeriod)} • {selectedScope === 'global' ? 'Global' : 'Friends'} Leaderboard
          </Text>
        </View>

        {leaderboardQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading leaderboard...</Text>
          </View>
        )}

        {leaderboardData.entries.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Drivers</Text>
            {leaderboardData.entries.map(entry => renderLeaderboardEntry(entry))}
          </View>
        )}

        {leaderboardData.currentUserEntry && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Stats</Text>
            {renderLeaderboardEntry(leaderboardData.currentUserEntry, true)}
          </View>
        )}

        {leaderboardData.entries.length === 0 && !leaderboardQuery.isLoading && (
          <View style={styles.infoNotice}>
            <Trophy size={24} color={theme.colors.dark.accent} />
            <Text style={styles.infoNoticeTitle}>
              {selectedScope === 'friends' ? 'No Friends Yet' : 'Be the First!'}
            </Text>
            <Text style={styles.infoNoticeText}>
              {selectedScope === 'friends' 
                ? 'Add friends to compete with them on the leaderboard. Go to your profile to add friends!'
                : 'Start driving to climb the leaderboard! Your stats will appear here as you complete trips.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
  },
  filterSection: {
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  filterLabel: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  filterScroll: {
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.full,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  filterChipText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  filterChipTextActive: {
    color: theme.colors.dark.text,
  },
  currentPeriodBanner: {
    marginTop: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  currentPeriodText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  podiumPlace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: theme.spacing.sm,
    position: 'relative',
  },
  podiumAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  podiumAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumAvatarText: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
  },
  crownBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumUsername: {
    ...theme.typography.footnote,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  podiumValue: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  podiumUnit: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  podiumBase: {
    width: '100%',
    height: 80,
    borderTopLeftRadius: theme.borderRadius.md,
    borderTopRightRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    ...theme.typography.title2,
    color: '#FFFFFF',
    fontWeight: '700' as const,
  },
  section: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    marginBottom: theme.spacing.md,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  currentUserCard: {
    backgroundColor: theme.colors.dark.cardElevated,
    borderWidth: 2,
    borderColor: theme.colors.dark.accent,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.md,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goldBadge: {
    backgroundColor: 'transparent',
  },
  silverBadge: {
    backgroundColor: '#C0C0C0',
  },
  bronzeBadge: {
    backgroundColor: '#CD7F32',
  },
  rankNumber: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
  },
  entryInfo: {
    flex: 1,
  },
  entryUsername: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  entryRegion: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  entryRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  changeText: {
    ...theme.typography.caption1,
    fontWeight: '600' as const,
  },
  entryValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  entryUnit: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
    fontWeight: '400' as const,
  },
  infoNotice: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  infoNoticeTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
  infoNoticeText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.dark.accent,
  },
  infoText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    marginBottom: 4,
  },
  infoSubtext: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
  },
  loadingContainer: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  loadingText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
});
