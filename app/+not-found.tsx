import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { ZapOff } from "lucide-react-native";
import { theme } from "@/constants/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Not Found",
          headerStyle: { backgroundColor: theme.colors.dark.background },
          headerTintColor: theme.colors.dark.text,
        }} 
      />
      <View style={styles.container}>
        <ZapOff size={64} color={theme.colors.dark.textTertiary} strokeWidth={1.5} />
        <Text style={styles.title}>Road Not Found</Text>
        <Text style={styles.subtitle}>This route doesn&apos;t exist on the map</Text>

        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Return to Drive</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.dark.background,
  },
  title: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    marginTop: theme.spacing.lg,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.dark.textSecondary,
    textAlign: "center",
    marginTop: theme.spacing.sm,
  },
  link: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.dark.accent,
    borderRadius: theme.borderRadius.md,
  },
  linkText: {
    ...theme.typography.callout,
    color: theme.colors.dark.background,
    fontWeight: "600" as const,
  },
});
