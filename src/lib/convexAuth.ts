/**
 * Convex Auth client for Vue (ported from @convex-dev/auth/react internals).
 *
 * Manages JWT + refresh token in localStorage,
 * wires into ConvexClient.setAuth() for automatic token refresh,
 * and exposes signIn / signOut helpers.
 */
import { ConvexClient, ConvexHttpClient } from "convex/browser";
import { ref } from "vue";

const JWT_KEY = "__convexAuthJWT";
const REFRESH_TOKEN_KEY = "__convexAuthRefreshToken";

function storageKey(key: string, namespace: string) {
  return `${key}_${namespace.replace(/[^a-zA-Z0-9]/g, "")}`;
}

// --------------- Reactive state (module-level singletons) ---------------

export const isAuthenticated = ref(false);
export const isAuthLoading = ref(true);
export const isConvexConfigured = ref(false);

interface AuthTokens {
  token: string;
  refreshToken: string;
}

interface AuthResult {
  tokens?: AuthTokens;
}

type ConvexActionRef = Parameters<ConvexHttpClient["action"]>[0];

let _client: ConvexClient | null = null;
let _namespace = "";
let _currentToken: string | null = null;

const AUTH_SIGN_IN = "auth:signIn" as unknown as ConvexActionRef;
const AUTH_SIGN_OUT = "auth:signOut" as unknown as ConvexActionRef;

function getHttpClient() {
  if (!_namespace) {
    throw new Error(
      "Account sync is unavailable — this build was not configured with a Convex backend.",
    );
  }
  return new ConvexHttpClient(_namespace);
}

// --------------- Bootstrap ---------------

/**
 * Call once at app startup (before mounting Vue).
 * - Restores a previous session from localStorage
 * - Falls back to anonymous sign-in when no session exists
 */
export async function setupConvexAuth(client: ConvexClient, convexUrl: string) {
  _client = client;
  _namespace = convexUrl;
  isConvexConfigured.value = true;

  const jwtK = storageKey(JWT_KEY, _namespace);
  const refreshK = storageKey(REFRESH_TOKEN_KEY, _namespace);

  // Provide the token callback to ConvexClient
  client.setAuth(
    async ({ forceRefreshToken }) => {
      if (forceRefreshToken) {
        const refreshToken = localStorage.getItem(refreshK);
        if (!refreshToken) {
          clearTokens();
          return null;
        }
        try {
          const httpClient = new ConvexHttpClient(convexUrl);
          const result = (await httpClient.action(AUTH_SIGN_IN, {
            refreshToken,
          })) as AuthResult | null;
          if (result?.tokens) {
            persistTokens(result.tokens);
            return result.tokens.token;
          }
        } catch {
          // Refresh failed — session expired
        }
        clearTokens();
        return null;
      }
      return _currentToken;
    },
    (authenticated) => {
      isAuthenticated.value = authenticated;
    },
  );

  // Try to restore from storage
  const stored = localStorage.getItem(jwtK);
  if (stored) {
    _currentToken = stored;
    isAuthenticated.value = true;
    isAuthLoading.value = false;
    return;
  }

  // No existing session → auto sign-in anonymously
  try {
    await signIn("anonymous");
  } catch (e) {
    console.warn("[ConvexAuth] Anonymous sign-in failed (offline?)", e);
  }
  isAuthLoading.value = false;
}

// --------------- Actions ---------------

/**
 * Sign in with a provider.
 *
 * @example signIn("anonymous")
 * @example signIn("password", { email, password, flow: "signUp" })
 */
export async function signIn(
  provider: string,
  params?: Record<string, string>,
) {
  if (!_client) {
    throw new Error(
      "Account sync is unavailable — this build was not configured with a Convex backend.",
    );
  }

  const httpClient = getHttpClient();
  const result = (await httpClient.action(AUTH_SIGN_IN, {
    provider,
    params: params ?? {},
  })) as AuthResult | null;

  if (result?.tokens) {
    persistTokens(result.tokens);
  }

  return result;
}

export async function signOut() {
  if (!_client) return;
  try {
    const httpClient = getHttpClient();
    await httpClient.action(AUTH_SIGN_OUT, {});
  } catch (e) {
    console.warn("[ConvexAuth] Sign-out failed (already signed out?)", e);
  }
  clearTokens();
}

// --------------- Helpers ---------------

function persistTokens(tokens: { token: string; refreshToken: string }) {
  _currentToken = tokens.token;
  localStorage.setItem(storageKey(JWT_KEY, _namespace), tokens.token);
  localStorage.setItem(
    storageKey(REFRESH_TOKEN_KEY, _namespace),
    tokens.refreshToken,
  );
  isAuthenticated.value = true;
}

function clearTokens() {
  _currentToken = null;
  localStorage.removeItem(storageKey(JWT_KEY, _namespace));
  localStorage.removeItem(storageKey(REFRESH_TOKEN_KEY, _namespace));
  isAuthenticated.value = false;
}
