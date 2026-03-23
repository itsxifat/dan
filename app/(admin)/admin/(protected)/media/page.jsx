import { getMedia } from "@/actions/admin/mediaActions";
import MediaLibrary from "./MediaLibrary";

export const metadata = { title: "Media Library — Admin" };
export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const data = await getMedia({ page: 1, limit: 48 });

  return (
    <div className="p-5 sm:p-7 max-w-7xl">
      <MediaLibrary initialData={data} />
    </div>
  );
}
