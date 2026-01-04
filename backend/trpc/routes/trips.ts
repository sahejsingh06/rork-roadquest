import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db/store";

export const tripsRouter = createTRPCRouter({
  shareTrip: protectedProcedure
    .input(
      z.object({
        tripId: z.string(),
        trip: z.object({
          id: z.string(),
          startTime: z.number(),
          endTime: z.number(),
          distance: z.number(),
          maxSpeed: z.number(),
          avgSpeed: z.number(),
          duration: z.number(),
          carIcon: z.string().optional(),
          sharedWithFriends: z.boolean(),
          locations: z.array(z.object({
            latitude: z.number(),
            longitude: z.number(),
            speed: z.number().nullable(),
            timestamp: z.number(),
            accuracy: z.number().nullable(),
          })),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUser(ctx.userId);
      
      const dbTrip = {
        id: input.tripId,
        userId: ctx.userId,
        username: user?.username || 'Unknown',
        userPhotoUrl: user?.photoUrl,
        startTime: input.trip.startTime,
        endTime: input.trip.endTime,
        distance: input.trip.distance,
        maxSpeed: input.trip.maxSpeed,
        avgSpeed: input.trip.avgSpeed,
        duration: input.trip.duration,
        carIcon: input.trip.carIcon,
        sharedWithFriends: input.trip.sharedWithFriends,
        locations: input.trip.locations,
        isPaused: false,
        pausedDuration: 0,
      };

      await db.setTrip(dbTrip);
      return { success: true };
    }),

  getFriendsTrips: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await db.getUserFriendships(ctx.userId);
    const friendIds = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => f.userId === ctx.userId ? f.friendId : f.userId);

    const trips = await db.getFriendsSharedTrips(friendIds);
    return trips;
  }),

  getFriendsProgress: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await db.getUserFriendships(ctx.userId);
    const friendIds = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => f.userId === ctx.userId ? f.friendId : f.userId);

    const friends = await db.getUsersByIds(friendIds);
    
    const friendsProgress = await Promise.all(
      friends.map(async (friend) => {
        const trips = await db.getUserTrips(friend.id);
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
        
        const todayTrips = trips.filter((t) => t.startTime >= startOfDay);
        const weekTrips = trips.filter((t) => t.startTime >= startOfWeek);
        
        const todayDistance = todayTrips.reduce((sum: number, t) => sum + t.distance, 0);
        const weekDistance = weekTrips.reduce((sum: number, t) => sum + t.distance, 0);
        
        return {
          userId: friend.id,
          username: friend.username,
          photoUrl: friend.photoUrl,
          totalDistance: friend.totalDistance,
          totalTrips: friend.totalTrips,
          totalGPSPoints: friend.totalGPSPoints,
          todayDistance,
          weekDistance,
          todayTrips: todayTrips.length,
          weekTrips: weekTrips.length,
        };
      })
    );
    
    return friendsProgress;
  }),
});
