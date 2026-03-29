import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, UserPlus, Check, MapPin } from 'lucide-react-native';
import { theme } from '@/constants/theme';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/contexts/AuthContext';

export default function AddFriendScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [requestSent, setRequestSent] = useState(false);

  const userQuery = trpc.user.get.useQuery({ userId });
  const friendsQuery = trpc.friends.list.useQuery();
  const sendRequestMutation = trpc.friends.sendRequest.useMutation({
    onSuccess: () => {
      setRequestSent(true);
      Alert.alert('Success', 'Friend request sent!');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const isCurrentUser = currentUser?.id === userId;
  const isFriend = friendsQuery.data?.friends.some(f => f.userId === userId);
  const hasPendingRequest = friendsQuery.data?.sentRequests.some(r => r.userId === userId);

  const handleSendRequest = () => {
    if (!userId) return;
    sendRequestMutation.mutate({ friendId: userId });
  };

  if (userQuery.isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.dark.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Add Friend</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.dark.accent} />
        </View>
      </View>
    );
  }

  if (!userQuery.data) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.colors.dark.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Add Friend</Text>
            <View style={styles.headerSpacer} />
          </View>
        </SafeAreaView>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>User not found</Text>
        </View>
      </View>
    );
  }

  const user = userQuery.data;

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.colors.dark.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Add Friend</Text>
          <View style={styles.headerSpacer} />
        </View>
      </SafeAreaView>

      <View style={styles.content}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user.photoUrl ? (
              <Image 
                source={{ uri: user.photoUrl }} 
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
                  {user.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.handle}>@{user.username.toLowerCase().replace(/\s+/g, '')}</Text>

          {user.region && (
            <View style={styles.regionContainer}>
              <MapPin size={16} color={theme.colors.dark.textSecondary} />
              <Text style={styles.region}>{user.region}</Text>
            </View>
          )}

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalDistance.toFixed(0)}</Text>
              <Text style={styles.statLabel}>km driven</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.totalTrips}</Text>
              <Text style={styles.statLabel}>trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.roadCoveragePercent.toFixed(1)}%</Text>
              <Text style={styles.statLabel}>coverage</Text>
            </View>
          </View>
        </View>

        {!isCurrentUser && (
          <View style={styles.actionContainer}>
            {isFriend ? (
              <View style={styles.friendStatus}>
                <Check size={20} color={theme.colors.dark.success} />
                <Text style={styles.friendStatusText}>Already Friends</Text>
              </View>
            ) : hasPendingRequest || requestSent ? (
              <View style={styles.pendingStatus}>
                <Text style={styles.pendingStatusText}>Friend Request Sent</Text>
              </View>
            ) : (
              <Pressable 
                style={styles.addButton}
                onPress={handleSendRequest}
                disabled={sendRequestMutation.isPending}
              >
                {sendRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color={theme.colors.dark.background} />
                ) : (
                  <>
                    <UserPlus size={20} color={theme.colors.dark.background} />
                    <Text style={styles.addButtonText}>Add Friend</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}

        {isCurrentUser && (
          <View style={styles.currentUserContainer}>
            <Text style={styles.currentUserText}>This is your profile</Text>
          </View>
        )}
      </View>
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
    padding: theme.spacing.sm,
  },
  headerTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  errorText: {
    ...theme.typography.headline,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxl,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: theme.colors.dark.accent,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    fontSize: 48,
  },
  username: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.xs,
  },
  handle: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    marginBottom: theme.spacing.md,
  },
  regionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
  region: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.dark.border,
  },
  statValue: {
    ...theme.typography.title3,
    color: theme.colors.dark.accent,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: theme.spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dark.accent,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  addButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.background,
    fontWeight: '600' as const,
  },
  friendStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  friendStatusText: {
    ...theme.typography.callout,
    color: theme.colors.dark.success,
    fontWeight: '600' as const,
  },
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
  },
  pendingStatusText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  currentUserContainer: {
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  currentUserText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
  },
});
