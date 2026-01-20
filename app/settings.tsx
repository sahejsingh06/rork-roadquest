import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Alert, ActivityIndicator } from 'react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Trash2 } from 'lucide-react-native';

const SPEED_THRESHOLDS = [80, 100, 120, 150];

export default function SettingsScreen() {
  const { useKmh, toggleUnit } = useTrip();
  const { deleteAccount } = useUser();
  const { signOut } = useAuth();
  const [highSpeedThreshold, setHighSpeedThreshold] = useState(100);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action is irreversible and will delete all your data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteAccount();
              await signOut();
              router.replace('/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Settings</Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Units</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Distance Unit</Text>
                <Text style={styles.settingDescription}>
                  Currently using {useKmh ? 'Kilometers (km)' : 'Miles (mi)'}
                </Text>
              </View>
              <Switch
                value={useKmh}
                onValueChange={toggleUnit}
                trackColor={{ false: theme.colors.dark.border, true: theme.colors.dark.accent }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Speed Settings</Text>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>High Speed Threshold</Text>
            <Text style={styles.cardDescription}>
              Set the speed threshold for &apos;high speed time&apos; tracking
            </Text>
            <View style={styles.thresholdOptions}>
              {SPEED_THRESHOLDS.map((threshold) => (
                <Pressable
                  key={threshold}
                  style={[
                    styles.thresholdOption,
                    highSpeedThreshold === threshold && styles.thresholdOptionSelected,
                  ]}
                  onPress={() => setHighSpeedThreshold(threshold)}
                >
                  <Text style={[
                    styles.thresholdText,
                    highSpeedThreshold === threshold && styles.thresholdTextSelected,
                  ]}>
                    {threshold} {useKmh ? 'km/h' : 'mph'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDescription}>1.0.0</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <Trash2 size={20} color={theme.colors.dark.danger} />
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Deleting Account...' : 'Delete Account'}
              </Text>
              {isDeleting && <ActivityIndicator size="small" color={theme.colors.dark.danger} />}
            </Pressable>
            <Text style={styles.deleteDescription}>
              Permanently delete your account and all associated data.
            </Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
  },
  backText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  title: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  placeholder: {
    width: 50,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
  },
  sectionTitle: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
    marginBottom: theme.spacing.sm,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingLabel: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.xs,
  },
  settingDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
  cardTitle: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
  },
  thresholdOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  thresholdOption: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.dark.cardElevated,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thresholdOptionSelected: {
    backgroundColor: theme.colors.dark.accent,
    borderColor: theme.colors.dark.accent,
  },
  thresholdText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  thresholdTextSelected: {
    color: theme.colors.dark.background,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  deleteButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.danger,
    fontWeight: '600' as const,
  },
  deleteDescription: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.sm,
  },
});
