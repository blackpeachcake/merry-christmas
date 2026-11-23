import * as Y from "yjs";
import { getBlocks, getMeta, getOrder, LOCAL_ORIGIN } from "./doc";
import { createId } from "./id";
import type { Background, Block, Size, StickerBlock, TextBlock, TextDraft } from "./types";

export type BlockPatch = Partial<Omit<TextBlock, "id" | "type">> &
  Partial<Omit<StickerBlock, "id" | "type">>;

const newId = () => createId();

function insertBlock(doc: Y.Doc, block: Block): void {
  doc.transact(() => {
    const map = new Y.Map<unknown>();
    for (const [key, value] of Object.entries(block)) map.set(key, value);
    getBlocks(doc).set(block.id, map);
    getOrder(doc).push([block.id]);
  }, LOCAL_ORIGIN);
}

function moveToEnd(doc: Y.Doc, id: string): void {
  const order = getOrder(doc);
  const index = order.toArray().indexOf(id);
  if (index === -1 || index === order.length - 1) return;
  order.delete(index, 1);
  order.push([id]);
}

export function addText(doc: Y.Doc, fields: Omit<TextBlock, "id" | "type">): string {
  const block: TextBlock = { id: newId(), type: "text", ...fields };
  insertBlock(doc, block);
  return block.id;
}

export function addSticker(doc: Y.Doc, fields: Omit<StickerBlock, "id" | "type">): string {
  const block: StickerBlock = { id: newId(), type: "sticker", ...fields };
  insertBlock(doc, block);
  return block.id;
}

export function updateBlock(
  doc: Y.Doc,
  id: string,
  patch: BlockPatch,
  options: { bringToFront?: boolean } = {},
): void {
  doc.transact(() => {
    const map = getBlocks(doc).get(id);
    if (!map) return;
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) map.set(key, value);
    }
    if (options.bringToFront) moveToEnd(doc, id);
  }, LOCAL_ORIGIN);
}

export function bringToFront(doc: Y.Doc, id: string): void {
  doc.transact(() => moveToEnd(doc, id), LOCAL_ORIGIN);
}

export function removeBlock(doc: Y.Doc, id: string): void {
  doc.transact(() => {
    getBlocks(doc).delete(id);
    const order = getOrder(doc);
    const index = order.toArray().indexOf(id);
    if (index !== -1) order.delete(index, 1);
  }, LOCAL_ORIGIN);
}

export function setBackground(doc: Y.Doc, background: Background): void {
  doc.transact(() => getMeta(doc).set("background", background), LOCAL_ORIGIN);
}

/**
 * 텍스트 입력 화면의 [완료] 처리.
 * - 내용이 비면: 기존 블록은 삭제, 새 텍스트는 추가하지 않음 → null
 * - 새 텍스트: 캔버스 중앙·배율 1·회전 0으로 추가 → id
 * - 기존 텍스트: 내용·스타일만 수정 → id
 */
export function commitTextDraft(
  doc: Y.Doc,
  canvas: Size,
  blockId: string | null,
  draft: TextDraft,
): string | null {
  const empty = draft.text.trim() === "";
  if (blockId === null) {
    if (empty) return null;
    return addText(doc, {
      ...draft,
      x: canvas.width / 2,
      y: canvas.height / 2,
      rotation: 0,
      scale: 1,
    });
  }
  if (empty) {
    removeBlock(doc, blockId);
    return null;
  }
  updateBlock(doc, blockId, draft);
  return blockId;
}
