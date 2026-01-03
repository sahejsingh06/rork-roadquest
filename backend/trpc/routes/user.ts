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
    .mutation(({ ctx, input }) => {
      const existingUser = db.getUser(ctx.userId);
      
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

      db.setUser(user);

      const periods = ['weekly', 'monthly', 'season', 'allTime'] as const;
      periods.forEach(period => {
        db.setLeaderboardEntry({
          userId: ctx.userId,
          username: input.username,
          photoUrl: input.photoUrl,
          region: input.region,
          value: input.totalDistance,
          type: 'distance',
          period,
        });
        
        db.setLeaderboardEntry({
          userId: ctx.userId,
          username: input.username,
          photoUrl: input.photoUrl,
          region: input.region,
          value: input.totalGPSPoints,
          type: 'gpsPoints',
          period,
        });
        
        db.setLeaderboardEntry({
          userId: ctx.userId,
          username: input.username,
          photoUrl: input.photoUrl,
          region: input.region,
          value: input.totalTrips,
          type: 'trips',
          period,
        });
        
        db.setLeaderboardEntry({
          userId: ctx.userId,
          username: input.username,
          photoUrl: input.photoUrl,
          region: input.region,
          value: input.roadCoveragePercent,
          type: 'coverage',
          period,
        });
      });

      return { success: true, user };
    }),

  get: protectedProcedure
    .input(z.object({ userId: z.string().optional() }))
    .query(({ ctx, input }) => {
      const userId = input.userId || ctx.userId;
      const user = db.getUser(userId);
      return user || null;
    }),

  search: protectedProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input }) => {
      const query = input.query.toLowerCase();
      const users = db.getAllUsers();
      return users.filter(
        u => u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      ).slice(0, 20);
    }),
});
