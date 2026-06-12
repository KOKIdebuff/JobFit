import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5 group", className)}>
      <span className="relative flex h-8 w-8 items-center justify-center">
        <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4285f4" />
              <stop offset="40%" stopColor="#9b72f9" />
              <stop offset="70%" stopColor="#ea4c89" />
              <stop offset="100%" stopColor="#f9ab00" />
            </linearGradient>
          </defs>
          <path
            d="M6 24 L16 6 L26 24"
            fill="none"
            stroke="url(#logoGrad)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="text-lg font-semibold font-display tracking-tight">
        HireLink<span className="text-gradient"> AI</span>
      </span>
    </Link>
  );
}
