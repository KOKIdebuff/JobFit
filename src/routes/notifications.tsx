import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarClock, CheckCheck, ChevronRight, RefreshCw } from "lucide-react";
import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "站内通知 - HireLink AI" },
      { name: "description", content: "查看真人面试预约、报告发布和流程状态通知。" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { data, loading, error, retry, markRead, markAllRead } = useNotifications();

  return (
    <PageShell>
      <main className="mx-auto max-w-5xl px-5 py-10 pb-24 sm:px-8">
        <section className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">消息中心</p>
              <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">站内通知</h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                查看预约邀约、时间确认、改期取消和报告发布等状态变化。
              </p>
            </div>
            <Button
              variant="outline"
              className="rounded-full"
              disabled={!data.unreadCount}
              onClick={() => void markAllRead()}
            >
              <CheckCheck /> 全部标为已读
            </Button>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-border bg-card p-4 shadow-soft sm:p-6">
          {loading && <Skeleton className="h-48 rounded-3xl" />}
          {error && !loading && (
            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center">
              <h2 className="font-semibold text-amber-900">通知暂时不可用</h2>
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
              <Button className="mt-4 rounded-full" variant="outline" onClick={() => void retry()}>
                <RefreshCw /> 重试
              </Button>
            </div>
          )}
          {!loading && !error && !data.notifications.length && (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold">暂无通知</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                新的预约邀约和流程状态会出现在这里。
              </p>
            </div>
          )}
          <div className="space-y-3">
            {data.notifications.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-border bg-background p-4 transition-colors hover:bg-secondary/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold">{item.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === "unread" && (
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-700">
                        未读
                      </span>
                    )}
                    {item.href ? (
                      <Button
                        size="sm"
                        className="rounded-full"
                        asChild
                        onClick={() => void markRead(item.id)}
                      >
                        <Link to={item.href}>
                          <ChevronRight /> 查看
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => void markRead(item.id)}
                      >
                        标为已读
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </PageShell>
  );
}
