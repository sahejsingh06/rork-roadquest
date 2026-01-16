import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db/store";

export const userRouter = createTRPCRouter({
  sync: protectedProcedure
    .input(
      z.object({
        username: z.string(),
        email: z.string(),
        photoUrl: z.string().optional(),
        region: z.string().optional(),
        totalDistance: z.number(),
        totalTrips: z.number(),
        totalGPSPoints: z.number(),
        roadCoveragePercent: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const existingUser = await db.getUser(ctx.userId);
      
      const user = {
        id: ctx.userId,
        username: input.username,
        email: input.email,
        photoUrl: input.photoUrl,
        region: input.region,
        totalDistance: input.totalDistance,
        totalTrips: input.totalTrips,
        totalGPSPoints: input.totalGPSPoints,
        roadCoveragePercent: input.roadCoveragePercent,
        createdAt: existingUser?.createdAt || Date.now(),
        lastUpdated: Date.now(),
      };

      await db.setUser(user);

      const periods = ['weekly', 'monthly', 'season', 'allTime'] as const;
      await Promise.all(
        periods.map(async (period) => {
          await db.setLeaderboardEntry({
            userId: ctx.userId,
            username: input.username,
            photoUrl: input.photoUrl,
            region: input.region,
            value: input.totalDistance,
            type: 'distance',
            period,
          });
          
          await db.setLeaderboardEntry({
            userId: ctx.userId,
            username: input.username,
            photoUrl: input.photoUrl,
            region: input.region,
            value: input.totalGPSPoints,
            type: 'gpsPoints',
            period,
          });
          
          await db.setLeaderboardEntry({
            userId: ctx.userId,
            username: input.username,
            photoUrl: input.photoUrl,
            region: input.region,
            value: input.totalTrips,
            type: 'trips',
            period,
          });
          
          await db.setLeaderboardEntry({
            userId: ctx.userId,
            username: input.username,
            photoUrl: input.photoUrl,
            region: input.region,
            value: input.roadCoveragePercent,
            type: 'coverage',
            period,
          });
        })
      );

      return { success: true, user };
    }),

  get: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.userId;
      const user = await db.getUser(userId);
      return user || null;
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ ctx, input }) => {
      const query = input.query.trim().toLowerCase();
      
      console.log('Searching for users with query:', query || '(empty - showing all)');
      const users = await db.getAllUsers();
      console.log('Total users in database:', users.length);
      
      let results;
      if (query.length === 0) {
        results = users.filter((u) => u.id !== ctx.userId).slice(0, 50);
      } else {
        results = users.filter(
          (u) => u.id !== ctx.userId && (
            u.username.toLowerCase().includes(query) || 
            u.email.toLowerCase().includes(query)
          )
        ).slice(0, 20);
      }
      
      console.log('Search results:', results.length);
      return results;
    }),

  deleteAccount: protectedProcedure
    .mutation(async ({ ctx }) => {
      console.log('Deleting account for user:', ctx.userId);
      await db.deleteUser(ctx.userId);
      return { success: true };
    }),
});
