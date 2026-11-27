"use client";

import { useEffect } from "react";
import { toast, Toaster } from "sonner";
import { EditorScreen } from "./EditorScreen";
import { initDoc } from "./model/doc";
import { useDocSnapshot } from "./state/useDocSnapshot";
import { useEditorDoc } from "./state/useEditorDoc";
import { SetupFlow } from "./ui/SetupFlow";

export function EditorRoot() {
  const handle = useEditorDoc();
  const snapshot = useDocSnapshot(handle.doc);

  useEffect(() => {
    if (handle.status === "ready" && !handle.persistent) {
      toast.warning("이 브라우저에서는 저장이 안 돼요. 새로고침하면 작업이 사라져요.");
    }
  }, [handle.status, handle.persistent]);

  return (
    <main className="min-h-dvh bg-neutral-900 text-white">
      <Toaster position="top-center" theme="dark" />
      {handle.status === "loading" ? (
        <p className="p-6 text-center text-sm text-neutral-400">불러오는 중…</p>
      ) : snapshot === null ? (
        <SetupFlow onComplete={(ratio, background) => initDoc(handle.doc, ratio, background)} />
      ) : (
        <EditorScreen handle={handle} snapshot={snapshot} />
      )}
    </main>
  );
}
