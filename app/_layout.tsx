import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { TripProvider } from "@/contexts/TripContext";
import { UserProvider, useUser } from "@/contexts/UserContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading } = useUser();

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000000' }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
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
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TripProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </TripProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}
