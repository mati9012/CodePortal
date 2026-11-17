import { useSyncExternalStore } from "react";

const SERVER_NOW = 0;

export function useNow(intervalMs = 1000) {
  return useSyncExternalStore(
    (onTick) => {
      const id = setInterval(onTick, intervalMs);
      return () => clearInterval(id);
    },
    () => Math.floor(Date.now() / intervalMs) * intervalMs,
    () => SERVER_NOW,
  );
}
