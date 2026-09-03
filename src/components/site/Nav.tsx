import { Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ChevronDown,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Logo } from "./Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authQueryKey, useCurrentUser } from "@/hooks/use-current-user";
import { useNotifications } from "@/hooks/use-notifications";
import { authService } from "@/lib/auth/service";
import {
  HUMAN_INTERVIEW_DEMO_APPLICATION_ID,
  HUMAN_INTERVIEW_DEMO_TOKEN,
} from "@/lib/human-interviews/fallback";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { to: "/", label: "产品首页" },
  { to: "/resume", label: "简历管理" },
  { to: "/match", label: "岗位匹配" },
  { to: "/interview", label: "面试验证" },
  { to: "/human-interviews", label: "真人面试预约" },
  { to: "/hr", label: "HR 招聘" },
] as const;

const HR_NAV_LINKS = [
  { to: "/hr", label: "HR 工作台" },
  {
    to: "/hr/jobs/$jobId/candidates",
    params: { jobId: "job_ai_pm_campus_001" },
    label: "候选人列表",
  },
  {
    to: "/human-interviews/hr/applications/$applicationId",
    params: { applicationId: HUMAN_INTERVIEW_DEMO_APPLICATION_ID },
    label: "真人面试预约",
  },
  { to: "/hr/agent-runs", label: "多 Agent 协作" },
  {
    to: "/hr/applications/$applicationId/report",
    params: { applicationId: "application_ai_pm_li_001" },
    label: "证据链报告",
  },
] as const;

const FUNCTION_GROUPS = [
  {
    label: "产品总览",
    links: [
      { to: "/", label: "产品首页" },
      { to: "/flow", label: "产品流程" },
    ],
  },
  {
    label: "求职者功能",
    links: [
      { to: "/resume", label: "简历管理" },
      { to: "/job-profile", label: "职业画像" },
      { to: "/match", label: "岗位匹配" },
      { to: "/interview", label: "面试验证" },
      { to: "/network", label: "职业人脉" },
      { to: "/notifications", label: "站内通知" },
    ],
  },
  {
    label: "真人面试预约",
    links: [
      { to: "/human-interviews", label: "预约总入口" },
      {
        to: "/human-interviews/hr/applications/$applicationId",
        params: { applicationId: HUMAN_INTERVIEW_DEMO_APPLICATION_ID },
        label: "HR 预约管理",
      },
      { to: "/human-interviews/candidate", label: "我的真人面试" },
      {
        to: "/human-interviews/invitations/$token",
        params: { token: HUMAN_INTERVIEW_DEMO_TOKEN },
        label: "候选人邀约入口",
      },
    ],
  },
  {
    label: "HR 招聘",
    links: [
      { to: "/hr", label: "HR 工作台" },
      { to: "/jd-parse", label: "岗位管理" },
      {
        to: "/hr/jobs/$jobId/candidates",
        params: { jobId: "job_ai_pm_campus_001" },
        label: "候选人列表",
      },
      { to: "/hr/agent-runs", label: "多 Agent 协作" },
    ],
  },
  {
    label: "证据链报告",
    links: [
      {
        to: "/hr/applications/$applicationId/report",
        params: { applicationId: "application_ai_pm_li_001" },
        label: "HR 证据链报告",
      },
      {
        to: "/candidate/applications/$applicationId/report",
        params: { applicationId: "application_ai_pm_li_001" },
        label: "候选人反馈报告",
      },
    ],
  },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  const { user, isLoading } = useCurrentUser();
  const { data: notifications } = useNotifications();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((link) =>
            link.to === "/hr" ? (
              <DropdownMenu key={link.to}>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground">
                  {link.label}
                  <ChevronDown className="h-3.5 w-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    HR 招聘
                  </DropdownMenuLabel>
                  {HR_NAV_LINKS.map((item) => (
                    <DropdownMenuItem key={item.label} asChild>
                      <Link
                        to={item.to}
                        params={"params" in item ? item.params : undefined}
                        className="cursor-pointer"
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{
                  className:
                    "rounded-full px-3.5 py-2 text-sm text-foreground bg-secondary font-medium",
                }}
              >
                {link.label}
              </Link>
            ),
          )}
          <Link
            to="/notifications"
            className="relative rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            activeProps={{
              className:
                "relative rounded-full px-3.5 py-2 text-sm text-foreground bg-secondary font-medium",
            }}
          >
            <span className="inline-flex items-center gap-1.5">
              <Bell className="h-4 w-4" /> 通知
            </span>
            {notifications.unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
            )}
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground">
              <LayoutGrid className="h-4 w-4" /> 全部功能 <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {FUNCTION_GROUPS.map((group, groupIndex) => (
                <div key={group.label}>
                  {groupIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.links.map((item) => (
                    <DropdownMenuItem key={`${group.label}-${item.label}`} asChild>
                      <Link
                        to={item.to}
                        params={"params" in item ? item.params : undefined}
                        className="cursor-pointer"
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-full bg-secondary" />
          ) : user ? (
            <UserMenu />
          ) : (
            <>
              <Button variant="ghost" className="rounded-full" asChild>
                <a href="/login">登录</a>
              </Button>
              <Button className="rounded-full" asChild>
                <a href="/register">注册</a>
              </Button>
            </>
          )}
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="菜单"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      <div
        className={cn(
          "overflow-y-auto border-t border-border/60 lg:hidden",
          open ? "max-h-[calc(100vh-4rem)]" : "max-h-0",
          "transition-[max-height] duration-300",
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-3">
          {user && (
            <div className="mb-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium">{user.display_name}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{user.email}</div>
                </div>
                <RoleBadge role={user.role} />
              </div>
            </div>
          )}
          {FUNCTION_GROUPS.map((group) => (
            <div key={group.label} className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              {group.links.map((item) => (
                <Link
                  key={`${group.label}-${item.label}`}
                  to={item.to}
                  params={"params" in item ? item.params : undefined}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-foreground hover:bg-secondary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
          <div className="mt-2 border-t border-border pt-3">
            {user ? (
              <MobileLogout onDone={() => setOpen(false)} />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-full" asChild>
                  <a href="/login" onClick={() => setOpen(false)}>
                    登录
                  </a>
                </Button>
                <Button className="rounded-full" asChild>
                  <a href="/register" onClick={() => setOpen(false)}>
                    注册
                  </a>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function UserMenu() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null);
      toast.success("已退出登录");
      void navigate({ to: "/" });
    },
    onError: () => toast.error("退出失败，请稍后重试"),
  });

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-2.5 py-1.5 text-sm shadow-sm outline-none transition-colors hover:bg-secondary data-[state=open]:bg-secondary">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-rainbow text-xs font-semibold text-white">
          {user.display_name.slice(0, 1)}
        </span>
        <span className="max-w-24 truncate">{user.display_name}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate font-medium">{user.display_name}</div>
              <div className="mt-1 truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </div>
            </div>
            <RoleBadge role={user.role} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={user.role === "hr" ? "/hr" : "/resume"} className="cursor-pointer">
            <ShieldCheck className="mr-2 h-4 w-4" />
            进入{user.role === "hr" ? " HR 工作台" : "求职者流程"}
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          disabled={logoutMutation.isPending}
          onClick={() => logoutMutation.mutate()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logoutMutation.isPending ? "正在退出" : "退出登录"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MobileLogout({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const logoutMutation = useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null);
      onDone();
      toast.success("已退出登录");
      void navigate({ to: "/" });
    },
    onError: () => toast.error("退出失败，请稍后重试"),
  });

  return (
    <Button
      variant="outline"
      className="w-full rounded-full"
      disabled={logoutMutation.isPending}
      onClick={() => logoutMutation.mutate()}
    >
      <LogOut />
      {logoutMutation.isPending ? "正在退出" : "退出登录"}
    </Button>
  );
}

function RoleBadge({ role }: { role: "candidate" | "hr" }) {
  return (
    <Badge variant="secondary" className="shrink-0 rounded-full">
      <UserCircle className="mr-1 h-3.5 w-3.5" />
      {role === "hr" ? "HR" : "求职者"}
    </Badge>
  );
}
