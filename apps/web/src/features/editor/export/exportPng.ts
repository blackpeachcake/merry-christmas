import type Konva from "konva";

/** 화면에 축소돼 그려진 Stage를 논리 해상도 PNG로 만든다. */
export async function exportStageToPng(stage: Konva.Stage, logicalWidth: number): Promise<Blob> {
  const pixelRatio = logicalWidth / stage.width();
  return (await stage.toBlob({ pixelRatio, mimeType: "image/png" })) as Blob;
}

/** iOS 등 파일 공유가 되면 공유 시트(“이미지 저장”), 아니면 파일 다운로드 */
export async function saveImage(
  blob: Blob,
  filename: string,
  nav: Pick<Navigator, "canShare" | "share"> = navigator,
): Promise<"shared" | "downloaded" | "cancelled"> {
  const file = new File([blob], filename, { type: "image/png" });

  if (typeof nav.canShare === "function" && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file] });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // 그 외 실패는 다운로드로 대체
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
