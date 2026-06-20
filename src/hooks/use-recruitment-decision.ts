import { useCallback, useEffect, useState } from "react";
import { recruitmentDecisionService, resetDecisionMock } from "@/lib/recruitment-decision/service";
import type {
  RecruitmentDecision,
  RecruitmentDecisionHistoryItem,
  SubmitRecruitmentDecisionInput,
} from "@/lib/recruitment-decision/types";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "决策数据加载失败，请重试。";
}

export function useRecruitmentDecision(applicationId: string) {
  const [decision, setDecision] = useState<RecruitmentDecision | null>(null);
  const [history, setHistory] = useState<RecruitmentDecisionHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextDecision, nextHistory] = await Promise.all([
        recruitmentDecisionService.get(applicationId),
        recruitmentDecisionService.getHistory(applicationId),
      ]);
      setDecision(nextDecision);
      setHistory(nextHistory);
    } catch (nextError) {
      setDecision(null);
      setHistory([]);
      setError(errorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void reload();
    return recruitmentDecisionService.subscribe(applicationId, () => void reload());
  }, [applicationId, reload]);

  const submit = useCallback(
    async (input: Omit<SubmitRecruitmentDecisionInput, "applicationId">) => {
      setSubmitting(true);
      setError(null);
      try {
        const next = await recruitmentDecisionService.submit({ ...input, applicationId });
        const nextHistory = await recruitmentDecisionService.getHistory(applicationId);
        setDecision(next);
        setHistory(nextHistory);
        return next;
      } catch (nextError) {
        setError(errorMessage(nextError));
        throw nextError;
      } finally {
        setSubmitting(false);
      }
    },
    [applicationId],
  );

  const reset = useCallback(() => {
    resetDecisionMock(applicationId);
    void reload();
  }, [applicationId, reload]);

  return { decision, history, loading, submitting, error, submit, retry: reload, reset };
}

export function useRecruitmentDecisionCollection(applicationIds: readonly string[]) {
  const idsKey = applicationIds.join("|");
  const [decisions, setDecisions] = useState<Record<string, RecruitmentDecision>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const values = await Promise.all(
        applicationIds.map((id) => recruitmentDecisionService.get(id)),
      );
      setDecisions(
        Object.fromEntries(values.map((decision) => [decision.applicationId, decision])),
      );
    } catch (nextError) {
      setError(errorMessage(nextError));
    } finally {
      setLoading(false);
    }
    // idsKey captures value changes while callers keep a stable constant array.
    void idsKey;
  }, [applicationIds, idsKey]);

  useEffect(() => {
    void reload();
    const unsubscribes = applicationIds.map((id) =>
      recruitmentDecisionService.subscribe(id, () => void reload()),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
  }, [applicationIds, reload]);

  return { decisions, loading, error, retry: reload };
}
