import type { ParsedRequest, ParsedTag } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAG_STYLES: Record<ParsedTag["type"], string> = {
  category: "border-indigo-200 bg-indigo-50 text-indigo-700",
  location: "border-zinc-200 bg-white text-zinc-600",
  urgency: "border-zinc-200 bg-white text-zinc-600",
  work: "border-zinc-200 bg-white text-zinc-600",
};

const URGENCY_LABELS = {
  immediate: "Urgente",
  today: "Para hoy",
  scheduled: "Programado",
} as const;

export function buildParsedTags(parsed: ParsedRequest): ParsedTag[] {
  return [
    {
      id: "category",
      label: parsed.category,
      type: "category",
    },
    {
      id: "urgency",
      label: URGENCY_LABELS[parsed.urgency],
      type: "urgency",
    },
    {
      id: "location",
      label: parsed.location,
      type: "location",
    },
    {
      id: "work",
      label: parsed.requires_presence ? "Presencial" : "Remoto",
      type: "work",
    },
  ];
}

interface ParsedTagsProps {
  tags: ParsedTag[];
  className?: string;
}

export function ParsedTags({ tags, className }: ParsedTagsProps) {
  return (
    <div
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      {tags.map((tag) => (
        <span
          key={tag.id}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-medium",
            TAG_STYLES[tag.type]
          )}
        >
          {tag.label}
        </span>
      ))}
    </div>
  );
}
