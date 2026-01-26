import { redirect } from "next/navigation";

// Public registration is disabled
// Only administrators can create new users via /usuarios
export default function RegisterPage() {
  redirect("/login");
}
