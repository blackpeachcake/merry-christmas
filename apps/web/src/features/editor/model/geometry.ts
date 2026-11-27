import {
  LONG_PRESS_MS,
  ROTATION_SNAP_DEG,
  SCALE_BOUNDS,
  SNAP_DISTANCE,
  STICKER_INITIAL_RATIO,
} from "./constants";
import type { Point, Size } from "./types";

export function fitScale(canvas: Size, viewport: Size): number {
  return Math.min(viewport.width / canvas.width, viewport.height / canvas.height);
}

export function snapToCenter(
  pos: Point,
  canvas: Size,
  distance: number = SNAP_DISTANCE,
): Point & { guideX: boolean; guideY: boolean } {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const guideX = Math.abs(pos.x - cx) <= distance;
  const guideY = Math.abs(pos.y - cy) <= distance;
  return { x: guideX ? cx : pos.x, y: guideY ? cy : pos.y, guideX, guideY };
}

export function normalizeDeg(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return d > 180 ? d - 360 : d;
}

export function snapRotation(deg: number, threshold: number = ROTATION_SNAP_DEG): number {
  return Math.abs(normalizeDeg(deg)) <= threshold ? 0 : deg;
}

export function isInside(
  point: Point,
  rect: { left: number; top: number; right: number; bottom: number },
  padding = 0,
): boolean {
  return (
    point.x >= rect.left - padding &&
    point.x <= rect.right + padding &&
    point.y >= rect.top - padding &&
    point.y <= rect.bottom + padding
  );
}

export function applyPinch(
  start: { scale: number; rotation: number },
  movement: [number, number],
): { scale: number; rotation: number } {
  const [ratio, angle] = movement;
  const scale = Math.min(SCALE_BOUNDS.max, Math.max(SCALE_BOUNDS.min, start.scale * ratio));
  return { scale, rotation: start.rotation + angle };
}

export function coverRect(
  image: Size,
  box: Size,
): { x: number; y: number; width: number; height: number } {
  const scale = Math.max(box.width / image.width, box.height / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  return { x: (box.width - width) / 2, y: (box.height - height) / 2, width, height };
}

export function stickerInitialScale(image: Size, canvas: Size): number {
  const target = Math.min(canvas.width, canvas.height) * STICKER_INITIAL_RATIO;
  return target / Math.max(image.width, image.height);
}

/** 짧게 누른 것만 탭으로 본다. 꾹 누르기는 휴대폰 기본 붙여넣기 메뉴에 양보한다. */
export function isQuickTap(elapsedMs: number): boolean {
  return elapsedMs < LONG_PRESS_MS;
}
