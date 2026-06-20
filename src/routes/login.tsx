import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/site/PageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authQueryKey } from "@/hooks/use-current-user";
import { ApiError } from "@/lib/api/client";
import { DEMO_ACCOUNTS, authService } from "@/lib/auth/service";
import type { AuthSession } from "@/lib/auth/types";

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "登录 - HireLink AI" },
      { name: "description", content: "登录 HireLink AI，进入 HR 或求职者工作流。" },
    ],
  }),
  component: LoginPage,
});

function safeRedirect(value: string | undefined, role: AuthSession["user"]["role"]) {
  if (value && value.startsWith("/") && !value.startsWith("//")) return value;
  return role === "hr" ? "/hr" : "/resume";
}

function LoginPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState<string>(DEMO_ACCOUNTS.hr.identifier);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNTS.hr.password);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKey, session);
      toast.success(`欢迎回来，${session.user.display_name}`);
      const target = safeRedirect(search.redirect, session.user.role);
      if (target === "/hr") {
        void navigate({ to: "/hr" });
      } else {
        window.location.assign(target);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    },
  });

  const helperText = useMemo(() => {
    if (loginMutation.isPending) return "正在验证账号并建立安全会话";
    return "登录后将按账号角色进入对应工作流。";
  }, [loginMutation.isPending]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ identifier, password });
  };

  return (
    <PageShell>
      <main className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl bg-rainbow opacity-[0.10] blur-[90px]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
          <section className="max-w-2xl">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> HireLink AI Auth
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
              登录后进入 <span className="text-gradient">HireLink 工作台</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              使用 HR 或求职者账号进入对应流程，继续处理候选人、面试预约和报告查看。
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <AccountCard
                title="HR 账号"
                description="进入 HR 工作台、候选人、报告和真人面试预约流程。"
                onUse={() => {
                  setIdentifier(DEMO_ACCOUNTS.hr.identifier);
                  setPassword(DEMO_ACCOUNTS.hr.password);
                  setError(null);
                }}
              />
              <AccountCard
                title="求职者账号"
                description="进入求职者流程，查看申请、任务、面试和报告。"
                onUse={() => {
                  setIdentifier(DEMO_ACCOUNTS.candidate.identifier);
                  setPassword(DEMO_ACCOUNTS.candidate.password);
                  setError(null);
                }}
              />
            </div>
          </section>

          <Card className="rounded-3xl border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">账号登录</CardTitle>
              <CardDescription>{helperText}</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">邮箱或用户名</Label>
                  <Input
                    id="identifier"
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    autoComplete="username"
                    placeholder="hr.demo@hirelink.local"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="current-password"
                    placeholder="请输入密码"
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>登录失败</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button className="w-full rounded-full" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                  {loginMutation.isPending ? "正在登录" : "登录"}
                </Button>
              </form>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">还没有账号？</span>
                <a
                  href="/register"
                  className="inline-flex items-center gap-1 font-medium hover:underline"
                >
                  创建账号 <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}

function AccountCard({
  title,
  description,
  onUse,
}: {
  title: string;
  description: string;
  onUse: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onUse}
      className="rounded-2xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:bg-secondary/45"
    >
      <div className="font-medium">{title}</div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      <span className="mt-3 inline-flex text-xs font-medium text-foreground">填入账号</span>
    </button>
  );
}
