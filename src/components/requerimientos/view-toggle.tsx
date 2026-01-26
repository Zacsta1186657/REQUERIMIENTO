"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List } from "lucide-react";

export type ViewMode = "table" | "cards";

interface ViewToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className="border rounded-lg p-1"
    >
      <ToggleGroupItem
        value="table"
        aria-label="Vista de tabla"
        className="h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <List className="h-4 w-4 mr-2" />
        Tabla
      </ToggleGroupItem>
      <ToggleGroupItem
        value="cards"
        aria-label="Vista de tarjetas"
        className="h-8 px-3 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
      >
        <LayoutGrid className="h-4 w-4 mr-2" />
        Tarjetas
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
