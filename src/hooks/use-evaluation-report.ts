import { useEffect, useSyncExternalStore } from "react";
import { evaluationReportService, evaluationReportStore } from "@/lib/evaluation-report/service";

export function useEvaluationReport(applicationId?: string) {
  const state = useSyncExternalStore(
    evaluationReportStore.subscribe,
    evaluationReportStore.getSnapshot,
    evaluationReportStore.getServerSnapshot,
  );

  useEffect(() => {
    void evaluationReportService.load(applicationId);
  }, [applicationId]);

  useEffect(() => {
    const sync = () => evaluationReportService.syncStale();
    window.addEventListener("hirelink:trial-demo-updated", sync);
    return () => window.removeEventListener("hirelink:trial-demo-updated", sync);
  }, []);

  return state;
}
