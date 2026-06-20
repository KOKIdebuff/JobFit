import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, Building2, Loader2, UserRound } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
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
import type { UserRole } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "注册 - HireLink AI" },
      { name: "description", content: "创建 HireLink AI 求职者或 HR 演示账号。" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [role, setRole] = useState<UserRole>("candidate");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [organizationName, setOrganizationName] = useState("星河智能");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: (session) => {
      queryClient.setQueryData(authQueryKey, session);
      toast.success("账号已创建");
      if (session.user.role === "hr") {
        void navigate({ to: "/hr" });
      } else {
        window.location.assign("/resume");
      }
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
      role,
      organization_name: role === "hr" ? organizationName : null,
    });
  };

  return (
    <PageShell>
      <main className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-72 max-w-3xl bg-rainbow opacity-[0.10] blur-[90px]" />
        <div className="relative mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1fr_460px] lg:items-start">
          <section className="max-w-2xl pt-4">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              平衡级认证入口
            </Badge>
            <h1 className="mt-5 text-3xl font-semibold leading-tight sm:text-5xl">
              创建账号，区分<span className="text-gradient">求职者与 HR</span>
            </h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              注册后由后端保存用户、角色和组织关系。P0 只支持 candidate 与
              hr，不开放管理员和复杂企业权限。
            </p>
            <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="text-sm font-medium">当前边界</div>
              <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <div className="rounded-2xl bg-secondary/45 p-4">JWT 写入 HttpOnly Cookie</div>
                <div className="rounded-2xl bg-secondary/45 p-4">
                  HR 数据后续按岗位 created_by 隔离
                </div>
                <div className="rounded-2xl bg-secondary/45 p-4">不做 Refresh Token</div>
                <div className="rounded-2xl bg-secondary/45 p-4">不做管理员角色</div>
              </div>
            </div>
          </section>

          <Card className="rounded-3xl border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-2xl">创建账号</CardTitle>
              <CardDescription>请选择角色并填写基础信息。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-5 grid grid-cols-2 gap-2">
                <RoleButton
                  active={role === "candidate"}
                  title="求职者"
                  icon={<UserRound className="h-4 w-4" />}
                  onClick={() => setRole("candidate")}
                />
                <RoleButton
                  active={role === "hr"}
                  title="HR"
                  icon={<Building2 className="h-4 w-4" />}
                  onClick={() => setRole("hr")}
                />
              </div>
              <form className="space-y-4" onSubmit={submit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">显示名称</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder={role === "hr" ? "陈经理" : "李同学"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder={role === "hr" ? "chen_hr" : "li_candidate"}
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
                    placeholder="name@hirelink.local"
                  />
                </div>
                {role === "hr" && (
                  <div className="space-y-2">
                    <Label htmlFor="organizationName">组织名称</Label>
                    <Input
                      id="organizationName"
                      value={organizationName}
                      onChange={(event) => setOrganizationName(event.target.value)}
                      placeholder="星河智能"
                    />
                  </div>
                )}
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

function RoleButton({
  active,
  title,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border hover:bg-secondary",
      )}
    >
      {icon}
      {title}
    </button>
  );
}
