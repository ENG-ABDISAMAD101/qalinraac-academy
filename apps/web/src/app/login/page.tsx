import { redirectLegacyLogin } from "@/lib/auth-routes";

export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  redirectLegacyLogin(sp.redirect);
}
