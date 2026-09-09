"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { OnlineClassroomVisual } from "@/components/auth/OnlineClassroomVisual";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { portalPathForRole, useAuth } from "@/lib/auth-context";
import { authRegisterHref, safeAuthRedirect } from "@/lib/auth-routes";
import { getApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";
import { PageLoader, Spinner } from "@/components/ui/spinner";

const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

function FieldIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function destinationFor(role: string) {
    return safeAuthRedirect(redirectParam, portalPathForRole(role));
  }

  useEffect(() => {
    if (loading || !user) return;
    router.replace(destinationFor(user.role));
  }, [loading, user, router, redirectParam]);

  async function onSubmit(values: LoginFormValues) {
    setIsLoading(true);
    setFormError("");
    try {
      const signedIn = await login(values.email, values.password);
      router.push(destinationFor(signedIn.role));
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Could not sign in. Check your credentials."));
    } finally {
      setIsLoading(false);
    }
  }

  const registerHref = authRegisterHref(redirectParam ?? "/register");

  return (
    <div className="min-h-screen bg-canvas text-foreground">
      <header className="border-b border-border/70 bg-background">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold lowercase text-primary-foreground">
              q
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-bold leading-tight text-primary">
                Qalinraac
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Learn. Build. Grow.
              </p>
            </div>
          </Link>
          <p className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">New here? </span>
            <Link
              href={registerHref}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Create account
            </Link>
          </p>
        </div>
      </header>

      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl lg:grid-cols-[1.1fr_0.9fr]">
        <section className="order-1 flex items-center justify-center px-4 py-10 sm:px-8 lg:order-2 lg:border-l lg:border-border/70 lg:py-12">
          <div className="w-full max-w-md">
            <div className="rounded-[1.75rem] border border-border/80 bg-card p-6 shadow-[0_20px_50px_-30px_rgba(28,30,33,0.35)] sm:p-8">
              <h1 className="font-display text-3xl font-bold tracking-tight text-primary">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to continue learning with expert instructors.
              </p>

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-4"
                noValidate
              >
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <FieldIcon>
                      <Mail className="h-4 w-4" />
                    </FieldIcon>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className={cn(
                        "rounded-2xl pl-11",
                        errors.email && "border-destructive ring-destructive/30",
                      )}
                      {...register("email")}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <FieldIcon>
                      <Lock className="h-4 w-4" />
                    </FieldIcon>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className={cn(
                        "rounded-2xl pl-11 pr-11",
                        errors.password &&
                          "border-destructive ring-destructive/30",
                      )}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                {formError ? (
                  <p className="text-sm text-destructive">{formError}</p>
                ) : null}

                <Button
                  type="submit"
                  disabled={isLoading}
                  aria-busy={isLoading}
                  className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold"
                >
                  {isLoading ? (
                    <>
                      <Spinner
                        className="sm on-primary"
                        label="Signing in"
                      />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  href={registerHref}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </section>

        <section className="order-2 border-t border-border/70 lg:order-1 lg:border-t-0">
          <OnlineClassroomVisual />
        </section>
      </main>
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense fallback={<PageLoader label="Loading sign in" className="bg-canvas" />}>
      <LoginForm />
    </Suspense>
  );
}
