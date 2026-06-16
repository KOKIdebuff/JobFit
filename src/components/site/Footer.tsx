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
              让求职从「海投等待」变成「精准连接 + 智能筛选」。
            </p>
          </div>
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <Link to="/match" className="text-muted-foreground hover:text-foreground">
              岗位匹配
            </Link>
            <Link to="/resume" className="text-muted-foreground hover:text-foreground">
              简历原型
            </Link>
            <Link to="/network" className="text-muted-foreground hover:text-foreground">
              后续人脉
            </Link>
            <Link to="/interview" className="text-muted-foreground hover:text-foreground">
              轻量面试
            </Link>
            <Link to="/flow" className="text-muted-foreground hover:text-foreground">
              产品流程
            </Link>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © 2026 HireLink AI · AI 人才服务智能体平台
        </div>
      </div>
    </footer>
  );
}
