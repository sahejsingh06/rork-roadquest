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

  private extractId(fullId: string): string {
    if (typeof fullId === 'string' && fullId.includes(':')) {
      return fullId.split(':')[1];
    }
    return fullId;
  }

  private async init() {
    if (this.initialized) return;
    try {
      await Promise.race([
        (async () => {
          await this.client.connect(endpoint);
          await this.client.use({ namespace, database: 'app' });
          await this.client.authenticate(token);
        })(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 10000)
        )
      ]);
      this.initialized = true;
      console.log('RorkDB connected successfully');
    } catch (error) {
      console.error('Failed to connect to RorkDB:', error);
      this.initialized = false;
      throw error;
    }
  }

  async getUser(userId: string): Promise<DBUser | undefined> {
    try {
      await this.init();
      const result = await this.client.query<[DBUser[]]>(
        'SELECT * FROM user WHERE id = type::thing("user", $userId) LIMIT 1',
        { userId }
      );
      const user = result[0]?.[0];
      console.log('getUser result for', userId, ':', user ? 'found' : 'not found');
      if (user) {
        return {
          ...user,
          id: this.extractId(user.id as any),
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error getting user:', error);
      return undefined;
    }
  }

  async setUser(user: DBUser): Promise<void> {
    try {
      await this.init();
      const userWithId = {
        ...user,
        id: `user:${user.id}`,
      };
      await this.client.query(
        'UPDATE type::thing("user", $id) CONTENT $data',
        { id: user.id, data: userWithId }
      );
      console.log('User saved:', user.id, user.username);
    } catch (error) {
      console.error('Error setting user:', error, user);
      throw error;
    }
  }

  async getAllUsers(): Promise<DBUser[]> {
    try {
      await this.init();
      const result = await this.client.query<[DBUser[]]>('SELECT * FROM user ORDER BY username ASC');
      const users = (result[0] || []).map(u => ({
        ...u,
        id: this.extractId(u.id as any),
      }));
      console.log('getAllUsers returned', users.length, 'users:', users.map(u => ({ id: u.id, username: u.username })));
      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  async getUsersByIds(userIds: string[]): Promise<DBUser[]> {
    if (userIds.length === 0) return [];
    try {
      await this.init();
      const formattedIds = userIds.map(id => id.startsWith('user:') ? id : `user:${id}`);
      const result = await this.client.query<[DBUser[]]>(
        'SELECT * FROM user WHERE id IN $userIds',
        { userIds: formattedIds }
      );
      const users = (result[0] || []).map(u => ({
        ...u,
        id: this.extractId(u.id as any),
      }));
      console.log('getUsersByIds found', users.length, 'users for', userIds.length, 'IDs');
      return users;
    } catch (error) {
      console.error('Error getting users by ids:', error);
      return [];
    }
  }

  async getFriendship(friendshipId: string): Promise<DBFriendship | undefined> {
    try {
      await this.init();
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
    try {
      await this.init();
      await this.client.query(
        'UPDATE type::thing("friendship", $id) CONTENT $friendship',
        { id: friendship.id, friendship }
      );
    } catch (error) {
      console.error('Error setting friendship:', error);
      throw error;
    }
  }

  async getUserFriendships(userId: string): Promise<DBFriendship[]> {
    try {
      await this.init();
      const result = await this.client.query<[DBFriendship[]]>(
        'SELECT * FROM friendship WHERE userId = $userId OR friendId = $userId',
        { userId }
      );
      console.log('getUserFriendships for', userId, 'returned', result[0]?.length || 0, 'friendships');
      return result[0] || [];
    } catch (error) {
      console.error('Error getting user friendships:', error);
      return [];
    }
  }

  async removeFriendship(friendshipId: string): Promise<void> {
    try {
      await this.init();
      await this.client.query(
        'DELETE type::thing("friendship", $id)',
        { id: friendshipId }
      );
    } catch (error) {
      console.error('Error removing friendship:', error);
      throw error;
    }
  }

  async setLeaderboardEntry(entry: DBLeaderboardEntry): Promise<void> {
    try {
      await this.init();
      const id = `${entry.userId}_${entry.type}_${entry.period}`;
      await this.client.query(
        'UPDATE type::thing("leaderboard", $id) CONTENT $entry',
        { id, entry }
      );
    } catch (error) {
      console.error('Error setting leaderboard entry:', error);
      throw error;
    }
  }

  async getLeaderboardEntries(type: string, period: string): Promise<DBLeaderboardEntry[]> {
    try {
      await this.init();
      const result = await this.client.query<[DBLeaderboardEntry[]]>(
        'SELECT * FROM leaderboard WHERE type = $type AND period = $period ORDER BY value DESC LIMIT 100',
        { type, period }
      );
      const entries = result[0] || [];
      console.log('getLeaderboardEntries:', type, period, 'returned', entries.length, 'entries:', entries.map(e => ({ userId: e.userId, username: e.username, value: e.value })));
      return entries;
    } catch (error) {
      console.error('Error getting leaderboard entries:', error);
      return [];
    }
  }

  async setTrip(trip: DBTrip): Promise<void> {
    try {
      await this.init();
      await this.client.query(
        'CREATE type::thing("trip", $id) CONTENT $trip',
        { id: trip.id, trip }
      );
    } catch (error) {
      console.error('Error setting trip:', error);
      throw error;
    }
  }

  async getTrip(tripId: string): Promise<DBTrip | undefined> {
    try {
      await this.init();
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
    try {
      await this.init();
      const result = await this.client.query<[DBTrip[]]>(
        'SELECT * FROM trip WHERE userId = $userId ORDER BY startTime DESC',
        { userId }
      );
      return result[0] || [];
    } catch (error) {
      console.error('Error getting user trips:', error);
      return [];
    }
  }

  async getFriendsSharedTrips(friendIds: string[]): Promise<DBTrip[]> {
    if (friendIds.length === 0) return [];
    try {
      await this.init();
      const result = await this.client.query<[DBTrip[]]>(
        'SELECT * FROM trip WHERE userId IN $friendIds AND sharedWithFriends = true ORDER BY startTime DESC',
        { friendIds }
      );
      return result[0] || [];
    } catch (error) {
      console.error('Error getting friends shared trips:', error);
      return [];
    }
  }
}

export const db = new RorkDB();
