import type { NavigationGuard } from "vue-router";
import { useAuth } from "@clerk/vue";

export const authGuard: NavigationGuard = async (to, _from, next) => {
  // Public routes — always allow
  if (to.path === "/login" || to.path === "/sign-up") {
    const { isSignedIn } = useAuth();
    // If already signed in, skip the login page
    if (isSignedIn.value) {
      return next("/twitter");
    }
    return next();
  }

  if (to.meta.requiresAuth) {
    const { isLoaded, isSignedIn } = useAuth();

    // Wait for Clerk to initialise (SSR or cold start)
    if (!isLoaded.value) {
      // Clerk not ready yet — allow through; the component will handle it
      return next();
    }

    if (!isSignedIn.value) {
      return next("/login");
    }
  }

  next();
};

export const networkAccessGuard: NavigationGuard = (_to, _from, next) => {
  next();
};
