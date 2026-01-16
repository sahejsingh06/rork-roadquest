import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Switch, Modal, Alert, ActivityIndicator } from 'react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SPEED_THRESHOLDS = [80, 100, 120, 150];

export default function SettingsScreen() {
  const { useKmh, toggleUnit } = useTrip();
  const [highSpeedThreshold, setHighSpeedThreshold] = useState(100);
  const { deleteAccount: deleteAuthAccount } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteAccountMutation = trpc.user.deleteAccount.useMutation();

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
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <Pressable
              style={styles.deleteButton}
              onPress={() => setShowDeleteModal(true)}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Version</Text>
                <Text style={styles.settingDescription}>1.0.1</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Account?</Text>
            <Text style={styles.modalMessage}>
              This permanently deletes your account and associated data. This cannot be undone.
            </Text>
            
            {isDeleting ? (
              <ActivityIndicator size="large" color={theme.colors.dark.accent} style={styles.loader} />
            ) : (
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowDeleteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmDeleteButton]}
                  onPress={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccountMutation.mutateAsync();
                      
                      await AsyncStorage.multiRemove([
                        '@roadquest_trips',
                        '@roadquest_stats',
                        '@roadquest_missions',
                        '@roadquest_store',
                      ]);
                      
                      const allKeys = await AsyncStorage.getAllKeys();
                      const userKeys = allKeys.filter(key => 
                        key.startsWith('@roadquest_user_profile_') || 
                        key.startsWith('@roadquest_onboarding_seen_')
                      );
                      if (userKeys.length > 0) {
                        await AsyncStorage.multiRemove(userKeys);
                      }
                      
                      await deleteAuthAccount();
                      
                      setShowDeleteModal(false);
                      
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
                      
                      router.replace('/sign-in');
                    } catch (error: any) {
                      console.error('Error deleting account:', error);
                      Alert.alert(
                        'Deletion Failed',
                        'Failed to delete your account. Please try again or contact support.'
                      );
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  <Text style={styles.confirmDeleteButtonText}>Delete</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#DC2626',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    ...theme.typography.callout,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
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
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalMessage: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
    lineHeight: 22,
  },
  loader: {
    marginVertical: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.colors.dark.cardElevated,
  },
  cancelButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  confirmDeleteButton: {
    backgroundColor: '#DC2626',
  },
  confirmDeleteButtonText: {
    ...theme.typography.callout,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
});
