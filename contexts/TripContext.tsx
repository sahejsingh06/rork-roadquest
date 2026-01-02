import createContextHook from '@nkzw/create-context-hook';
import * as Location from 'expo-location';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Trip, LocationPoint, TripStats } from '@/types/trip';

const TRIPS_STORAGE_KEY = '@roadquest_trips';
const STATS_STORAGE_KEY = '@roadquest_stats';
const PAUSE_THRESHOLD_SPEED = 5 / 3.6;
const PAUSE_THRESHOLD_TIME = 10 * 60 * 1000;

export const [TripProvider, useTrip] = createContextHook(() => {
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
  const isStoppingRef = useRef(false);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const pauseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastLowSpeedTime = useRef<number | null>(null);
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
          console.log('Background location permission not granted');
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

  const startTrip = useCallback(async () => {
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
          timeInterval: 1000,
          distanceInterval: 5,
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
              } else if (Date.now() - lastLowSpeedTime.current >= PAUSE_THRESHOLD_TIME && !prev.isPaused) {
                return { ...prev, isPaused: true };
              }
            } else {
              lastLowSpeedTime.current = null;
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

    console.log('Trip ended and saved:', endedTrip.id, 'distance:', endedTrip.distance);

    setCurrentTrip(null);
    setIsTracking(false);
    setCurrentSpeed(0);
    setCurrentLocation(null);
    
    setTimeout(() => {
      isStoppingRef.current = false;
    }, 500);
  }, [currentTrip, isTracking]);

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

  return {
    isTracking,
    currentTrip,
    currentSpeed,
    currentLocation,
    trips,
    stats,
    hasPermission,
    useKmh,
    startTrip,
    stopTrip,
    deleteTrip,
    toggleUnit,
  };
});
