"use client";

import { FormatSwitchButton } from "@/components/editor/format-switch-button";
import { SaveSchemaButton } from "@/components/editor/save-schema-button";

type EditorToolbarProps = {
  ready: boolean;
  userId: string | null;
};

export function EditorToolbar({ ready, userId }: EditorToolbarProps) {
  return (
    <div
      data-testid="editor-toolbar"
      className="z-20 flex h-10 shrink-0 items-center justify-end gap-2 px-2"
    >
      {ready && userId ? <SaveSchemaButton userId={userId} /> : null}
      {ready ? <FormatSwitchButton /> : null}
    </div>
  );
}
