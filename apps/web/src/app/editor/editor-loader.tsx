"use client";

import dynamic from "next/dynamic";

// Konva·Yjs·IndexedDB는 브라우저 전용이라 서버 렌더링에서 뺀다.
const EditorRoot = dynamic(() => import("@/features/editor/EditorRoot").then((m) => m.EditorRoot), {
  ssr: false,
  loading: () => <p className="p-6 text-center text-sm text-neutral-400">에디터를 불러오는 중…</p>,
});

export function EditorLoader() {
  return <EditorRoot />;
}
