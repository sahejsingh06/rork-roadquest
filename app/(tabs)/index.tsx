import React, { useEffect, useState, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, Modal, Share } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Play, Square, ChevronRight, Target, TrendingUp, Share2, Map } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Car } from '@/types/user';

export default function DriveScreen() {
  const {
    isTracking,
    currentTrip,
    currentSpeed,
    currentLocation,
    hasPermission,
    useKmh,
    startTrip,
    stopTrip,
    toggleUnit,
    trips,
    stats,
  } = useTrip();

  const { userProfile } = useUser();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [displayDuration, setDisplayDuration] = useState(0);
  const durationInterval = useRef<number | null>(null);

  const lastTrip = useMemo(() => {
    if (trips.length === 0) return null;
    return trips[0];
  }, [trips]);

  const todayMission = useMemo(() => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const todayTrips = trips.filter(trip => trip.startTime >= startOfDay);
    const todayDistance = todayTrips.reduce((sum, trip) => sum + trip.distance, 0);
    
    const missionTarget = 5;
    const progress = Math.min((todayDistance / missionTarget) * 100, 100);
    const remaining = Math.max(0, missionTarget - todayDistance);
    
    return {
      target: missionTarget,
      current: todayDistance,
      progress,
      remaining,
      pointsToEarn: Math.floor(missionTarget - todayDistance),
    };
  }, [trips]);

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation]);

  useEffect(() => {
    if (isTracking && currentTrip) {
      durationInterval.current = setInterval(() => {
        const duration = Date.now() - currentTrip.startTime - currentTrip.pausedDuration;
        setDisplayDuration(duration);
      }, 1000);
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
      setDisplayDuration(0);
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };
  }, [isTracking, currentTrip]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const handleStartDrive = () => {
    if (userProfile && userProfile.cars.length > 0 && !selectedCar) {
      setShowCarSelector(true);
    } else if (selectedCar) {
      startTrip(selectedCar.id, selectedCar.brand, selectedCar.model, selectedCar.icon);
    } else {
      startTrip();
    }
  };

  const handleSelectCar = (car: Car) => {
    setSelectedCar(car);
    setShowCarSelector(false);
  };

  const displaySpeed = useKmh ? currentSpeed : currentSpeed * 0.621371;
  const speedUnit = useKmh ? 'km/h' : 'mph';

  const formatDurationShort = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${minutes}m`;
  };

  const handleShareLastDrive = async () => {
    if (!lastTrip) return;
    
    const message = `🚗 Just completed a drive on RoadQuest!

📍 Distance: ${lastTrip.distance.toFixed(1)} km
⚡ Avg Speed: ${Math.round(useKmh ? lastTrip.avgSpeed : lastTrip.avgSpeed * 0.621371)} ${useKmh ? 'km/h' : 'mph'}
⏱️ Duration: ${formatDurationShort(lastTrip.duration)}
🏆 GPS Points: +${Math.floor(lastTrip.distance)}`;

    try {
      if (Platform.OS === 'web') {
        await navigator.share({ text: message });
      } else {
        await Share.share({ message });
      }
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  if (!isTracking) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={['#000000', '#0a0a0a', '#1a1a1a']}
          style={styles.preStartContainer}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <View style={styles.contentWrapper}>
              <ScrollView 
                style={styles.preStartScroll}
                contentContainerStyle={styles.preStartContent}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.greetingSection}>
                  <Text style={styles.greeting}>
                    {getGreeting()}{userProfile ? `, ${userProfile.username}` : ''}
                  </Text>
                </View>

                <View style={styles.missionCard}>
                <View style={styles.missionHeader}>
                  <View style={styles.missionIcon}>
                    <Target size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.missionTitle}>Today&apos;s Mission</Text>
                </View>
                <Text style={styles.missionDescription}>
                  Drive {todayMission.remaining.toFixed(1)} km more to earn +{todayMission.pointsToEarn} GPS points
                </Text>
                <View style={styles.missionProgressContainer}>
                  <View style={styles.missionProgressBar}>
                    <LinearGradient
                      colors={['#0A84FF', '#0066CC']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.missionProgressFill, { width: `${todayMission.progress}%` }]}
                    />
                  </View>
                  <Text style={styles.missionProgressText}>
                    {todayMission.current.toFixed(1)} / {todayMission.target} km
                  </Text>
                </View>
              </View>

              {lastTrip && (
                <View style={styles.lastDriveCard}>
                  <View style={styles.lastDriveHeader}>
                    <View style={styles.lastDriveHeaderLeft}>
                      <TrendingUp size={18} color={theme.colors.dark.accent} />
                      <Text style={styles.lastDriveTitle}>Last Drive</Text>
                    </View>
                    <Pressable onPress={handleShareLastDrive} style={styles.shareButton}>
                      <Share2 size={18} color={theme.colors.dark.accent} />
                    </Pressable>
                  </View>
                  <View style={styles.lastDriveStats}>
                    <View style={styles.lastDriveStat}>
                      <Text style={styles.lastDriveValue}>{lastTrip.distance.toFixed(1)} km</Text>
                      <Text style={styles.lastDriveLabel}>Distance</Text>
                    </View>
                    <View style={styles.lastDriveStat}>
                      <Text style={styles.lastDriveValue}>
                        {Math.round(useKmh ? lastTrip.avgSpeed : lastTrip.avgSpeed * 0.621371)} {useKmh ? 'km/h' : 'mph'}
                      </Text>
                      <Text style={styles.lastDriveLabel}>Avg Speed</Text>
                    </View>
                    <View style={styles.lastDriveStat}>
                      <Text style={styles.lastDriveValue}>+{Math.floor(lastTrip.distance)}</Text>
                      <Text style={styles.lastDriveLabel}>GPS Points</Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.roadCoverageTeaser}>
                <View style={styles.roadCoverageTeaserHeader}>
                  <Map size={16} color={theme.colors.dark.success} />
                  <Text style={styles.roadCoverageTeaserTitle}>Explore Nearby Roads</Text>
                </View>
                <Text style={styles.roadCoverageTeaserText}>
                  Discover new routes and earn more GPS points
                </Text>
                <View style={styles.roadCoverageTeaserStats}>
                  <Text style={styles.roadCoverageTeaserStat}>🗺️ {trips.length} routes tracked</Text>
                  <Text style={styles.roadCoverageTeaserStat}>📍 {stats.totalDistance.toFixed(0)} km explored</Text>
                </View>
              </View>

              {selectedCar && (
                <Pressable 
                  style={styles.selectedCarCard}
                  onPress={() => setShowCarSelector(true)}
                >
                  <Text style={styles.selectedCarIcon}>{selectedCar.icon}</Text>
                  <View style={styles.selectedCarInfo}>
                    <Text style={styles.selectedCarBrand}>{selectedCar.brand}</Text>
                    <Text style={styles.selectedCarModel}>{selectedCar.model} • {selectedCar.year}</Text>
                  </View>
                  <ChevronRight size={20} color={theme.colors.dark.textSecondary} />
                </Pressable>
              )}

                {userProfile && userProfile.cars.length > 0 && !selectedCar && (
                  <Pressable 
                    style={styles.selectCarPrompt}
                    onPress={() => setShowCarSelector(true)}
                  >
                    <Text style={styles.selectCarText}>Select your car</Text>
                    <ChevronRight size={20} color={theme.colors.dark.accent} />
                  </Pressable>
                )}
              </ScrollView>

              <View style={styles.bottomActions}>
                <Pressable
                  style={styles.startDriveButton}
                  onPress={handleStartDrive}
                  disabled={!hasPermission}
                >
                  <LinearGradient
                    colors={['#0A84FF', '#0066CC']}
                    style={styles.startButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Play size={28} color="#FFFFFF" fill="#FFFFFF" />
                    <Text style={styles.startDriveText}>Start Drive</Text>
                  </LinearGradient>
                </Pressable>

                {!hasPermission && (
                  <Text style={styles.permissionText}>
                    Location permission required
                  </Text>
                )}
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>

        <Modal
          visible={showCarSelector}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCarSelector(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.carSelectorModal}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Select Your Car</Text>
              <ScrollView style={styles.carList} showsVerticalScrollIndicator={false}>
                {userProfile?.cars.map((car) => (
                  <Pressable
                    key={car.id}
                    style={styles.carOption}
                    onPress={() => handleSelectCar(car)}
                  >
                    <Text style={styles.carOptionIcon}>{car.icon}</Text>
                    <View style={styles.carOptionInfo}>
                      <Text style={styles.carOptionBrand}>{car.brand}</Text>
                      <Text style={styles.carOptionModel}>{car.model} • {car.year}</Text>
                    </View>
                    <ChevronRight size={20} color={theme.colors.dark.textSecondary} />
                  </Pressable>
                ))}
              </ScrollView>
              <Pressable
                style={styles.skipButton}
                onPress={() => {
                  setShowCarSelector(false);
                  startTrip();
                }}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        region={region}
        mapType="standard"
        showsUserLocation
        followsUserLocation
        showsMyLocationButton={false}
      >
        {currentTrip && currentTrip.locations.length > 1 && (
          <Polyline
            coordinates={currentTrip.locations.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor={theme.colors.dark.accent}
            strokeWidth={4}
          />
        )}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Pressable onPress={toggleUnit} style={styles.speedBadge}>
            <Text style={styles.speedBadgeValue}>{Math.round(displaySpeed)}</Text>
            <Text style={styles.speedBadgeUnit}>{speedUnit}</Text>
          </Pressable>
          <View style={styles.headerRight}>
            {selectedCar && (
              <View style={styles.headerCar}>
                <Text style={styles.headerCarIcon}>{selectedCar.icon}</Text>
                <Text style={styles.headerCarName}>{selectedCar.brand}</Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.overlay}>

        {isTracking && currentTrip && (
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {currentTrip.distance.toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>km</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {formatDuration(displayDuration)}
              </Text>
              <Text style={styles.statLabel}>time</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.round(useKmh ? currentTrip.avgSpeed : currentTrip.avgSpeed * 0.621371)}
              </Text>
              <Text style={styles.statLabel}>avg</Text>
            </View>
          </View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.controlsContainer}>
          <Pressable
            style={styles.stopButton}
            onPress={stopTrip}
          >
            <View style={styles.stopButtonContent}>
              <Square size={20} color="#FFFFFF" fill="#FFFFFF" />
              <Text style={styles.stopButtonText}>End Drive</Text>
            </View>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  preStartContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
  },
  preStartScroll: {
    flex: 1,
  },
  preStartContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  greeting: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    textAlign: 'center',
    fontSize: 28,
  },
  missionCard: {
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    marginBottom: theme.spacing.md,
  },
  missionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  missionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.dark.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  missionTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  missionDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
  },
  missionProgressContainer: {
    gap: theme.spacing.xs,
  },
  missionProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  missionProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  missionProgressText: {
    ...theme.typography.caption1,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  lastDriveCard: {
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
    marginBottom: theme.spacing.md,
  },
  lastDriveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  lastDriveHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  lastDriveTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  shareButton: {
    padding: theme.spacing.xs,
  },
  lastDriveStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  lastDriveStat: {
    flex: 1,
  },
  lastDriveValue: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  lastDriveLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  roadCoverageTeaser: {
    backgroundColor: 'rgba(48, 209, 88, 0.1)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    marginBottom: theme.spacing.md,
  },
  roadCoverageTeaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  roadCoverageTeaserTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  roadCoverageTeaserText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.md,
  },
  roadCoverageTeaserStats: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  roadCoverageTeaserStat: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  selectedCarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
    marginBottom: theme.spacing.md,
  },
  selectedCarIcon: {
    fontSize: 40,
  },
  selectedCarInfo: {
    flex: 1,
  },
  selectedCarBrand: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  selectedCarModel: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  selectCarPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 132, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    marginBottom: theme.spacing.md,
  },
  selectCarText: {
    ...theme.typography.headline,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  startDriveButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xl,
  },
  startDriveText: {
    ...theme.typography.title3,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 24,
  },
  permissionText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.4)',
  },
  speedBadgeValue: {
    fontSize: 28,
    color: theme.colors.dark.accent,
    fontWeight: '700' as const,
  },
  speedBadgeUnit: {
    fontSize: 12,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  headerCar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.8)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.xs,
  },
  headerCarIcon: {
    fontSize: 20,
  },
  headerCarName: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  overlay: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  stopButton: {
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  stopButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  stopButtonText: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  carSelectorModal: {
    backgroundColor: theme.colors.dark.card,
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: theme.colors.dark.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.lg,
  },
  carList: {
    marginBottom: theme.spacing.lg,
  },
  carOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.cardElevated,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  carOptionIcon: {
    fontSize: 40,
  },
  carOptionInfo: {
    flex: 1,
  },
  carOptionBrand: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  carOptionModel: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  skipButton: {
    backgroundColor: theme.colors.dark.cardElevated,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
});
