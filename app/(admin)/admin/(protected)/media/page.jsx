import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getMedia, getFolders } from "@/actions/admin/mediaActions";
import MediaLibrary from "./MediaLibrary";
import PageHeader from "@/components/admin/PageHeader";

export const metadata = { title: "Media Library — Admin" };
export const dynamic  = "force-dynamic";

export default async function MediaPage() {
  const session = await getServerSession(authOptions);
  if (!hasPermission(session?.user?.role, "dashboard.read")) redirect("/admin/login");

  const [data, folders] = await Promise.all([
    getMedia({ page: 1, limit: 48 }),
    getFolders(),
  ]);

  const totalFiles   = folders.reduce((s, f) => s + (f.count || 0), 0);
  const folderCount  = folders.length;

  return (
    <div className="p-5 sm:p-7 space-y-6 max-w-[1600px]">
      <PageHeader
        title="Media Library"
        subtitle="Upload, organise and manage all site images"
        count={`${totalFiles} file${totalFiles !== 1 ? "s" : ""} · ${folderCount} folder${folderCount !== 1 ? "s" : ""}`}
      />

      <MediaLibrary initialData={data} initialFolders={folders} />
    </div>
  );
}
