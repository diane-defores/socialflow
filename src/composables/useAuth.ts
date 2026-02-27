// Thin wrapper around @clerk/vue — centralises auth composable imports
// so the rest of the app imports from one place.
export { useAuth, useUser } from "@clerk/vue";
