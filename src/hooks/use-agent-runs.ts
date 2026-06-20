import { useEffect, useSyncExternalStore } from "react";
import { agentRunService, agentRunStore } from "@/lib/agent-runs/service";

export function useAgentRuns(runId?: string, options: { forbidden?: boolean } = {}) {
  const forbidden = options.forbidden;
  const state = useSyncExternalStore(
    agentRunStore.subscribe,
    agentRunStore.getSnapshot,
    agentRunStore.getServerSnapshot,
  );

  useEffect(() => {
    void agentRunService.load(runId, { forbidden });
  }, [runId, forbidden]);

  return state;
}
