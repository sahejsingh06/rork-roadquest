import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X, Plus, Edit3, MapPin, Car as CarIcon, Trash2 } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [username, setUsername] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carYear, setCarYear] = useState('');
  const [selectedCarIcon, setSelectedCarIcon] = useState('🚗');

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
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Car</Text>
              <Pressable onPress={() => setIsCarModalVisible(false)}>
                <X size={24} color={theme.colors.dark.textSecondary} />
              </Pressable>
            </View>
            
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
          </View>
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
    marginTop: theme.spacing.xl,
    backgroundColor: theme.colors.dark.card,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  signOutText: {
    ...theme.typography.callout,
    color: theme.colors.dark.danger,
    fontWeight: '600' as const,
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
    maxHeight: '80%',
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
});
