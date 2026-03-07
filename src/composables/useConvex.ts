import { ref, onMounted, onUnmounted, unref, type Ref } from "vue";
import { getConvexClient } from "@/lib/convex";
import { useAuth } from "@clerk/vue";
import type { FunctionReference, FunctionArgs, FunctionReturnType } from "convex/server";

async function withAuth(getToken: ReturnType<typeof useAuth>["getToken"]) {
  const client = getConvexClient();
  try {
    const tokenFn = unref(getToken);
    if (typeof tokenFn !== "function") return client;
    const token = await tokenFn({ template: "convex" });
    if (token) client.setAuth(token);
  } catch {
    // Not signed in or token unavailable — proceed unauthenticated
  }
  return client;
}

export function useConvexQuery<Query extends FunctionReference<"query">>(
  query: Query,
  args: FunctionArgs<Query>
): {
  data: Ref<FunctionReturnType<Query> | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  refresh: () => Promise<void>;
} {
  const { getToken } = useAuth();
  const data = ref(null) as Ref<FunctionReturnType<Query> | null>;
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  let intervalId: ReturnType<typeof setInterval> | undefined;

  const fetchData = async () => {
    try {
      const client = await withAuth(getToken);
      const result = await client.query(query, args);
      data.value = result;
      error.value = null;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Query failed";
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    fetchData();
    intervalId = setInterval(fetchData, 30_000);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { data, isLoading, error, refresh: fetchData };
}

export function useConvexMutation<Mutation extends FunctionReference<"mutation">>(
  mutation: Mutation
): {
  mutate: (args: FunctionArgs<Mutation>) => Promise<FunctionReturnType<Mutation>>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
} {
  const { getToken } = useAuth();
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const mutate = async (args: FunctionArgs<Mutation>) => {
    isLoading.value = true;
    error.value = null;
    try {
      const client = await withAuth(getToken);
      const result = await client.mutation(mutation, args);
      return result;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Mutation failed";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  return { mutate, isLoading, error };
}
