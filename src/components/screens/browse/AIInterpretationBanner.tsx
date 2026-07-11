import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

interface AIInterpretationBannerProps {
  summary: string;
  className?: string;
}

export function AIInterpretationBanner({
  summary,
  className,
}: AIInterpretationBannerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-blue-200 bg-[#EFF6FF] px-4 py-3",
        className
      )}
    >
      <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600" />
      <p className="text-sm text-blue-900">
        <span className="font-medium">IA interpretó:</span> {summary}
      </p>
    </div>
  );
}
