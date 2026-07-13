"use client";

import { useEffect, useState } from "react";

export type MonacoTheme = "vs" | "vs-dark";

export function useMonacoTheme(): MonacoTheme {
  const [theme, setTheme] = useState<MonacoTheme>("vs");

  useEffect(() => {
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const update = () => setTheme(query.matches ? "vs-dark" : "vs");

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return theme;
}
