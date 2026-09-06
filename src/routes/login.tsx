import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState, type FormEvent } from "react";
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

interface LoginSearch {
  redirect?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "登录 - JobFit" },
      { name: "description", content: "登录 JobFit，开始岗位胜任力评估。" },
    ],
  }),
  component: LoginPage,
});

function safeRedirect(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/assessment";

  const pathname = value.split(/[?#]/, 1)[0];
  const isJobFitRoute =
    pathname === "/assessment" ||
    pathname === "/interviews" ||
    pathname === "/reports" ||
    pathname.startsWith("/interviews/") ||
    pathname.startsWith("/reports/");

  return isJobFitRoute ? value : "/assessment";
}

function LoginPage() {
  const search = Route.useSearch();
  const queryClient = useQueryClient();
  const [identifier, setIdentifier] = useState<string>(DEMO_ACCOUNTS.candidate.identifier);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNTS.candidate.password);
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKey, session);
      toast.success(`欢迎回来，${session.user.display_name}`);
      window.location.assign(safeRedirect(search.redirect));
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "登录失败，请稍后重试");
    },
  });

  const helperText = loginMutation.isPending
    ? "正在验证账号并建立安全会话"
    : "登录后即可上传简历并开始岗位评估。";

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
              <Sparkles className="mr-1 h-3.5 w-3.5" /> JobFit 账号登录
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
              登录后开始 <span className="text-gradient">岗位胜任力评估</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              上传简历并选择目标岗位，通过自适应追问沉淀能力证据，生成可解释的评估报告。
            </p>
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
                    placeholder="请输入演示账号邮箱"
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
