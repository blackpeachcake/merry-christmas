import type { Metadata, Viewport } from "next";
import { EditorLoader } from "./editor-loader";

export const metadata: Metadata = { title: "에디터 실험" };

// 캔버스 제스처와 브라우저 확대가 겹치지 않게 막는다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function EditorPage() {
  return <EditorLoader />;
}
