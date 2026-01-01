import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '@/types/user';

const USER_PROFILE_KEY = '@roadquest_user_profile';

export const [UserProvider, useUser] = createContextHook(() => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserProfile = async (profile: UserProfile) => {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const createProfile = async (username: string) => {
    const newProfile: UserProfile = {
      id: Date.now().toString(),
      username: username.trim(),
      createdAt: Date.now(),
    };
    setUserProfile(newProfile);
    await saveUserProfile(newProfile);
  };

  const updateUsername = async (username: string) => {
    if (!userProfile) return;
    
    const updatedProfile: UserProfile = {
      ...userProfile,
      username: username.trim(),
    };
    setUserProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
  };

  return {
    userProfile,
    isLoading,
    createProfile,
    updateUsername,
  };
});
