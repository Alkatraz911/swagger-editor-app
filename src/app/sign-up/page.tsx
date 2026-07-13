import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/get-user";
import { AuthForm } from "@/components/auth/auth-form";

export default async function SignUpPage() {
  const user = await getUser();
  if (user) redirect("/");

  return <AuthForm mode="sign-up" />;
}
