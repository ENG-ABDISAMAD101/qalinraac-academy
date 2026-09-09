import { redirect } from "next/navigation";

/** Keep post-auth redirects on-site and out of auth loops. */
export function safeAuthRedirect(
  redirectParam: string | null | undefined,
  fallback: string,
) {
  if (!redirectParam) return fallback;
  if (!redirectParam.startsWith("/") || redirectParam.startsWith("//")) {
    return fallback;
  }
  if (
    redirectParam.startsWith("/auth/") ||
    redirectParam === "/auth/login" ||
    redirectParam === "/register"
  ) {
    return fallback;
  }
  return redirectParam;
}

export function authRegisterHref(redirectTo = "/register") {
  return `/auth/register?redirect=${encodeURIComponent(redirectTo)}`;
}

export function authLoginHref(redirectTo?: string) {
  if (!redirectTo) return "/auth/login";
  return `/auth/login?redirect=${encodeURIComponent(redirectTo)}`;
}

/** Legacy `/register` → canonical auth URL */
export function redirectLegacyRegister(redirectParam?: string) {
  redirect(authRegisterHref(redirectParam || "/register"));
}

/** Legacy `/login` → canonical auth URL */
export function redirectLegacyLogin(redirectParam?: string) {
  const href = redirectParam
    ? authLoginHref(redirectParam)
    : "/auth/login";
  redirect(href);
}
