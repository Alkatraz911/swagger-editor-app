"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { credentialsSchema, type Credentials } from "@/lib/auth/schema";
import { signIn, signUp } from "@/lib/auth/actions";

type AuthMode = "sign-in" | "sign-up";

const inputClass =
  "rounded border border-black/15 bg-transparent px-3 py-2 dark:border-white/20";

export function AuthForm({ mode }: { mode: AuthMode }) {
  const t = useTranslations("auth");
  const isSignIn = mode === "sign-in";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Credentials>({
    resolver: zodResolver(credentialsSchema),
    mode: "onTouched",
  });

  async function onSubmit({ email, password }: Credentials) {
    const action = isSignIn ? signIn : signUp;
    try {
      const result = await action(email, password);
      if (result?.error) toast.error(result.error);
    } catch (error) {
      // A successful sign-in/up redirects via the server action, which surfaces
      // here as Next's redirect control-flow error — re-throw it so the
      // navigation happens; only show a toast for genuine failures.
      unstable_rethrow(error);
      toast.error(t("failed"));
    }
  }

  const emailError = errors.email?.message;
  const passwordError = errors.password?.message;

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <h1 className="text-xl font-semibold">
          {t(isSignIn ? "signInTitle" : "signUpTitle")}
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            {t("email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            {...register("email")}
          />
          {emailError && (
            <p role="alert" className="text-sm text-red-600">
              {t(`errors.${emailError}`)}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            {t("password")}
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            className={inputClass}
            {...register("password")}
          />
          {passwordError && (
            <p role="alert" className="text-sm text-red-600">
              {t(`errors.${passwordError}`)}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-foreground px-4 py-2 font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {t(isSignIn ? "signIn" : "signUp")}
        </button>

        <p className="text-center text-sm opacity-70">
          {isSignIn ? t("noAccount") : t("haveAccount")}{" "}
          <Link
            href={isSignIn ? "/sign-up" : "/sign-in"}
            className="font-medium underline"
          >
            {t(isSignIn ? "signUp" : "signIn")}
          </Link>
        </p>
      </form>
    </div>
  );
}
