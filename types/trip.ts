export interface LocationPoint {
  latitude: number;
  longitude: number;
  speed: number | null;
  timestamp: number;
  accuracy: number | null;
}

export interface Trip {
  id: string;
  startTime: number;
  endTime: number | null;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  duration: number;
  locations: LocationPoint[];
  isPaused: boolean;
  pausedDuration: number;
}

export interface TripStats {
  totalDistance: number;
  totalTrips: number;
  totalDuration: number;
  averageSpeed: number;
  maxSpeedAllTime: number;
}
