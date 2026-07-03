"use client";

import { useOrientation } from "@/hooks/use-orientation";
import type { ReactNode } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";

interface SplitViewProps {
  start: ReactNode;
  end: ReactNode;
}

/**
 * Responsive resizable split. Lays the two panes side by side in landscape
 * and stacks them in portrait.
 */
export function SplitView({ start, end }: SplitViewProps) {
  const orientation = useOrientation();

  const handleClass =
    orientation === "horizontal"
      ? "w-1.5 bg-black/10 transition-colors hover:bg-black/25 dark:bg-white/10 dark:hover:bg-white/25"
      : "h-1.5 bg-black/10 transition-colors hover:bg-black/25 dark:bg-white/10 dark:hover:bg-white/25";

  return (
    <Group orientation={orientation} className="flex h-full w-full flex-1">
      <Panel
        defaultSize="50%"
        minSize="20%"
        className="flex flex-col overflow-hidden"
      >
        {start}
      </Panel>
      <Separator className={handleClass} />
      <Panel defaultSize="50%" minSize="20%" className="overflow-auto">
        {end}
      </Panel>
    </Group>
  );
}
