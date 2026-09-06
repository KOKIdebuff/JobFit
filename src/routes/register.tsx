import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Loader2 } from "lucide-react";
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
import { authService } from "@/lib/auth/service";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "注册 - JobFit" },
      { name: "description", content: "创建 JobFit 账号，开始岗位胜任力评估。" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKey, session);
      toast.success("账号已创建");
      void navigate({ to: "/assessment" });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "注册失败，请稍后重试");
    },
  });

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    registerMutation.mutate({
      email,
      username,
      display_name: displayName,
      password,
      role: "candidate",
      organization_name: null,
    });
  };

  return (
    <PageShell>
      <main className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl bg-rainbow opacity-[0.10] blur-[90px]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          <section className="max-w-2xl pt-4">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              JobFit 账号入口
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
              创建账号，开始<span className="text-gradient">岗位能力评估</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              注册后即可上传简历并选择目标岗位，通过多轮追问建立可追溯的能力证据。
            </p>
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="text-sm font-medium">当前边界</div>
              <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/45 p-4">JWT 写入 HttpOnly Cookie</div>
                <div className="rounded-2xl bg-secondary/45 p-4">不做 Refresh Token</div>
                <div className="rounded-2xl bg-secondary/45 p-4">报告仅基于面试证据生成</div>
              </div>
            </div>
          </section>

          <Card className="rounded-3xl border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">创建账号</CardTitle>
              <CardDescription>填写基础信息，开始岗位胜任力评估。</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">显示名称</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="李同学"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="li_candidate"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    autoComplete="new-password"
                    placeholder="至少 8 位"
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="rounded-2xl">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>注册失败</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button className="w-full rounded-full" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {registerMutation.isPending ? "正在创建" : "创建账号"}
                </Button>
              </form>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">已有账号？</span>
                <a href="/login" className="font-medium hover:underline">
                  去登录
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageShell>
  );
}
