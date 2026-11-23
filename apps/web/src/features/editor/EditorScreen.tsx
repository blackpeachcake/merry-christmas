"use client";

import type Konva from "konva";
import { useEffect, useRef, useState } from "react";
import { EditorStage } from "./canvas/EditorStage";
import { useCanvasGestures } from "./gestures/useCanvasGestures";
import { ensureFontsLoaded } from "./media/fonts";
import { CANVAS_SIZE, DEFAULT_TEXT_DRAFT } from "./model/constants";
import { fitScale } from "./model/geometry";
import { commitTextDraft, updateBlock } from "./model/operations";
import type { EditorSnapshot, TextDraft } from "./model/types";
import { useUiStore } from "./state/uiStore";
import type { EditorDocHandle } from "./state/useEditorDoc";
import { useElementSize } from "./state/useElementSize";
import { useHistoryState } from "./state/useHistoryState";
import { TextComposer } from "./ui/TextComposer";
import { TopBar } from "./ui/TopBar";
import { TrashZone } from "./ui/TrashZone";

export function EditorScreen({
  handle,
  snapshot,
}: {
  handle: EditorDocHandle;
  snapshot: EditorSnapshot;
}) {
  const { doc, history } = handle;
  const stageRef = useRef<Konva.Stage | null>(null);
  const [areaRef, area] = useElementSize<HTMLDivElement>();
  const [fontsVersion, setFontsVersion] = useState(0);
  const { canUndo, canRedo } = useHistoryState(history);
  const ui = useUiStore();

  const canvas = CANVAS_SIZE[snapshot.ratio];
  const viewScale = area.width > 0 ? fitScale(canvas, area) : 0;

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const trashRef = useRef<HTMLDivElement | null>(null);
  const finePointer = typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches;

  function handleTapBlock(id: string) {
    const block = snapshot.blocks.find((b) => b.id === id);
    if (!block) return;
    if (finePointer && ui.selectedId !== id) {
      ui.select(id);
      return;
    }
    if (block.type === "text") ui.openComposer(id);
  }

  function handleTapEmpty() {
    if (finePointer && ui.selectedId) {
      ui.select(null);
      return;
    }
    ui.openComposer(null);
  }

  function composerInitial(): TextDraft {
    const id = ui.composer?.blockId;
    const block = id ? snapshot.blocks.find((b) => b.id === id) : undefined;
    if (block?.type !== "text") return DEFAULT_TEXT_DRAFT;
    const { text, fontId, fontSize, color, align, textBg } = block;
    return { text, fontId, fontSize, color, align, textBg };
  }

  useCanvasGestures({
    targetRef: canvasRef,
    stageRef,
    doc,
    canvas,
    viewScale,
    trashRef,
    enabled: ui.composer === null && ui.sheet === null && viewScale > 0,
    onTapBlock: handleTapBlock,
    onTapEmpty: handleTapEmpty,
  });

  // 폰트 조각이 새로 로드되면 글자 폭을 다시 잰다.
  useEffect(() => {
    const onLoaded = () => setFontsVersion((v) => v + 1);
    document.fonts.addEventListener("loadingdone", onLoaded);
    return () => document.fonts.removeEventListener("loadingdone", onLoaded);
  }, []);

  useEffect(() => {
    void ensureFontsLoaded(snapshot.blocks);
  }, [snapshot.blocks]);

  // iOS Safari의 페이지 핀치 확대를 막는다.
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("gesturestart", prevent);
    return () => document.removeEventListener("gesturestart", prevent);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-neutral-950">
      <TopBar
        hidden={ui.dragging}
        canUndo={canUndo}
        canRedo={canRedo}
        exporting={ui.exporting}
        onClose={() => {}}
        onUndo={() => history.undo()}
        onRedo={() => history.redo()}
        onBackground={() => ui.openSheet("background")}
        onText={() => ui.openComposer(null)}
        onSticker={() => ui.openSheet("sticker")}
        onExport={() => {}}
      />
      <div
        ref={areaRef}
        className="relative flex flex-1 items-center justify-center overflow-hidden"
      >
        {viewScale > 0 && (
          <div
            ref={canvasRef}
            data-testid="editor-canvas"
            data-block-count={snapshot.blocks.length}
            className="touch-none select-none"
          >
            <EditorStage
              snapshot={snapshot}
              viewScale={viewScale}
              stageRef={stageRef}
              fontsVersion={fontsVersion}
              selectedId={ui.selectedId}
              guides={ui.guides}
              showOverlay={!ui.exporting}
              onTransformEnd={(id, node) =>
                updateBlock(
                  doc,
                  id,
                  { x: node.x(), y: node.y(), scale: node.scaleX(), rotation: node.rotation() },
                  { bringToFront: true },
                )
              }
            />
          </div>
        )}
        <TrashZone ref={trashRef} visible={ui.dragging} active={ui.overTrash} />
      </div>
      {ui.composer && (
        <TextComposer
          key={ui.composer.blockId ?? "new"}
          initial={composerInitial()}
          onDone={(draft) => {
            commitTextDraft(doc, canvas, ui.composer?.blockId ?? null, draft);
            ui.closeComposer();
          }}
        />
      )}
    </div>
  );
}
