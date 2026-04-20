"use client";

import Image from "next/image";
import Link from "next/link";
import { Lora, Josefin_Sans } from "next/font/google";

const lora    = Lora({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const josefin = Josefin_Sans({ subsets: ["latin"], weight: ["300", "400", "600", "700"] });

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export const authFonts = {
  body: josefin.className,
  display: lora.className,
};

export const AUTH_LABEL =
  "mb-2 block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#756961]";

export const AUTH_INPUT =
  "w-full rounded-2xl border border-[#ddd1c8] bg-white/82 px-4 py-3.5 text-[14px] text-[#201915] outline-none placeholder:text-[#998e86] transition duration-200 focus:border-[#7A2267]/45 focus:bg-white focus:shadow-[0_0_0_4px_rgba(122,34,103,0.08)]";

export const AUTH_PRIMARY_BUTTON =
  "w-full rounded-2xl bg-[linear-gradient(135deg,#2B1825_0%,#7A2267_100%)] px-4 py-3.5 text-[13px] font-semibold tracking-[0.08em] text-white shadow-[0_18px_40px_rgba(78,27,63,0.28)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_50px_rgba(78,27,63,0.34)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const AUTH_SECONDARY_BUTTON =
  "w-full rounded-2xl border border-[#ddd1c8] bg-white/72 px-4 py-3.5 text-[13px] font-semibold text-[#201915] transition duration-200 hover:border-[#cbbcaf] hover:bg-white";

export const AUTH_INLINE_BUTTON =
  "text-[12px] font-semibold text-[#6E214F] transition duration-200 hover:text-[#8B2B64] hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline";

export function AuthShell({ title, description, children, footer }) {
  return (
    <div
      className={cx(
        "relative min-h-[100svh] overflow-hidden bg-[#f4efe9] px-3 py-3 sm:px-6 sm:py-6",
        authFonts.body
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,#f7f3ee_0%,#efe6dc_100%)]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(122,34,103,0.08), transparent 22%), radial-gradient(circle at 82% 20%, rgba(181,140,82,0.12), transparent 24%), radial-gradient(circle at 50% 100%, rgba(122,34,103,0.06), transparent 28%)",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_100%)]" />
      </div>

      <div className="relative mx-auto flex min-h-[100svh] max-w-md items-center justify-center py-2 sm:py-4">
        <div className="w-full max-h-[calc(100svh-1.5rem)] overflow-y-auto rounded-[24px] border border-white/85 bg-white/78 p-4 shadow-[0_20px_70px_rgba(76,58,43,0.12)] backdrop-blur-xl sm:max-h-[calc(100svh-3rem)] sm:rounded-[28px] sm:p-7">
          <div className="mb-4 flex justify-center sm:mb-6">
            <Link href="/" className="inline-flex">
              <Image
                src="/logo.png"
                alt="Dhali's Amber Nivaas"
                width={78}
                height={26}
                className="h-auto w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {(title || description) && (
            <div className="mb-4 text-center sm:mb-5">
              {title && (
                <h1
                  className={cx(
                    "text-[1.45rem] font-semibold leading-tight tracking-[-0.03em] text-[#1c1512] sm:text-[1.8rem]",
                    authFonts.display
                  )}
                >
                  {title}
                </h1>
              )}
              {description && (
                <p className="mt-1.5 text-[12px] leading-5 text-[#6f645d] sm:mt-2 sm:text-[13px] sm:leading-6">
                  {description}
                </p>
              )}
            </div>
          )}

          {children}

          {footer && <div className="mt-5 text-center text-[12.5px] text-[#6f645d]">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthMessage({ children, variant = "error" }) {
  if (!children) {
    return null;
  }

  const styles =
    variant === "success"
      ? "border-emerald-200 bg-emerald-50/90 text-emerald-700"
      : "border-red-200 bg-red-50/90 text-red-700";

  return <div className={cx("mb-4 rounded-2xl border px-4 py-3 text-[12px] leading-5", styles)}>{children}</div>;
}

export function AuthDivider({ label }) {
  return (
    <div className="relative my-4 flex items-center gap-3">
      <div className="h-px flex-1 bg-[#e5d8cf]" />
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a8d85]">{label}</span>
      <div className="h-px flex-1 bg-[#e5d8cf]" />
    </div>
  );
}

export function AuthGoogleButton({ children, onClick }) {
  return (
    <button type="button" onClick={onClick} className={cx(AUTH_SECONDARY_BUTTON, "flex items-center justify-center gap-3")}>
      <GoogleIcon />
      <span>{children}</span>
    </button>
  );
}

export function AuthProgress({ currentStep, steps }) {
  return (
    <div className="mb-4 flex items-center justify-center gap-2.5 sm:mb-5 sm:gap-3">
      {steps.map((step, index) => {
        const status =
          index < currentStep ? "complete" : index === currentStep ? "current" : "upcoming";

        return (
          <div key={step} className="flex items-center gap-2.5 sm:gap-3">
            <div
              className={cx(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition duration-200 sm:h-8 sm:w-8 sm:text-[11px]",
                status === "complete" && "border-[#6E214F] bg-[#6E214F] text-white",
                status === "current" && "border-[#6E214F]/35 bg-[#f5ebf2] text-[#6E214F] shadow-[0_0_0_4px_rgba(122,34,103,0.08)]",
                status === "upcoming" && "border-[#dfd3ca] bg-white/70 text-[#9a8d85]"
              )}
            >
              {status === "complete" ? <CheckIcon /> : index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={cx("h-px w-6 sm:w-10", status === "complete" ? "bg-[#6E214F]" : "bg-[#dfd3ca]")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EyeIcon({ visible }) {
  if (visible) {
    return (
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
        <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
      <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5Z" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 2l12 12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.3" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" width="12" height="12" fill="none" aria-hidden="true">
      <path d="M2.2 6.2 4.7 8.6 9.8 3.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    </svg>
  );
}
