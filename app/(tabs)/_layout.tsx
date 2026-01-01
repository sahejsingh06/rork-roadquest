import { Tabs } from "expo-router";
import { Navigation, Clock, User } from "lucide-react-native";
import React from "react";
import { theme } from "@/constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.dark.accent,
        tabBarInactiveTintColor: theme.colors.dark.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.dark.background,
          borderTopColor: theme.colors.dark.border,
          borderTopWidth: 0.5,
        },
        headerShown: false,
        tabBarShowLabel: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Drive",
          tabBarIcon: ({ color, size }) => <Navigation color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
