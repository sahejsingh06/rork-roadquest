import type { DBUser, DBFriendship, DBLeaderboardEntry } from './schema';

class InMemoryDB {
  private users: Map<string, DBUser> = new Map();
  private friendships: Map<string, DBFriendship> = new Map();
  private leaderboard: Map<string, DBLeaderboardEntry> = new Map();

  getUser(userId: string): DBUser | undefined {
    return this.users.get(userId);
  }

  setUser(user: DBUser): void {
    this.users.set(user.id, user);
  }

  getAllUsers(): DBUser[] {
    return Array.from(this.users.values());
  }

  getUsersByIds(userIds: string[]): DBUser[] {
    return userIds.map(id => this.users.get(id)).filter(Boolean) as DBUser[];
  }

  getFriendship(friendshipId: string): DBFriendship | undefined {
    return this.friendships.get(friendshipId);
  }

  setFriendship(friendship: DBFriendship): void {
    this.friendships.set(friendship.id, friendship);
  }

  getUserFriendships(userId: string): DBFriendship[] {
    return Array.from(this.friendships.values()).filter(
      f => f.userId === userId || f.friendId === userId
    );
  }

  removeFriendship(friendshipId: string): void {
    this.friendships.delete(friendshipId);
  }

  setLeaderboardEntry(entry: DBLeaderboardEntry): void {
    const key = `${entry.userId}_${entry.type}_${entry.period}`;
    this.leaderboard.set(key, entry);
  }

  getLeaderboardEntries(type: string, period: string): DBLeaderboardEntry[] {
    return Array.from(this.leaderboard.values())
      .filter(e => e.type === type && e.period === period)
      .sort((a, b) => b.value - a.value);
  }
}

export const db = new InMemoryDB();
