import * as Y from "yjs";
import { HISTORY_LIMIT } from "./constants";
import { getBlocks, getMeta, getOrder, LOCAL_ORIGIN } from "./doc";

/**
 * 실행 취소 기록. 메모리에만 있고(새로고침하면 비워짐) 최근 limit 단계만 유지한다.
 * Y.UndoManager에 개수 옵션이 없어서 기록이 추가될 때 오래된 것부터 버린다.
 */
export function createHistory(doc: Y.Doc, limit: number = HISTORY_LIMIT): Y.UndoManager {
  const history = new Y.UndoManager([getMeta(doc), getBlocks(doc), getOrder(doc)], {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
    captureTimeout: 0,
  });
  history.on("stack-item-added", () => {
    while (history.undoStack.length > limit) history.undoStack.shift();
  });
  return history;
}
