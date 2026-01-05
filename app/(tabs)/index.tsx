import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, ScrollView, Modal, Share, Animated } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Play, Square, ChevronRight, Target, TrendingUp, Share2, Map, Trophy, Route as RouteIcon, X, Zap, ShoppingBag } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { useUser } from '@/contexts/UserContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { Car } from '@/types/user';
import { useRouter } from 'expo-router';

export default function DriveScreen() {
  const router = useRouter();
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

  const { userProfile, hasSeenOnboarding, markOnboardingAsSeen } = useUser();
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [showCarSelector, setShowCarSelector] = useState(false);
  const [displayDuration, setDisplayDuration] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const durationInterval = useRef<number | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const lastTrip = useMemo(() => {
    if (trips.length === 0) return null;
    return trips[0];
  }, [trips]);

  const totalGPSPoints = useMemo(() => {
    return Math.floor(trips.reduce((sum, trip) => sum + trip.distance, 0));
  }, [trips]);

  useEffect(() => {
    if (!hasSeenOnboarding && !isTracking) {
      setTimeout(() => {
        setShowOnboarding(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 1000);
    }
  }, [hasSeenOnboarding, isTracking, fadeAnim]);

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

  const handleCloseOnboarding = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowOnboarding(false);
      setOnboardingStep(0);
      markOnboardingAsSeen();
    });
  };

  const handleNextOnboarding = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(onboardingStep + 1);
    } else {
      handleCloseOnboarding();
    }
  };

  const onboardingSteps = [
    {
      icon: RouteIcon,
      iconColor: '#30D158',
      title: 'Track Your Journeys',
      description: 'Every drive becomes an adventure with RoadQuest. We automatically record your routes using GPS—tracking distance, speed, and duration without you lifting a finger.\n\nSimply tap "Start Drive", select your car, and hit the road. Your journey is captured in real-time with live stats and a beautiful map trail.\n\nView your complete driving history, analyze your patterns, and relive every route you\'ve taken.',
    },
    {
      icon: Target,
      iconColor: '#FF9F0A',
      title: 'Complete Daily Missions',
      description: 'Turn driving into a rewarding experience. Earn 1 GPS Point for every kilometer you drive, with bonus points from completing missions.\n\nDaily: "Drive 5 km today" (+5 GP)\nWeekly: "Explore 10 new roads" (+20 GP)\nMonthly: "Cover 100 km" (+80 GP)\n\nSpend your GPS Points in the store to unlock exclusive car icons, profile badges, map themes, and special boosts.',
    },
    {
      icon: Map,
      iconColor: '#64D2FF',
      title: 'Discover the World',
      description: 'See exactly which roads you\'ve conquered. RoadQuest maps every unique road you drive, showing your personal coverage on an interactive world map.\n\nExample: Drive through Singapore and watch as roads light up in green. "You\'ve covered 2.4% of Singapore\'s roads!"\n\nWith ~64-193 million km of roads worldwide, even 0.001% is an achievement. Every drive adds to your global exploration percentage.',
    },
    {
      icon: Trophy,
      iconColor: '#FFD700',
      title: 'Compete Globally',
      description: 'Join thousands of drivers worldwide. Climb leaderboards based on distance driven, unique roads discovered, and GPS Points earned.\n\nCompete with friends or challenge drivers globally—all rankings focus on exploration and consistency, never speed.\n\nSafe driving meets friendly competition. See where you rank today, this week, and this month!',
    },
  ];

  const currentStep = onboardingSteps[onboardingStep];
  const StepIcon = currentStep?.icon;

  const mapRef = useRef<MapView>(null);

  const handleStartDriveMemo = useCallback(() => {
    if (userProfile && userProfile.cars.length > 0 && !selectedCar) {
      setShowCarSelector(true);
    } else if (selectedCar) {
      startTrip(selectedCar.id, selectedCar.brand, selectedCar.model, selectedCar.icon);
    } else {
      startTrip();
    }
  }, [userProfile, selectedCar, startTrip]);

  if (!isTracking) {
    return (
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          style={styles.backgroundMap}
          provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
          region={region}
          mapType="standard"
          showsUserLocation
          showsMyLocationButton={false}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          toolbarEnabled={false}
          loadingEnabled={false}
        />
        <View style={styles.mapOverlay} />
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.85)']}
          style={styles.preStartContainer}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <View style={styles.contentWrapper}>
              <View style={styles.topSection}>
                <View style={styles.greetingSection}>
                  <Text style={styles.greeting}>
                    {getGreeting()}{userProfile ? `, ${userProfile.username}` : ''}
                  </Text>
                  <Pressable 
                    style={styles.gpsPointsBadge}
                    onPress={() => router.push('/gp-store')}
                  >
                    <Zap size={16} color="#FFD700" fill="#FFD700" />
                    <Text style={styles.gpsPointsText}>{totalGPSPoints} GPS Points</Text>
                    <ShoppingBag size={14} color="#FFD700" />
                  </Pressable>
                </View>

                {userProfile && userProfile.cars.length > 0 && (
                  <View style={styles.carSelectorTop}>
                    <Text style={styles.carSelectorLabel}>Select Your Car</Text>
                    {selectedCar ? (
                      <Pressable 
                        style={styles.selectedCarCardTop}
                        onPress={() => setShowCarSelector(true)}
                      >
                        <Text style={styles.selectedCarIconTop}>{selectedCar.icon}</Text>
                        <View style={styles.selectedCarInfoTop}>
                          <Text style={styles.selectedCarBrandTop}>{selectedCar.brand}</Text>
                          <Text style={styles.selectedCarModelTop}>{selectedCar.model} • {selectedCar.year}</Text>
                        </View>
                        <ChevronRight size={20} color={theme.colors.dark.textSecondary} />
                      </Pressable>
                    ) : (
                      <Pressable 
                        style={styles.selectCarPromptTop}
                        onPress={() => setShowCarSelector(true)}
                      >
                        <Text style={styles.selectCarTextTop}>Tap to select a car</Text>
                        <ChevronRight size={20} color={theme.colors.dark.accent} />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>

              <ScrollView 
                style={styles.preStartScroll}
                contentContainerStyle={styles.preStartContent}
                showsVerticalScrollIndicator={false}
              >

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
              </ScrollView>

              <View style={styles.bottomActions}>
                <Pressable
                  style={styles.startDriveButton}
                  onPress={handleStartDriveMemo}
                  disabled={!hasPermission}
                >
                  <LinearGradient
                    colors={['#0A84FF', '#0066CC']}
                    style={styles.startButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Play size={20} color="#FFFFFF" fill="#FFFFFF" />
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

        <Modal
          visible={showOnboarding}
          transparent
          animationType="none"
          onRequestClose={handleCloseOnboarding}
        >
          <Animated.View style={[styles.onboardingOverlay, { opacity: fadeAnim }]}>
            <View style={styles.onboardingContent}>
              <Pressable style={styles.closeButton} onPress={handleCloseOnboarding}>
                <X size={24} color={theme.colors.dark.textSecondary} />
              </Pressable>
              
              <View style={styles.onboardingHeader}>
                <View style={styles.onboardingIconContainer}>
                  {StepIcon && <StepIcon size={40} color={currentStep.iconColor} />}
                </View>
                <Text style={styles.onboardingTitle}>
                  {onboardingStep === 0 ? 'Welcome to RoadQuest!' : currentStep.title}
                </Text>
                {onboardingStep === 0 && (
                  <Text style={styles.onboardingSubtitle}>Turn every drive into an adventure</Text>
                )}
              </View>

              <ScrollView 
                style={styles.onboardingFeatures}
                contentContainerStyle={styles.onboardingFeaturesContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.featureDescription}>
                  {currentStep.description}
                </Text>
              </ScrollView>

              <View style={styles.onboardingProgress}>
                {onboardingSteps.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.progressDot,
                      index === onboardingStep && styles.progressDotActive,
                    ]}
                  />
                ))}
              </View>

              <Pressable
                style={styles.onboardingButton}
                onPress={handleNextOnboarding}
              >
                <LinearGradient
                  colors={['#0A84FF', '#0066CC']}
                  style={styles.onboardingButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.onboardingButtonText}>
                    {onboardingStep < 3 ? 'Next' : 'Get Started'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </Animated.View>
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
  backgroundMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    paddingBottom: theme.spacing.xl,
  },
  topSection: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  greetingSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  greeting: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    textAlign: 'center',
    fontSize: 28,
  },
  gpsPointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  gpsPointsText: {
    ...theme.typography.callout,
    color: '#FFD700',
    fontWeight: '700' as const,
    fontSize: 16,
  },
  carSelectorTop: {
    marginBottom: theme.spacing.lg,
  },
  carSelectorLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textTransform: 'uppercase',
    fontWeight: '600' as const,
    letterSpacing: 0.5,
    marginBottom: theme.spacing.sm,
  },
  selectedCarCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(28, 28, 30, 0.9)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
  },
  selectedCarIconTop: {
    fontSize: 32,
  },
  selectedCarInfoTop: {
    flex: 1,
  },
  selectedCarBrandTop: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  selectedCarModelTop: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: 2,
  },
  selectCarPromptTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
  },
  selectCarTextTop: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  missionCard: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(10, 132, 255, 0.3)',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
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
    backgroundColor: 'rgba(28, 28, 30, 0.85)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.dark.border,
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
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
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(48, 209, 88, 0.3)',
    marginBottom: theme.spacing.md,
    marginHorizontal: theme.spacing.xl,
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
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  roadCoverageTeaserStat: {
    ...theme.typography.callout,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    fontSize: 14,
  },
  bottomActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  startDriveButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
  },
  startDriveText: {
    ...theme.typography.headline,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 17,
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
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  onboardingContent: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.xxl,
    padding: theme.spacing.xxl,
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  onboardingIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  onboardingTitle: {
    ...theme.typography.largeTitle,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 32,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    ...theme.typography.body,
    color: '#FFFFFFCC',
    textAlign: 'center',
    fontSize: 16,
  },
  onboardingFeatures: {
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.md,
    maxHeight: 320,
  },
  featureDescription: {
    ...theme.typography.body,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'center',
    fontSize: 15,
    opacity: 0.9,
  },
  onboardingProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: theme.colors.dark.accent,
    width: 24,
  },
  onboardingButton: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  onboardingButtonGradient: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingButtonText: {
    ...theme.typography.headline,
    color: '#FFFFFF',
    fontWeight: '700' as const,
    fontSize: 18,
  },
  onboardingFeaturesContent: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
});
