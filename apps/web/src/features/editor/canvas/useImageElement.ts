import { useEffect, useState } from "react";

/** src를 HTMLImageElement로 불러온다. 불러오기 전에는 null. */
export function useImageElement(src: string | null): HTMLImageElement | null {
  const [loaded, setLoaded] = useState<{ src: string; element: HTMLImageElement } | null>(null);

  useEffect(() => {
    if (!src) return;
    const element = new Image();
    element.onload = () => setLoaded({ src, element });
    element.src = src;
    return () => {
      element.onload = null;
    };
  }, [src]);

  return loaded && loaded.src === src ? loaded.element : null;
}
