import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ScreenShellProps {
  children: ReactNode;
  className?: string;
}

export function ScreenShell({ children, className }: ScreenShellProps) {
  return (
    <div className="min-h-dvh bg-[#F9FAFB]">
      <div
        className={cn(
          "mx-auto flex min-h-dvh w-full max-w-[430px] flex-col px-4 pb-8 md:max-w-[768px]",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
