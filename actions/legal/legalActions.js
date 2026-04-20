"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import LegalDocument from "@/models/LegalDocument";
import { hasPermission } from "@/lib/permissions";

const DEFAULT_TERMS = {
  type: "terms",
  title: "Terms & Conditions",
  effectiveDate: "January 1, 2025",
  intro:
    "Welcome to Dhali's Amber Nivaas. By accessing our website or making a booking, you agree to be bound by these Terms & Conditions. Please read them carefully before proceeding.",
  sections: [
    {
      title: "Acceptance of Terms",
      content:
        "By accessing and using this website, you accept and agree to be bound by these Terms & Conditions and our Privacy Policy. If you do not agree to these terms, please do not use our services.",
    },
    {
      title: "Booking & Reservations",
      content:
        "All bookings are subject to availability and confirmation. A booking is only confirmed upon receipt of full or partial payment as specified during the reservation process. We reserve the right to cancel any booking in the event of a payment dispute or fraudulent activity.",
    },
    {
      title: "Payment Policy",
      content:
        "Payment is required at the time of booking or upon check-in as indicated. We accept all major credit/debit cards and mobile banking (bKash, Nagad). All prices are quoted in Bangladeshi Taka (BDT) and are inclusive of applicable taxes.",
    },
    {
      title: "Cancellation & Refund",
      content:
        "Cancellations made more than 72 hours before check-in are eligible for a full refund. Cancellations within 72 hours of check-in are non-refundable. No-shows will be charged the full booking amount. Refunds, where applicable, will be processed within 7–10 business days.",
    },
    {
      title: "Check-in & Check-out",
      content:
        "Standard check-in time is 2:00 PM and check-out is 12:00 PM (noon). Early check-in and late check-out are subject to availability and may incur additional charges. Valid government-issued photo ID is required for all guests at check-in.",
    },
    {
      title: "Code of Conduct",
      content:
        "Dhali's Amber Nivaas is a family-friendly, halal-certified resort. All guests are expected to behave respectfully and in accordance with Islamic values. Consumption of alcohol or any intoxicating substances is strictly prohibited on the premises. Misconduct may result in immediate removal without refund.",
    },
    {
      title: "Liability Limitation",
      content:
        "Dhali's Amber Nivaas shall not be liable for any loss, damage, injury, or theft of personal belongings during your stay. Guests are encouraged to use in-room safes where provided. We are not responsible for disruptions caused by force majeure, including natural disasters or government actions.",
    },
    {
      title: "Changes to Terms",
      content:
        "We reserve the right to modify these Terms & Conditions at any time. Changes will be effective immediately upon posting to this website. Your continued use of our services constitutes acceptance of the revised terms.",
    },
  ],
};

const DEFAULT_PRIVACY = {
  type: "privacy",
  title: "Privacy Policy",
  effectiveDate: "January 1, 2025",
  intro:
    "At Dhali's Amber Nivaas, we are committed to protecting your personal information and your right to privacy. This policy explains how we collect, use, and safeguard your data.",
  sections: [
    {
      title: "Information We Collect",
      content:
        "We collect information you provide directly, including: full name, contact number, email address, payment details, and booking preferences. We may also collect technical data such as IP address, browser type, and device information through our website analytics.",
    },
    {
      title: "How We Use Your Information",
      content:
        "Your information is used to: process and confirm reservations, communicate booking updates, send promotional offers (with your consent), improve our services and website experience, and comply with legal obligations.",
    },
    {
      title: "Data Storage & Security",
      content:
        "All personal data is stored on secure servers with industry-standard encryption. We implement appropriate technical and organizational measures to protect your data from unauthorized access, disclosure, or misuse. Payment data is processed through secure, PCI-compliant payment gateways.",
    },
    {
      title: "Sharing Your Information",
      content:
        "We do not sell or rent your personal information to third parties. We may share data with trusted service providers (e.g., payment processors, email services) strictly to deliver our services. These parties are bound by confidentiality agreements.",
    },
    {
      title: "Cookies",
      content:
        "Our website uses cookies to enhance your browsing experience, analyze traffic, and remember your preferences. You may disable cookies through your browser settings, though this may affect certain features of our website.",
    },
    {
      title: "Your Rights",
      content:
        "You have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your data (subject to legal requirements), opt out of marketing communications at any time, and lodge a complaint with a relevant data protection authority.",
    },
    {
      title: "Data Retention",
      content:
        "We retain your personal data for as long as necessary to fulfil the purposes for which it was collected, including for legal, accounting, or reporting requirements. Booking records are typically retained for 5 years.",
    },
    {
      title: "Contact Us",
      content:
        "If you have any questions about this Privacy Policy or how we handle your data, please contact us at info@ambernivaas.com or write to us at Dhali's Amber Nivaas, [Resort Address], Bangladesh.",
    },
  ],
};

export async function getLegalDocument(type) {
  await dbConnect();
  let doc = await LegalDocument.findOne({ type }).lean();
  if (!doc) {
    const defaults = type === "terms" ? DEFAULT_TERMS : DEFAULT_PRIVACY;
    doc = await LegalDocument.create(defaults);
  }
  return JSON.parse(JSON.stringify(doc));
}

export async function updateLegalDocument(type, data) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  const existing = await LegalDocument.findOne({ type });
  const payload = { ...data, type, updatedAt: new Date() };
  if (existing) {
    await LegalDocument.findByIdAndUpdate(existing._id, payload);
  } else {
    await LegalDocument.create(payload);
  }
  revalidatePath(`/${type === "terms" ? "terms" : "privacy"}`);
  revalidatePath(`/admin/legal/${type}`);
  return { success: true };
}
