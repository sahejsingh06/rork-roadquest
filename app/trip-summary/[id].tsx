import React, { useMemo, useCallback, useRef, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Dimensions, Platform, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Calendar, Clock, Zap, Route, Gauge, TrendingUp, Award, Share2, Instagram, Facebook, Twitter } from 'lucide-react-native';
import { useTrip } from '@/contexts/TripContext';
import { theme } from '@/constants/theme';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');
const CHART_HEIGHT = 200;
const CHART_WIDTH = width - theme.spacing.lg * 2;

export default function TripSummaryScreen() {
  const { id } = useLocalSearchParams();
  const { trips, useKmh } = useTrip();
  const shareViewRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

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

  const gpsPoints = useMemo(() => {
    if (!trip) return 0;
    return Math.floor(trip.distance);
  }, [trip]);

  const expectedDuration = useMemo(() => {
    if (!trip || trip.distance === 0) return 0;
    const avgSpeedKmh = 60;
    return (trip.distance / avgSpeedKmh) * 60 * 60 * 1000;
  }, [trip]);

  const timeDifference = useMemo(() => {
    if (!trip) return 0;
    return trip.duration - expectedDuration;
  }, [trip, expectedDuration]);

  const getSpeedColor = useCallback((speed: number) => {
    const kmh = useKmh ? speed : speed / 0.621371;
    if (kmh < 50) return '#FF3B30';
    if (kmh < 100) return '#FF9500';
    if (kmh < 150) return '#34C759';
    return '#0A84FF';
  }, [useKmh]);

  const speedSegments = useMemo(() => {
    if (!trip || trip.locations.length < 2) return [];
    
    const segments: { coordinates: {latitude: number, longitude: number}[], color: string }[] = [];
    let currentSegment: {latitude: number, longitude: number}[] = [];
    let currentColor = getSpeedColor(trip.locations[0].speed || 0);
    
    trip.locations.forEach((loc, index) => {
      const color = getSpeedColor(loc.speed || 0);
      
      if (color === currentColor) {
        currentSegment.push({ latitude: loc.latitude, longitude: loc.longitude });
      } else {
        if (currentSegment.length > 0) {
          currentSegment.push({ latitude: loc.latitude, longitude: loc.longitude });
          segments.push({ coordinates: [...currentSegment], color: currentColor });
        }
        currentSegment = [{ latitude: loc.latitude, longitude: loc.longitude }];
        currentColor = color;
      }
    });
    
    if (currentSegment.length > 1) {
      segments.push({ coordinates: currentSegment, color: currentColor });
    }
    
    return segments;
  }, [trip, getSpeedColor]);

  const startLocation = trip?.locations[0];
  const endLocation = trip?.locations[trip?.locations.length - 1];

  const handleShare = async () => {
    if (!shareViewRef.current) return;
    
    if (Platform.OS === 'web') {
      Alert.alert('Share unavailable', 'Sharing is not supported on web');
      return;
    }

    try {
      setIsSharing(true);
      const uri = await captureRef(shareViewRef, {
        format: 'png',
        quality: 0.9,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share your RoadQuest journey',
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share trip');
    } finally {
      setIsSharing(false);
    }
  };

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
      <Stack.Screen 
        options={{
          title: 'Trip Details',
          headerRight: () => (
            <TouchableOpacity 
              onPress={handleShare}
              disabled={isSharing}
              style={styles.shareButton}
            >
              {isSharing ? (
                <ActivityIndicator size="small" color={theme.colors.dark.accent} />
              ) : (
                <Share2 size={22} color={theme.colors.dark.accent} />
              )}
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View ref={shareViewRef} collapsable={false} style={styles.shareContainer}>
          <View style={styles.shareHeader}>
            <View style={styles.shareBrandingTop}>
              <Text style={styles.shareBrandingText}>RoadQuest</Text>
              <Text style={styles.shareBrandingSubtext}>Track • Explore • Compete</Text>
            </View>
            <View style={styles.socialIconsContainer}>
              <View style={styles.socialIcon}>
                <Instagram size={16} color={theme.colors.dark.accent} />
              </View>
              <View style={styles.socialIcon}>
                <Facebook size={16} color={theme.colors.dark.accent} />
              </View>
              <View style={styles.socialIcon}>
                <Twitter size={16} color={theme.colors.dark.accent} />
              </View>
            </View>
          </View>
          
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
            {speedSegments.map((segment, index) => (
              <Polyline
                key={index}
                coordinates={segment.coordinates}
                strokeColor={segment.color}
                strokeWidth={4}
              />
            ))}
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
                <Award size={18} color={theme.colors.dark.textSecondary} />
                <View style={styles.additionalStatText}>
                  <Text style={styles.additionalStatValue}>{gpsPoints}</Text>
                  <Text style={styles.additionalStatLabel}>GPS Points Earned</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.travelTimeCard}>
            <View style={styles.travelTimeHeader}>
              <TrendingUp size={20} color={theme.colors.dark.text} />
              <Text style={styles.travelTimeTitle}>Travel Time Comparison</Text>
            </View>
            <View style={styles.travelTimeContent}>
              <View style={styles.travelTimeItem}>
                <Text style={styles.travelTimeLabel}>Expected Time</Text>
                <Text style={styles.travelTimeValue}>{formatDuration(expectedDuration)}</Text>
              </View>
              <View style={styles.travelTimeDivider} />
              <View style={styles.travelTimeItem}>
                <Text style={styles.travelTimeLabel}>Your Time</Text>
                <Text style={styles.travelTimeValue}>{formatDuration(trip.duration)}</Text>
              </View>
            </View>
            <View style={styles.travelTimeDifference}>
              <Text style={[
                styles.travelTimeDifferenceText,
                { color: timeDifference < 0 ? theme.colors.dark.success : theme.colors.dark.warning }
              ]}>
                {timeDifference < 0 ? '⚡ ' : '🐢 '}
                {Math.abs(Math.round(timeDifference / 1000 / 60))} min {timeDifference < 0 ? 'faster' : 'slower'} than expected
              </Text>
            </View>
          </View>

          <View style={styles.speedLegend}>
            <Text style={styles.speedLegendTitle}>Speed Ranges</Text>
            <View style={styles.speedLegendItems}>
              <View style={styles.speedLegendItem}>
                <View style={[styles.speedLegendColor, { backgroundColor: '#FF3B30' }]} />
                <Text style={styles.speedLegendText}>0-50 {useKmh ? 'km/h' : 'mph'}</Text>
              </View>
              <View style={styles.speedLegendItem}>
                <View style={[styles.speedLegendColor, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.speedLegendText}>50-100 {useKmh ? 'km/h' : 'mph'}</Text>
              </View>
              <View style={styles.speedLegendItem}>
                <View style={[styles.speedLegendColor, { backgroundColor: '#34C759' }]} />
                <Text style={styles.speedLegendText}>100-150 {useKmh ? 'km/h' : 'mph'}</Text>
              </View>
              <View style={styles.speedLegendItem}>
                <View style={[styles.speedLegendColor, { backgroundColor: '#0A84FF' }]} />
                <Text style={styles.speedLegendText}>150+ {useKmh ? 'km/h' : 'mph'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.shareStatsCard}>
            <View style={styles.shareStatsHeader}>
              <Text style={styles.shareStatsTitle}>Journey Summary</Text>
              <Text style={styles.shareStatsDate}>{formatDate(trip.startTime)}</Text>
            </View>
            <View style={styles.shareStatsRow}>
              <View style={styles.shareStatItem}>
                <View style={styles.shareStatIconContainer}>
                  <Route size={18} color={theme.colors.dark.accent} />
                </View>
                <Text style={styles.shareStatValue}>{trip.distance.toFixed(1)} km</Text>
                <Text style={styles.shareStatLabel}>Distance</Text>
              </View>
              <View style={styles.shareStatDivider} />
              <View style={styles.shareStatItem}>
                <View style={styles.shareStatIconContainer}>
                  <Clock size={18} color={theme.colors.dark.accent} />
                </View>
                <Text style={styles.shareStatValue}>{formatDuration(trip.duration)}</Text>
                <Text style={styles.shareStatLabel}>Duration</Text>
              </View>
              <View style={styles.shareStatDivider} />
              <View style={styles.shareStatItem}>
                <View style={styles.shareStatIconContainer}>
                  <Gauge size={18} color={theme.colors.dark.accent} />
                </View>
                <Text style={styles.shareStatValue}>{Math.round(useKmh ? trip.avgSpeed : trip.avgSpeed * 0.621371)}</Text>
                <Text style={styles.shareStatLabel}>Avg Speed ({useKmh ? 'km/h' : 'mph'})</Text>
              </View>
            </View>
            <View style={styles.shareFooter}>
              <View style={styles.shareFooterReward}>
                <Award size={20} color={theme.colors.dark.accent} />
                <Text style={styles.shareFooterText}>+{gpsPoints} GP Earned</Text>
              </View>
            </View>
          </View>

          <View style={styles.chartSection}>
            <Text style={styles.chartTitle}>Speed Over Time</Text>
            <View style={styles.chartContainer}>
              <View style={styles.chartWrapper}>
                <View style={styles.chartYAxis}>
                  <Text style={styles.chartYLabel}>{Math.round(maxChartSpeed)}</Text>
                  <Text style={styles.chartYLabel}>{Math.round(maxChartSpeed / 2)}</Text>
                  <Text style={styles.chartYLabel}>0</Text>
                </View>
                <View style={styles.chart}>
                  {speedData.map((point, index) => {
                    const height = (point.y / maxChartSpeed) * CHART_HEIGHT;
                    const barWidth = (CHART_WIDTH - 40) / speedData.length;
                    
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
              </View>
              <View style={styles.chartXAxisLabel}>
                <Text style={styles.chartLabel}>Speed ({useKmh ? 'km/h' : 'mph'})</Text>
              </View>
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
    justifyContent: 'center',
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
  chartWrapper: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chartYAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: theme.spacing.xs,
    width: 40,
  },
  chartYLabel: {
    ...theme.typography.caption2,
    color: theme.colors.dark.textSecondary,
    fontSize: 11,
  },
  chart: {
    height: CHART_HEIGHT,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
  },
  chartBar: {
    backgroundColor: theme.colors.dark.accent,
    borderRadius: 2,
  },
  chartXAxisLabel: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  chartLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    fontWeight: '600' as const,
  },
  travelTimeCard: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  travelTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  travelTimeTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
  },
  travelTimeContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  travelTimeItem: {
    flex: 1,
    alignItems: 'center',
  },
  travelTimeDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.dark.border,
  },
  travelTimeLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  travelTimeValue: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
  },
  travelTimeDifference: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.dark.border,
    alignItems: 'center',
  },
  travelTimeDifferenceText: {
    ...theme.typography.callout,
    fontWeight: '600' as const,
  },
  speedLegend: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.dark.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  speedLegendTitle: {
    ...theme.typography.headline,
    color: theme.colors.dark.text,
    fontWeight: '600' as const,
    marginBottom: theme.spacing.md,
  },
  speedLegendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  speedLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: '45%',
  },
  speedLegendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  speedLegendText: {
    ...theme.typography.subheadline,
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
  shareButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.xs,
  },
  shareContainer: {
    backgroundColor: theme.colors.dark.background,
  },
  shareHeader: {
    backgroundColor: theme.colors.dark.card,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: theme.colors.dark.accent,
  },
  shareBrandingTop: {
    flex: 1,
  },
  shareBrandingText: {
    ...theme.typography.largeTitle,
    color: theme.colors.dark.accent,
    fontWeight: '800' as const,
    letterSpacing: 1.5,
    fontSize: 32,
  },
  shareBrandingSubtext: {
    ...theme.typography.subheadline,
    color: theme.colors.dark.textSecondary,
    marginTop: 4,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  socialIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.dark.accent,
  },
  shareStatsCard: {
    backgroundColor: theme.colors.dark.card,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 2,
    borderColor: theme.colors.dark.accent,
  },
  shareStatsHeader: {
    marginBottom: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.dark.border,
  },
  shareStatsTitle: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '700' as const,
    marginBottom: theme.spacing.xs,
  },
  shareStatsDate: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
  },
  shareStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  shareStatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.dark.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  shareStatValue: {
    ...theme.typography.title2,
    color: theme.colors.dark.text,
    fontWeight: '800' as const,
    marginTop: theme.spacing.xs,
  },
  shareStatLabel: {
    ...theme.typography.caption1,
    color: theme.colors.dark.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  shareStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: theme.colors.dark.border,
  },
  shareFooter: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 2,
    borderTopColor: theme.colors.dark.accent,
    alignItems: 'center',
  },
  shareFooterReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.dark.cardElevated,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  shareFooterText: {
    ...theme.typography.headline,
    color: theme.colors.dark.accent,
    fontWeight: '700' as const,
  },
});
