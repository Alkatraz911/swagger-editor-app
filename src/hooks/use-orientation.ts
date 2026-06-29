"use client";

import { useEffect, useState } from "react";

export type Orientation = "horizontal" | "vertical";

/**
 * Returns "horizontal" when the viewport is landscape (width > height) and
 * "vertical" when it is portrait. Drives the responsive split view.
 */
export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>("horizontal");

  useEffect(() => {
    const query = window.matchMedia("(orientation: portrait)");
    const update = () =>
      setOrientation(query.matches ? "vertical" : "horizontal");

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return orientation;
}
