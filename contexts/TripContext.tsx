import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, LocationPoint, TripStats } from '@/types/trip';
import { useUser } from '@/contexts/UserContext';

const TRIPS_STORAGE_KEY = '@roadquest_trips';
const STATS_STORAGE_KEY = '@roadquest_stats';
const BONUS_GP_STORAGE_KEY = '@roadquest_bonus_gp';
const CLAIMED_MISSIONS_KEY = '@roadquest_claimed_missions';
const PAUSE_THRESHOLD_SPEED = 7 / 3.6;
const PAUSE_THRESHOLD_TIME = 10 * 60 * 1000;
const WARNING_TIME = 10 * 60 * 1000;

export const [TripProvider, useTrip] = createContextHook(() => {
  const { syncToBackend } = useUser();
  const [isTracking, setIsTracking] = useState(false);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [currentLocation, setCurrentLocation] = useState<LocationPoint | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<TripStats>({
    totalDistance: 0,
    totalTrips: 0,
    totalDuration: 0,
    averageSpeed: 0,
    maxSpeedAllTime: 0,
  });
  const [hasPermission, setHasPermission] = useState(Platform.OS === 'web');
  const [useKmh, setUseKmh] = useState(true);
  const [bonusGPPoints, setBonusGPPoints] = useState(0);
  const [claimedMissionIds, setClaimedMissionIds] = useState<string[]>([]);
  const isStoppingRef = useRef(false);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLowSpeedTime = useRef<number | null>(null);
  const hasShownWarning = useRef<boolean>(false);
  const tripsRef = useRef<Trip[]>(trips);
  const statsRef = useRef<TripStats>(stats);

  useEffect(() => {
    tripsRef.current = trips;
  }, [trips]);

  useEffect(() => {
    statsRef.current = stats;
  }, [stats]);

  useEffect(() => {
    loadTrips();
    loadStats();
    loadBonusGP();
    loadClaimedMissions();
    requestPermissions();

    return () => {
      if (locationSubscription.current) {
        try {
          if (typeof locationSubscription.current.remove === 'function') {
            locationSubscription.current.remove();
          }
        } catch (error) {
          console.error('Error removing location subscription:', error);
        }
        locationSubscription.current = null;
      }
    };
  }, []);

  const requestPermissions = async () => {
    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        if (Platform.OS !== 'web') {
          Alert.alert(
            'Location Permission Required',
            'RoadQuest needs location access to track your trips.',
            [{ text: 'OK' }]
          );
        }
        return;
      }

      if (Platform.OS !== 'web') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Background Location Required',
            'For accurate trip tracking, please enable "Always Allow" location access in Settings. This allows the app to track your route even when not in use.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Location.requestBackgroundPermissionsAsync();
                  }
                }
              }
            ]
          );
        } else {
          console.log('Background location permission granted');
        }
      }

      setHasPermission(true);
    } catch (error) {
      console.error('Error requesting permissions:', error);
    }
  };

  const loadTrips = async () => {
    try {
      const stored = await AsyncStorage.getItem(TRIPS_STORAGE_KEY);
      if (stored) {
        const parsedTrips = JSON.parse(stored) as Trip[];
        setTrips(parsedTrips);
      }
    } catch (error) {
      console.error('Error loading trips:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stored = await AsyncStorage.getItem(STATS_STORAGE_KEY);
      if (stored) {
        setStats(JSON.parse(stored) as TripStats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const saveTrips = async (newTrips: Trip[]) => {
    try {
      await AsyncStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(newTrips));
    } catch (error) {
      console.error('Error saving trips:', error);
    }
  };

  const saveStats = async (newStats: TripStats) => {
    try {
      await AsyncStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const loadBonusGP = async () => {
    try {
      const stored = await AsyncStorage.getItem(BONUS_GP_STORAGE_KEY);
      if (stored) {
        setBonusGPPoints(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading bonus GP:', error);
    }
  };

  const saveBonusGP = async (newBonusGP: number) => {
    try {
      await AsyncStorage.setItem(BONUS_GP_STORAGE_KEY, JSON.stringify(newBonusGP));
    } catch (error) {
      console.error('Error saving bonus GP:', error);
    }
  };

  const loadClaimedMissions = async () => {
    try {
      const stored = await AsyncStorage.getItem(CLAIMED_MISSIONS_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        const startOfDay = new Date(now).setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now);
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        
        const validMissions = data.filter((item: { id: string; claimedAt: number }) => {
          if (item.id.startsWith('d')) {
            return item.claimedAt >= startOfDay;
          } else if (item.id.startsWith('w')) {
            return item.claimedAt >= startOfWeek.getTime();
          } else if (item.id.startsWith('m')) {
            return item.claimedAt >= startOfMonth.getTime();
          }
          return false;
        });
        
        setClaimedMissionIds(validMissions.map((item: { id: string }) => item.id));
        if (validMissions.length !== data.length) {
          await AsyncStorage.setItem(CLAIMED_MISSIONS_KEY, JSON.stringify(validMissions));
        }
      }
    } catch (error) {
      console.error('Error loading claimed missions:', error);
    }
  };

  const saveClaimedMission = async (missionId: string) => {
    try {
      const stored = await AsyncStorage.getItem(CLAIMED_MISSIONS_KEY);
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [...existing, { id: missionId, claimedAt: Date.now() }];
      await AsyncStorage.setItem(CLAIMED_MISSIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving claimed mission:', error);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const startTrip = useCallback(async (carId?: string, carBrand?: string, carModel?: string, carIcon?: string) => {
    console.log('startTrip called, hasPermission:', hasPermission, 'isTracking:', isTracking);
    
    if (isTracking) {
      console.log('Already tracking, ignoring start');
      return;
    }

    if (!hasPermission && Platform.OS !== 'web') {
      console.log('No permission, requesting...');
      await requestPermissions();
      return;
    }

    const newTrip: Trip = {
      id: Date.now().toString(),
      startTime: Date.now(),
      endTime: null,
      distance: 0,
      maxSpeed: 0,
      avgSpeed: 0,
      duration: 0,
      locations: [],
      isPaused: false,
      pausedDuration: 0,
      carId,
      carBrand,
      carModel,
      carIcon,
    };

    console.log('Creating new trip:', newTrip.id);
    setCurrentTrip(newTrip);
    setIsTracking(true);
    isStoppingRef.current = false;

    if (Platform.OS === 'web') {
      console.log('Web platform - using simulated tracking');
      return;
    }

    try {
      console.log('Starting location watch...');
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 500,
          distanceInterval: 1,
          mayShowUserSettingsDialog: true,
        },
        (location) => {
          if (isStoppingRef.current) return;
          
          const speed = (location.coords.speed || 0) < 0 ? 0 : (location.coords.speed || 0);
          const speedKmh = speed * 3.6;

          const point: LocationPoint = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            speed: speedKmh,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy,
          };

          setCurrentSpeed(speedKmh);
          setCurrentLocation(point);

          setCurrentTrip((prev) => {
            if (!prev || isStoppingRef.current) return prev;

            const updatedLocations = [...prev.locations, point];
            let distance = prev.distance;

            if (prev.locations.length > 0) {
              const lastLocation = prev.locations[prev.locations.length - 1];
              distance += calculateDistance(
                lastLocation.latitude,
                lastLocation.longitude,
                point.latitude,
                point.longitude
              );
            }

            const maxSpeed = Math.max(prev.maxSpeed, speedKmh);
            const duration = Date.now() - prev.startTime - prev.pausedDuration;
            const avgSpeed = duration > 0 ? (distance / (duration / 1000 / 3600)) : 0;

            if (speedKmh < PAUSE_THRESHOLD_SPEED) {
              if (lastLowSpeedTime.current === null) {
                lastLowSpeedTime.current = Date.now();
                hasShownWarning.current = false;
              } else {
                const lowSpeedDuration = Date.now() - lastLowSpeedTime.current;
                
                if (lowSpeedDuration >= WARNING_TIME && !hasShownWarning.current) {
                  hasShownWarning.current = true;
                  
                  if (Platform.OS === 'web') {
                    const userResponse = confirm('Your speed has been under 7 km/h for 10 minutes. Are you still driving?');
                    if (!userResponse) {
                      console.log('User confirmed they are not driving');
                    }
                  } else {
                    Alert.alert(
                      'Still Driving?',
                      'Your speed has been under 7 km/h for 10 minutes. Are you still driving?',
                      [
                        {
                          text: 'Yes, Continue',
                          onPress: () => {
                            lastLowSpeedTime.current = Date.now();
                            hasShownWarning.current = false;
                          },
                          style: 'default',
                        },
                        {
                          text: 'No, End Drive',
                          onPress: () => {
                            console.log('User ending drive from warning');
                          },
                          style: 'destructive',
                        },
                      ],
                      { cancelable: false }
                    );
                  }
                }
                
                if (lowSpeedDuration >= PAUSE_THRESHOLD_TIME && !prev.isPaused) {
                  return { ...prev, isPaused: true };
                }
              }
            } else {
              lastLowSpeedTime.current = null;
              hasShownWarning.current = false;
              if (prev.isPaused) {
                return { ...prev, isPaused: false };
              }
            }

            return {
              ...prev,
              locations: updatedLocations,
              distance,
              maxSpeed,
              avgSpeed,
              duration,
            };
          });
        }
      );

      locationSubscription.current = subscription;
      console.log('Location subscription started successfully');
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsTracking(false);
      setCurrentTrip(null);
    }
  }, [hasPermission, isTracking]);

  const stopTrip = useCallback(() => {
    console.log('stopTrip called, isTracking:', isTracking, 'currentTrip:', currentTrip?.id);
    
    if (isStoppingRef.current) {
      console.log('Already stopping, ignoring');
      return;
    }
    
    isStoppingRef.current = true;
    
    if (locationSubscription.current) {
      try {
        console.log('Removing location subscription...');
        if (typeof locationSubscription.current.remove === 'function') {
          locationSubscription.current.remove();
        }
      } catch (error) {
        console.error('Error removing location subscription:', error);
      }
      locationSubscription.current = null;
    }

    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }

    lastLowSpeedTime.current = null;
    hasShownWarning.current = false;

    const tripToEnd = currentTrip;
    
    if (!tripToEnd) {
      console.log('No current trip to stop');
      setIsTracking(false);
      isStoppingRef.current = false;
      return;
    }

    console.log('Ending trip:', tripToEnd.id);

    const endedTrip: Trip = {
      ...tripToEnd,
      endTime: Date.now(),
      duration: Date.now() - tripToEnd.startTime - tripToEnd.pausedDuration,
      isPaused: false,
    };

    const currentTrips = tripsRef.current;
    const currentStats = statsRef.current;

    const updatedTrips = [endedTrip, ...currentTrips];
    setTrips(updatedTrips);
    saveTrips(updatedTrips);

    const newTotalDistance = currentStats.totalDistance + endedTrip.distance;
    const newTotalDuration = currentStats.totalDuration + endedTrip.duration;
    const updatedStats: TripStats = {
      totalDistance: newTotalDistance,
      totalTrips: currentStats.totalTrips + 1,
      totalDuration: newTotalDuration,
      averageSpeed: newTotalDuration > 0 ? newTotalDistance / (newTotalDuration / 1000 / 3600) : 0,
      maxSpeedAllTime: Math.max(currentStats.maxSpeedAllTime, endedTrip.maxSpeed),
    };
    setStats(updatedStats);
    saveStats(updatedStats);

    syncToBackend({
      totalDistance: updatedStats.totalDistance,
      totalTrips: updatedStats.totalTrips,
      totalGPSPoints: Math.floor(updatedStats.totalDistance),
      roadCoveragePercent: 0.8,
    });

    console.log('Trip ended and saved:', endedTrip.id, 'distance:', endedTrip.distance);

    setCurrentTrip(null);
    setIsTracking(false);
    setCurrentSpeed(0);
    setCurrentLocation(null);
    
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 500);
  }, [currentTrip, isTracking, syncToBackend]);

  const deleteTrip = useCallback((tripId: string) => {
    setTrips((prev) => {
      const tripToDelete = prev.find(t => t.id === tripId);
      const updatedTrips = prev.filter(t => t.id !== tripId);
      saveTrips(updatedTrips);

      if (tripToDelete) {
        const updatedStats: TripStats = {
          totalDistance: Math.max(0, stats.totalDistance - tripToDelete.distance),
          totalTrips: Math.max(0, stats.totalTrips - 1),
          totalDuration: Math.max(0, stats.totalDuration - tripToDelete.duration),
          averageSpeed: updatedTrips.length > 0
            ? (stats.totalDistance - tripToDelete.distance) / ((stats.totalDuration - tripToDelete.duration) / 1000 / 3600)
            : 0,
          maxSpeedAllTime: updatedTrips.length > 0
            ? Math.max(...updatedTrips.map(t => t.maxSpeed))
            : 0,
        };
        setStats(updatedStats);
        saveStats(updatedStats);
      }

      return updatedTrips;
    });
  }, [stats]);

  const toggleUnit = () => {
    setUseKmh(prev => !prev);
  };

  const addBonusGPPoints = useCallback((points: number, missionId: string) => {
    if (claimedMissionIds.includes(missionId)) {
      console.log('Mission already claimed:', missionId);
      return false;
    }
    
    const newBonusGP = bonusGPPoints + points;
    setBonusGPPoints(newBonusGP);
    saveBonusGP(newBonusGP);
    
    setClaimedMissionIds(prev => [...prev, missionId]);
    saveClaimedMission(missionId);
    
    console.log('Added bonus GP:', points, 'Total bonus GP:', newBonusGP);
    return true;
  }, [bonusGPPoints, claimedMissionIds]);

  const isMissionClaimed = useCallback((missionId: string) => {
    return claimedMissionIds.includes(missionId);
  }, [claimedMissionIds]);

  const totalGPSPoints = Math.floor(stats.totalDistance) + bonusGPPoints;

  const toggleTripSharing = useCallback((tripId: string, shared: boolean) => {
    setTrips((prev) => {
      const updatedTrips = prev.map(trip => 
        trip.id === tripId ? { ...trip, sharedWithFriends: shared } : trip
      );
      saveTrips(updatedTrips);
      return updatedTrips;
    });
  }, []);

  const getTripById = useCallback((tripId: string) => {
    return trips.find(t => t.id === tripId);
  }, [trips]);

  return {
    isTracking,
    currentTrip,
    currentSpeed,
    currentLocation,
    trips,
    stats,
    hasPermission,
    useKmh,
    bonusGPPoints,
    totalGPSPoints,
    startTrip,
    stopTrip,
    deleteTrip,
    toggleUnit,
    toggleTripSharing,
    getTripById,
    addBonusGPPoints,
    isMissionClaimed,
  };
});
