"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Playfair_Display, Montserrat, Cormorant_Garamond } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500"] });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500"], style: ["italic"] });

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.2 } }
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 1.4, ease: [0.16, 1, 0.3, 1] } }
  };

  // Button Arrow Animation Variants
  const arrowVariants = {
    initial: { x: 0, opacity: 1 },
    hover: { 
      x: 30, 
      opacity: 0, 
      transition: { duration: 0.3, ease: "easeInOut" } 
    }
  };

  const arrowInVariants = {
    initial: { x: -30, opacity: 0 },
    hover: { 
      x: 0, 
      opacity: 1, 
      transition: { duration: 0.4, ease: "easeOut", delay: 0.1 } 
    }
  };

  return (
    <div className="relative h-[100dvh] min-h-[600px] w-full bg-[#050505] overflow-hidden selection:bg-[#7A2267] selection:text-white">
      
      {/* 1. Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/dhalis.jpg"
          alt="Dhali's Amber Nivaas Resort"
          fill
          priority
          quality={100}
          className="object-cover"
        />
      </div>

      {/* 2. Protective Gradient - Responsive Opacity */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-full md:w-[75%] pointer-events-none"></div>
      {/* Mobile-only bottom fade to help text legibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-transparent to-transparent md:hidden pointer-events-none"></div>

      {/* 3. Main Content - Fully Responsive Spacing */}
      <div className="relative z-20 w-full h-full max-w-[90rem] mx-auto px-6 md:px-12 lg:px-16 pt-20 md:pt-32 flex flex-col justify-center">
        
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col w-full max-w-2xl lg:max-w-4xl"
        >
          {/* Overline */}
          <motion.div variants={fadeUp} className="mb-4 sm:mb-8">
            <span className={`text-[9px] sm:text-[11px] tracking-[0.4em] sm:tracking-[0.5em] uppercase text-white/90 font-medium ${montserrat.className}`}>
              Dhali's Amber Nivaas
            </span>
          </motion.div>
          
          {/* Tagline - Responsive font sizes */}
          <div className="mb-6 sm:mb-10">
            <motion.div variants={fadeUp} className={`text-4xl sm:text-7xl lg:text-[80px] xl:text-[95px] text-white leading-[1.1] tracking-tight font-normal ${playfair.className}`}>
              Where there's unity,
            </motion.div>
            <motion.div variants={fadeUp} className={`text-5xl sm:text-8xl lg:text-[90px] xl:text-[110px] text-white/90 leading-[1] mt-1 sm:mt-4 ${cormorant.className}`}>
              there's luxury.
            </motion.div>
          </div>
          
          {/* Subtitle */}
          <motion.p 
            variants={fadeUp}
            className={`text-[11px] sm:text-sm md:text-[15px] tracking-[0.1em] sm:tracking-[0.2em] text-white/70 leading-relaxed max-w-[16rem] sm:max-w-xl font-light ${montserrat.className}`}
          >
            Experience unparalleled serenity and world-class hospitality tailored exclusively for you.
          </motion.p>
        </motion.div>
      </div>

      {/* 4. BRANDED CTA BUTTON 
          - Brand Color: #7A2267
          - Glassmorphism & High-End Shadow
          - Responsive positioning
      */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-10 left-6 right-6 md:left-auto md:right-12 lg:right-16 z-30 flex justify-center md:justify-end"
      >
        <Link href="/accommodation" className="relative group block w-full md:w-auto">
          <div 
            className={`
              relative flex items-center justify-between md:justify-start gap-6 pl-8 pr-2 py-2.5
              bg-[#7A2267]/90 backdrop-blur-md border border-white/10
              rounded-full transition-all duration-500
              hover:bg-[#7A2267] hover:border-white/30
              shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(122,34,103,0.3)]
              hover:shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(122,34,103,0.5)]
              active:scale-95
            `}
          >
            {/* Subtle Shimmer */}
            <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
              />
            </div>

            <span className={`text-[10px] sm:text-[11px] font-bold tracking-[0.25em] uppercase text-white ${montserrat.className}`}>
              Explore Rooms
            </span>

            {/* Portal Arrow Circle */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shadow-inner">
              <motion.div 
                initial="initial"
                whileHover="hover"
                className="relative flex items-center justify-center w-full h-full"
              >
                {/* Outgoing Arrow */}
                <motion.svg 
                  variants={arrowVariants}
                  className="absolute w-5 h-5 text-[#1a1a1a]" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>

                {/* Incoming Arrow */}
                <motion.svg 
                  variants={arrowInVariants}
                  className="absolute w-5 h-5 text-[#1a1a1a]" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </motion.svg>
              </motion.div>
            </div>
          </div>
        </Link>
      </motion.div>

    </div>
  );
}