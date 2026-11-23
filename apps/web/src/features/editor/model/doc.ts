import * as Y from "yjs";
import type { Background, Block, EditorSnapshot, Ratio } from "./types";

/** 사용자 조작. 실행 취소 대상. */
export const LOCAL_ORIGIN = Symbol("local");
/** 초기화·새로 만들기. 실행 취소 대상 아님. */
export const SYSTEM_ORIGIN = Symbol("system");

const KEYS = { meta: "meta", blocks: "blocks", order: "order" } as const;

export function createEditorDoc(): Y.Doc {
  return new Y.Doc();
}

export const getMeta = (doc: Y.Doc) => doc.getMap<unknown>(KEYS.meta);
export const getBlocks = (doc: Y.Doc) => doc.getMap<Y.Map<unknown>>(KEYS.blocks);
export const getOrder = (doc: Y.Doc) => doc.getArray<string>(KEYS.order);

export function initDoc(doc: Y.Doc, ratio: Ratio, background: Background): void {
  doc.transact(() => {
    const meta = getMeta(doc);
    meta.set("ratio", ratio);
    meta.set("background", background);
  }, SYSTEM_ORIGIN);
}

export function clearDoc(doc: Y.Doc): void {
  doc.transact(() => {
    getMeta(doc).clear();
    getBlocks(doc).clear();
    const order = getOrder(doc);
    order.delete(0, order.length);
  }, SYSTEM_ORIGIN);
}

export function readSnapshot(doc: Y.Doc): EditorSnapshot | null {
  const meta = getMeta(doc);
  const ratio = meta.get("ratio") as Ratio | undefined;
  const background = meta.get("background") as Background | undefined;
  if (!ratio || !background) return null;

  const blockMaps = getBlocks(doc);
  const blocks: Block[] = [];
  for (const id of getOrder(doc).toArray()) {
    const map = blockMaps.get(id);
    if (map) blocks.push(map.toJSON() as Block);
  }
  return { ratio, background, blocks };
}
