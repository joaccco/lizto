import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ScreenShellProps {
  children: ReactNode;
  className?: string;
}

export function ScreenShell({ children, className }: ScreenShellProps) {
  return (
    <div className="min-h-dvh bg-[#F7F7F5]">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
