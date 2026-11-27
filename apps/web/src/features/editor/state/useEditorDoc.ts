import { useCallback, useEffect, useState } from "react";
import { IndexeddbPersistence } from "y-indexeddb";
import type * as Y from "yjs";
import { clearDoc, createEditorDoc } from "../model/doc";
import { createHistory } from "../model/history";

export interface EditorDocHandle {
  doc: Y.Doc;
  history: Y.UndoManager;
  status: "loading" | "ready";
  /** false면 새로고침 시 작업이 사라진다(IndexedDB 사용 불가) */
  persistent: boolean;
  /** 새로 만들기: 문서와 실행 취소 기록을 비운다 */
  reset(): void;
}

const SYNC_TIMEOUT_MS = 3000;

export function useEditorDoc({
  persist = true,
  name = "merry-editor-phase1",
}: { persist?: boolean; name?: string } = {}): EditorDocHandle {
  const [doc] = useState(createEditorDoc);
  const [history] = useState(() => createHistory(doc));
  const [canPersist] = useState(() => persist && typeof indexedDB !== "undefined");
  const [status, setStatus] = useState<"loading" | "ready">(canPersist ? "loading" : "ready");
  const [persistent, setPersistent] = useState(canPersist);

  useEffect(() => {
    if (!canPersist) return;
    let cancelled = false;
    const provider = new IndexeddbPersistence(name, doc);
    const timeout = setTimeout(() => {
      if (cancelled) return;
      setPersistent(false);
      setStatus("ready");
    }, SYNC_TIMEOUT_MS);

    provider.whenSynced.then(() => {
      if (cancelled) return;
      clearTimeout(timeout);
      setStatus("ready");
    });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      void provider.destroy();
    };
  }, [canPersist, doc, name]);

  const reset = useCallback(() => {
    clearDoc(doc);
    history.clear();
  }, [doc, history]);

  return { doc, history, status, persistent, reset };
}
