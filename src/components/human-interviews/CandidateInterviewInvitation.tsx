import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useHumanInterviewInvitation } from "@/hooks/use-human-interviews";
import type {
  HumanInterviewAvailabilitySlot,
  HumanInterviewContact,
} from "@/lib/human-interviews/types";
import {
  formatDate,
  formatDateTime,
  HumanInterviewStatePanel,
  HumanInterviewTypeBadge,
  invitationStatusLabel,
  StatusBadge,
  TimelineRow,
} from "./HumanInterviewCommon";

export function CandidateInterviewInvitation({
  controller,
}: {
  controller: ReturnType<typeof useHumanInterviewInvitation>;
}) {
  const { view, loading, processing, error, retry, confirm } = controller;
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<HumanInterviewAvailabilitySlot | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [contact, setContact] = useState<HumanInterviewContact>({
    name: "",
    email: "",
    phone: "",
    note: "",
  });

  const invitation = view?.invitation;
  const availableSlots = useMemo(
    () =>
      (view?.slots ?? [])
        .filter((slot) => slot.status === "available")
        .sort((a, b) => a.startAt.localeCompare(b.startAt)),
    [view?.slots],
  );
  const datesWithSlots = useMemo(
    () => new Set(availableSlots.map((slot) => new Date(slot.startAt).toDateString())),
    [availableSlots],
  );
  const visibleSlots = selectedDate
    ? availableSlots.filter(
        (slot) => new Date(slot.startAt).toDateString() === selectedDate.toDateString(),
      )
    : availableSlots.slice(0, 5);
  const existingBooking = view?.bookings.find(
    (booking) => booking.invitationId === invitation?.id && booking.status !== "cancelled",
  );
  const contactReady = Boolean(contact.name.trim() && contact.email.trim() && contact.phone.trim());
  const emailLooksValid = !contact.email || /\S+@\S+\.\S+/.test(contact.email);
  const canSubmit = Boolean(selectedSlot && contactReady && emailLooksValid);

  if (loading)
    return (
      <HumanInterviewStatePanel
        title="正在加载预约邀请"
        description="正在确认该预约链接、主面试官档期和会议或地点信息。"
        tone="loading"
      />
    );
  if (error || !view || !invitation)
    return (
      <HumanInterviewStatePanel
        title="预约邀请暂时不可用"
        description={error || "该预约邀请不存在或已经失效。"}
        tone="error"
        action={{ label: "重试", onClick: () => void retry() }}
      />
    );
  if (invitation.status === "revoked" || invitation.status === "expired")
    return (
      <HumanInterviewStatePanel
        title="预约链接已失效"
        description="请等待 HR 重新发送新的预约入口。当前页面不会改变已有申请和评估记录。"
        tone="error"
      />
    );
  if (existingBooking)
    return (
      <HumanInterviewStatePanel
        title="面试时间已确认"
        description={`${formatDateTime(existingBooking.startAt)}，${existingBooking.meetingLink || existingBooking.location || "会议或地点信息待补全"}`}
        tone="success"
        action={{
          label: "查看我的预约",
          onClick: () => {
            window.location.href = "/candidate/interviews";
          },
        }}
      />
    );

  const requestConfirm = () => {
    if (!selectedSlot) {
      toast.error("请先选择一个可预约时间");
      return;
    }
    if (!contactReady) {
      toast.error("请补齐姓名、邮箱和手机号");
      return;
    }
    if (!emailLooksValid) {
      toast.error("请填写有效邮箱地址");
      return;
    }
    setConfirmOpen(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{invitation.company}</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              {invitation.jobTitle} 真人面试预约
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              请选择主面试官开放的可预约时间段，并确认本次联系信息。确认后系统会锁定该时间段。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <HumanInterviewTypeBadge type={invitation.interviewType} />
            <StatusBadge tone="positive">{invitationStatusLabel(invitation.status)}</StatusBadge>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-border bg-background p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              modifiers={{ hasSlot: (day) => datesWithSlots.has(day.toDateString()) }}
              modifiersClassNames={{ hasSlot: "bg-primary/10 text-primary font-semibold" }}
              className="mx-auto"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">
                  {selectedDate
                    ? `${formatDate(selectedDate.toISOString())} 可选时间`
                    : "最近可用时间"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  默认 60 分钟面试，确认后不可被其他人选择。
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {visibleSlots.map((slot) => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedSlot?.id === slot.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary/40"}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="font-medium">
                      {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt).slice(-5)}
                    </span>
                    {selectedSlot?.id === slot.id && (
                      <StatusBadge tone="positive">
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> 已选择
                      </StatusBadge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{slot.timezone}</p>
                </button>
              ))}
              {!visibleSlots.length && (
                <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  当前日期暂无可预约时间，请切换日期或等待 HR 补充档期。
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <aside className="space-y-5">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">面试信息</h2>
          <div className="mt-3">
            <TimelineRow
              label="主面试官"
              value={`${invitation.primaryInterviewer.name} · ${invitation.primaryInterviewer.title}`}
            />
            <TimelineRow label="链接有效期" value={formatDateTime(invitation.expiresAt)} />
            <TimelineRow
              label="面试方式"
              value={
                invitation.interviewType === "online"
                  ? invitation.meetingLink
                  : invitation.locationTemplate
              }
            />
          </div>
        </section>
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-semibold">确认联系方式</h2>
          <div className="mt-4 space-y-3">
            <ContactInput
              label="姓名"
              value={contact.name}
              onChange={(name) => setContact({ ...contact, name })}
            />
            <ContactInput
              label="邮箱"
              value={contact.email}
              onChange={(email) => setContact({ ...contact, email })}
              error={!emailLooksValid ? "邮箱格式不正确" : undefined}
            />
            <ContactInput
              label="手机号"
              value={contact.phone}
              onChange={(phone) => setContact({ ...contact, phone })}
            />
            <div className="space-y-2">
              <Label>补充说明</Label>
              <Textarea
                value={contact.note}
                onChange={(event) => setContact({ ...contact, note: event.target.value })}
              />
            </div>
          </div>
          <Button
            className="mt-5 w-full rounded-full"
            disabled={processing}
            onClick={requestConfirm}
          >
            {processing ? <Loader2 className="animate-spin" /> : <CalendarCheck2 />} 确认预约{" "}
            <ArrowRight />
          </Button>
          {!canSubmit && (
            <p className="mt-3 text-xs text-muted-foreground">
              需要选择时间并补齐姓名、邮箱、手机号后才能确认。
            </p>
          )}
        </section>
      </aside>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>确认本次真人面试时间？</DialogTitle>
            <DialogDescription>确认后该时间段会立即锁定，并进入我的预约列表。</DialogDescription>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-3 rounded-2xl bg-secondary/45 p-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-muted-foreground" />
                {formatDateTime(selectedSlot.startAt)} -{" "}
                {formatDateTime(selectedSlot.endAt).slice(-5)}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {contact.email}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {contact.phone}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              再看看
            </Button>
            <Button
              disabled={!selectedSlot || !canSubmit || processing}
              onClick={() => {
                if (!selectedSlot) return;
                void confirm({ token: view.token, slotId: selectedSlot.id, contact });
                setConfirmOpen(false);
              }}
            >
              {processing ? <Loader2 className="animate-spin" /> : null}确认锁定时间
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactInput({
  label,
  value,
  error,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
