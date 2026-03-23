import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import SetupForm from "@/components/admin/SetupForm";

export const metadata = { title: "First-Run Setup | Admin" };

// Never cache this page — owner status must always be checked live
export const dynamic = "force-dynamic";

export default async function SetupPage() {
  // If OWNER_SETUP_TOKEN is not configured, there's nothing to do here
  if (!process.env.OWNER_SETUP_TOKEN) return notFound();

  await dbConnect();

  // Lock the page permanently once any owner exists
  const ownerExists = await User.exists({ role: "owner" });
  if (ownerExists) return notFound();

  // If already logged in as admin from a previous partial setup, skip
  const session = await getServerSession(authOptions);
  if (session?.user?.role === "owner") redirect("/admin/dashboard");

  return <SetupForm />;
}
