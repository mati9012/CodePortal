"use client";

import { useSyncExternalStore } from "react";
import { SegmentedControl } from "./tabs";
import { THEME_STORAGE_KEY as STORAGE_KEY } from "./theme-script";

export type ThemePreference = "light" | "dark" | "system";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

export function setThemePreference(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") delete root.dataset.theme;
  else root.dataset.theme = pref;
  try {
    if (pref === "system") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, pref);
  } catch {
  }
  listeners.forEach((l) => l());
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readPreference,
    () => "system",
  );
}

export function ThemeSwitcher({ withSystem = true }: { withSystem?: boolean }) {
  const pref = useThemePreference();
  const options = [
    { value: "light", label: "Jasny" },
    { value: "dark", label: "Ciemny" },
    ...(withSystem ? [{ value: "system", label: "Systemowy" }] : []),
  ];
  return (
    <SegmentedControl
      aria-label="Motyw"
      options={options}
      value={pref}
      onChange={(v) => setThemePreference(v as ThemePreference)}
    />
  );
}
