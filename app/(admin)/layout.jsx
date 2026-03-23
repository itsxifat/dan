import "../globals.css";
import AuthProvider from "@/components/providers/AuthProvider";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Admin | Dhali's Amber Nivaas",
  description: "Admin control panel",
};

export default function AdminRootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.className} antialiased bg-[#0a0a0a] text-white`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
