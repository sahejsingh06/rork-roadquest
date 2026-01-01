import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { Play, Square, Pause } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DriveScreen() {
  const {
    isTracking,
    currentTrip,
    currentSpeed,
    currentLocation,
    hasPermission,
    useKmh,
    startTrip,
    stopTrip,
    toggleUnit,
  } = useTrip();

  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  useEffect(() => {
    if (currentLocation) {
      setRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  }, [currentLocation]);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const displaySpeed = useKmh ? currentSpeed : currentSpeed * 0.621371;
  const speedUnit = useKmh ? 'km/h' : 'mph';

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        mapType="standard"
        showsUserLocation
        followsUserLocation
        showsMyLocationButton={false}
      >
        {currentTrip && currentTrip.locations.length > 1 && (
          <Polyline
            coordinates={currentTrip.locations.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor={theme.colors.dark.accent}
            strokeWidth={4}
          />
        )}
      </MapView>

      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <Text style={styles.logo}>RoadQuest</Text>
          <Pressable onPress={toggleUnit} style={styles.unitToggle}>
            <Text style={styles.unitText}>{speedUnit}</Text>
          </Pressable>
        </View>
      </SafeAreaView>

      <View style={styles.overlay}>
        <View style={styles.speedContainer}>
            <Text style={styles.speed}>
              {Math.round(displaySpeed)}
            </Text>
            <Text style={styles.speedUnit}>{speedUnit}</Text>
          </View>

          {isTracking && currentTrip && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {currentTrip.distance.toFixed(2)}
                </Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {formatDuration(currentTrip.duration)}
                </Text>
                <Text style={styles.statLabel}>time</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {Math.round(useKmh ? currentTrip.avgSpeed : currentTrip.avgSpeed * 0.621371)}
                </Text>
                <Text style={styles.statLabel}>avg</Text>
              </View>
            </View>
          )}

        {currentTrip?.isPaused && (
          <View style={styles.pausedBanner}>
            <Pause size={16} color={theme.colors.dark.warning} />
            <Text style={styles.pausedText}>Auto-Paused</Text>
          </View>
        )}
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSafeArea}>
        <View style={styles.controlsContainer}>
          {!isTracking ? (
            <Pressable
              style={[styles.controlButton, styles.startButton]}
              onPress={startTrip}
              disabled={!hasPermission}
            >
              <Play size={32} color={theme.colors.dark.background} fill={theme.colors.dark.background} />
              <Text style={styles.startButtonText}>Start Drive</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.controlButton, styles.stopButton]}
              onPress={stopTrip}
            >
              <Square size={24} color={theme.colors.dark.text} fill={theme.colors.dark.text} />
              <Text style={styles.stopButtonText}>End Drive</Text>
            </Pressable>
          )}
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
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  logo: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  unitToggle: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: 'rgba(44, 44, 46, 0.8)',
    borderRadius: theme.borderRadius.md,
  },
  unitText: {
    ...theme.typography.callout,
    color: theme.colors.dark.accent,
    fontWeight: '600' as const,
  },
  overlay: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    paddingHorizontal: theme.spacing.lg,
  },
  speedContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    alignSelf: 'center',
  },
  speed: {
    ...theme.typography.largeTitle,
    color: theme.colors.dark.speed,
    fontSize: 96,
    fontWeight: '700' as const,
    letterSpacing: -4,
  },
  speedUnit: {
    ...theme.typography.title3,
    color: theme.colors.dark.textSecondary,
    marginTop: -theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  statLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
  },
  pausedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    alignSelf: 'center',
  },
  pausedText: {
    ...theme.typography.callout,
    color: theme.colors.dark.warning,
    fontWeight: '600' as const,
  },
  bottomSafeArea: {
    backgroundColor: theme.colors.dark.background,
  },
  controlsContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
  startButton: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  startButtonText: {
    ...theme.typography.title3,
    color: theme.colors.dark.background,
    fontWeight: '700' as const,
  },
  stopButton: {
    backgroundColor: theme.colors.dark.card,
  },
  stopButtonText: {
    ...theme.typography.title3,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
});
