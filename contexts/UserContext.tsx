import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile, Car } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

const USER_PROFILE_KEY = '@roadquest_user_profile';

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: authUser, isLoading: authLoading } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
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
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      username: username.trim(),
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

  return {
    userProfile,
    isLoading,
    updateUsername,
    updateProfilePhoto,
    updateRegion,
    addCar,
    removeCar,
  };
});
