"use client";

import type { EditorSnapshot } from "./model/types";
import type { EditorDocHandle } from "./state/useEditorDoc";

export function EditorScreen({ snapshot }: { handle: EditorDocHandle; snapshot: EditorSnapshot }) {
  return (
    <div data-testid="editor-canvas" data-block-count={snapshot.blocks.length} className="p-6">
      {snapshot.ratio} 에디터 준비 중
    </div>
  );
}
