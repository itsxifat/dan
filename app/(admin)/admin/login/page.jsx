import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { ADMIN_ROLES } from "@/lib/permissions";

export const metadata = {
  title: "Admin Login | Dhali's Amber Nivaas",
};

export default async function AdminLoginPage({ searchParams }) {
  const session = await getServerSession(authOptions);

  // Already authenticated admin → skip login
  if (session?.user?.role && ADMIN_ROLES.includes(session.user.role)) {
    redirect("/admin/dashboard");
  }

  const params = await searchParams;
  const error = params?.error ?? null;

  return <AdminLoginForm initialError={error} />;
}
