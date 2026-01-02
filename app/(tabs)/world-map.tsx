import React, { useMemo } from 'react';
import { StyleSheet, Text, View, Platform, Pressable } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Route, ArrowLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const ESTIMATED_WORLD_ROADS_KM = 64000000;

export default function WorldMapScreen() {
  const { trips } = useTrip();
  const router = useRouter();

  const { routeColors, uniqueRoadsKm } = useMemo(() => {
    const colors: string[] = [];
    const roadSegments = new Set<string>();

    trips.forEach((trip, index) => {
      
      if (trip.locations.length > 0) {
        const hue = (index * 137.5) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);

        for (let i = 0; i < trip.locations.length - 1; i++) {
          const loc1 = trip.locations[i];
          const loc2 = trip.locations[i + 1];
          const lat1 = Math.round(loc1.latitude * 1000) / 1000;
          const lon1 = Math.round(loc1.longitude * 1000) / 1000;
          const lat2 = Math.round(loc2.latitude * 1000) / 1000;
          const lon2 = Math.round(loc2.longitude * 1000) / 1000;
          const segmentKey = `${lat1},${lon1}-${lat2},${lon2}`;
          roadSegments.add(segmentKey);
        }
      }
    });

    const uniqueRoadsEstimate = roadSegments.size * 0.05;

    return {
      routeColors: colors,
      uniqueRoadsKm: uniqueRoadsEstimate,
    };
  }, [trips]);

  const initialRegion = useMemo(() => {
    const allCoordinates: { latitude: number; longitude: number }[] = [];
    
    trips.forEach((trip) => {
      trip.locations.forEach(location => {
        allCoordinates.push({
          latitude: location.latitude,
          longitude: location.longitude,
        });
      });
    });

    if (allCoordinates.length === 0) {
      return {
        latitude: 20,
        longitude: 0,
        latitudeDelta: 80,
        longitudeDelta: 80,
      };
    }

    const latitudes = allCoordinates.map(c => c.latitude);
    const longitudes = allCoordinates.map(c => c.longitude);

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    
    const latDelta = (maxLat - minLat) * 1.5 || 80;
    const lngDelta = (maxLng - minLng) * 1.5 || 80;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(latDelta, 0.05),
      longitudeDelta: Math.max(lngDelta, 0.05),
    };
  }, [trips]);

  const worldCoveragePercentage = ((uniqueRoadsKm / ESTIMATED_WORLD_ROADS_KM) * 100).toFixed(8);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={theme.colors.dark.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <Globe size={28} color={theme.colors.dark.accent} strokeWidth={2} />
            <View>
              <Text style={styles.title}>World Coverage</Text>
              <Text style={styles.subtitle}>{trips.length} trips • All time</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
          mapType="standard"
          showsUserLocation={false}
          showsMyLocationButton={false}
          rotateEnabled={true}
          pitchEnabled={true}
          scrollEnabled={true}
          zoomEnabled={true}
        >
          {trips.map((trip, tripIndex) => {
            if (trip.locations.length < 2) return null;

            return (
              <Polyline
                key={trip.id}
                coordinates={trip.locations.map(loc => ({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))}
                strokeColor={routeColors[tripIndex] || theme.colors.dark.accent}
                strokeWidth={3}
                lineCap="round"
                lineJoin="round"
              />
            );
          })}
        </MapView>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Route size={16} color={theme.colors.dark.success} />
            <Text style={styles.statValue}>{uniqueRoadsKm.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Unique Roads</Text>
          </View>

          <View style={styles.statCard}>
            <Globe size={16} color={theme.colors.dark.accent} />
            <Text style={styles.statValue}>{worldCoveragePercentage}%</Text>
            <Text style={styles.statLabel}>World Coverage</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trips.length}</Text>
            <Text style={styles.statLabel}>Total Trips</Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  safeArea: {
    backgroundColor: theme.colors.dark.background,
    zIndex: 10,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.dark.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.dark.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.dark.textSecondary,
    marginTop: 2,
  },

  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: theme.colors.dark.text,
  },
});
