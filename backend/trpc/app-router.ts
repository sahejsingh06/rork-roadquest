import { createTRPCRouter } from "./create-context";
import { userRouter } from "./routes/user";
import { friendsRouter } from "./routes/friends";
import { leaderboardRouter } from "./routes/leaderboard";
import { tripsRouter } from "./routes/trips";

export const appRouter = createTRPCRouter({
  user: userRouter,
  friends: friendsRouter,
  leaderboard: leaderboardRouter,
  trips: tripsRouter,
});

export type AppRouter = typeof appRouter;
