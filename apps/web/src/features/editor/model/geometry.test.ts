import { describe, expect, it } from "vitest";
import {
  applyPinch,
  coverRect,
  fitScale,
  isInside,
  isQuickTap,
  normalizeDeg,
  snapRotation,
  snapToCenter,
  stickerInitialScale,
} from "./geometry";

const canvas = { width: 1080, height: 1920 };

describe("geometry", () => {
  it("fitScale은 캔버스가 화면 안에 다 들어가는 배율이다", () => {
    expect(fitScale(canvas, { width: 360, height: 800 })).toBeCloseTo(1 / 3);
    expect(fitScale(canvas, { width: 1000, height: 960 })).toBeCloseTo(0.5);
  });

  it("snapToCenter는 중앙 근처면 달라붙고 가이드를 켠다", () => {
    expect(snapToCenter({ x: 530, y: 100 }, canvas, 24)).toEqual({
      x: 540,
      y: 100,
      guideX: true,
      guideY: false,
    });
    expect(snapToCenter({ x: 100, y: 975 }, canvas, 24)).toEqual({
      x: 100,
      y: 960,
      guideX: false,
      guideY: true,
    });
    expect(snapToCenter({ x: 500, y: 900 }, canvas, 24)).toEqual({
      x: 500,
      y: 900,
      guideX: false,
      guideY: false,
    });
  });

  it("normalizeDeg는 (-180, 180]로 맞춘다", () => {
    expect(normalizeDeg(370)).toBe(10);
    expect(normalizeDeg(-190)).toBe(170);
    expect(normalizeDeg(180)).toBe(180);
  });

  it("snapRotation은 0° 근처에서만 0으로 맞춘다", () => {
    expect(snapRotation(3, 5)).toBe(0);
    expect(snapRotation(-4, 5)).toBe(0);
    expect(snapRotation(363, 5)).toBe(0);
    expect(snapRotation(30, 5)).toBe(30);
  });

  it("isInside는 패딩만큼 넓힌 사각형으로 판정한다", () => {
    const rect = { left: 100, top: 100, right: 200, bottom: 200 };
    expect(isInside({ x: 150, y: 150 }, rect)).toBe(true);
    expect(isInside({ x: 90, y: 150 }, rect)).toBe(false);
    expect(isInside({ x: 90, y: 150 }, rect, 16)).toBe(true);
  });

  it("applyPinch는 시작 값에 배율을 곱하고 각도를 더하며, 배율 범위를 지킨다", () => {
    expect(applyPinch({ scale: 2, rotation: 10 }, [1.5, 20])).toEqual({ scale: 3, rotation: 30 });
    expect(applyPinch({ scale: 1, rotation: 0 }, [0.01, 0]).scale).toBe(0.1);
    expect(applyPinch({ scale: 5, rotation: 0 }, [5, 0]).scale).toBe(10);
  });

  it("coverRect는 박스를 꽉 채우도록 가운데 맞춘다", () => {
    expect(coverRect({ width: 200, height: 100 }, { width: 100, height: 100 })).toEqual({
      x: -50,
      y: 0,
      width: 200,
      height: 100,
    });
  });

  it("stickerInitialScale은 긴 변을 캔버스 짧은 변의 50%에 맞춘다", () => {
    expect(stickerInitialScale({ width: 1080, height: 540 }, canvas)).toBeCloseTo(0.5);
  });

  // 꾹 누른 뒤 떼는 것까지 탭으로 보면, 붙여넣기 메뉴를 텍스트 입력 화면이 가린다.
  it("isQuickTap은 짧게 누른 것만 탭으로 본다", () => {
    expect(isQuickTap(120)).toBe(true);
    expect(isQuickTap(449)).toBe(true);
    expect(isQuickTap(450)).toBe(false);
    expect(isQuickTap(900)).toBe(false);
  });
});
