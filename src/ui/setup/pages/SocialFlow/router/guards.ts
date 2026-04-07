import type { NavigationGuard } from "vue-router";
import { isAuthenticated, isAuthLoading } from "@/lib/convexAuth";

export const authGuard: NavigationGuard = async (to, _from, next) => {
  // Public routes — always allow
  if (to.path === "/login" || to.path === "/sign-up") {
    // If already signed in, skip the login page
    if (isAuthenticated.value) {
      return next("/twitter");
    }
    return next();
  }

  if (to.meta.requiresAuth) {
    // Still loading auth state — allow through, component will handle it
    if (isAuthLoading.value) {
      return next();
    }

    if (!isAuthenticated.value) {
      return next("/login");
    }
  }

  next();
};
