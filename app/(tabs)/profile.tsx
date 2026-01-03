import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus, Edit3, MapPin, Car as CarIcon, Trash2, Settings, Users, UserPlus, Check, Search } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { trpc } from '@/lib/trpc';
import type { Car } from '@/types/user';

const CAR_BRANDS = [
  { name: 'Toyota', icon: '🚗' },
  { name: 'Honda', icon: '🚙' },
  { name: 'BMW', icon: '🏎️' },
  { name: 'Mercedes', icon: '🚘' },
  { name: 'Audi', icon: '🚓' },
  { name: 'Ford', icon: '🚕' },
  { name: 'Tesla', icon: '⚡' },
  { name: 'Porsche', icon: '🏁' },
  { name: 'Ferrari', icon: '🔴' },
  { name: 'Lamborghini', icon: '🟡' },
  { name: 'Nissan', icon: '🔵' },
  { name: 'Mazda', icon: '⭕' },
  { name: 'Volkswagen', icon: '🔷' },
  { name: 'Other', icon: '🚐' },
];

const REGIONS = [
  'North America',
  'Europe',
  'Asia',
  'South America',
  'Africa',
  'Oceania',
  'Middle East',
];

export default function ProfileScreen() {
  const { stats } = useTrip();
  const { userProfile, updateUsername, updateProfilePhoto, updateRegion, addCar, removeCar } = useUser();
  const { signOut } = useAuth();
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isRegionModalVisible, setIsRegionModalVisible] = useState(false);
  const [isCarModalVisible, setIsCarModalVisible] = useState(false);
  const [isFriendsModalVisible, setIsFriendsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [selectedCarIcon, setSelectedCarIcon] = useState('🚗');

  const friendsQuery = trpc.friends.list.useQuery(undefined, { refetchInterval: 10000 });
  const searchQuery2 = trpc.user.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );
  const sendRequestMutation = trpc.friends.sendRequest.useMutation({
    onSuccess: () => friendsQuery.refetch(),
  });
  const acceptRequestMutation = trpc.friends.acceptRequest.useMutation({
    onSuccess: () => friendsQuery.refetch(),
  });
  const rejectRequestMutation = trpc.friends.rejectRequest.useMutation({
    onSuccess: () => friendsQuery.refetch(),
  });
  const removeFriendMutation = trpc.friends.removeFriend.useMutation({
    onSuccess: () => friendsQuery.refetch(),
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to upload a photo!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets[0]) {
      await updateProfilePhoto(result.assets[0].uri);
    }
  };

  const handleSaveUsername = async () => {
    if (username.trim().length === 0) return;
    await updateUsername(username);
    setIsEditModalVisible(false);
    setUsername('');
  };

  const handleSelectRegion = async (region: string) => {
    await updateRegion(region);
    setIsRegionModalVisible(false);
  };

  const handleAddCar = async () => {
    if (!carBrand || !carModel || !carYear) return;
    
    const newCar: Car = {
      id: Date.now().toString(),
      brand: carBrand,
      model: carModel,
      year: carYear,
      icon: selectedCarIcon,
    };
    
    await addCar(newCar);
    setIsCarModalVisible(false);
    setCarBrand('');
    setCarModel('');
    setCarYear('');
    setSelectedCarIcon('🚗');
  };

  const openEditModal = () => {
    setUsername(userProfile?.username || '');
    setIsEditModalVisible(true);
  };

  const openCarModal = () => {
    setCarBrand('');
    setCarModel('');
    setCarYear('');
    setSelectedCarIcon('🚗');
    setIsCarModalVisible(true);
  };

  if (!userProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable onPress={pickImage} style={styles.profileImageContainer}>
            {userProfile.photoUrl ? (
              <Image 
                source={{ uri: userProfile.photoUrl }} 
                style={styles.profileImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Camera size={24} color={theme.colors.dark.textSecondary} />
              </View>
            )}
          </Pressable>
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

      <Modal
        visible={isRegionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRegionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Region</Text>
              <Pressable onPress={() => setIsRegionModalVisible(false)}>
                <X size={24} color={theme.colors.dark.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={styles.regionList}>
              {REGIONS.map((region) => (
                <Pressable
                  key={region}
                  style={[
                    styles.regionItem,
                    userProfile.region === region && styles.regionItemSelected,
                  ]}
                  onPress={() => handleSelectRegion(region)}
                >
                  <Text style={[
                    styles.regionText,
                    userProfile.region === region && styles.regionTextSelected,
                  ]}>
                    {region}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsCarModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <Pressable 
            style={styles.modalOverlayPressable} 
            onPress={() => setIsCarModalVisible(false)}
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Car</Text>
                <Pressable onPress={() => setIsCarModalVisible(false)}>
                  <X size={24} color={theme.colors.dark.textSecondary} />
                </Pressable>
              </View>
              
              <ScrollView 
                style={styles.modalScrollView}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.inputLabel}>Select Brand</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.brandScroll}>
                  {CAR_BRANDS.map((brand) => (
                    <Pressable
                      key={brand.name}
                      style={[
                        styles.brandItem,
                        carBrand === brand.name && styles.brandItemSelected,
                      ]}
                      onPress={() => {
                        setCarBrand(brand.name);
                        setSelectedCarIcon(brand.icon);
                      }}
                    >
                      <Text style={styles.brandIcon}>{brand.icon}</Text>
                      <Text style={[
                        styles.brandText,
                        carBrand === brand.name && styles.brandTextSelected,
                      ]}>
                        {brand.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>

                <Text style={styles.inputLabel}>Model</Text>
                <TextInput
                  style={styles.input}
                  value={carModel}
                  onChangeText={setCarModel}
                  placeholder="e.g., Camry"
                  placeholderTextColor={theme.colors.dark.textTertiary}
                  maxLength={30}
                />

                <Text style={styles.inputLabel}>Year</Text>
                <TextInput
                  style={styles.input}
                  value={carYear}
                  onChangeText={setCarYear}
                  placeholder="e.g., 2023"
                  placeholderTextColor={theme.colors.dark.textTertiary}
                  keyboardType="numeric"
                  maxLength={4}
                />

                <Pressable
                  style={[
                    styles.addButton,
                    (!carBrand || !carModel || !carYear) && styles.addButtonDisabled,
                  ]}
                  onPress={handleAddCar}
                  disabled={!carBrand || !carModel || !carYear}
                >
                  <Text style={styles.addButtonText}>Add Car</Text>
                </Pressable>
              </ScrollView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isFriendsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsFriendsModalVisible(false)}
      >
        <View style={styles.friendsModalOverlay}>
          <Pressable 
            style={styles.friendsModalBackdrop} 
            onPress={() => setIsFriendsModalVisible(false)}
          >
            <Pressable 
              style={styles.friendsModalContent} 
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Friends</Text>
                <Pressable 
                  onPress={() => {
                    console.log('Close friends modal');
                    setIsFriendsModalVisible(false);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.closeButton}
                >
                  <X size={24} color={theme.colors.dark.textSecondary} />
                </Pressable>
              </View>

              <View style={styles.searchContainer}>
              <Search size={20} color={theme.colors.dark.textSecondary} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search users..."
                placeholderTextColor={theme.colors.dark.textTertiary}
                autoCapitalize="none"
              />
            </View>

            <ScrollView style={styles.friendsModalScrollView}>
              {searchQuery.length > 2 && searchQuery2.data && searchQuery2.data.length > 0 && (
                <View style={styles.searchResults}>
                  <Text style={styles.friendsModalSectionTitle}>Search Results</Text>
                  {searchQuery2.data.map((user) => {
                    const isFriend = friendsQuery.data?.friends.some(f => f.userId === user.id);
                    const hasPendingRequest = friendsQuery.data?.sentRequests.some(r => r.userId === user.id);
                    const isCurrentUser = user.id === userProfile?.id;
                    
                    if (isCurrentUser) return null;
                    
                    return (
                      <View key={user.id} style={styles.userCard}>
                        <View style={styles.userInfo}>
                          <View style={styles.userAvatar}>
                            {user.photoUrl ? (
                              <Image source={{ uri: user.photoUrl }} style={styles.userAvatarImage} />
                            ) : (
                              <Text style={styles.userAvatarText}>
                                {user.username.charAt(0).toUpperCase()}
                              </Text>
                            )}
                          </View>
                          <View style={styles.userDetails}>
                            <Text style={styles.userUsername}>{user.username}</Text>
                            {user.region && (
                              <Text style={styles.userRegion}>{user.region}</Text>
                            )}
                          </View>
                        </View>
                        {isFriend ? (
                          <Text style={styles.friendLabel}>Friend</Text>
                        ) : hasPendingRequest ? (
                          <Text style={styles.pendingLabel}>Pending</Text>
                        ) : (
                          <Pressable
                            style={styles.addFriendButton}
                            onPress={() => {
                              console.log('Sending friend request to:', user.id);
                              sendRequestMutation.mutate({ friendId: user.id });
                            }}
                            disabled={sendRequestMutation.isPending}
                          >
                            <UserPlus size={18} color={theme.colors.dark.background} />
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {friendsQuery.data && friendsQuery.data.friends.length > 0 && (
                <View style={styles.friendsSection}>
                  <Text style={styles.friendsModalSectionTitle}>My Friends ({friendsQuery.data.friends.length})</Text>
                  {friendsQuery.data.friends.map((friend) => (
                    <View key={friend.userId} style={styles.friendCard}>
                      <View style={styles.friendInfo}>
                        <View style={styles.friendAvatar}>
                          {friend.photoUrl ? (
                            <Image source={{ uri: friend.photoUrl }} style={styles.friendAvatarImage} />
                          ) : (
                            <Text style={styles.friendAvatarText}>
                              {friend.username.charAt(0).toUpperCase()}
                            </Text>
                          )}
                        </View>
                        <View style={styles.friendDetails}>
                          <Text style={styles.friendUsername}>{friend.username}</Text>
                          {friend.region && (
                            <Text style={styles.friendRegion}>{friend.region}</Text>
                          )}
                        </View>
                      </View>
                      <Pressable
                        style={styles.removeFriendButton}
                        onPress={() => removeFriendMutation.mutate({ friendshipId: friend.friendshipId })}
                        disabled={removeFriendMutation.isPending}
                      >
                        <X size={18} color={theme.colors.dark.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              )}

              {friendsQuery.data && friendsQuery.data.sentRequests.length > 0 && (
                <View style={styles.sentRequestsSection}>
                  <Text style={styles.friendsModalSectionTitle}>Sent Requests ({friendsQuery.data.sentRequests.length})</Text>
                  {friendsQuery.data.sentRequests.map((request) => (
                    <View key={request.friendshipId} style={styles.sentRequestCard}>
                      <Text style={styles.sentRequestUsername}>{request.username}</Text>
                      <Text style={styles.sentRequestStatus}>Pending</Text>
                    </View>
                  ))}
                </View>
              )}

              {friendsQuery.data && 
               friendsQuery.data.friends.length === 0 && 
               friendsQuery.data.sentRequests.length === 0 &&
               searchQuery.length <= 2 && (
                <View style={styles.emptyState}>
                  <Users size={48} color={theme.colors.dark.textTertiary} />
                  <Text style={styles.emptyStateText}>No friends yet</Text>
                  <Text style={styles.emptyStateSubtext}>Search for users above to add friends</Text>
                </View>
              )}
              </ScrollView>
            </Pressable>
          </Pressable>
        </View>
      </Modal>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileSection}>
          <View style={styles.usernameContainer}>
            <Text style={styles.username}>{userProfile.username}</Text>
            <Pressable onPress={openEditModal} style={styles.editButton}>
              <Edit3 size={18} color={theme.colors.dark.accent} />
            </Pressable>
          </View>
          
          <Pressable 
            style={styles.regionButton}
            onPress={() => setIsRegionModalVisible(true)}
          >
            <MapPin size={16} color={theme.colors.dark.textSecondary} />
            <Text style={styles.regionText}>
              {userProfile.region || 'Set your region'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CarIcon size={20} color={theme.colors.dark.text} />
            <Text style={styles.sectionTitle}>My Garage</Text>
          </View>

          {userProfile.cars.length === 0 ? (
            <Pressable style={styles.emptyGarage} onPress={openCarModal}>
              <Plus size={32} color={theme.colors.dark.textSecondary} />
              <Text style={styles.emptyGarageText}>Add your first car</Text>
            </Pressable>
          ) : (
            <View style={styles.carsList}>
              {userProfile.cars.map((car) => (
                <View key={car.id} style={styles.carCard}>
                  <Text style={styles.carIcon}>{car.icon}</Text>
                  <View style={styles.carInfo}>
                    <Text style={styles.carBrand}>{car.brand}</Text>
                    <Text style={styles.carModel}>{car.model} • {car.year}</Text>
                  </View>
                  <Pressable 
                    style={styles.removeCarButton}
                    onPress={() => removeCar(car.id)}
                  >
                    <Trash2 size={18} color={theme.colors.dark.danger} />
                  </Pressable>
                </View>
              ))}
              <Pressable style={styles.addCarButton} onPress={openCarModal}>
                <Plus size={20} color={theme.colors.dark.accent} />
                <Text style={styles.addCarText}>Add Car</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driving Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalDistance.toFixed(0)}</Text>
              <Text style={styles.statLabel}>km driven</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalTrips}</Text>
              <Text style={styles.statLabel}>trips</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.averageSpeed)}</Text>
              <Text style={styles.statLabel}>avg km/h</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Math.round(stats.maxSpeedAllTime)}</Text>
              <Text style={styles.statLabel}>max km/h</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Users size={20} color={theme.colors.dark.text} />
            <Text style={styles.sectionTitle}>Friends</Text>
          </View>

          <Pressable 
            style={styles.friendsButton} 
            onPress={() => setIsFriendsModalVisible(true)}
          >
            <UserPlus size={20} color={theme.colors.dark.accent} />
            <Text style={styles.friendsButtonText}>Manage Friends</Text>
            {friendsQuery.data && (
              <View style={styles.friendsBadge}>
                <Text style={styles.friendsBadgeText}>
                  {friendsQuery.data.friends.length}
                </Text>
              </View>
            )}
          </Pressable>

          {friendsQuery.data && friendsQuery.data.receivedRequests.length > 0 && (
            <View style={styles.requestsContainer}>
              <Text style={styles.requestsTitle}>Friend Requests</Text>
              {friendsQuery.data.receivedRequests.map((request) => (
                <View key={request.friendshipId} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <View style={styles.requestAvatar}>
                      {request.photoUrl ? (
                        <Image source={{ uri: request.photoUrl }} style={styles.requestAvatarImage} />
                      ) : (
                        <Text style={styles.requestAvatarText}>
                          {request.username.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.requestUsername}>{request.username}</Text>
                  </View>
                  <View style={styles.requestActions}>
                    <Pressable
                      style={styles.acceptButton}
                      onPress={() => acceptRequestMutation.mutate({ friendshipId: request.friendshipId })}
                      disabled={acceptRequestMutation.isPending}
                    >
                      <Check size={18} color={theme.colors.dark.success} />
                    </Pressable>
                    <Pressable
                      style={styles.rejectButton}
                      onPress={() => rejectRequestMutation.mutate({ friendshipId: request.friendshipId })}
                      disabled={rejectRequestMutation.isPending}
                    >
                      <X size={18} color={theme.colors.dark.danger} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <Pressable 
          style={styles.settingsButton} 
          onPress={() => router.push('/settings')}
        >
          <Settings size={20} color={theme.colors.dark.text} />
          <Text style={styles.settingsButtonText}>Settings</Text>
        </Pressable>

        <Pressable style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>
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
    paddingVertical: theme.spacing.lg,
  },
  title: {
    ...theme.typography.title1,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  profileImageContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.dark.accent,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.dark.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  profileSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  username: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  editButton: {
    padding: theme.spacing.xs,
  },
  regionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
  regionText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
  section: {
    paddingHorizontal: theme.spacing.lg,
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
  emptyGarage: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    gap: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.dark.border,
    borderStyle: 'dashed',
  },
  emptyGarageText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
  },
  carsList: {
    gap: theme.spacing.md,
  },
  carCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  carIcon: {
    fontSize: 40,
  },
  carInfo: {
    flex: 1,
  },
  carBrand: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  carModel: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  removeCarButton: {
    padding: theme.spacing.sm,
  },
  addCarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.dark.border,
    borderStyle: 'dashed',
  },
  addCarText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
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
  statValue: {
    ...theme.typography.title2,
    color: theme.colors.dark.accent,
    fontWeight: '700' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  signOutButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  settingsButton: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  settingsButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  signOutText: {
    ...theme.typography.callout,
    color: theme.colors.dark.danger,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
  },
  friendsModalOverlay: {
    flex: 1,
  },
  friendsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  friendsModalContent: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  closeButton: {
    padding: theme.spacing.sm,
    zIndex: 999,
  },
  modalOverlayPressable: {
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
    maxHeight: '80%',
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  inputLabel: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
    fontWeight: '600' as const,
  },
  input: {
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    color: theme.colors.dark.text,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
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
  regionList: {
    maxHeight: 400,
  },
  regionItem: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.dark.cardElevated,
  },
  regionItemSelected: {
    backgroundColor: theme.colors.dark.accent,
  },
  regionTextSelected: {
    color: theme.colors.dark.background,
  },
  brandScroll: {
    marginBottom: theme.spacing.md,
  },
  brandItem: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.dark.cardElevated,
    minWidth: 80,
  },
  brandItemSelected: {
    backgroundColor: theme.colors.dark.accent,
  },
  brandIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  brandText: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
  },
  brandTextSelected: {
    color: theme.colors.dark.background,
    fontWeight: '600' as const,
  },
  addButton: {
    backgroundColor: theme.colors.dark.accent,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.background,
    fontWeight: '600' as const,
  },
  friendsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.dark.border,
  },
  friendsButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  friendsBadge: {
    backgroundColor: theme.colors.dark.accent,
    borderRadius: 12,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  friendsBadgeText: {
    ...theme.typography.caption1,
    color: theme.colors.dark.background,
    fontWeight: '700' as const,
  },
  requestsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  requestsTitle: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase' as const,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  requestAvatarImage: {
    width: 40,
    height: 40,
  },
  requestAvatarText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  requestUsername: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  requestActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    ...theme.typography.body,
    color: theme.colors.dark.text,
    paddingVertical: theme.spacing.sm,
  },
  friendsModalScrollView: {
    flex: 1,
  },
  searchResults: {
    marginBottom: theme.spacing.lg,
  },
  friendsModalSectionTitle: {
    ...theme.typography.footnote,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  userAvatarImage: {
    width: 40,
    height: 40,
  },
  userAvatarText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  userDetails: {
    flex: 1,
  },
  userUsername: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  userRegion: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  friendLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.success,
    fontWeight: '600' as const,
  },
  pendingLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  addFriendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  friendsSection: {
    marginBottom: theme.spacing.lg,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  friendAvatarImage: {
    width: 40,
    height: 40,
  },
  friendAvatarText: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  friendDetails: {
    flex: 1,
  },
  friendUsername: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  friendRegion: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  removeFriendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.cardElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentRequestsSection: {
    marginBottom: theme.spacing.lg,
  },
  sentRequestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  sentRequestUsername: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  sentRequestStatus: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  emptyStateText: {
    ...theme.typography.headline,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  emptyStateSubtext: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textTertiary,
    textAlign: 'center',
  },
});
