import { CalendarClock, FileText, Loader2, RotateCcw, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useCandidateHumanInterviews } from "@/hooks/use-human-interviews";
import type {
  HumanInterviewAvailabilitySlot,
  HumanInterviewBooking,
} from "@/lib/human-interviews/types";
import {
  bookingStatusLabel,
  bookingTone,
  formatDateTime,
  HumanInterviewStatePanel,
  HumanInterviewTypeBadge,
  reportStatusLabel,
  StatusBadge,
  TimelineRow,
} from "./HumanInterviewCommon";

export function CandidateHumanInterviews({
  controller,
}: {
  controller: ReturnType<typeof useCandidateHumanInterviews>;
}) {
  const { data, loading, processing, error, retry, cancel, reschedule } = controller;
  const [cancelBooking, setCancelBooking] = useState<HumanInterviewBooking | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<HumanInterviewBooking | null>(null);
  const [reason, setReason] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<HumanInterviewAvailabilitySlot | null>(null);
  const availableSlots = useMemo(
    () => (data?.slots ?? []).filter((slot) => slot.status === "available"),
    [data?.slots],
  );

  if (loading)
    return (
      <HumanInterviewStatePanel
        title="正在加载我的预约"
        description="正在读取当前账号的真人面试安排、改期状态和已发布报告。"
        tone="loading"
      />
    );
  if (error || !data)
    return (
      <HumanInterviewStatePanel
        title="我的预约暂时不可用"
        description={error || "预约列表加载失败。"}
        tone="error"
        action={{ label: "重试", onClick: () => void retry() }}
      />
    );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <p className="text-sm font-medium text-muted-foreground">候选人工作台</p>
        <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">我的真人面试</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          查看已确认的企业真人面试安排。若需要调整时间，可在仍有可用时间段时发起改期。
        </p>
      </section>
      {!data.bookings.length && (
        <section className="rounded-3xl border border-dashed border-border p-10 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-3 font-semibold">暂无真人面试预约</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            收到 HR 发送的预约入口后，可选择可用时间并在这里查看安排。
          </p>
        </section>
      )}
      <div className="grid gap-5">
        {data.bookings.map((booking) => {
          const report = data.reports.find(
            (item) => item.bookingId === booking.id && item.status === "published",
          );
          const terminal = [
            "cancelled",
            "completed",
            "candidate_no_show",
            "interviewer_no_show",
            "expired",
          ].includes(booking.status);
          return (
            <article
              key={booking.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{formatDateTime(booking.startAt)}</h2>
                    <StatusBadge tone={bookingTone(booking.status)}>
                      {bookingStatusLabel(booking.status)}
                    </StatusBadge>
                    <HumanInterviewTypeBadge type={booking.interviewType} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {booking.primaryInterviewer.name} · {booking.primaryInterviewer.title}
                  </p>
                  {booking.cancellationReason && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      备注：{booking.cancellationReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={processing || terminal || !availableSlots.length}
                    onClick={() => {
                      setSelectedSlot(null);
                      setRescheduleBooking(booking);
                    }}
                  >
                    <RotateCcw /> 改期
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    disabled={processing || terminal}
                    onClick={() => setCancelBooking(booking)}
                  >
                    <XCircle /> 取消
                  </Button>
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <section className="rounded-2xl bg-secondary/40 p-4">
                  <TimelineRow
                    label="会议或地点"
                    value={booking.meetingLink || booking.location || "待补全"}
                  />
                  <TimelineRow
                    label="联系方式"
                    value={`${booking.contact.name} · ${booking.contact.email} · ${booking.contact.phone}`}
                  />
                  <TimelineRow label="更新时间" value={formatDateTime(booking.updatedAt)} />
                </section>
                <section className="rounded-2xl bg-secondary/40 p-4">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    真人面试报告
                    <StatusBadge tone={report ? "positive" : "neutral"}>
                      {reportStatusLabel(report?.status)}
                    </StatusBadge>
                  </div>
                  {report ? (
                    <div className="mt-3 space-y-3 text-sm text-muted-foreground">
                      <p>{report.candidateSummary}</p>
                      <div className="rounded-xl bg-background p-3">
                        <div className="font-medium text-foreground">面试结论</div>
                        <p className="mt-1">{report.conclusion}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">
                      HR 发布后，这里会显示求职者可见摘要版报告。
                    </p>
                  )}
                </section>
              </div>
            </article>
          );
        })}
      </div>
      <Dialog
        open={Boolean(cancelBooking)}
        onOpenChange={(open) => !open && setCancelBooking(null)}
      >
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>取消这场真人面试？</DialogTitle>
            <DialogDescription>
              取消后该预约进入终态，请确认已经与 HR 或面试官完成必要沟通。
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="可填写取消原因"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelBooking(null)}>
              保留预约
            </Button>
            <Button
              variant="destructive"
              disabled={!cancelBooking || processing}
              onClick={() => {
                if (!cancelBooking) return;
                void cancel(cancelBooking.id, reason);
                setCancelBooking(null);
                setReason("");
              }}
            >
              {processing ? <Loader2 className="animate-spin" /> : null}确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(rescheduleBooking)}
        onOpenChange={(open) => {
          if (!open) {
            setRescheduleBooking(null);
            setSelectedSlot(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>选择新的面试时间</DialogTitle>
            <DialogDescription>改期后原时间段释放，新时间段会被锁定。</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {availableSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`w-full rounded-2xl border p-4 text-left text-sm transition-colors ${selectedSlot?.id === slot.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary/40"}`}
              >
                {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt).slice(-5)}
                <span className="mt-1 block text-xs text-muted-foreground">{slot.timezone}</span>
              </button>
            ))}
            {!availableSlots.length && (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                暂无可改期时间段。
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRescheduleBooking(null);
                setSelectedSlot(null);
              }}
            >
              取消
            </Button>
            <Button
              disabled={!rescheduleBooking || !selectedSlot || processing}
              onClick={() => {
                if (!rescheduleBooking || !selectedSlot) return;
                void reschedule({ bookingId: rescheduleBooking.id, slotId: selectedSlot.id });
                setRescheduleBooking(null);
                setSelectedSlot(null);
              }}
            >
              {processing ? <Loader2 className="animate-spin" /> : null}确认改期
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
