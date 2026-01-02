import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { theme } from '@/constants/theme';
import { LogIn } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignInScreen() {
  const { signInWithGoogle, signInWithApple, isAppleAuthAvailable, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.dark.accent} />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#0a0a0a', '#1a1a2e', '#0a0a0a']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <LogIn size={80} color={theme.colors.dark.accent} strokeWidth={1.5} />
          <Text style={styles.title}>RoadQuest</Text>
          <Text style={styles.subtitle}>Track your driving adventures</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.googleButton}
            onPress={signInWithGoogle}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.buttonText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {isAppleAuthAvailable && (
            <TouchableOpacity
              style={styles.appleButton}
              onPress={signInWithApple}
              activeOpacity={0.8}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.buttonText}>Continue with Apple</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.disclaimer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.dark.background,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingTop: 120,
    paddingBottom: 60,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: theme.colors.dark.text,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 16,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  appleButton: {
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    gap: 12,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  googleIcon: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#4285F4',
  },
  appleIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  disclaimer: {
    fontSize: 12,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
