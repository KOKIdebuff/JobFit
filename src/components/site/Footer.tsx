import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="max-w-sm space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">
              用真实对话与可追溯证据，识别岗位胜任力边界。
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Link to="/assessment" className="text-muted-foreground hover:text-foreground">
              岗位评估
            </Link>
            <Link to="/interviews" className="text-muted-foreground hover:text-foreground">
              面试记录
            </Link>
            <Link to="/reports" className="text-muted-foreground hover:text-foreground">
              评估报告
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © 2026 JobFit · 岗位胜任力评估智能体
        </div>
      </div>
    </footer>
  );
}
