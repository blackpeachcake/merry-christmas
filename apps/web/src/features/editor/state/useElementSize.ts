import { useCallback, useEffect, useState } from "react";
import type { Size } from "../model/types";

/** 요소 크기를 추적한다. 반환한 ref 콜백을 요소에 붙인다. */
export function useElementSize<T extends HTMLElement>(): [(el: T | null) => void, Size] {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  const ref = useCallback((el: T | null) => setElement(el), []);
  return [ref, size];
}
