import type { ReactNode } from "react";
import { ArrowLeft, Bell, Filter, Map, UserRound } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface TopBarProps {
  variant?: "home" | "back";
  title?: string;
  backHref?: string;
  rightIcon?: "bell" | "filter" | "map" | "none";
  onRightClick?: () => void;
  className?: string;
  children?: ReactNode;
}

export function TopBar({
  variant = "home",
  title,
  backHref = "/",
  rightIcon = "bell",
  onRightClick,
  className,
  children,
}: TopBarProps) {
  const RightIcon =
    rightIcon === "filter" ? Filter : rightIcon === "map" ? Map : Bell;

  return (
    <header
      className={cn(
        "flex min-h-16 items-center justify-between py-3",
        className
      )}
    >
      {variant === "home" ? (
        <h1 className="text-[23px] font-bold tracking-[-0.045em] text-zinc-950">
          Li<span className="text-[#4F46E5]">z</span>to
        </h1>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link
            href={backHref}
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E4E4E0] bg-white text-zinc-700 transition-colors hover:bg-zinc-50"
            aria-label="Volver"
          >
            <ArrowLeft className="size-4" />
          </Link>
          {title ? (
            <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
          ) : null}
        </div>
      )}

      {children}

      {rightIcon !== "none" ? (
        <button
          type="button"
          onClick={onRightClick}
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E4E4E0] bg-white text-zinc-700 transition-colors hover:bg-zinc-50"
          aria-label="Acción superior"
        >
          {variant === "home" && rightIcon === "bell" ? (
            <UserRound className="size-4" />
          ) : (
            <RightIcon className="size-4" />
          )}
        </button>
      ) : (
        <div className="size-9 shrink-0" />
      )}
    </header>
  );
}
