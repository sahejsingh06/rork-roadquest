import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import MapView, { Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Globe, Route, Calendar, Info } from 'lucide-react-native';

const MILESTONES = [
  { km: 100, label: '100 km' },
  { km: 500, label: '500 km' },
  { km: 1000, label: '1,000 km' },
  { km: 5000, label: '5,000 km' },
  { km: 10000, label: '10,000 km' },
  { km: 50000, label: '50,000 km' },
  { km: 100000, label: '100,000 km' },
];

const ESTIMATED_WORLD_ROADS_KM = 64000000;

type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'all';

export default function WorldMapScreen() {
  const { trips } = useTrip();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all');

  const filteredTrips = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    switch (selectedPeriod) {
      case 'daily':
        return trips.filter(trip => trip.startTime >= startOfDay);
      case 'weekly':
        return trips.filter(trip => trip.startTime >= startOfWeek);
      case 'monthly':
        return trips.filter(trip => trip.startTime >= startOfMonth);
      default:
        return trips;
    }
  }, [trips, selectedPeriod]);

  const { totalDistance, routeColors, uniqueRoadsKm } = useMemo(() => {
    let distance = 0;
    const colors: string[] = [];
    const roadSegments = new Set<string>();

    filteredTrips.forEach((trip, index) => {
      distance += trip.distance;
      
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
      totalDistance: distance,
      routeColors: colors,
      uniqueRoadsKm: uniqueRoadsEstimate,
    };
  }, [filteredTrips]);

  const initialRegion = useMemo(() => {
    const allCoordinates: { latitude: number; longitude: number }[] = [];
    
    filteredTrips.forEach((trip) => {
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
  }, [filteredTrips]);

  const getCurrentMilestone = (distance: number) => {
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (distance >= MILESTONES[i].km) {
        return MILESTONES[i];
      }
    }
    return null;
  };

  const getNextMilestone = (distance: number) => {
    for (const milestone of MILESTONES) {
      if (distance < milestone.km) {
        return milestone;
      }
    }
    return MILESTONES[MILESTONES.length - 1];
  };

  const nextMilestone = getNextMilestone(uniqueRoadsKm);
  const currentMilestone = getCurrentMilestone(uniqueRoadsKm);
  const progressToNext = nextMilestone ? Math.min((uniqueRoadsKm / nextMilestone.km) * 100, 100) : 100;

  const worldCoveragePercentage = ((uniqueRoadsKm / ESTIMATED_WORLD_ROADS_KM) * 100).toFixed(6);

  const periods: { key: TimePeriod; label: string }[] = [
    { key: 'daily', label: 'Today' },
    { key: 'weekly', label: 'Week' },
    { key: 'monthly', label: 'Month' },
    { key: 'all', label: 'All' },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Globe size={28} color={theme.colors.dark.accent} strokeWidth={2} />
            <View>
              <Text style={styles.title}>World Coverage</Text>
              <Text style={styles.subtitle}>{filteredTrips.length} trips recorded</Text>
            </View>
          </View>
        </View>

        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <Pressable
              key={period.key}
              style={[
                styles.periodTab,
                selectedPeriod === period.key && styles.periodTabActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodTabText,
                  selectedPeriod === period.key && styles.periodTabTextActive,
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          ))}
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
          {filteredTrips.map((trip, tripIndex) => {
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
          <View style={styles.statHeader}>
            <Globe size={16} color={theme.colors.dark.accent} />
            <Text style={styles.statLabel}>World Road Coverage</Text>
          </View>
          <Text style={styles.statValue}>{worldCoveragePercentage}%</Text>
          <Text style={styles.statSubtext}>
            {uniqueRoadsKm.toFixed(1)} km of unique roads discovered
          </Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
            </View>
            <Text style={styles.statSubtext}>
              {nextMilestone && uniqueRoadsKm < nextMilestone.km 
                ? `${(nextMilestone.km - uniqueRoadsKm).toFixed(0)} km to ${nextMilestone.label}`
                : currentMilestone ? `${currentMilestone.label} reached!` : 'Start exploring!'}
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Route size={16} color={theme.colors.dark.success} />
            <Text style={styles.statLabel}>Routes Tracked</Text>
          </View>
          <Text style={styles.statValue}>{filteredTrips.length}</Text>
          <Text style={styles.statSubtext}>
            {totalDistance.toFixed(1)} km total distance
          </Text>
        </View>
      </View>

      <View style={[styles.infoCard, { bottom: 120 }]}>
        <Info size={14} color={theme.colors.dark.textSecondary} />
        <Text style={styles.infoText}>
          Road Coverage = % of unique roads driven. Based on estimated {(ESTIMATED_WORLD_ROADS_KM / 1000000).toFixed(0)}M km of roads worldwide.
        </Text>
      </View>

      <View style={[styles.infoCard, { bottom: 80 }]}>
        <Calendar size={14} color={theme.colors.dark.textSecondary} />
        <Text style={styles.infoText}>
          {selectedPeriod === 'all' 
            ? 'Showing all recorded routes' 
            : `Showing routes from ${selectedPeriod === 'daily' ? 'today' : selectedPeriod === 'weekly' ? 'this week' : 'this month'}`}
        </Text>
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
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.md,
  },
  periodTab: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.dark.card,
    alignItems: 'center',
  },
  periodTabActive: {
    backgroundColor: theme.colors.dark.accent,
  },
  periodTabText: {
    ...theme.typography.callout,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  periodTabTextActive: {
    color: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  statsContainer: {
    position: 'absolute',
    bottom: 160,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 18, 18, 0.95)',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: theme.colors.dark.accent,
  },
  statSubtext: {
    fontSize: 11,
    color: theme.colors.dark.textTertiary,
    marginTop: theme.spacing.xs,
  },
  infoCard: {
    position: 'absolute',
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    backgroundColor: 'rgba(18, 18, 18, 0.9)',
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoText: {
    fontSize: 12,
    color: theme.colors.dark.textSecondary,
    flex: 1,
  },
  progressContainer: {
    marginTop: theme.spacing.xs,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.dark.accent,
    borderRadius: 2,
  },
});
