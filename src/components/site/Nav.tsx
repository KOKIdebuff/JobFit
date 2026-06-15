import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, LayoutGrid, Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_LINKS = [
  { to: "/", label: "产品首页" },
  { to: "/resume", label: "简历管理" },
  { to: "/match", label: "岗位匹配" },
  { to: "/interview", label: "面试验证" },
  { to: "/hr", label: "HR 招聘" },
] as const;

const FUNCTION_GROUPS = [
  {
    label: "求职者功能",
    links: [
      { to: "/resume", label: "简历与职业画像" },
      { to: "/match", label: "岗位匹配" },
      { to: "/interview", label: "面试与任务" },
      { to: "/network", label: "职业人脉" },
    ],
  },
  {
    label: "企业招聘",
    links: [
      { to: "/jd-parse", label: "岗位管理" },
      { to: "/hr", label: "招聘工作台" },
    ],
  },
  {
    label: "产品说明",
    links: [{ to: "/flow", label: "产品流程" }],
  },
] as const;

export function Nav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{
                className:
                  "rounded-full px-3.5 py-2 text-sm text-foreground bg-secondary font-medium",
              }}
            >
              {l.label}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-sm text-muted-foreground outline-none transition-colors hover:bg-secondary hover:text-foreground data-[state=open]:bg-secondary data-[state=open]:text-foreground">
              <LayoutGrid className="h-4 w-4" />
              全部功能
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {FUNCTION_GROUPS.map((group, groupIndex) => (
                <div key={group.label}>
                  {groupIndex > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {group.links.map((link) => (
                    <DropdownMenuItem key={link.to} asChild>
                      <Link to={link.to} className="cursor-pointer">
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        <div className="hidden lg:block">
          <Link
            to="/hr"
            className="inline-flex items-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            进入 HR 工作台
          </Link>
        </div>
        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-secondary lg:hidden"
          onClick={() => setOpen((v) => !v)}
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
          {FUNCTION_GROUPS.map((group) => (
            <div key={group.label} className="py-1">
              <div className="px-4 py-2 text-xs font-medium text-muted-foreground">
                {group.label}
              </div>
              {group.links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-4 py-2.5 text-sm text-foreground hover:bg-secondary"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
