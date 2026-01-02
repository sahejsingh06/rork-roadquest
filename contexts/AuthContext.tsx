import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const AUTH_STORAGE_KEY = '@roadquest_auth';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'google' | 'apple';
  photoUrl?: string;
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  const loadUser = async () => {
    console.log('Loading auth user...');
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const authUser = JSON.parse(stored) as AuthUser;
        console.log('Auth user loaded:', authUser.email);
        setUser(authUser);
      }
    } catch (error) {
      console.error('Error loading auth user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (authUser: AuthUser) => {
    try {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      console.log('Auth user saved:', authUser.email);
    } catch (error) {
      console.error('Error saving auth user:', error);
    }
  };

  const fetchGoogleUserInfo = useCallback(async (accessToken: string) => {
    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );
      const userInfo = await response.json();
      
      const authUser: AuthUser = {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        provider: 'google',
        photoUrl: userInfo.picture,
      };

      setUser(authUser);
      await saveUser(authUser);
    } catch (error) {
      console.error('Error fetching Google user info:', error);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.accessToken) {
        fetchGoogleUserInfo(authentication.accessToken);
      }
    }
  }, [googleResponse, fetchGoogleUserInfo]);

  const signInWithGoogle = useCallback(async () => {
    console.log('Signing in with Google...');
    try {
      await googlePromptAsync();
    } catch (error) {
      console.error('Google sign in error:', error);
    }
  }, [googlePromptAsync]);

  const signInWithApple = useCallback(async () => {
    console.log('Signing in with Apple...');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const authUser: AuthUser = {
        id: credential.user,
        email: credential.email || `${credential.user}@apple.com`,
        name: credential.fullName 
          ? `${credential.fullName.givenName || ''} ${credential.fullName.familyName || ''}`.trim()
          : 'Apple User',
        provider: 'apple',
      };

      setUser(authUser);
      await saveUser(authUser);
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('Apple sign in canceled');
      } else {
        console.error('Apple sign in error:', error);
      }
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('Signing out...');
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const isAppleAuthAvailable = Platform.OS === 'ios' || Platform.OS === 'android';

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithApple,
    signOut,
    isAppleAuthAvailable,
  };
});
