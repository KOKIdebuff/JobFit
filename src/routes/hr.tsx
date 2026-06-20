import { createFileRoute, Outlet } from "@tanstack/react-router";
import { Home, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";

import { PageShell } from "@/components/site/PageShell";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/hr")({
  component: HrLayout,
});

function HrLayout() {
  const { user, isLoading, isFetching } = useCurrentUser();

  if (isLoading || isFetching) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
          <h1 className="mt-5 text-xl font-semibold">正在确认登录状态</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            系统正在通过后端会话确认当前用户角色。
          </p>
        </main>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <section className="rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
              <LockKeyhole className="h-7 w-7 text-muted-foreground" />
            </div>
            <h1 className="mt-5 text-xl font-semibold">请先登录</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
              HR 工作台需要后端认证会话。登录后系统会根据角色决定是否允许进入招聘页面。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button className="rounded-full" asChild>
                <a href="/login?redirect=/hr">登录 HR 账号</a>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <a href="/">返回首页</a>
              </Button>
            </div>
          </section>
        </main>
      </PageShell>
    );
  }

  if (user.role !== "hr") {
    return (
      <PageShell>
        <main className="mx-auto max-w-2xl px-5 py-20 sm:px-8">
          <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-8 text-center shadow-soft">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-background">
              <ShieldAlert className="h-7 w-7 text-amber-700" />
            </div>
            <h1 className="mt-5 text-xl font-semibold">当前账号不能进入 HR 页面</h1>
            <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
              你当前登录的是求职者账号。候选人可以继续使用简历、匹配、试炼任务和反馈报告入口。
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button className="rounded-full" asChild>
                <a href="/resume">进入求职者流程</a>
              </Button>
              <Button variant="outline" className="rounded-full" asChild>
                <a href="/">
                  <Home /> 返回首页
                </a>
              </Button>
            </div>
          </section>
        </main>
      </PageShell>
    );
  }

  return <Outlet />;
}
