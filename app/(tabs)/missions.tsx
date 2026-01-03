import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Clock, CheckCircle2, Trophy, Zap, Navigation, Moon, TrendingUp, ShoppingBag, Users } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { useTrip } from '@/contexts/TripContext';
import { trpc } from '@/lib/trpc';
import { Image } from 'expo-image';

type MissionPeriod = 'daily' | 'weekly' | 'monthly';

interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  reward: number;
  type: 'distance' | 'trips' | 'roads' | 'speed' | 'night' | 'streak';
  period: MissionPeriod;
  completed: boolean;
}

export default function MissionsScreen() {
  const router = useRouter();
  const { trips } = useTrip();
  const [selectedPeriod, setSelectedPeriod] = useState<MissionPeriod>('daily');
  const [claimedMissions, setClaimedMissions] = useState<Set<string>>(new Set());

  const friendsProgressQuery = trpc.trips.getFriendsProgress.useQuery(undefined, {
    refetchInterval: 30000,
  });

  const timeUntilReset = useMemo(() => {
    const now = new Date();
    let resetTime: Date;

    if (selectedPeriod === 'daily') {
      resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    } else if (selectedPeriod === 'weekly') {
      const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
      resetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday, 0, 0, 0);
    } else {
      resetTime = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0);
    }

    const diff = resetTime.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  }, [selectedPeriod]);

  const missions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    const dailyTrips = trips.filter(trip => trip.startTime >= startOfDay);
    const weeklyTrips = trips.filter(trip => trip.startTime >= startOfWeek);
    const monthlyTrips = trips.filter(trip => trip.startTime >= startOfMonth);

    const dailyDistance = dailyTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const weeklyDistance = weeklyTrips.reduce((sum, trip) => sum + trip.distance, 0);
    const monthlyDistance = monthlyTrips.reduce((sum, trip) => sum + trip.distance, 0);

    const dailyTripsCount = dailyTrips.length;
    const weeklyTripsCount = weeklyTrips.length;

    const nightTrips = dailyTrips.filter(trip => {
      const hour = new Date(trip.startTime).getHours();
      return hour >= 20 || hour < 5;
    }).length;

    const weeklyDays = new Set(weeklyTrips.map(trip => 
      new Date(trip.startTime).toDateString()
    )).size;

    const uniqueRoadsDaily = Math.floor(dailyDistance * 0.8);
    const uniqueRoadsWeekly = Math.floor(weeklyDistance * 0.8);
    const uniqueRoadsMonthly = Math.floor(monthlyDistance * 0.8);

    const allMissions: Mission[] = [
      {
        id: 'd1',
        title: 'Daily Driver',
        description: 'Drive 3 km today',
        target: 3,
        current: dailyDistance,
        reward: 3,
        type: 'distance',
        period: 'daily',
        completed: dailyDistance >= 3,
      },
      {
        id: 'd2',
        title: 'Complete a Trip',
        description: 'Finish 1 trip today',
        target: 1,
        current: dailyTripsCount,
        reward: 1,
        type: 'trips',
        period: 'daily',
        completed: dailyTripsCount >= 1,
      },
      {
        id: 'd3',
        title: 'Road Explorer',
        description: 'Cover 5 km of new roads',
        target: 5,
        current: uniqueRoadsDaily,
        reward: 5,
        type: 'roads',
        period: 'daily',
        completed: uniqueRoadsDaily >= 5,
      },
      {
        id: 'd4',
        title: 'Night Owl',
        description: 'Drive at night (8pm-5am)',
        target: 1,
        current: nightTrips,
        reward: 2,
        type: 'night',
        period: 'daily',
        completed: nightTrips >= 1,
      },
      {
        id: 'w1',
        title: 'Weekly Warrior',
        description: 'Drive 50 km this week',
        target: 50,
        current: weeklyDistance,
        reward: 50,
        type: 'distance',
        period: 'weekly',
        completed: weeklyDistance >= 50,
      },
      {
        id: 'w2',
        title: 'Road Discoverer',
        description: 'Cover 25 km of new roads',
        target: 25,
        current: uniqueRoadsWeekly,
        reward: 30,
        type: 'roads',
        period: 'weekly',
        completed: uniqueRoadsWeekly >= 25,
      },
      {
        id: 'w3',
        title: 'Consistent Driver',
        description: 'Drive on 5 different days',
        target: 5,
        current: weeklyDays,
        reward: 25,
        type: 'streak',
        period: 'weekly',
        completed: weeklyDays >= 5,
      },
      {
        id: 'w4',
        title: 'Trip Master',
        description: 'Complete 10 trips',
        target: 10,
        current: weeklyTripsCount,
        reward: 20,
        type: 'trips',
        period: 'weekly',
        completed: weeklyTripsCount >= 10,
      },
      {
        id: 'm1',
        title: 'Monthly Marathon',
        description: 'Drive 300 km this month',
        target: 300,
        current: monthlyDistance,
        reward: 300,
        type: 'distance',
        period: 'monthly',
        completed: monthlyDistance >= 300,
      },
      {
        id: 'm2',
        title: 'Road Coverage Expert',
        description: 'Cover 100 km of new roads',
        target: 100,
        current: uniqueRoadsMonthly,
        reward: 150,
        type: 'roads',
        period: 'monthly',
        completed: uniqueRoadsMonthly >= 100,
      },
      {
        id: 'm3',
        title: 'Top Performer',
        description: 'Reach top 20% in leaderboard',
        target: 1,
        current: 0,
        reward: 100,
        type: 'speed',
        period: 'monthly',
        completed: false,
      },
      {
        id: 'm4',
        title: 'Streak Champion',
        description: 'Maintain 10-day streak',
        target: 10,
        current: 0,
        reward: 75,
        type: 'streak',
        period: 'monthly',
        completed: false,
      },
    ];

    return allMissions.filter(m => m.period === selectedPeriod);
  }, [trips, selectedPeriod]);

  const handleClaimMission = (missionId: string) => {
    setClaimedMissions(new Set([...claimedMissions, missionId]));
  };

  const completedCount = missions.filter(m => m.completed).length;
  const totalRewards = missions.reduce((sum, m) => sum + (m.completed ? m.reward : 0), 0);

  const totalGPSPoints = useMemo(() => {
    return Math.floor(trips.reduce((sum, trip) => sum + trip.distance, 0));
  }, [trips]);

  const getMissionIcon = (type: Mission['type']) => {
    switch (type) {
      case 'distance':
        return <Navigation size={20} color={theme.colors.dark.accent} />;
      case 'trips':
        return <Target size={20} color={theme.colors.dark.success} />;
      case 'roads':
        return <TrendingUp size={20} color={theme.colors.dark.warning} />;
      case 'night':
        return <Moon size={20} color="#9F7AEA" />;
      case 'streak':
        return <Zap size={20} color="#F59E0B" />;
      default:
        return <Trophy size={20} color={theme.colors.dark.accent} />;
    }
  };

  const renderMission = (mission: Mission) => {
    const progress = Math.min((mission.current / mission.target) * 100, 100);
    const isClaimed = claimedMissions.has(mission.id);

    return (
      <Pressable
        key={mission.id}
        style={[
          styles.missionCard,
          mission.completed && styles.missionCardCompleted,
          isClaimed && styles.missionCardClaimed,
        ]}
        disabled={!mission.completed || isClaimed}
        onPress={() => mission.completed && !isClaimed && handleClaimMission(mission.id)}
      >
        <View style={styles.missionHeader}>
          <View style={[
            styles.missionIconContainer,
            mission.completed && styles.missionIconContainerCompleted,
          ]}>
            {getMissionIcon(mission.type)}
          </View>
          <View style={styles.missionInfo}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            <Text style={styles.missionDescription}>{mission.description}</Text>
          </View>
          {isClaimed ? (
            <View style={styles.claimedBadge}>
              <CheckCircle2 size={20} color={theme.colors.dark.success} />
              <Text style={styles.claimedText}>Claimed</Text>
            </View>
          ) : mission.completed ? (
            <View style={styles.claimButton}>
              <Trophy size={16} color="#FFFFFF" />
              <Text style={styles.claimButtonText}>Claim</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.missionProgress}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={
                mission.completed
                  ? [theme.colors.dark.success, theme.colors.dark.success]
                  : ['#0A84FF', '#0066CC']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress}%` }]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {mission.current.toFixed(mission.type === 'distance' || mission.type === 'roads' ? 1 : 0)} / {mission.target}
            </Text>
            <View style={styles.rewardBadge}>
              <Trophy size={12} color={theme.colors.dark.accent} />
              <Text style={styles.rewardText}>+{mission.reward} GP</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#0a0a0a', '#000000']}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerIconWrapper}>
              <LinearGradient
                colors={['#0A84FF', '#0066CC']}
                style={styles.headerIconGradient}
              >
                <Target size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Missions</Text>
              <Text style={styles.subtitle}>Complete challenges to earn rewards</Text>
            </View>
          <Pressable 
            style={styles.gpStoreBadge}
            onPress={() => router.push('/gp-store')}
          >
            <Zap size={16} color="#FFD700" fill="#FFD700" />
            <Text style={styles.gpStoreText}>{totalGPSPoints}</Text>
            <ShoppingBag size={14} color="#FFD700" />
          </Pressable>
        </View>
        </View>
      </LinearGradient>

      <View style={styles.periodSelector}>
        <Pressable
          style={[
            styles.periodTab,
            selectedPeriod === 'daily' && styles.periodTabActive,
          ]}
          onPress={() => setSelectedPeriod('daily')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'daily' && styles.periodTabTextActive,
            ]}
          >
            Daily
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.periodTab,
            selectedPeriod === 'weekly' && styles.periodTabActive,
          ]}
          onPress={() => setSelectedPeriod('weekly')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'weekly' && styles.periodTabTextActive,
            ]}
          >
            Weekly
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.periodTab,
            selectedPeriod === 'monthly' && styles.periodTabActive,
          ]}
          onPress={() => setSelectedPeriod('monthly')}
        >
          <Text
            style={[
              styles.periodTabText,
              selectedPeriod === 'monthly' && styles.periodTabTextActive,
            ]}
          >
            Monthly
          </Text>
        </Pressable>
      </View>

      <LinearGradient
        colors={['rgba(10, 132, 255, 0.15)', 'rgba(10, 132, 255, 0.05)']}
        style={styles.statsBar}
      >
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{completedCount}/{missions.length}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalRewards} GP</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Clock size={16} color={theme.colors.dark.textSecondary} />
          <Text style={styles.statValue}>{timeUntilReset}</Text>
          <Text style={styles.statLabel}>Reset</Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <View style={styles.sectionHeaderWithIcon}>
            <View style={styles.sectionIconCircle}>
              <Zap size={16} color="#FFD700" fill="#FFD700" />
            </View>
            <Text style={styles.sectionTitle}>
              {selectedPeriod === 'daily' ? 'Today' : selectedPeriod === 'weekly' ? 'This Week' : 'This Month'}&apos;s Missions
            </Text>
          </View>
          <View style={styles.missionsGrid}>
            {missions.map(renderMission)}
          </View>
        </View>

        <LinearGradient
          colors={['rgba(10, 132, 255, 0.1)', 'rgba(10, 132, 255, 0.05)']}
          style={styles.infoBox}
        >
          <View style={styles.infoIconContainer}>
            <Trophy size={20} color={theme.colors.dark.accent} />
          </View>
          <Text style={styles.infoTitle}>How Missions Work</Text>
          <Text style={styles.infoText}>
            🎯 Complete missions to earn bonus GPS Points{'\n'}
            ⏰ Missions reset {selectedPeriod === 'daily' ? 'daily at midnight' : selectedPeriod === 'weekly' ? 'every Monday' : 'on the 1st of each month'}{'\n'}
            🎁 GPS Points can be used to unlock rewards{'\n'}
            🚗 Drive safe and explore new roads!
          </Text>
        </LinearGradient>

        {friendsProgressQuery.data && friendsProgressQuery.data.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderWithIcon}>
              <View style={styles.sectionIconCircle}>
                <Users size={16} color={theme.colors.dark.accent} />
              </View>
              <Text style={styles.sectionTitle}>Friends Progress</Text>
            </View>
            <View style={styles.friendsProgressList}>
              {friendsProgressQuery.data.map((friend) => (
                <View key={friend.userId} style={styles.friendProgressCard}>
                  <View style={styles.friendProgressHeader}>
                    <View style={styles.friendProgressAvatar}>
                      {friend.photoUrl ? (
                        <Image source={{ uri: friend.photoUrl }} style={styles.friendProgressAvatarImage} />
                      ) : (
                        <Text style={styles.friendProgressAvatarText}>
                          {friend.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.friendProgressInfo}>
                      <Text style={styles.friendProgressName}>{friend.username}</Text>
                      <Text style={styles.friendProgressGP}>{friend.totalGPSPoints} GP</Text>
                    </View>
                  </View>
                  <View style={styles.friendProgressStats}>
                    <View style={styles.friendProgressStat}>
                      <Text style={styles.friendProgressStatValue}>{friend.todayDistance.toFixed(1)} km</Text>
                      <Text style={styles.friendProgressStatLabel}>Today</Text>
                    </View>
                    <View style={styles.friendProgressStat}>
                      <Text style={styles.friendProgressStatValue}>{friend.weekDistance.toFixed(1)} km</Text>
                      <Text style={styles.friendProgressStatLabel}>This Week</Text>
                    </View>
                    <View style={styles.friendProgressStat}>
                      <Text style={styles.friendProgressStatValue}>{friend.todayTrips}</Text>
                      <Text style={styles.friendProgressStatLabel}>Trips Today</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
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
  headerGradient: {
    paddingBottom: theme.spacing.md,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerIconWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerIconGradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  subtitle: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
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
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.dark.border,
    marginHorizontal: theme.spacing.sm,
  },
  statValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  missionsGrid: {
    gap: theme.spacing.md,
  },
  missionCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.dark.border,
  },
  missionCardCompleted: {
    borderColor: theme.colors.dark.success,
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
  },
  missionCardClaimed: {
    opacity: 0.6,
    borderColor: theme.colors.dark.border,
    backgroundColor: 'rgba(28, 28, 30, 0.4)',
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  missionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionIconContainerCompleted: {
    backgroundColor: 'rgba(48, 209, 88, 0.2)',
  },
  missionInfo: {
    flex: 1,
  },
  missionTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  missionDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: 2,
  },
  missionProgress: {
    gap: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  rewardText: {
    ...theme.typography.caption1,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.dark.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  claimButtonText: {
    ...theme.typography.callout,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 14,
  },
  claimedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  claimedText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
    fontSize: 12,
  },
  infoBox: {
    marginTop: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  infoTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    fontSize: 18,
  },
  infoText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },
  friendsProgressList: {
    gap: theme.spacing.md,
  },
  friendProgressCard: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.dark.border,
  },
  friendProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  friendProgressAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  friendProgressAvatarImage: {
    width: 48,
    height: 48,
  },
  friendProgressAvatarText: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  friendProgressInfo: {
    flex: 1,
  },
  friendProgressName: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  friendProgressGP: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.accent,
    marginTop: 2,
  },
  friendProgressStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  friendProgressStat: {
    flex: 1,
    alignItems: 'center',
  },
  friendProgressStatValue: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  friendProgressStatLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  gpStoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  gpStoreText: {
    ...theme.typography.callout,
    color: '#FFD700',
    fontWeight: '700' as const,
    fontSize: 14,
  },
});
