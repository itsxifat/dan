import WeddingGalleryManager from "./WeddingGalleryManager";
import { getAllWeddingPhotos } from "@/actions/wedding/weddingActions";

export const metadata = { title: "Wedding Gallery — Admin" };

export default async function WeddingGalleryPage() {
  const data = await getAllWeddingPhotos({ page: 1, limit: 48 });
  return <WeddingGalleryManager initialData={data} />;
}
