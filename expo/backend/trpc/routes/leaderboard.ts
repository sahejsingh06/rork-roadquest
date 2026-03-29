import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db/store";

export const leaderboardRouter = createTRPCRouter({
  get: protectedProcedure
    .input(
      z.object({
        type: z.enum(['distance', 'gpsPoints', 'trips', 'coverage']),
        period: z.enum(['weekly', 'monthly', 'season', 'allTime']),
        scope: z.enum(['global', 'friends']).default('global'),
      })
    )
    .query(async ({ ctx, input }) => {
      let entries = await db.getLeaderboardEntries(input.type, input.period);

      if (input.scope === 'friends') {
        const friendships = await db.getUserFriendships(ctx.userId);
        const friendIds = friendships
          .filter((f) => f.status === 'accepted')
          .map((f) => f.userId === ctx.userId ? f.friendId : f.userId);
        
        friendIds.push(ctx.userId);
        
        entries = entries.filter((e) => friendIds.includes(e.userId));
      }

      const rankedEntries = entries.map((entry, index) => ({
        rank: index + 1,
        userId: entry.userId,
        username: entry.username,
        photoUrl: entry.photoUrl,
        region: entry.region,
        value: entry.value,
        change: 0,
      }));

      const currentUserEntry = rankedEntries.find((e) => e.userId === ctx.userId);

      return {
        entries: rankedEntries.slice(0, 100),
        currentUserEntry: currentUserEntry || null,
        lastUpdated: Date.now(),
      };
    }),
});
