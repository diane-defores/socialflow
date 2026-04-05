/**
 * Auth composable — wraps Convex Auth for use in Vue components.
 */
import {
  isAuthenticated,
  isAuthLoading,
  signIn,
  signOut,
} from "@/lib/convexAuth";
import { useConvexQuery } from "@/composables/useConvex";
import { api } from "../../convex/_generated/api";

export function useAuth() {
  return {
    isSignedIn: isAuthenticated,
    isLoaded: isAuthLoading, // inverted: true = still loading (kept for compat)
    signIn,
    signOut,
  };
}

/** Returns the current Convex user (reactive, real-time). */
export function useUser() {
  const { data: user, isLoading } = useConvexQuery(api.users.getMe, {});
  return { user, isLoading };
}
