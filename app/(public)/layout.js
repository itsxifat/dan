import "../globals.css";
import Navbar from "../../components/layout/Navbar";
import AuthProvider from "../../components/providers/AuthProvider";

export const metadata = {
  title: "Dhali's Amber Nivaas | where there's unity, there's luxury...",
  description: "Experience unparalleled luxury, serenity, and world-class hospitality at Dhali's Amber Nivaas.",
};

export default function PublicLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased bg-[#fcfcfc] text-[#1a1a1a] font-sans" suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}