import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, Car } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';

const USER_PROFILE_KEY = '@roadquest_user_profile';
const ONBOARDING_KEY = '@roadquest_onboarding_seen';

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const syncMutation = trpc.user.sync.useMutation();

  const getUserProfileKey = useCallback((authUserId: string) => {
    return `${USER_PROFILE_KEY}_${authUserId}`;
  }, []);

  const saveUserProfile = useCallback(async (profile: UserProfile, authUserId: string) => {
    try {
      const key = getUserProfileKey(authUserId);
      await AsyncStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }, [getUserProfileKey]);

  const loadUserProfile = useCallback(async (authUserId: string) => {
    console.log('Loading user profile for:', authUserId);
    try {
      const key = getUserProfileKey(authUserId);
      const stored = await AsyncStorage.getItem(key);
      console.log('User profile loaded:', stored ? 'found' : 'not found');
      
      const onboardingSeen = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(onboardingSeen === 'true');
      
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        if (!profile.cars) {
          profile.cars = [];
        }
        setUserProfile(profile);
      } else if (authUser) {
        const newProfile: UserProfile = {
          id: authUser.id,
          username: authUser.name,
          createdAt: Date.now(),
          photoUrl: authUser.photoUrl,
          cars: [],
        };
        setUserProfile(newProfile);
        await saveUserProfile(newProfile, authUserId);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  }, [authUser, getUserProfileKey, saveUserProfile]);

  useEffect(() => {
    if (!authLoading && authUser) {
      loadUserProfile(authUser.id);
    } else if (!authLoading && !authUser) {
      setUserProfile(null);
      setIsLoading(false);
    }
  }, [authUser, authLoading, loadUserProfile]);

  const updateUsername = useCallback(async (username: string) => {
    if (!userProfile || !authUser) return;
    
    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    
    if (userProfile.usernameSetAt && (now - userProfile.usernameSetAt) < oneYearInMs) {
      const timeLeft = oneYearInMs - (now - userProfile.usernameSetAt);
      const daysLeft = Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
      throw new Error(`You can change your username in ${daysLeft} days`);
    }
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      username: username.trim(),
      usernameSetAt: now,
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, authUser.id);
  }, [userProfile, authUser, saveUserProfile]);

  const updateProfilePhoto = useCallback(async (photoUrl: string) => {
    if (!userProfile || !authUser) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      photoUrl,
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, authUser.id);
  }, [userProfile, authUser, saveUserProfile]);

  const updateRegion = useCallback(async (region: string) => {
    if (!userProfile || !authUser) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      region,
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, authUser.id);
  }, [userProfile, authUser, saveUserProfile]);

  const addCar = useCallback(async (car: Car) => {
    if (!userProfile || !authUser) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      cars: [...userProfile.cars, car],
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, authUser.id);
  }, [userProfile, authUser, saveUserProfile]);

  const removeCar = useCallback(async (carId: string) => {
    if (!userProfile || !authUser) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      cars: userProfile.cars.filter(c => c.id !== carId),
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile, authUser.id);
  }, [userProfile, authUser, saveUserProfile]);

  const markOnboardingAsSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  }, []);

  const canChangeUsername = useCallback(() => {
    if (!userProfile || !userProfile.usernameSetAt) return true;
    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    return (now - userProfile.usernameSetAt) >= oneYearInMs;
  }, [userProfile]);

  const daysUntilUsernameChange = useCallback(() => {
    if (!userProfile || !userProfile.usernameSetAt) return 0;
    const now = Date.now();
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    const timeLeft = oneYearInMs - (now - userProfile.usernameSetAt);
    return Math.ceil(timeLeft / (24 * 60 * 60 * 1000));
  }, [userProfile]);

  const syncToBackend = useCallback(async (statsData?: { totalDistance: number; totalTrips: number; totalGPSPoints: number; roadCoveragePercent: number }) => {
    if (!authUser || !userProfile) return;
    
    console.log('Syncing user to backend:', userProfile.username);
    try {
      const syncPromise = syncMutation.mutateAsync({
        username: userProfile.username,
        email: authUser.email,
        photoUrl: userProfile.photoUrl,
        region: userProfile.region,
        totalDistance: statsData?.totalDistance || 0,
        totalTrips: statsData?.totalTrips || 0,
        totalGPSPoints: statsData?.totalGPSPoints || 0,
        roadCoveragePercent: statsData?.roadCoveragePercent || 0,
      });
      
      await Promise.race([
        syncPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sync timeout')), 8000)
        )
      ]);
      
      console.log('User synced successfully');
    } catch (error: any) {
      console.log('Backend sync failed (app continues locally):', error?.message || 'Unknown error');
    }
  }, [authUser, userProfile, syncMutation]);

  useEffect(() => {
    if (authUser && userProfile?.username) {
      syncToBackend().catch(() => {});
    }
  }, [authUser, userProfile?.username, syncToBackend]);

  return {
    userProfile,
    isLoading,
    hasSeenOnboarding,
    updateUsername,
    updateProfilePhoto,
    updateRegion,
    addCar,
    removeCar,
    markOnboardingAsSeen,
    canChangeUsername,
    daysUntilUsernameChange,
    syncToBackend,
  };
});
