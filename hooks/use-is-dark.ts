"use client";

import { useEffect, useState } from "react";

/**
 * Whether the dark palette is active, read from the `.dark` class next-themes
 * puts on <html>. Charts need the actual value (SVG fills cannot be a CSS
 * variable that changes per theme without a repaint), so this observes the
 * class instead of guessing.
 *
 * Starts as `false` and syncs after mount, so server and client agree on the
 * first paint.
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setIsDark(root.classList.contains("dark"));

    read();

    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  return isDark;
}
