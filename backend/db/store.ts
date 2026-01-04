import Surreal from 'surrealdb.js';
import type { DBUser, DBFriendship, DBLeaderboardEntry, DBTrip } from './schema';

const endpoint = process.env.EXPO_PUBLIC_RORK_DB_ENDPOINT || '';
const namespace = process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE || '';
const token = process.env.EXPO_PUBLIC_RORK_DB_TOKEN || '';

class RorkDB {
  private client: Surreal;
  private initialized = false;

  constructor() {
    this.client = new Surreal();
  }

  private async init() {
    if (this.initialized) return;
    try {
      await this.client.connect(endpoint);
      await this.client.use({ namespace, database: 'app' });
      await this.client.authenticate(token);
      this.initialized = true;
      console.log('RorkDB connected successfully');
    } catch (error) {
      console.error('Failed to connect to RorkDB:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<DBUser | undefined> {
    await this.init();
    try {
      const result = await this.client.query<[DBUser[]]>(
        'SELECT * FROM type::thing("user", $userId) LIMIT 1',
        { userId }
      );
      return result[0]?.[0];
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async setUser(user: DBUser): Promise<void> {
    await this.init();
    try {
      await this.client.query(
        'UPDATE type::thing("user", $id) CONTENT $user',
        { id: user.id, user }
      );
    } catch (error) {
      console.error('Error setting user:', error);
    }
  }

  async getAllUsers(): Promise<DBUser[]> {
    await this.init();
    const result = await this.client.query<[DBUser[]]>('SELECT * FROM user');
    return result[0] || [];
  }

  async getUsersByIds(userIds: string[]): Promise<DBUser[]> {
    if (userIds.length === 0) return [];
    await this.init();
    try {
      const result = await this.client.query<[DBUser[]]>(
        'SELECT * FROM user WHERE id IN $userIds',
        { userIds: userIds.map(id => `user:${id}`) }
      );
      return result[0] || [];
    } catch (error) {
      console.error('Error getting users by ids:', error);
      return [];
    }
  }

  async getFriendship(friendshipId: string): Promise<DBFriendship | undefined> {
    await this.init();
    try {
      const result = await this.client.query<[DBFriendship[]]>(
        'SELECT * FROM type::thing("friendship", $id) LIMIT 1',
        { id: friendshipId }
      );
      return result[0]?.[0];
    } catch (error) {
      console.error('Error getting friendship:', error);
      return undefined;
    }
  }

  async setFriendship(friendship: DBFriendship): Promise<void> {
    await this.init();
    try {
      await this.client.query(
        'UPDATE type::thing("friendship", $id) CONTENT $friendship',
        { id: friendship.id, friendship }
      );
    } catch (error) {
      console.error('Error setting friendship:', error);
    }
  }

  async getUserFriendships(userId: string): Promise<DBFriendship[]> {
    await this.init();
    const result = await this.client.query<[DBFriendship[]]>(
      'SELECT * FROM friendship WHERE userId = $userId OR friendId = $userId',
      { userId }
    );
    return result[0] || [];
  }

  async removeFriendship(friendshipId: string): Promise<void> {
    await this.init();
    try {
      await this.client.query(
        'DELETE type::thing("friendship", $id)',
        { id: friendshipId }
      );
    } catch (error) {
      console.error('Error removing friendship:', error);
    }
  }

  async setLeaderboardEntry(entry: DBLeaderboardEntry): Promise<void> {
    await this.init();
    try {
      const id = `${entry.userId}_${entry.type}_${entry.period}`;
      await this.client.query(
        'UPDATE type::thing("leaderboard", $id) CONTENT $entry',
        { id, entry }
      );
    } catch (error) {
      console.error('Error setting leaderboard entry:', error);
    }
  }

  async getLeaderboardEntries(type: string, period: string): Promise<DBLeaderboardEntry[]> {
    await this.init();
    const result = await this.client.query<[DBLeaderboardEntry[]]>(
      'SELECT * FROM leaderboard WHERE type = $type AND period = $period ORDER BY value DESC',
      { type, period }
    );
    return result[0] || [];
  }

  async setTrip(trip: DBTrip): Promise<void> {
    await this.init();
    try {
      await this.client.query(
        'CREATE type::thing("trip", $id) CONTENT $trip',
        { id: trip.id, trip }
      );
    } catch (error) {
      console.error('Error setting trip:', error);
    }
  }

  async getTrip(tripId: string): Promise<DBTrip | undefined> {
    await this.init();
    try {
      const result = await this.client.query<[DBTrip[]]>(
        'SELECT * FROM type::thing("trip", $id) LIMIT 1',
        { id: tripId }
      );
      return result[0]?.[0];
    } catch (error) {
      console.error('Error getting trip:', error);
      return undefined;
    }
  }

  async getUserTrips(userId: string): Promise<DBTrip[]> {
    await this.init();
    const result = await this.client.query<[DBTrip[]]>(
      'SELECT * FROM trip WHERE userId = $userId ORDER BY startTime DESC',
      { userId }
    );
    return result[0] || [];
  }

  async getFriendsSharedTrips(friendIds: string[]): Promise<DBTrip[]> {
    if (friendIds.length === 0) return [];
    await this.init();
    const result = await this.client.query<[DBTrip[]]>(
      'SELECT * FROM trip WHERE userId IN $friendIds AND sharedWithFriends = true ORDER BY startTime DESC',
      { friendIds }
    );
    return result[0] || [];
  }
}

export const db = new RorkDB();
