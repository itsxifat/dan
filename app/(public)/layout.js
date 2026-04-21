import "../globals.css";
import { Lora, Josefin_Sans } from "next/font/google";
import Navbar from "../../components/layout/Navbar";
import AuthProvider from "../../components/providers/AuthProvider";
import SmoothScrollProvider from "../../components/providers/SmoothScrollProvider";

// Fonts defined once here — CSS variables make them available to all children
// without each component needing its own import.
const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata = {
  title: "Dhali's Amber Nivaas | where there's unity, there's luxury...",
  description: "Experience unparalleled luxury, serenity, and world-class hospitality at Dhali's Amber Nivaas.",
};

export default function PublicLayout({ children }) {
  return (
    <html lang="en" className={`${lora.variable} ${josefin.variable}`}>
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
