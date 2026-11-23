import { useCallback, useRef, useSyncExternalStore } from "react";
import type * as Y from "yjs";
import { readSnapshot } from "../model/doc";
import type { EditorSnapshot } from "../model/types";

/** Y.Doc 변경을 React 렌더로 연결한다. 문서가 바뀔 때만 새 스냅샷을 만든다. */
export function useDocSnapshot(doc: Y.Doc): EditorSnapshot | null {
  const cache = useRef<{ snapshot: EditorSnapshot | null } | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = () => {
        cache.current = null;
        onChange();
      };
      doc.on("update", handler);
      return () => doc.off("update", handler);
    },
    [doc],
  );

  const getSnapshot = useCallback(() => {
    if (cache.current === null) cache.current = { snapshot: readSnapshot(doc) };
    return cache.current.snapshot;
  }, [doc]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
