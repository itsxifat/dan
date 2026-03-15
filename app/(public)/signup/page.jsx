"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Montserrat, Playfair_Display } from "next/font/google";
import { registerUser } from "../../../actions/authActions"; 

const montserrat = Montserrat({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600"] });

export default function SignupPage() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/login?registered=true");
    }
  };

  // Premium Staggered Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    },
  };

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#Faf9f8] px-4 py-12 sm:px-6 lg:px-8 ${montserrat.className}`}>
      
      {/* BRANDING LOGO */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-8 sm:mb-10 w-full flex justify-center"
      >
        <Link href="/" className="inline-block transition-transform duration-500 hover:scale-105 active:scale-95">
          <div className="relative w-[120px] h-[50px] sm:w-[150px] sm:h-[60px]">
            <Image 
              src="/logo.png" 
              alt="Dhali's Amber Nivaas" 
              fill
              priority
              className="object-contain"
            />
          </div>
        </Link>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[460px]"
      >
        {/* FORM CARD */}
        <motion.div 
          variants={itemVariants}
          className="bg-white border border-gray-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.04)] rounded-2xl sm:rounded-3xl p-6 sm:p-10 md:p-12 relative overflow-hidden"
        >
          {/* Subtle Top Accent Line */}
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-[#7A2267]/40 to-transparent" />

          <div className="mb-8 text-center sm:text-left">
            <h1 className={`text-3xl sm:text-4xl text-[#1a1a1a] font-semibold mb-3 ${playfair.className}`}>
              Create Account
            </h1>
            <p className="text-gray-400 text-xs sm:text-sm font-light tracking-wide leading-relaxed">
              Join Dhali's Amber Nivaas and step into a world of exclusive luxury.
            </p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-red-50/80 text-red-600 text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold border-l-2 border-red-500 rounded-r-lg"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full bg-[#fcfcfc] border border-gray-100 focus:bg-white focus:border-[#7A2267]/30 focus:shadow-[0_0_15px_rgba(122,34,103,0.05)] px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl text-sm transition-all duration-300 outline-none text-[#1a1a1a] placeholder:text-gray-300"
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full bg-[#fcfcfc] border border-gray-100 focus:bg-white focus:border-[#7A2267]/30 focus:shadow-[0_0_15px_rgba(122,34,103,0.05)] px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl text-sm transition-all duration-300 outline-none text-[#1a1a1a] placeholder:text-gray-300"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold ml-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="w-full bg-[#fcfcfc] border border-gray-100 focus:bg-white focus:border-[#7A2267]/30 focus:shadow-[0_0_15px_rgba(122,34,103,0.05)] px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl text-sm transition-all duration-300 outline-none text-[#1a1a1a] placeholder:text-gray-300"
                placeholder="Min. 8 characters"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#1a1a1a] text-white py-4 sm:py-5 rounded-xl text-[10px] sm:text-[11px] uppercase tracking-[0.3em] font-bold hover:bg-[#7A2267] transition-all duration-500 shadow-lg shadow-black/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          {/* DIVIDER */}
          <div className="relative flex items-center justify-center my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <span className="relative bg-white px-4 text-[9px] uppercase tracking-[0.3em] text-gray-400 font-bold">
              Or
            </span>
          </div>

          {/* GOOGLE BUTTON */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            type="button"
            className="w-full flex items-center justify-center gap-3 sm:gap-4 border border-gray-200 py-3.5 sm:py-4 rounded-xl hover:bg-[#fcfcfc] hover:border-gray-300 transition-all duration-300 active:scale-[0.98] group"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:scale-110 duration-300" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest font-bold text-gray-500 group-hover:text-[#1a1a1a] transition-colors duration-300">
              Sign up with Google
            </span>
          </button>
        </motion.div>

        {/* FOOTER LINK */}
        <motion.div variants={itemVariants} className="mt-8 text-center">
          <p className="text-[10px] sm:text-[11px] text-gray-400 font-light tracking-wide">
            Already a member?{" "}
            <Link href="/login" className="text-[#7A2267] font-semibold hover:text-[#5a184c] hover:underline ml-1 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}