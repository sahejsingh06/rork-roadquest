import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { TripProvider } from "@/contexts/TripContext";
import { UserProvider } from "@/contexts/UserContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { trpc, createTRPCClient } from "@/lib/trpc";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'sign-in';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="trip-summary/[id]" 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#FFFFFF',
            title: 'Trip Details',
            headerBackTitle: 'Back',
          }} 
        />
        <Stack.Screen 
          name="settings" 
          options={{ 
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="gp-store" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />
      </Stack>
    </>
  );
}

function TRPCWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  const trpcClient = useMemo(() => {
    return createTRPCClient(user?.id);
  }, [user?.id]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TRPCWrapper>
          <UserProvider>
            <StoreProvider>
              <TripProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <RootLayoutNav />
                </GestureHandlerRootView>
              </TripProvider>
            </StoreProvider>
          </UserProvider>
        </TRPCWrapper>
      </AuthProvider>
    </QueryClientProvider>
  );
}
