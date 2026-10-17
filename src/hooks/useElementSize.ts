import { useCallback, useEffect, useState } from 'react';

/** Observe conditional elements as soon as they mount, including after uploads. */
export function useElementSize<T extends HTMLElement>() {
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: 900, height: 560 });
  const ref = useCallback((node: T | null) => setElement(node), []);
  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const next = { width: entry.contentRect.width, height: entry.contentRect.height };
      setSize(previous => previous.width === next.width && previous.height === next.height ? previous : next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return { ref, size };
}
