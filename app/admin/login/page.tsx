import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { verifyUserSessionToken, USER_COOKIE_NAME } from "@/lib/user-token";
import { verifySessionToken, ADMIN_COOKIE_NAME, SUPER_ADMIN_EMAIL } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function AdminLoginRedirectPage() {
  const cookieStore = await cookies();
  const userToken = cookieStore.get(USER_COOKIE_NAME)?.value;

  if (userToken) {
    const payload = await verifyUserSessionToken(userToken);
    if (
      payload?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
      payload?.role === "superadmin" ||
      payload?.role === "admin"
    ) {
      redirect("/admin");
    }
  }

  const adminToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (adminToken && (await verifySessionToken(adminToken))) {
    redirect("/admin");
  }

  redirect("/");
}
