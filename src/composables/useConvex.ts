import { ref, onMounted, onUnmounted, type Ref } from "vue";
import { getConvexClient } from "@/lib/convex";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

/**
 * Subscribe to a Convex query with real-time updates via WebSocket.
 * Data is pushed instantly when it changes on the server — no polling.
 * Auth is handled globally by initConvexAuth() called in App.vue.
 */
export function useConvexQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>
): {
  data: Ref<FunctionReturnType<Query> | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: () => Promise<void>;
} {
  const data = ref(null) as Ref<FunctionReturnType<Query> | null>;
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  let unsubscribe: (() => void) | undefined;

  onMounted(() => {
    const client = getConvexClient();
    unsubscribe = client.onUpdate(query, args, (result) => {
      data.value = result;
      isLoading.value = false;
      error.value = null;
    });
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  // Manual refresh — with subscriptions data auto-updates,
  // but kept for API compatibility with existing callers.
  const refresh = async () => {
    try {
      const client = getConvexClient();
      const result = await client.query(query, args);
      data.value = result;
      error.value = null;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Query failed";
    }
  };

  return { data, isLoading, error, refresh };
}

export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): {
  mutate: (args: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const mutate = async (args: FunctionArgs<Mutation>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = getConvexClient();
      return await client.mutation(mutation, args);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Mutation failed";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return { mutate, isLoading, error };
}
