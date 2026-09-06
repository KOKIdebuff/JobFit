import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { authQueryKey, useCurrentUser } from "@/hooks/use-current-user";
import { authService } from "@/lib/auth/service";

const LINKS = [
  { to: "/assessment", label: "岗位评估" },
  { to: "/interviews", label: "面试记录" },
  { to: "/reports", label: "评估报告" },
] as const;
export function Nav() {
  const [open, setOpen] = useState(false);
  const { user } = useCurrentUser();
  return (
    <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden gap-1 md:flex">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-full px-4 py-2 text-sm text-muted-foreground hover:bg-secondary"
              activeProps={{ className: "rounded-full bg-secondary px-4 py-2 text-sm font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden md:block">
          {user ? (
            <Logout />
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/login">登录</Link>
            </Button>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="菜单">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="border-t p-4 md:hidden">
          {LINKS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3"
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <Logout />
          ) : (
            <Link to="/login" className="block px-4 py-3">
              登录
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
function Logout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: async () => {
      queryClient.setQueryData(authQueryKey, null);
      await navigate({ to: "/" });
    },
  });
  return (
    <Button variant="ghost" onClick={() => mutation.mutate()}>
      <LogOut className="mr-2 h-4 w-4" />
      退出
    </Button>
  );
}
