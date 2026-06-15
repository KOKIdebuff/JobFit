import { useEffect, useSyncExternalStore } from "react";
import { candidateDetailDemoStore } from "@/lib/candidate-detail-demo";
import { candidateDetailDemoService } from "@/lib/candidate-detail-demo";

export function useCandidateDetailDemo() {
  const state = useSyncExternalStore(
    candidateDetailDemoStore.subscribe,
    candidateDetailDemoStore.getSnapshot,
    candidateDetailDemoStore.getServerSnapshot,
  );

  useEffect(() => {
    void candidateDetailDemoService.getCandidateDetail();
  }, []);

  return state;
}
