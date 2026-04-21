import dynamic from "next/dynamic";
import Hero from "../../components/ui/Hero";
import AboutSection from "../../components/sections/AboutSection";
import { getProperties } from "@/actions/accommodation/propertyActions";
import { getPublishedGalleryPhotos, getGalleryCategories } from "@/actions/gallery/galleryActions";
import { getActiveDayLongPackages } from "@/actions/accommodation/dayLongPackageActions";
import { getContactInfo } from "@/actions/contact/contactActions";

// Below-fold sections: code-split into separate JS chunks.
// HTML is still server-rendered (ssr: true default) so SEO is unaffected.
const RoomsSection       = dynamic(() => import("../../components/sections/RoomsSection"));
const ExperienceSection  = dynamic(() => import("../../components/sections/ExperienceSection"));
const GallerySection     = dynamic(() => import("../../components/sections/GallerySection"));
const TestimonialsSection= dynamic(() => import("../../components/sections/TestimonialsSection"));
const PackagesSection    = dynamic(() => import("../../components/sections/PackagesSection"));
const CorporateSection   = dynamic(() => import("../../components/sections/CorporateSection"));
const WeddingSection     = dynamic(() => import("../../components/sections/WeddingSection"));
const DiningSection      = dynamic(() => import("../../components/sections/DiningSection"));
const CtaSection         = dynamic(() => import("../../components/sections/CtaSection"));
const FooterSection      = dynamic(() => import("../../components/sections/FooterSection"));

export default async function Home() {
  const [{ properties }, galleryPhotos, galleryCategories, dayLongServices, contactInfo] = await Promise.all([
    getProperties({ onlyActive: true, limit: 6 }),
    getPublishedGalleryPhotos({ limit: 24 }),
    getGalleryCategories(),
    getActiveDayLongPackages(),
    getContactInfo(),
  ]);

  return (
    <main className="flex min-h-screen flex-col">
      <Hero />
      <AboutSection />
      <RoomsSection properties={properties} />
      <ExperienceSection />
      <GallerySection
        photos={galleryPhotos}
        categories={galleryCategories.map((c) => c.name)}
      />
      <TestimonialsSection />
      <PackagesSection services={dayLongServices} />
      <CorporateSection />
      <WeddingSection />
      <DiningSection />
      <CtaSection />
      <FooterSection contactInfo={contactInfo} />
    </main>
  );
}
