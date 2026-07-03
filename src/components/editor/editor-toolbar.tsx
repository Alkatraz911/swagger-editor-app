"use client";

import { FormatSwitchButton } from "@/components/editor/format-switch-button";

type EditorToolbarProps = {
  ready: boolean;
};

export function EditorToolbar({ ready }: EditorToolbarProps) {
  return (
    <div
      data-testid="editor-toolbar"
      className="z-20 flex h-10 shrink-0 items-center justify-end gap-2 px-2"
    >
      {ready ? <FormatSwitchButton /> : null}
    </div>
  );
}
