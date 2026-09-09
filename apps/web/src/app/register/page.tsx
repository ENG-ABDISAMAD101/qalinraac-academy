import { redirectLegacyRegister } from "@/lib/auth-routes";

export default async function LegacyRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const sp = await searchParams;
  redirectLegacyRegister(sp.redirect);
}
