import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { MapPin, Activity, Clock, TrendingUp, Edit3, Trophy } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { stats, useKmh } = useTrip();
  const { userProfile, updateUsername, isLoading } = useUser();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [username, setUsername] = useState('');

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

  const handleSaveUsername = async () => {
    if (username.trim().length === 0) return;
    
    await updateUsername(username);
    setIsEditModalVisible(false);
    setUsername('');
  };

  const openEditModal = () => {
    setUsername(userProfile?.username || '');
    setIsEditModalVisible(true);
  };

  if (!isLoading && !userProfile) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
          <View style={styles.setupContainer}>
            <Trophy size={80} color={theme.colors.dark.accent} strokeWidth={1.5} />
            <Text style={styles.setupTitle}>Welcome to RoadQuest</Text>
            <Text style={styles.setupSubtitle}>
              Create your profile to appear on leaderboards and track your achievements
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Choose your username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor={theme.colors.dark.textTertiary}
                autoCapitalize="none"
                maxLength={20}
              />
            </View>

            <Pressable
              style={[styles.createButton, username.trim().length === 0 && styles.createButtonDisabled]}
              onPress={handleSaveUsername}
              disabled={username.trim().length === 0}
            >
              <Text style={styles.createButtonText}>Create Profile</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Stats</Text>
            <View style={styles.usernameContainer}>
              <Text style={styles.username}>@{userProfile?.username}</Text>
              <Pressable onPress={openEditModal} style={styles.editButton}>
                <Edit3 size={16} color={theme.colors.dark.accent} />
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <Modal
        visible={isEditModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.colors.dark.textTertiary}
              autoCapitalize="none"
              maxLength={20}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setIsEditModalVisible(false);
                  setUsername('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonSave, username.trim().length === 0 && styles.modalButtonDisabled]}
                onPress={handleSaveUsername}
                disabled={username.trim().length === 0}
              >
                <Text style={styles.modalButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  setupTitle: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
    marginTop: theme.spacing.xl,
    textAlign: 'center',
  },
  setupSubtitle: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginTop: theme.spacing.xxl,
  },
  inputLabel: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    marginBottom: theme.spacing.sm,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.dark.text,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  createButton: {
    backgroundColor: theme.colors.dark.accent,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    marginTop: theme.spacing.xl,
    width: '100%',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    ...theme.typography.headline,
    color: theme.colors.dark.background,
    fontWeight: '700' as const,
    textAlign: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  username: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  modalContent: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: theme.colors.dark.cardElevated,
  },
  modalButtonSave: {
    backgroundColor: theme.colors.dark.accent,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.background,
    fontWeight: '600' as const,
  },
  modalButtonTextCancel: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
});
