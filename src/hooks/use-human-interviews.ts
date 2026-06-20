import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { HUMAN_INTERVIEW_EVENT } from "@/lib/human-interviews/fallback";
import { humanInterviewService } from "@/lib/human-interviews/service";
import type {
  AddAvailabilitySlotInput,
  CandidateHumanInterviews,
  ConfirmHumanInterviewInput,
  HumanInterviewInvitationView,
  HumanInterviewWorkspace,
  RescheduleHumanInterviewInput,
  SaveHumanInterviewReportInput,
  SaveInvitationSettingsInput,
  UpdateBookingStatusInput,
} from "@/lib/human-interviews/types";

function messageFromError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useHrHumanInterview(applicationId: string) {
  const [workspace, setWorkspace] = useState<HumanInterviewWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkspace(await humanInterviewService.getHrWorkspace(applicationId));
    } catch (nextError) {
      setError(messageFromError(nextError, "真人面试预约数据加载失败"));
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  const run = useCallback(
    async <T>(action: () => Promise<T>, success: string) => {
      setProcessing(true);
      setError(null);
      try {
        await action();
        toast.success(success);
        await reload();
      } catch (nextError) {
        const message = messageFromError(nextError, "操作失败，请重试");
        setError(message);
        toast.error(message);
      } finally {
        setProcessing(false);
      }
    },
    [reload],
  );

  useEffect(() => {
    void reload();
    const sync = () => void reload();
    window.addEventListener(HUMAN_INTERVIEW_EVENT, sync);
    return () => window.removeEventListener(HUMAN_INTERVIEW_EVENT, sync);
  }, [reload]);

  return {
    workspace,
    loading,
    processing,
    error,
    retry: reload,
    createInvitation: () =>
      run(() => humanInterviewService.createInvitation(applicationId), "预约链接已生成"),
    revokeInvitation: () =>
      run(() => humanInterviewService.revokeInvitation(applicationId), "预约链接已撤回"),
    saveSettings: (input: SaveInvitationSettingsInput) =>
      run(() => humanInterviewService.saveInvitationSettings(input), "预约设置已保存"),
    addSlot: (input: AddAvailabilitySlotInput) =>
      run(() => humanInterviewService.addAvailabilitySlot(input), "可预约时间段已添加"),
    removeSlot: (slotId: string) =>
      run(
        () => humanInterviewService.removeAvailabilitySlot(applicationId, slotId),
        "可预约时间段已移除",
      ),
    updateBookingStatus: (input: UpdateBookingStatusInput) =>
      run(() => humanInterviewService.updateBookingStatus(input), "预约状态已更新"),
    rescheduleBooking: (input: RescheduleHumanInterviewInput) =>
      run(() => humanInterviewService.rescheduleBooking(input), "预约时间已改期"),
    saveReport: (input: SaveHumanInterviewReportInput) =>
      run(() => humanInterviewService.saveReport(input), "真人面试报告已保存"),
    publishReport: (bookingId: string) =>
      run(() => humanInterviewService.publishReport(bookingId), "真人面试报告已发布"),
  };
}

export function useHumanInterviewInvitation(token: string) {
  const [view, setView] = useState<HumanInterviewInvitationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setView(await humanInterviewService.getInvitation(token));
    } catch (nextError) {
      setError(messageFromError(nextError, "预约邀请加载失败"));
    } finally {
      setLoading(false);
    }
  }, [token]);

  const confirm = useCallback(
    async (input: ConfirmHumanInterviewInput) => {
      setProcessing(true);
      setError(null);
      try {
        await humanInterviewService.confirmBooking(input);
        toast.success("面试时间已确认");
        await reload();
      } catch (nextError) {
        const message = messageFromError(nextError, "预约失败，请重新选择时间");
        setError(message);
        toast.error(message);
      } finally {
        setProcessing(false);
      }
    },
    [reload],
  );

  useEffect(() => {
    void reload();
    const sync = () => void reload();
    window.addEventListener(HUMAN_INTERVIEW_EVENT, sync);
    return () => window.removeEventListener(HUMAN_INTERVIEW_EVENT, sync);
  }, [reload]);

  return { view, loading, processing, error, retry: reload, confirm };
}

export function useCandidateHumanInterviews() {
  const [data, setData] = useState<CandidateHumanInterviews | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await humanInterviewService.getCandidateInterviews());
    } catch (nextError) {
      setError(messageFromError(nextError, "我的真人面试加载失败"));
    } finally {
      setLoading(false);
    }
  }, []);

  const run = useCallback(
    async <T>(action: () => Promise<T>, success: string) => {
      setProcessing(true);
      setError(null);
      try {
        await action();
        toast.success(success);
        await reload();
      } catch (nextError) {
        const message = messageFromError(nextError, "操作失败，请重试");
        setError(message);
        toast.error(message);
      } finally {
        setProcessing(false);
      }
    },
    [reload],
  );

  useEffect(() => {
    void reload();
    const sync = () => void reload();
    window.addEventListener(HUMAN_INTERVIEW_EVENT, sync);
    return () => window.removeEventListener(HUMAN_INTERVIEW_EVENT, sync);
  }, [reload]);

  return {
    data,
    loading,
    processing,
    error,
    retry: reload,
    cancel: (bookingId: string, reason?: string) =>
      run(
        () =>
          humanInterviewService.updateBookingStatus({
            bookingId,
            status: "cancelled",
            reason,
          }),
        "预约已取消",
      ),
    reschedule: (input: RescheduleHumanInterviewInput) =>
      run(() => humanInterviewService.rescheduleBooking(input), "预约时间已改期"),
  };
}
