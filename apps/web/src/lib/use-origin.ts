import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function useOrigin() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.origin,
    () => "",
  );
}

export function useJoinLink(code: string) {
  return `${useOrigin()}/t/${code}`;
}
