"use client";

import { Badge } from "@/components/ui/badge";
import { RequerimientoStatus, STATUS_CONFIG } from "@/types";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: RequerimientoStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium",
        config.bgColor,
        config.color,
        config.borderColor,
        className
      )}
    >
      {config.label}
    </Badge>
  );
}
