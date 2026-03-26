import "../globals.css";
import Navbar from "../../components/layout/Navbar";
import AuthProvider from "../../components/providers/AuthProvider";
import SmoothScrollProvider from "../../components/providers/SmoothScrollProvider";

export const metadata = {
  title: "Dhali's Amber Nivaas | where there's unity, there's luxury...",
  description: "Experience unparalleled luxury, serenity, and world-class hospitality at Dhali's Amber Nivaas.",
};

export default function PublicLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#fcfcfc] text-[#1a1a1a] font-sans" suppressHydrationWarning>
        <AuthProvider>
          <SmoothScrollProvider>
            <Navbar />
            {children}
          </SmoothScrollProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
