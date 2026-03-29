import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../create-context";
import { db } from "@/backend/db/store";
import { TRPCError } from "@trpc/server";

export const friendsRouter = createTRPCRouter({
  sendRequest: protectedProcedure
    .input(z.object({ friendId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.userId === input.friendId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot add yourself as a friend",
        });
      }

      const existingFriendships = await db.getUserFriendships(ctx.userId);
      const alreadyExists = existingFriendships.find(
        (f) => (f.userId === ctx.userId && f.friendId === input.friendId) ||
             (f.userId === input.friendId && f.friendId === ctx.userId)
      );

      if (alreadyExists) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Friend request already exists",
        });
      }

      const friendship = {
        id: `${ctx.userId}_${input.friendId}_${Date.now()}`,
        userId: ctx.userId,
        friendId: input.friendId,
        status: 'pending' as const,
        createdAt: Date.now(),
      };

      await db.setFriendship(friendship);
      return { success: true, friendship };
    }),

  acceptRequest: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await db.getFriendship(input.friendshipId);
      
      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      if (friendship.friendId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only accept requests sent to you",
        });
      }

      await db.setFriendship({ ...friendship, status: 'accepted' });
      return { success: true };
    }),

  rejectRequest: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await db.getFriendship(input.friendshipId);
      
      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friend request not found",
        });
      }

      if (friendship.friendId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only reject requests sent to you",
        });
      }

      await db.removeFriendship(input.friendshipId);
      return { success: true };
    }),

  removeFriend: protectedProcedure
    .input(z.object({ friendshipId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const friendship = await db.getFriendship(input.friendshipId);
      
      if (!friendship) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Friendship not found",
        });
      }

      if (friendship.userId !== ctx.userId && friendship.friendId !== ctx.userId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only remove your own friendships",
        });
      }

      await db.removeFriendship(input.friendshipId);
      return { success: true };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const friendships = await db.getUserFriendships(ctx.userId);
    
    const friendIds = friendships
      .filter((f) => f.status === 'accepted')
      .map((f) => f.userId === ctx.userId ? f.friendId : f.userId);

    const friends = await db.getUsersByIds(friendIds);

    const pending = friendships.filter((f) => f.status === 'pending');
    const sentRequests = pending.filter((f) => f.userId === ctx.userId);
    const receivedRequests = pending.filter((f) => f.friendId === ctx.userId);

    const receivedRequestUsers = await db.getUsersByIds(receivedRequests.map((r) => r.userId));

    const sentRequestsWithUsers = await Promise.all(
      sentRequests.map(async (r) => {
        const friend = await db.getUser(r.friendId);
        return {
          friendshipId: r.id,
          userId: r.friendId,
          username: friend?.username || 'Unknown',
          photoUrl: friend?.photoUrl,
          createdAt: r.createdAt,
        };
      })
    );

    return {
      friends: friends.map((f) => ({
        userId: f.id,
        username: f.username,
        photoUrl: f.photoUrl,
        region: f.region,
        friendshipId: friendships.find(
          (fs) => (fs.userId === ctx.userId && fs.friendId === f.id) ||
                (fs.userId === f.id && fs.friendId === ctx.userId)
        )?.id || '',
      })),
      sentRequests: sentRequestsWithUsers,
      receivedRequests: receivedRequests.map((r, idx) => ({
        friendshipId: r.id,
        userId: r.userId,
        username: receivedRequestUsers[idx]?.username || 'Unknown',
        photoUrl: receivedRequestUsers[idx]?.photoUrl,
        createdAt: r.createdAt,
      })),
    };
  }),
});
