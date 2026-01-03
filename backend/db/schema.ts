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
