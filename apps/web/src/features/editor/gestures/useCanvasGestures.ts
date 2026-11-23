"use client";

import { useGesture } from "@use-gesture/react";
import type Konva from "konva";
import { type RefObject, useLayoutEffect, useRef } from "react";
import type * as Y from "yjs";
import { applyPinch, isInside, snapRotation, snapToCenter } from "../model/geometry";
import { removeBlock, updateBlock } from "../model/operations";
import type { Size } from "../model/types";
import { useUiStore } from "../state/uiStore";

interface Options {
  targetRef: RefObject<HTMLDivElement | null>;
  stageRef: RefObject<Konva.Stage | null>;
  doc: Y.Doc;
  canvas: Size;
  viewScale: number;
  trashRef: RefObject<HTMLDivElement | null>;
  enabled: boolean;
  onTapBlock(id: string): void;
  onTapEmpty(): void;
}

type Hit = { kind: "block"; node: Konva.Group } | { kind: "handle" } | { kind: "empty" };

interface Active {
  node: Konva.Group;
  dragging: boolean;
  pinching: boolean;
  /** 드래그 기준 위치와, 그때의 movement 값 */
  base: { x: number; y: number };
  movementBase: [number, number];
  rebase: boolean;
  pinchStart: {
    scale: number;
    rotation: number;
    x: number;
    y: number;
    origin: [number, number];
  } | null;
  overTrash: boolean;
}

export function useCanvasGestures(options: Options): void {
  const active = useRef<Active | null>(null);
  // 제스처 핸들러가 항상 최신 옵션(viewScale 등)을 보도록 렌더 후에 동기화한다.
  const opts = useRef(options);
  useLayoutEffect(() => {
    opts.current = options;
  });

  function hitTest(clientX: number, clientY: number): Hit {
    const stage = opts.current.stageRef.current;
    if (!stage) return { kind: "empty" };
    const rect = stage.container().getBoundingClientRect();
    const shape = stage.getIntersection({ x: clientX - rect.left, y: clientY - rect.top });
    if (!shape) return { kind: "empty" };
    if (shape.findAncestor("Transformer")) return { kind: "handle" };
    const group = shape.findAncestor(".block") as Konva.Group | undefined;
    return group ? { kind: "block", node: group } : { kind: "empty" };
  }

  function begin(node: Konva.Group): Active {
    node.moveToTop();
    const next: Active = {
      node,
      dragging: false,
      pinching: false,
      base: { x: node.x(), y: node.y() },
      movementBase: [0, 0],
      rebase: false,
      pinchStart: null,
      overTrash: false,
    };
    active.current = next;
    return next;
  }

  /** 드래그·핀치가 모두 끝났을 때 한 번만 문서에 기록한다. */
  function finishIfIdle() {
    const a = active.current;
    if (!a || a.dragging || a.pinching) return;
    const ui = useUiStore.getState();
    const id = a.node.id();
    if (a.overTrash) {
      removeBlock(opts.current.doc, id);
    } else {
      updateBlock(
        opts.current.doc,
        id,
        { x: a.node.x(), y: a.node.y(), scale: a.node.scaleX(), rotation: a.node.rotation() },
        { bringToFront: true },
      );
    }
    a.node.opacity(1);
    active.current = null;
    ui.resetGesture();
  }

  useGesture(
    {
      onDrag: ({ first, last, tap, initial, xy, movement, pinching }) => {
        if (!opts.current.enabled) return;
        const ui = useUiStore.getState();

        if (tap && last) {
          const hit = hitTest(xy[0], xy[1]);
          if (hit.kind === "block") opts.current.onTapBlock(hit.node.id());
          else if (hit.kind === "empty") opts.current.onTapEmpty();
          return;
        }

        if (first) {
          if (active.current) {
            active.current.dragging = true;
          } else {
            const hit = hitTest(initial[0], initial[1]);
            if (hit.kind !== "block") return;
            begin(hit.node).dragging = true;
          }
          ui.setDragging(true);
        }

        const a = active.current;
        if (!a) return;

        if (last) {
          a.dragging = false;
          finishIfIdle();
          return;
        }

        if (pinching || a.pinching) {
          a.rebase = true;
          return;
        }
        if (a.rebase) {
          a.base = { x: a.node.x(), y: a.node.y() };
          a.movementBase = [movement[0], movement[1]];
          a.rebase = false;
        }

        const { viewScale, canvas, trashRef } = opts.current;
        const raw = {
          x: a.base.x + (movement[0] - a.movementBase[0]) / viewScale,
          y: a.base.y + (movement[1] - a.movementBase[1]) / viewScale,
        };
        const snapped = snapToCenter(raw, canvas);
        a.node.position({ x: snapped.x, y: snapped.y });
        ui.setGuides({ x: snapped.guideX, y: snapped.guideY });

        const trash = trashRef.current?.getBoundingClientRect();
        a.overTrash = trash ? isInside({ x: xy[0], y: xy[1] }, trash, 16) : false;
        a.node.opacity(a.overTrash ? 0.5 : 1);
        ui.setOverTrash(a.overTrash);
        a.node.getLayer()?.batchDraw();
      },

      onPinch: ({ first, last, origin, movement }) => {
        if (!opts.current.enabled) return;

        if (first) {
          let a = active.current;
          if (!a) {
            const hit = hitTest(origin[0], origin[1]);
            if (hit.kind !== "block") return;
            a = begin(hit.node);
          }
          a.pinching = true;
          a.overTrash = false;
          a.node.opacity(1);
          a.pinchStart = {
            scale: a.node.scaleX(),
            rotation: a.node.rotation(),
            x: a.node.x(),
            y: a.node.y(),
            origin: [origin[0], origin[1]],
          };
          useUiStore.getState().setDragging(true);
          useUiStore.getState().setOverTrash(false);
        }

        const a = active.current;
        if (!a || !a.pinchStart) return;

        if (last) {
          a.pinching = false;
          a.pinchStart = null;
          a.rebase = true;
          finishIfIdle();
          return;
        }

        const { viewScale } = opts.current;
        const next = applyPinch(a.pinchStart, [movement[0], movement[1]]);
        a.node.scale({ x: next.scale, y: next.scale });
        a.node.rotation(snapRotation(next.rotation));
        a.node.position({
          x: a.pinchStart.x + (origin[0] - a.pinchStart.origin[0]) / viewScale,
          y: a.pinchStart.y + (origin[1] - a.pinchStart.origin[1]) / viewScale,
        });
        a.node.getLayer()?.batchDraw();
      },
    },
    {
      target: options.targetRef,
      eventOptions: { passive: false },
      drag: { filterTaps: true, pointer: { touch: true } },
      pinch: { scaleBounds: { min: 0.1, max: 10 }, rubberband: false },
    },
  );
}
