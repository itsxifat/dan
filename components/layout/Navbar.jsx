"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Montserrat } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

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
      {/* FLOATING PILL NAVBAR */}
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
              <div className="w-9 h-9 animate-pulse bg-white/20 rounded-full" />
            ) : session?.user ? (
              
              /* USER PROFILE DROPDOWN */
              <div className="relative group py-2">
                <Link href="/account" className="flex items-center">
                  <Image 
                    src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=7A2267&color=fff`} 
                    alt="Profile" 
                    width={36} 
                    height={36} 
                    className="rounded-full object-cover aspect-square border-2 border-transparent transition-all duration-300 group-hover:border-white/50 cursor-pointer"
                  />
                </Link>

                {/* Dropdown Menu (Appears on Hover) */}
                <div className="absolute right-0 top-[100%] pt-2 opacity-0 invisible translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
                  <div className="bg-white/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl overflow-hidden min-w-[180px] flex flex-col">
                    <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                      <p className="text-[9px] text-gray-400 uppercase tracking-widest font-semibold mb-0.5">Signed in as</p>
                      <p className="text-xs text-gray-900 font-medium truncate">{session.user.name}</p>
                    </div>
                    <div className="flex flex-col py-1">
                      <Link href="/account" className="px-5 py-2.5 text-[11px] uppercase tracking-wider text-gray-600 font-medium hover:bg-gray-50 hover:text-[#7A2267] transition-colors">
                        My Account
                      </Link>
                      <button 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="px-5 py-2.5 text-left text-[11px] uppercase tracking-wider text-red-500 font-medium hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            ) : (
              <Link href="/login" className="text-[10px] uppercase tracking-[0.2em] font-medium text-white/70 hover:text-white transition-colors">
                Login
              </Link>
            )}

            {/* Book Now Button */}
            <Link 
              href="/bookings" 
              className="group relative overflow-hidden px-8 py-3 bg-white text-[#1a1a1a] rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold transition-all duration-500 hover:shadow-lg"
            >
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

      {/* MOBILE MENU FULLSCREEN OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(20px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className={`fixed inset-0 z-[90] bg-[#1a1a1a]/90 flex flex-col items-center justify-center ${montserrat.className}`}
          >
            <div className="flex flex-col items-center space-y-8 w-full">
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
              
              {/* Mobile Profile & Actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="pt-8 flex flex-col items-center w-full gap-6"
              >
                <div className="w-16 h-[1px] bg-white/20 mb-2" />

                {session?.user ? (
                  <div className="flex flex-col items-center gap-5">
                    <div className="flex items-center gap-3 bg-white/5 pr-5 pl-2 py-2 rounded-full border border-white/10">
                      <Image 
                        src={session.user.image || `https://ui-avatars.com/api/?name=${session.user.name}&background=7A2267&color=fff`} 
                        alt="Profile" 
                        width={32} 
                        height={32} 
                        className="rounded-full object-cover aspect-square"
                      />
                      <span className="text-xs text-white uppercase tracking-widest">{session.user.name}</span>
                    </div>
                    <div className="flex gap-6">
                      <Link href="/account" className="text-xs text-white/70 uppercase tracking-widest hover:text-white transition-colors">
                        My Account
                      </Link>
                      <button onClick={() => signOut({ callbackUrl: '/' })} className="text-xs text-red-400 uppercase tracking-widest hover:text-red-300 transition-colors">
                        Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link href="/login" className="text-sm text-white/60 uppercase tracking-widest hover:text-white transition-colors">
                    Login
                  </Link>
                )}
                
                <Link href="/bookings" className="mt-4 px-10 py-4 bg-[#7A2267] text-white rounded-full text-xs uppercase tracking-[0.2em] font-medium border border-[#7A2267] hover:bg-transparent transition-all duration-300">
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