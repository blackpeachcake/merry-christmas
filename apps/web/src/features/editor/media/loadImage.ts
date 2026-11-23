import imageCompression from "browser-image-compression";
import { MAX_IMAGE_EDGE } from "../model/constants";

export interface LoadedImage {
  src: string;
  width: number;
  height: number;
}

/** JPEG는 JPEG로, 나머지(PNG·WebP·HEIC 등)는 투명도를 지키도록 PNG로 */
export function pickOutputType(inputType: string): "image/jpeg" | "image/png" {
  return inputType === "image/jpeg" ? "image/jpeg" : "image/png";
}

export function measureImage(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => reject(new Error("이미지를 읽지 못했어요"));
    image.src = src;
  });
}

/** 긴 변 2048px로 줄이고 data URL로 바꾼다 */
export async function loadImageFile(file: Blob): Promise<LoadedImage> {
  const input = file instanceof File ? file : new File([file], "image", { type: file.type });
  const compressed = await imageCompression(input, {
    maxWidthOrHeight: MAX_IMAGE_EDGE,
    fileType: pickOutputType(input.type),
    initialQuality: 0.85,
    useWebWorker: true,
  });
  const src = await imageCompression.getDataUrlFromFile(compressed);
  const { width, height } = await measureImage(src);
  return { src, width, height };
}
