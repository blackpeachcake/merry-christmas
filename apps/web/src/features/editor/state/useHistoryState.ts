import { useCallback, useRef, useSyncExternalStore } from "react";
import type * as Y from "yjs";

type HistoryState = { canUndo: boolean; canRedo: boolean };
const EVENTS = ["stack-item-added", "stack-item-popped", "stack-cleared"] as const;

export function useHistoryState(history: Y.UndoManager): HistoryState {
  const cache = useRef<HistoryState>({ canUndo: false, canRedo: false });

  const subscribe = useCallback(
    (onChange: () => void) => {
      for (const event of EVENTS) history.on(event, onChange);
      return () => {
        for (const event of EVENTS) history.off(event, onChange);
      };
    },
    [history],
  );

  const getSnapshot = useCallback(() => {
    const next = { canUndo: history.canUndo(), canRedo: history.canRedo() };
    if (next.canUndo !== cache.current.canUndo || next.canRedo !== cache.current.canRedo) {
      cache.current = next;
    }
    return cache.current;
  }, [history]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
