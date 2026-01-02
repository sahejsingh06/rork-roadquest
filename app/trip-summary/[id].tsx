import React, { useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Calendar, Clock, Zap, Fuel, Route, Gauge, Navigation } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_WIDTH = width - theme.spacing.lg * 2;

export default function TripSummaryScreen() {
  const { id } = useLocalSearchParams();
  const { trips, useKmh } = useTrip();

  const trip = useMemo(() => {
    return trips.find(t => t.id === id);
  }, [trips, id]);

  const region = useMemo(() => {
    if (!trip || trip.locations.length === 0) {
      return {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    const lats = trip.locations.map(l => l.latitude);
    const lngs = trip.locations.map(l => l.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 || 0.01,
      longitudeDelta: (maxLng - minLng) * 1.5 || 0.01,
    };
  }, [trip]);

  const speedData = useMemo(() => {
    if (!trip) return [];
    return trip.locations.map((loc, index) => ({
      x: index,
      y: useKmh ? (loc.speed || 0) : (loc.speed || 0) * 0.621371,
    }));
  }, [trip, useKmh]);

  const maxChartSpeed = Math.max(...speedData.map(d => d.y), 1);

  const estimatedFuel = useMemo(() => {
    if (!trip) return 0;
    const avgConsumption = 8;
    return (trip.distance / 100) * avgConsumption;
  }, [trip]);

  const startLocation = trip?.locations[0];
  const endLocation = trip?.locations[trip?.locations.length - 1];

  if (!trip) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Trip not found</Text>
        </View>
      </View>
    );
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={region}
            provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
            mapType="standard"
            scrollEnabled={true}
            zoomEnabled={true}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            {trip.locations.length > 1 && (
              <Polyline
                coordinates={trip.locations.map(loc => ({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                }))}
                strokeColor={theme.colors.dark.accent}
                strokeWidth={4}
              />
            )}
            {startLocation && (
              <Marker
                coordinate={{
                  latitude: startLocation.latitude,
                  longitude: startLocation.longitude,
                }}
                title="Start"
                pinColor="#34C759"
              />
            )}
            {endLocation && trip.locations.length > 1 && (
              <Marker
                coordinate={{
                  latitude: endLocation.latitude,
                  longitude: endLocation.longitude,
                }}
                title="End"
                pinColor="#FF3B30"
              />
            )}
          </MapView>
        </View>

        <View style={styles.content}>
          <View style={styles.dateSection}>
            <Calendar size={20} color={theme.colors.dark.textSecondary} />
            <Text style={styles.dateText}>{formatDate(trip.startTime)}</Text>
          </View>

          <View style={styles.timeSection}>
            <Text style={styles.timeText}>
              {formatTime(trip.startTime)} - {trip.endTime ? formatTime(trip.endTime) : 'In Progress'}
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Route size={20} color={theme.colors.dark.accent} />
              </View>
              <Text style={styles.statValue}>{trip.distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distance (km)</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Clock size={20} color={theme.colors.dark.success} />
              </View>
              <Text style={styles.statValue}>{formatDuration(trip.duration)}</Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Gauge size={20} color={theme.colors.dark.warning} />
              </View>
              <Text style={styles.statValue}>
                {Math.round(useKmh ? trip.avgSpeed : trip.avgSpeed * 0.621371)}
              </Text>
              <Text style={styles.statLabel}>Avg Speed ({useKmh ? 'km/h' : 'mph'})</Text>
            </View>

            <View style={styles.statCard}>
              <View style={styles.statIconContainer}>
                <Zap size={20} color={theme.colors.dark.danger} />
              </View>
              <Text style={styles.statValue}>
                {Math.round(useKmh ? trip.maxSpeed : trip.maxSpeed * 0.621371)}
              </Text>
              <Text style={styles.statLabel}>Max Speed ({useKmh ? 'km/h' : 'mph'})</Text>
            </View>
          </View>

          <View style={styles.additionalStats}>
            <View style={styles.additionalStatRow}>
              <View style={styles.additionalStatItem}>
                <Fuel size={18} color={theme.colors.dark.textSecondary} />
                <View style={styles.additionalStatText}>
                  <Text style={styles.additionalStatValue}>{estimatedFuel.toFixed(1)} L</Text>
                  <Text style={styles.additionalStatLabel}>Est. Fuel Used</Text>
                </View>
              </View>
              <View style={styles.additionalStatItem}>
                <Navigation size={18} color={theme.colors.dark.textSecondary} />
                <View style={styles.additionalStatText}>
                  <Text style={styles.additionalStatValue}>{trip.locations.length}</Text>
                  <Text style={styles.additionalStatLabel}>GPS Points</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Speed Over Time</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chart}>
                {speedData.map((point, index) => {
                  const height = (point.y / maxChartSpeed) * CHART_HEIGHT;
                  const barWidth = CHART_WIDTH / speedData.length;
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.chartBar,
                        {
                          height: Math.max(height, 2),
                          width: Math.max(barWidth - 1, 1),
                        },
                      ]}
                    />
                  );
                })}
              </View>
              <View style={styles.chartLabels}>
                <Text style={styles.chartLabel}>0</Text>
                <Text style={styles.chartLabel}>{Math.round(maxChartSpeed)} {useKmh ? 'km/h' : 'mph'}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  mapContainer: {
    height: 300,
    backgroundColor: theme.colors.dark.card,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
  },
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  dateText: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
  },
  timeSection: {
    marginTop: theme.spacing.xs,
  },
  timeText: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  additionalStats: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  additionalStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  additionalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  additionalStatText: {
    alignItems: 'flex-start',
  },
  additionalStatValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  additionalStatLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  chartSection: {
    marginTop: theme.spacing.xl,
  },
  chartTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.md,
  },
  chartContainer: {
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  chart: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  chartBar: {
    backgroundColor: theme.colors.dark.accent,
    borderRadius: 2,
  },
  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  chartLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...theme.typography.title3,
    color: theme.colors.dark.textSecondary,
  },
});
