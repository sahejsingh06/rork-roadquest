import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe } from 'lucide-react-native';

const TOTAL_ROADS_KM = 64000000;

export default function WorldMapScreen() {
  const { trips } = useTrip();

  const { totalCoverage, allCoordinates, routeColors } = useMemo(() => {
    let totalDistance = 0;
    const coords: { latitude: number; longitude: number }[] = [];
    const colors: string[] = [];

    trips.forEach((trip, index) => {
      totalDistance += trip.distance;
      
      if (trip.locations.length > 0) {
        trip.locations.forEach(location => {
          coords.push({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        });
        
        const hue = (index * 137.5) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
    });

    const coveragePercentage = (totalDistance / TOTAL_ROADS_KM) * 100;

    return {
      totalCoverage: coveragePercentage,
      allCoordinates: coords,
      routeColors: colors,
    };
  }, [trips]);

  const initialRegion = useMemo(() => {
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
  }, [allCoordinates]);

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Globe size={28} color={theme.colors.dark.accent} strokeWidth={2} />
            <View>
              <Text style={styles.title}>World Coverage</Text>
              <Text style={styles.subtitle}>{trips.length} trips recorded</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={initialRegion}
          provider={PROVIDER_DEFAULT}
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

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>World Road Coverage</Text>
          <Text style={styles.statValue}>
            {totalCoverage < 0.001 
              ? totalCoverage.toExponential(2)
              : totalCoverage.toFixed(6)}%
          </Text>
          <Text style={styles.statSubtext}>
            of {(TOTAL_ROADS_KM / 1000000).toFixed(0)}M km total roads
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Routes Tracked</Text>
          <Text style={styles.statValue}>{trips.length}</Text>
          <Text style={styles.statSubtext}>
            {trips.reduce((sum, trip) => sum + trip.distance, 0).toFixed(1)} km total
          </Text>
        </View>
      </View>
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
  },
  headerContent: {
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
  statsContainer: {
    position: 'absolute',
    bottom: 100,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: theme.colors.dark.accent,
    marginTop: theme.spacing.xs,
  },
  statSubtext: {
    fontSize: 12,
    color: theme.colors.dark.textTertiary,
    marginTop: theme.spacing.xs,
  },
});
