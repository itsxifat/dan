import Hero from "../../components/ui/Hero";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <Hero />
      
      {/* Temporary spacing to test the scroll effect */}
      <div className="h-screen w-full bg-brand-light flex items-center justify-center">
        <p className="text-brand-grey tracking-widest uppercase font-medium">
          Scroll up to see the transparent navbar transition
        </p>
      </div>
    </main>
  );
}