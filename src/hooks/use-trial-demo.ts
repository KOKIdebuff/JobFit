import { useEffect, useSyncExternalStore } from "react";
import { trialDemoService, trialDemoStore } from "@/lib/trial-demo";

export function useTrialDemo(applicationId?: string) {
  const state = useSyncExternalStore(
    trialDemoStore.subscribe,
    trialDemoStore.getSnapshot,
    trialDemoStore.getServerSnapshot,
  );

  useEffect(() => {
    void trialDemoService.load(applicationId);
  }, [applicationId]);

  return state;
}
