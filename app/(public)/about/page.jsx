import { getAboutPage } from "@/actions/about/aboutActions";
import { getContactInfo } from "@/actions/contact/contactActions";
import FooterSection from "@/components/sections/FooterSection";
import AboutContent from "./AboutContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us — Dhali's Amber Nivaas",
  description:
    "Learn about Dhali's Amber Nivaas — our story, values, and the vision behind Bangladesh's most serene luxury resort nestled in nature since 2015.",
};

export default async function AboutPage() {
  const [aboutData, contactInfo] = await Promise.all([
    getAboutPage(),
    getContactInfo().catch(() => ({})),
  ]);
  return (
    <>
      <AboutContent aboutData={aboutData} />
      <FooterSection contactInfo={contactInfo} />
    </>
  );
}
