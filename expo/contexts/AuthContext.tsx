import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform, Alert } from 'react-native';

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

  const [request, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
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
    console.log('Request ready:', !!request);
    console.log('Web Client ID:', process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ? 'Set' : 'Not set');
    console.log('iOS Client ID:', process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ? 'Set' : 'Not set');
    
    if (!request) {
      console.error('Google auth request not ready');
      if (Platform.OS === 'web') {
        alert('Google Sign-In is not available. Please try Apple Sign-In or check console for details.');
      } else {
        Alert.alert('Error', 'Google Sign-In is not available at the moment. Please try again or use Apple Sign-In.');
      }
      return;
    }
    
    try {
      const result = await googlePromptAsync();
      console.log('Google auth result:', result);
      if (result?.type === 'error') {
        console.error('Google auth error:', result.error);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to sign in with Google. Please try Apple Sign-In.');
      } else {
        Alert.alert('Error', 'Failed to sign in with Google. Please try again.');
      }
    }
  }, [googlePromptAsync, request]);

  const signInWithApple = useCallback(async () => {
    console.log('Signing in with Apple...');
    try {
      if (Platform.OS === 'web') {
        Alert.alert('Not Available', 'Apple Sign In is only available on iOS devices. Please use Google Sign In on web.');
        return;
      }

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
        if (Platform.OS !== 'web') {
          Alert.alert('Error', 'Failed to sign in with Apple. Please try again.');
        }
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

  const isAppleAuthAvailable = true;

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
