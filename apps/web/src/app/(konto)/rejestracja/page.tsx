import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Załóż konto · CodePortal" };

export default function RegisterPage() {
  return <RegisterForm />;
}
