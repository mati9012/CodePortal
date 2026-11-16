"use client";

import { authClient } from "@/lib/auth-client";

export function Greeting() {
  const { data } = authClient.useSession();
  const first = data?.user.name.split(" ")[0];
  return <>Dzień dobry{first ? `, ${first}` : ""}!</>;
}
