export type LeaderboardType = 'distance' | 'coverage' | 'gpsPoints' | 'trips';
export type LeaderboardScope = 'global' | 'country' | 'city' | 'friends';
export type LeaderboardPeriod = 'weekly' | 'monthly' | 'season' | 'allTime';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  photoUrl?: string;
  region?: string;
  value: number;
  change?: number;
}

export interface LeaderboardData {
  type: LeaderboardType;
  scope: LeaderboardScope;
  period: LeaderboardPeriod;
  entries: LeaderboardEntry[];
  currentUserEntry?: LeaderboardEntry;
  lastUpdated: number;
  seasonEndDate?: number;
}
