"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500"] });

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const hiddenRoutes = ["/login", "/signup", "/dashboard"];
  const shouldHide = hiddenRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (shouldHide) return null;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Accommodation", href: "/accommodation" },
    { name: "Facilities", href: "/facilities" },
    { name: "Gallery", href: "/gallery" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <>
      {/* FLOATING PILL NAVBAR with Framer Motion */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: isScrolled ? 10 : 24, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className={`fixed left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-6xl ${montserrat.className}`}
      >
        <div className={`relative flex items-center justify-between px-6 py-3 rounded-full transition-all duration-700 ease-[0.16,1,0.3,1] ${
          isScrolled 
            ? "border border-white/10 shadow-2xl shadow-black/20" 
            : "border border-white/10"
        }`}>
          
          {/* Glass Background Layer */}
          <div className={`absolute inset-0 rounded-full -z-10 transition-all duration-700 ease-[0.16,1,0.3,1] [transform:translateZ(0)] ${
            isScrolled 
              ? "bg-[#1a1a1a]/85 backdrop-blur-xl" 
              : "bg-[#1a1a1a]/50 backdrop-blur-md"
          }`} />

          {/* Logo */}
          <Link href="/" className="relative z-10 flex-shrink-0 flex items-center group">
            <Image 
              src="/logo.png" 
              alt="Dhali's Amber Nivaas" 
              width={isScrolled ? 100 : 120} 
              height={40} 
              className="transition-all duration-700 ease-[0.16,1,0.3,1] object-contain brightness-0 invert opacity-90 group-hover:opacity-100"
              priority
            />
          </Link>

          {/* Desktop Center Links */}
          <div className="hidden md:flex items-center space-x-8 lg:space-x-12 z-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link 
                  key={link.name} 
                  href={link.href} 
                  className="relative group py-2 flex flex-col items-center"
                >
                  <span className={`text-[11px] uppercase tracking-[0.2em] font-medium transition-colors duration-300 ${
                    isActive ? "text-white" : "text-white/60 group-hover:text-white"
                  }`}>
                    {link.name}
                  </span>
                  
                  {isActive ? (
                    <motion.span 
                      layoutId="activeDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" 
                    />
                  ) : (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-0 scale-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-6 z-10">
            {status === "loading" ? (
              <div className="w-8 h-8 animate-pulse bg-white/20 rounded-full" />
            ) : session?.user ? (
              <div 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="cursor-pointer group relative"
                title="Sign out"
              >
                <Image 
                  src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=7A2267&color=fff`} 
                  alt="Profile" 
                  width={34} 
                  height={34} 
                  className="rounded-full border border-white/20 transition-all duration-300 group-hover:border-white"
                />
              </div>
            ) : (
              <Link href="/login" className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/70 hover:text-white transition-colors">
                Login
              </Link>
            )}

            {/* NEW BUTTON: Vertical Circular Fill */}
            <Link 
              href="/bookings" 
              className="group relative overflow-hidden px-8 py-3 bg-white text-[#1a1a1a] rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-500 hover:shadow-lg"
            >
              {/* Circular fill element scaling up from the bottom */}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] aspect-square bg-[#7A2267] rounded-full translate-y-[100%] group-hover:translate-y-[10%] transition-transform duration-500 ease-[0.19,1,0.22,1]"></span>
              
              <span className="relative z-10 transition-colors duration-500 group-hover:text-white">
                Book Now
              </span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden relative z-50 flex flex-col justify-center items-center w-8 h-8 space-y-1.5 focus:outline-none"
          >
            <span className={`block w-6 h-[1.5px] bg-white transition-transform duration-300 ${isMobileMenuOpen ? "rotate-45 translate-y-[7.5px]" : ""}`} />
            <span className={`block w-6 h-[1.5px] bg-white transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-[1.5px] bg-white self-end transition-transform duration-300 ${isMobileMenuOpen ? "-rotate-45 -translate-y-[7.5px] w-6" : ""}`} />
          </button>

        </div>
      </motion.nav>

      {/* MOBILE MENU FULLSCREEN OVERLAY with Framer Motion AnimatePresence */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className={`fixed inset-0 z-[90] bg-[#1a1a1a]/90 flex flex-col items-center justify-center ${montserrat.className}`}
          >
            <div className="flex flex-col items-center space-y-8">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <Link 
                    href={link.href} 
                    className="text-2xl text-white font-light uppercase tracking-[0.2em]"
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-8 flex flex-col items-center gap-6"
              >
                {!session?.user && (
                  <Link href="/login" className="text-sm text-white/60 uppercase tracking-widest hover:text-white transition-colors">
                    Login
                  </Link>
                )}
                <Link href="/bookings" className="px-8 py-4 bg-[#7A2267] text-white rounded-full text-xs uppercase tracking-[0.2em] font-medium">
                  Book Your Stay
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}