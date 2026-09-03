import {
  AlertTriangle,
  Bell,
  CalendarPlus,
  CheckCircle2,
  ClipboardCopy,
  Link2,
  Loader2,
  RotateCcw,
  Save,
  Send,
  UserCheck,
  UserX,
  Wrench,
  XCircle,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useHrHumanInterview } from "@/hooks/use-human-interviews";
import { humanInterviewService } from "@/lib/human-interviews/service";
import type {
  HumanInterviewAvailabilitySlot,
  HumanInterviewBooking,
  HumanInterviewBookingStatus,
  HumanInterviewReport,
  HumanInterviewType,
} from "@/lib/human-interviews/types";
import {
  bookingStatusLabel,
  bookingTone,
  formatDateTime,
  HumanInterviewStatePanel,
  HumanInterviewTypeBadge,
  invitationStatusLabel,
  reportStatusLabel,
  StatusBadge,
  TimelineRow,
  typeLabel,
} from "./HumanInterviewCommon";

type Controller = ReturnType<typeof useHrHumanInterview>;
type Workspace = NonNullable<Controller["workspace"]>;
type ConfirmAction = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
};

export function HrHumanInterviewWorkspace({ controller }: { controller: Controller }) {
  const {
    workspace,
    loading,
    processing,
    error,
    retry,
    createInvitation,
    sendInvitation,
    resendInvitation,
    revokeInvitation,
    saveSettings,
    addSlot,
    removeSlot,
    updateBookingStatus,
    requestPendingConfirmation,
    completePendingConfirmation,
    expirePendingConfirmations,
    createBookingReminders,
    rescheduleBooking,
    saveReport,
    publishReport,
  } = controller;
  const [slotOpen, setSlotOpen] = useState(false);
  const [reportBooking, setReportBooking] = useState<HumanInterviewBooking | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<HumanInterviewBooking | null>(null);
  const [pendingTarget, setPendingTarget] = useState<HumanInterviewBooking | null>(null);
  const [completionTarget, setCompletionTarget] = useState<HumanInterviewBooking | null>(null);
  const [maintenanceMessage, setMaintenanceMessage] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  if (loading) {
    return (
      <HumanInterviewStatePanel
        title="正在加载真人面试预约"
        description="正在读取邀约草稿、候选人、主面试官档期、履约状态和报告审核信息。"
        tone="loading"
      />
    );
  }
  if (!workspace) {
    return (
      <HumanInterviewStatePanel
        title="真人面试预约暂时不可用"
        description="当前申请的预约数据没有成功加载。可以重试，已完成的上游评估不会被改动。"
        tone="error"
        action={{ label: "重试", onClick: () => void retry() }}
      />
    );
  }

  const invitation = workspace.invitation;
  const availableSlots = workspace.slots.filter((slot) => slot.status === "available");
  const activeBooking = workspace.bookings[0];
  const activeReport = activeBooking
    ? workspace.reports.find((report) => report.bookingId === activeBooking.id)
    : undefined;
  const missingToSend = humanInterviewService.sendReadiness(workspace);
  const counts = {
    available: availableSlots.length,
    confirmed: workspace.bookings.filter((b) => b.status === "confirmed").length,
    completed: workspace.bookings.filter((b) => b.status === "completed").length,
    exceptions: workspace.bookings.filter((b) =>
      [
        "pending_confirmation",
        "expired",
        "candidate_no_show",
        "interviewer_no_show",
        "cancelled",
      ].includes(b.status),
    ).length,
  };
  const ask = (action: ConfirmAction) => setConfirmAction(action);

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">真人面试预约</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">
              {invitation?.candidate.name ?? "候选人"} · {invitation?.jobTitle ?? "当前申请"}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              在这里保存邀约草稿、维护面试官与档期，并在条件齐备后向候选人发送站内预约邀约。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {invitation && <HumanInterviewTypeBadge type={invitation.interviewType} />}
            <StatusBadge
              tone={
                invitation?.status === "active" || invitation?.status === "booked"
                  ? "positive"
                  : invitation?.status === "revoked"
                    ? "danger"
                    : "neutral"
              }
            >
              {invitation ? invitationStatusLabel(invitation.status) : "待创建"}
            </StatusBadge>
            {invitation?.needsResend && <StatusBadge tone="warning">有更新待通知</StatusBadge>}
          </div>
        </div>
        {error && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800">
            <span>{error}</span>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => void retry()}
            >
              重试
            </Button>
          </div>
        )}
        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <Metric label="可预约时间段" value={`${counts.available} 个`} />
          <Metric label="已确认预约" value={`${counts.confirmed} 场`} />
          <Metric label="已完成面试" value={`${counts.completed} 场`} />
          <Metric label="异常/取消" value={`${counts.exceptions} 场`} />
        </div>
      </section>

      <Tabs
        defaultValue="invitation"
        className="rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 lg:grid-cols-4">
          <TabsTrigger value="invitation">邀约与设置</TabsTrigger>
          <TabsTrigger value="slots">档期管理</TabsTrigger>
          <TabsTrigger value="booking">预约履约</TabsTrigger>
          <TabsTrigger value="report">真人报告</TabsTrigger>
        </TabsList>
        <TabsContent value="invitation" className="mt-6">
          <InvitationSettings
            workspace={workspace}
            processing={processing}
            missingToSend={missingToSend}
            onCreate={() => void createInvitation()}
            onSend={() => void sendInvitation()}
            onResend={() => void resendInvitation()}
            onRevoke={() =>
              ask({
                title: "撤回当前预约邀约？",
                description: "撤回后候选人无法继续通过该入口选时。已确认预约不会被删除。",
                confirmLabel: "确认撤回",
                destructive: true,
                onConfirm: () => void revokeInvitation(),
              })
            }
            onSave={(input) => void saveSettings(input)}
          />
        </TabsContent>
        <TabsContent value="slots" className="mt-6">
          <SlotPanel
            workspace={workspace}
            processing={processing}
            onAdd={() => setSlotOpen(true)}
            onRemove={(slotId) =>
              ask({
                title: "移除这个可预约时间段？",
                description: "只有尚未被候选人占用的时间段可以移除。",
                confirmLabel: "移除时间段",
                onConfirm: () => void removeSlot(slotId),
              })
            }
          />
        </TabsContent>
        <TabsContent value="booking" className="mt-6">
          <BookingPanel
            bookings={workspace.bookings}
            processing={processing}
            maintenanceMessage={maintenanceMessage}
            onReport={setReportBooking}
            onReschedule={setRescheduleTarget}
            onRequestPending={setPendingTarget}
            onCompletePending={setCompletionTarget}
            onExpirePending={async () => {
              const result = await expirePendingConfirmations();
              if (result) {
                setMaintenanceMessage(`释放超时待确认：处理 ${result.processedCount} 条`);
              }
            }}
            onCreateReminders={async () => {
              const result = await createBookingReminders();
              if (result) {
                setMaintenanceMessage(`生成 24 小时提醒：处理 ${result.processedCount} 条`);
              }
            }}
            onStatus={(bookingId, status) =>
              ask({
                title: `确认标记为“${bookingStatusLabel(status)}”？`,
                description: "该操作会更新预约履约状态，并可能影响后续真人报告填写与发布。",
                confirmLabel: bookingStatusLabel(status),
                destructive: ["cancelled", "candidate_no_show", "interviewer_no_show"].includes(
                  status,
                ),
                onConfirm: () => void updateBookingStatus({ bookingId, status }),
              })
            }
          />
        </TabsContent>
        <TabsContent value="report" className="mt-6">
          <ReportReview
            booking={activeBooking}
            report={activeReport}
            processing={processing}
            onEdit={setReportBooking}
            onPublish={(bookingId) =>
              ask({
                title: "发布求职者可见摘要版报告？",
                description: "发布后候选人可以在我的预约中查看摘要、结论和面试反馈。",
                confirmLabel: "审核发布",
                onConfirm: () => void publishReport(bookingId),
              })
            }
          />
        </TabsContent>
      </Tabs>

      {workspace.invitation && (
        <AddSlotDialog
          open={slotOpen}
          onOpenChange={setSlotOpen}
          interviewerId={workspace.invitation.primaryInterviewer.id}
          applicationId={workspace.applicationId}
          processing={processing}
          onAdd={(input) => void addSlot(input)}
        />
      )}
      {reportBooking && (
        <ReportDialog
          booking={reportBooking}
          report={workspace.reports.find((report) => report.bookingId === reportBooking.id)}
          open={Boolean(reportBooking)}
          onOpenChange={(open) => !open && setReportBooking(null)}
          processing={processing}
          onSave={(input) => void saveReport(input)}
        />
      )}
      {pendingTarget && (
        <PendingConfirmationDialog
          booking={pendingTarget}
          open={Boolean(pendingTarget)}
          processing={processing}
          onOpenChange={(open) => !open && setPendingTarget(null)}
          onConfirm={(reason) => {
            void requestPendingConfirmation({ bookingId: pendingTarget.id, reason });
            setPendingTarget(null);
          }}
        />
      )}
      {completionTarget && (
        <CompletePendingConfirmationDialog
          booking={completionTarget}
          open={Boolean(completionTarget)}
          processing={processing}
          onOpenChange={(open) => !open && setCompletionTarget(null)}
          onConfirm={(input) => {
            void completePendingConfirmation({ bookingId: completionTarget.id, ...input });
            setCompletionTarget(null);
          }}
        />
      )}
      {rescheduleTarget && (
        <RescheduleDialog
          booking={rescheduleTarget}
          slots={availableSlots}
          open={Boolean(rescheduleTarget)}
          processing={processing}
          onOpenChange={(open) => !open && setRescheduleTarget(null)}
          onConfirm={(slotId) => {
            void rescheduleBooking({ bookingId: rescheduleTarget.id, slotId });
            setRescheduleTarget(null);
          }}
        />
      )}
      <ConfirmDialog
        action={confirmAction}
        processing={processing}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}

function InvitationSettings({
  workspace,
  processing,
  missingToSend,
  onCreate,
  onSend,
  onResend,
  onRevoke,
  onSave,
}: {
  workspace: Workspace;
  processing: boolean;
  missingToSend: string[];
  onCreate: () => void;
  onSend: () => void;
  onResend: () => void;
  onRevoke: () => void;
  onSave: (input: {
    applicationId: string;
    primaryInterviewerId: string;
    interviewType: HumanInterviewType;
    meetingLink: string;
    locationTemplate: string;
    arrivalInstructions?: string;
  }) => void;
}) {
  const invitation = workspace.invitation;
  const [primaryInterviewerId, setPrimaryInterviewerId] = useState(
    invitation?.primaryInterviewer.id ?? workspace.interviewers[0]?.id ?? "",
  );
  const [interviewType, setInterviewType] = useState<HumanInterviewType>(
    invitation?.interviewType ?? "online",
  );
  const [meetingLink, setMeetingLink] = useState(invitation?.meetingLink ?? "");
  const [locationTemplate, setLocationTemplate] = useState(invitation?.locationTemplate ?? "");
  const [arrivalInstructions, setArrivalInstructions] = useState(
    invitation?.arrivalInstructions ?? "",
  );
  const link = invitation ? humanInterviewService.invitationLink(invitation.token) : "";
  const missingVenue = interviewType === "online" ? !meetingLink.trim() : !locationTemplate.trim();
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("候选人链接已复制");
    } catch {
      toast.error("复制失败，请手动复制链接");
    }
  };
  const savePayload = {
    applicationId: workspace.applicationId,
    primaryInterviewerId,
    interviewType,
    meetingLink,
    locationTemplate,
    arrivalInstructions,
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="rounded-2xl border border-border bg-background p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="主面试官">
            <Select value={primaryInterviewerId} onValueChange={setPrimaryInterviewerId}>
              <SelectTrigger className="rounded-2xl">
                <SelectValue placeholder="选择主面试官" />
              </SelectTrigger>
              <SelectContent>
                {workspace.interviewers.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.name} · {i.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="面试类型">
            <Select
              value={interviewType}
              onValueChange={(value) => setInterviewType(value as HumanInterviewType)}
            >
              <SelectTrigger className="rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">线上面试</SelectItem>
                <SelectItem value="offline">线下面试</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="会议链接">
            <Input
              className="rounded-2xl"
              placeholder="https://meet.example.com/..."
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
            />
          </Field>
          <Field label="线下面试地点">
            <Input
              className="rounded-2xl"
              placeholder="上海市浦东新区张江路 88 号..."
              value={locationTemplate}
              onChange={(event) => setLocationTemplate(event.target.value)}
            />
          </Field>
          <div className="space-y-2 md:col-span-2">
            <Label>到场说明</Label>
            <Textarea
              className="min-h-24 rounded-2xl"
              value={arrivalInstructions}
              onChange={(event) => setArrivalInstructions(event.target.value)}
            />
          </div>
        </div>
        {missingVenue && (
          <p className="mt-3 text-xs text-amber-700">
            请补齐{interviewType === "online" ? "会议链接" : "线下面试地点"}
            ，候选人预约确认后会看到该信息。
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            className="rounded-full"
            disabled={processing || !primaryInterviewerId || missingVenue}
            onClick={() => onSave(savePayload)}
          >
            {processing ? <Loader2 className="animate-spin" /> : <Save />} 保存草稿
          </Button>
          {!invitation && (
            <Button
              variant="outline"
              className="rounded-full"
              disabled={processing}
              onClick={onCreate}
            >
              <Link2 /> 创建邀约草稿
            </Button>
          )}
          {invitation && invitation.status !== "active" && invitation.status !== "booked" && (
            <Button
              className="rounded-full"
              disabled={processing || Boolean(missingToSend.length)}
              onClick={onSend}
            >
              <Send /> 发送预约邀约
            </Button>
          )}
          {invitation && (invitation.status === "active" || invitation.status === "booked") && (
            <Button
              variant={invitation.needsResend ? "default" : "outline"}
              className="rounded-full"
              disabled={processing || Boolean(missingToSend.length)}
              onClick={onResend}
            >
              <Send /> {invitation.needsResend ? "重发更新通知" : "重发邀约"}
            </Button>
          )}
          {invitation && invitation.status !== "revoked" && (
            <Button
              variant="outline"
              className="rounded-full"
              disabled={processing}
              onClick={onRevoke}
            >
              <XCircle /> 撤回邀约
            </Button>
          )}
        </div>
      </section>
      <aside className="rounded-2xl border border-border bg-background p-5">
        <h2 className="font-semibold">邀约状态</h2>
        {invitation ? (
          <div className="mt-4 space-y-1">
            <TimelineRow label="状态" value={invitationStatusLabel(invitation.status)} />
            <TimelineRow label="有效期至" value={formatDateTime(invitation.expiresAt)} />
            <TimelineRow
              label="候选人"
              value={`${invitation.candidate.name} · ${invitation.candidate.email}`}
            />
            <TimelineRow
              label="最近发送"
              value={invitation.lastSentAt ? formatDateTime(invitation.lastSentAt) : "尚未发送"}
            />
            <TimelineRow
              label="预约入口"
              value={<span className="break-all text-muted-foreground">{link}</span>}
            />
            {missingToSend.length > 0 && (
              <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-800">
                发送前需要补齐：{missingToSend.join("、")}
              </div>
            )}
            <Button variant="outline" className="mt-4 w-full rounded-full" onClick={copyLink}>
              <ClipboardCopy /> 复制候选人链接
            </Button>
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-border p-5 text-sm text-muted-foreground">
            保存设置后创建邀约草稿，发送后候选人会收到站内通知。
          </div>
        )}
      </aside>
    </div>
  );
}

function SlotPanel({
  workspace,
  processing,
  onAdd,
  onRemove,
}: {
  workspace: Workspace;
  processing: boolean;
  onAdd: () => void;
  onRemove: (slotId: string) => void;
}) {
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">一次性可预约时间段</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            首期按 HR 手动时间段管理，候选人确认后该时间会被占用。
          </p>
        </div>
        <Button
          className="rounded-full"
          onClick={onAdd}
          disabled={processing || !workspace.invitation}
        >
          <CalendarPlus /> 添加时间段
        </Button>
      </div>
      {workspace.slots.length ? (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {workspace.slots.map((slot) => {
            const interviewer = workspace.interviewers.find(
              (item) => item.id === slot.interviewerId,
            );
            return (
              <div key={slot.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt).slice(-5)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {interviewer?.name ?? "面试官"} · {slot.timezone}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      slot.status === "available"
                        ? "positive"
                        : slot.status === "booked"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {slot.status === "available"
                      ? "可预约"
                      : slot.status === "booked"
                        ? "已占用"
                        : slot.status === "locked"
                          ? "锁定中"
                          : "已释放"}
                  </StatusBadge>
                </div>
                {slot.status === "available" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 rounded-full text-muted-foreground"
                    disabled={processing}
                    onClick={() => onRemove(slot.id)}
                  >
                    移除
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          暂无可预约时间段。添加至少一个时间段后才能发送邀约。
        </div>
      )}
    </>
  );
}

function BookingPanel({
  bookings,
  processing,
  maintenanceMessage,
  onStatus,
  onReport,
  onReschedule,
  onRequestPending,
  onCompletePending,
  onExpirePending,
  onCreateReminders,
}: {
  bookings: HumanInterviewBooking[];
  processing: boolean;
  maintenanceMessage: string | null;
  onStatus: (bookingId: string, status: HumanInterviewBookingStatus) => void;
  onReport: (booking: HumanInterviewBooking) => void;
  onReschedule: (booking: HumanInterviewBooking) => void;
  onRequestPending: (booking: HumanInterviewBooking) => void;
  onCompletePending: (booking: HumanInterviewBooking) => void;
  onExpirePending: () => void;
  onCreateReminders: () => void;
}) {
  const maintenancePanel = (
    <section className="rounded-2xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">演示维护</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            真实系统仍由后端维护接口执行，这里只用于本地演示手动触发。
          </p>
          {maintenanceMessage && (
            <p className="mt-2 text-xs text-muted-foreground">{maintenanceMessage}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={processing}
            onClick={onExpirePending}
          >
            <Wrench /> 释放超时待确认
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={processing}
            onClick={onCreateReminders}
          >
            <Bell /> 生成 24 小时提醒
          </Button>
        </div>
      </div>
    </section>
  );

  if (!bookings.length)
    return (
      <div className="space-y-4">
        {maintenancePanel}
        <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          候选人确认时间后，这里会显示预约详情、取消/改期入口和履约状态操作。
        </div>
      </div>
    );
  return (
    <div className="space-y-4">
      {maintenancePanel}
      {bookings.map((booking) => {
        const terminal = [
          "cancelled",
          "completed",
          "candidate_no_show",
          "interviewer_no_show",
          "expired",
        ].includes(booking.status);
        const pending = booking.status === "pending_confirmation";
        const locked = terminal || pending;
        return (
          <article key={booking.id} className="rounded-2xl border border-border bg-background p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{formatDateTime(booking.startAt)}</h2>
                  <StatusBadge tone={bookingTone(booking.status)}>
                    {bookingStatusLabel(booking.status)}
                  </StatusBadge>
                  <HumanInterviewTypeBadge type={booking.interviewType} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {booking.candidate.name} · {booking.primaryInterviewer.name} ·{" "}
                  {booking.contact.email} · {booking.contact.phone}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {booking.meetingLink || booking.location || "会议或地点信息待补全"}
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-full"
                disabled={processing || pending || booking.status === "expired"}
                onClick={() => onReport(booking)}
              >
                填写真人报告
              </Button>
            </div>
            {pending && (
              <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-900">
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" /> 履约信息待补全确认
                </div>
                <p className="mt-2 leading-relaxed">
                  原因：{booking.pendingConfirmationReason || "未填写原因"}；截止：
                  {formatDateTime(booking.pendingConfirmationExpiresAt)}
                  。待确认期间仍占用原时间段，不能改期、取消、标记履约或填写报告。
                </p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {booking.status === "confirmed" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={processing}
                  onClick={() => onRequestPending(booking)}
                >
                  <AlertTriangle /> 置为待确认
                </Button>
              )}
              {pending && (
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={processing}
                  onClick={() => onCompletePending(booking)}
                >
                  <CheckCircle2 /> 补齐并恢复确认
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={processing || locked}
                onClick={() => onReschedule(booking)}
              >
                <RotateCcw /> 改期
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={processing || locked}
                onClick={() => onStatus(booking.id, "completed")}
              >
                <CheckCircle2 /> 标记完成
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={processing || locked}
                onClick={() => onStatus(booking.id, "candidate_no_show")}
              >
                <UserX /> 候选人未到
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={processing || locked}
                onClick={() => onStatus(booking.id, "interviewer_no_show")}
              >
                <UserCheck /> 面试官未到
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                disabled={processing || locked}
                onClick={() => onStatus(booking.id, "cancelled")}
              >
                <XCircle /> 取消预约
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function PendingConfirmationDialog({
  booking,
  open,
  processing,
  onOpenChange,
  onConfirm,
}: {
  booking: HumanInterviewBooking;
  open: boolean;
  processing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("会议或地点信息需要补齐");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>置为待补全确认</DialogTitle>
          <DialogDescription>
            {booking.candidate.name} · {formatDateTime(booking.startAt)}
            。该状态会保留原时间占用，并要求 HR 在 6 小时内补齐履约信息。
          </DialogDescription>
        </DialogHeader>
        <Field label="原因">
          <Textarea
            className="min-h-24"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button disabled={processing || !reason.trim()} onClick={() => onConfirm(reason)}>
            置为待确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CompletePendingConfirmationDialog({
  booking,
  open,
  processing,
  onOpenChange,
  onConfirm,
}: {
  booking: HumanInterviewBooking;
  open: boolean;
  processing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: {
    meetingLink?: string;
    location?: string;
    arrivalInstructions?: string;
  }) => void;
}) {
  const [meetingLink, setMeetingLink] = useState(booking.meetingLink ?? "");
  const [location, setLocation] = useState(booking.location ?? "");
  const [arrivalInstructions, setArrivalInstructions] = useState(booking.arrivalInstructions ?? "");
  const online = booking.interviewType === "online";
  const canConfirm = online ? Boolean(meetingLink.trim()) : Boolean(location.trim());
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>补齐并恢复确认</DialogTitle>
          <DialogDescription>
            补齐{online ? "会议链接" : "线下面试地点"}后，预约会从待补全确认恢复为已预约。
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {online ? (
            <Field label="会议链接">
              <Input value={meetingLink} onChange={(event) => setMeetingLink(event.target.value)} />
            </Field>
          ) : (
            <>
              <Field label="线下面试地点">
                <Input value={location} onChange={(event) => setLocation(event.target.value)} />
              </Field>
              <Field label="到场说明">
                <Textarea
                  className="min-h-24"
                  value={arrivalInstructions}
                  onChange={(event) => setArrivalInstructions(event.target.value)}
                />
              </Field>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={processing || !canConfirm}
            onClick={() => onConfirm({ meetingLink, location, arrivalInstructions })}
          >
            恢复确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddSlotDialog({
  open,
  onOpenChange,
  interviewerId,
  applicationId,
  processing,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewerId: string;
  applicationId: string;
  processing: boolean;
  onAdd: (input: {
    applicationId: string;
    interviewerId: string;
    startAt: string;
    endAt: string;
    timezone: string;
  }) => void;
}) {
  const [startAt, setStartAt] = useState("2026-06-25T10:00");
  const [endAt, setEndAt] = useState("2026-06-25T11:00");
  const invalidRange = Boolean(startAt && endAt && new Date(startAt) >= new Date(endAt));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>添加一次性可预约时间段</DialogTitle>
          <DialogDescription>时间段会绑定当前主面试官，候选人确认后立即占用。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="开始时间">
            <Input
              type="datetime-local"
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
            />
          </Field>
          <Field label="结束时间">
            <Input
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </Field>
        </div>
        {invalidRange && <p className="text-sm text-red-600">结束时间必须晚于开始时间。</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={processing || !startAt || !endAt || invalidRange}
            onClick={() => {
              onAdd({
                applicationId,
                interviewerId,
                startAt: new Date(startAt).toISOString(),
                endAt: new Date(endAt).toISOString(),
                timezone: "Asia/Shanghai",
              });
              onOpenChange(false);
            }}
          >
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReportReview({
  booking,
  report,
  processing,
  onEdit,
  onPublish,
}: {
  booking?: HumanInterviewBooking;
  report?: HumanInterviewReport;
  processing: boolean;
  onEdit: (booking: HumanInterviewBooking) => void;
  onPublish: (bookingId: string) => void;
}) {
  if (!booking)
    return (
      <div className="rounded-3xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        预约确认并完成面试后，可在这里审核发布真人面试报告。
      </div>
    );
  const reportLocked = booking.status === "pending_confirmation" || booking.status === "expired";
  return (
    <section className="rounded-2xl border border-border bg-background p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold">{booking.candidate.name} 的真人面试报告</h2>
            <StatusBadge
              tone={
                report?.status === "published"
                  ? "positive"
                  : report?.status === "pending_hr_review"
                    ? "warning"
                    : "neutral"
              }
            >
              {reportStatusLabel(report?.status)}
            </StatusBadge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {report?.conclusion ?? "主面试官尚未提交报告。"}
          </p>
          {report?.candidateSummary && (
            <p className="mt-3 rounded-2xl bg-secondary/45 p-4 text-sm text-muted-foreground">
              求职者摘要：{report.candidateSummary}
            </p>
          )}
          {reportLocked && (
            <p className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-800">
              当前预约状态不能编辑或发布真人报告。
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            disabled={processing || reportLocked}
            onClick={() => onEdit(booking)}
          >
            <RotateCcw /> 编辑报告
          </Button>
          <Button
            className="rounded-full"
            disabled={processing || reportLocked || !report || report.status === "published"}
            onClick={() => onPublish(booking.id)}
          >
            <Send /> 审核发布
          </Button>
        </div>
      </div>
    </section>
  );
}

function ReportDialog({
  booking,
  report,
  open,
  onOpenChange,
  processing,
  onSave,
}: {
  booking: HumanInterviewBooking;
  report?: HumanInterviewReport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processing: boolean;
  onSave: (input: {
    bookingId: string;
    conclusion: string;
    abilityAssessment: string;
    keyObservations: string[];
    risksAndFollowups: string[];
    candidateSummary: string;
    internalNotes: string;
    submitForReview?: boolean;
  }) => void;
}) {
  const [conclusion, setConclusion] = useState(report?.conclusion ?? "建议进入后续业务面沟通");
  const [abilityAssessment, setAbilityAssessment] = useState(report?.abilityAssessment ?? "");
  const [keyObservations, setKeyObservations] = useState(
    (report?.keyObservations ?? []).join("\n"),
  );
  const [risksAndFollowups, setRisksAndFollowups] = useState(
    (report?.risksAndFollowups ?? []).join("\n"),
  );
  const [candidateSummary, setCandidateSummary] = useState(report?.candidateSummary ?? "");
  const [internalNotes, setInternalNotes] = useState(report?.internalNotes ?? "");
  const payload = useMemo(
    () => ({
      bookingId: booking.id,
      conclusion,
      abilityAssessment,
      keyObservations: keyObservations
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean),
      risksAndFollowups: risksAndFollowups
        .split("\n")
        .map((i) => i.trim())
        .filter(Boolean),
      candidateSummary,
      internalNotes,
    }),
    [
      abilityAssessment,
      booking.id,
      candidateSummary,
      conclusion,
      internalNotes,
      keyObservations,
      risksAndFollowups,
    ],
  );
  const canSave = Boolean(conclusion.trim() && candidateSummary.trim());
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>轻量真人面试报告</DialogTitle>
          <DialogDescription>
            {booking.candidate.name} · {typeLabel(booking.interviewType)} ·{" "}
            {formatDateTime(booking.startAt)}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="面试结论">
            <Input value={conclusion} onChange={(event) => setConclusion(event.target.value)} />
          </Field>
          <Field label="能力评价">
            <Textarea
              className="min-h-24"
              value={abilityAssessment}
              onChange={(event) => setAbilityAssessment(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="关键观察（每行一条）">
              <Textarea
                className="min-h-32"
                value={keyObservations}
                onChange={(event) => setKeyObservations(event.target.value)}
              />
            </Field>
            <Field label="风险或待跟进点（每行一条）">
              <Textarea
                className="min-h-32"
                value={risksAndFollowups}
                onChange={(event) => setRisksAndFollowups(event.target.value)}
              />
            </Field>
          </div>
          <Field label="求职者可见摘要">
            <Textarea
              className="min-h-24"
              value={candidateSummary}
              onChange={(event) => setCandidateSummary(event.target.value)}
            />
          </Field>
          <Field label="企业内部备注">
            <Textarea
              className="min-h-24"
              value={internalNotes}
              onChange={(event) => setInternalNotes(event.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            variant="outline"
            disabled={processing || !canSave}
            onClick={() => onSave(payload)}
          >
            保存草稿
          </Button>
          <Button
            disabled={processing || !canSave}
            onClick={() => {
              onSave({ ...payload, submitForReview: true });
              onOpenChange(false);
            }}
          >
            提交 HR 审核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function RescheduleDialog({
  booking,
  slots,
  open,
  processing,
  onOpenChange,
  onConfirm,
}: {
  booking: HumanInterviewBooking;
  slots: HumanInterviewAvailabilitySlot[];
  open: boolean;
  processing: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (slotId: string) => void;
}) {
  const [selectedSlotId, setSelectedSlotId] = useState("");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>为 {booking.candidate.name} 改期</DialogTitle>
          <DialogDescription>选择新的可预约时间段，原时间会被释放。</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {slots.map((slot) => (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlotId(slot.id)}
              className={`w-full rounded-2xl border p-4 text-left text-sm transition-colors ${selectedSlotId === slot.id ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-secondary/40"}`}
            >
              {formatDateTime(slot.startAt)} - {formatDateTime(slot.endAt).slice(-5)}
            </button>
          ))}
          {!slots.length && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              暂无可改期时间段。请先在档期管理中添加新时间段。
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            disabled={processing || !selectedSlotId}
            onClick={() => onConfirm(selectedSlotId)}
          >
            确认改期
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({
  action,
  processing,
  onOpenChange,
}: {
  action: ConfirmAction | null;
  processing: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={Boolean(action)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:rounded-3xl">
        <DialogHeader>
          <DialogTitle>{action?.title}</DialogTitle>
          <DialogDescription>{action?.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            返回
          </Button>
          <Button
            variant={action?.destructive ? "destructive" : "default"}
            disabled={processing}
            onClick={() => {
              action?.onConfirm();
              onOpenChange(false);
            }}
          >
            {action?.confirmLabel ?? "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
