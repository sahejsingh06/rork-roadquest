export interface DBTrip {
  id: string;
  userId: string;
  username: string;
  userPhotoUrl?: string;
  startTime: number;
  endTime: number;
  distance: number;
  maxSpeed: number;
  avgSpeed: number;
  duration: number;
  carIcon?: string;
  sharedWithFriends: boolean;
  locations: { latitude: number; longitude: number; speed: number | null; timestamp: number; accuracy: number | null }[];
  isPaused: boolean;
  pausedDuration: number;
}

export interface DBUser {
  id: string;
  username: string;
  email: string;
  photoUrl?: string;
  region?: string;
  totalDistance: number;
  totalTrips: number;
  totalGPSPoints: number;
  roadCoveragePercent: number;
  createdAt: number;
  lastUpdated: number;
}

export interface DBFriendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface DBLeaderboardEntry {
  userId: string;
  username: string;
  photoUrl?: string;
  region?: string;
  value: number;
  type: 'distance' | 'gpsPoints' | 'trips' | 'coverage';
  period: 'weekly' | 'monthly' | 'season' | 'allTime';
  weekStart?: number;
  monthStart?: number;
  seasonStart?: number;
}
