import type { Metadata } from "next";
import { ResetRequest } from "./reset-request";

export const metadata: Metadata = { title: "Reset hasła · CodePortal" };

export default function ResetPage() {
  return <ResetRequest />;
}
