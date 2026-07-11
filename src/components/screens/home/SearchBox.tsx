"use client";

import { Search } from "lucide-react";
import { FormEvent, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchBoxProps {
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SearchBox({
  onSubmit,
  isLoading = false,
  disabled = false,
  className,
}: SearchBoxProps) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = prompt.trim();

    if (!trimmed || isLoading || disabled) {
      return;
    }

    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Describí lo que necesitás..."
          disabled={isLoading || disabled}
          className="h-12 rounded-2xl border-[#E5E7EB] bg-white pl-10 text-sm text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <Badge
        variant="secondary"
        className="rounded-full border border-[#C7D2FE] bg-[#EEF2FF] px-3 py-1 text-xs font-medium text-[#4F46E5]"
      >
        ✦ IA interpreta tu solicitud
      </Badge>
    </form>
  );
}
