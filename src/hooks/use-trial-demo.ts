import { useSyncExternalStore } from "react";
import { trialDemoStore } from "@/lib/trial-demo";

export function useTrialDemo() {
  return useSyncExternalStore(
    trialDemoStore.subscribe,
    trialDemoStore.getSnapshot,
    trialDemoStore.getServerSnapshot,
  );
}
