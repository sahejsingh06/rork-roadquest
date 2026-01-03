import { createTRPCRouter } from "./create-context";
import { userRouter } from "./routes/user";
import { friendsRouter } from "./routes/friends";
import { leaderboardRouter } from "./routes/leaderboard";

export const appRouter = createTRPCRouter({
  user: userRouter,
  friends: friendsRouter,
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
