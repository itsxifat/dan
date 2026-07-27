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

const DEFAULT_REFUND = {
  type: "refund",
  title: "Refund & Cancellation Policy",
  effectiveDate: "January 1, 2025",
  intro:
    "We understand that plans can change. This Refund & Cancellation Policy explains how cancellations, rescheduling, and refunds are handled for bookings made with Dhali's Amber Nivaas — whether through our website, over the phone, or in person.",
  sections: [
    {
      title: "Booking Confirmation",
      content:
        "A booking is confirmed only upon receipt of full or partial advance payment through our secure payment gateway (credit/debit card, bKash, Nagad, or bank transfer). You will receive a confirmation email or SMS with your booking reference once payment is successful.",
    },
    {
      title: "Cancellation Timeline",
      content:
        "Cancellations made more than 72 hours before your scheduled check-in time are eligible for a full refund of the amount paid, less any applicable payment gateway charges. Cancellations made within 72 hours of check-in are non-refundable. To cancel, please contact us with your booking reference as early as possible.",
    },
    {
      title: "No-Show Policy",
      content:
        "If you do not arrive by the end of your scheduled check-in day and have not notified us in advance, this is treated as a no-show and the full booking amount will be forfeited. No refund will be issued for no-shows.",
    },
    {
      title: "Rescheduling",
      content:
        "Guests may request a one-time date change free of charge if requested more than 72 hours before the original check-in date, subject to room availability for the new dates. Requests made within 72 hours of check-in will be treated under our standard cancellation policy.",
    },
    {
      title: "Non-Refundable Bookings",
      content:
        "Certain discounted rates, promotional offers, festive/peak-season packages, and event or wedding advance payments may be marked as non-refundable at the time of booking. These will be clearly indicated before payment and are not eligible for cancellation or refund under this policy.",
    },
    {
      title: "Refund Processing",
      content:
        "Approved refunds are processed back to the original payment method used at the time of booking. Please allow 7–10 business days for the refund to reflect in your account, depending on your bank or mobile financial service provider.",
    },
    {
      title: "Resort-Initiated Cancellations",
      content:
        "In the rare event that we must cancel your booking due to unforeseen circumstances, force majeure, or operational issues, you will be offered a full refund or the option to reschedule at no additional cost, at your preference.",
    },
    {
      title: "Failed or Duplicate Transactions",
      content:
        "If a payment is deducted but a booking confirmation is not received due to a payment gateway error, please contact us immediately with your transaction details. Verified failed or duplicate transactions will be refunded in full within 7–10 business days.",
    },
    {
      title: "How to Request a Refund",
      content:
        "To request a cancellation or refund, please email us at info@ambernivaas.com or call our reservations desk with your booking reference number, guest name, and reason for the request. Our team will confirm eligibility and process approved refunds promptly.",
    },
  ],
};

const DEFAULT_DELIVERY = {
  type: "delivery",
  title: "Delivery Policy",
  effectiveDate: "January 1, 2025",
  intro:
    "Dhali's Amber Nivaas offers hospitality services — room bookings, packages, and dining — rather than physical goods. This Delivery Policy explains how your booking confirmation and services are delivered once a purchase is made on our website.",
  sections: [
    {
      title: "Nature of Our Services",
      content:
        "As a resort, we do not ship or deliver physical products. What you \"receive\" upon booking is a confirmed reservation for accommodation, packages, or services, along with a digital confirmation of that booking.",
    },
    {
      title: "Booking Confirmation Delivery",
      content:
        "Once your payment is successfully processed through our payment gateway, a booking confirmation with your reservation details and reference number is delivered instantly to the email address and/or phone number provided at checkout.",
    },
    {
      title: "Processing Time",
      content:
        "Online bookings paid via card, bKash, or Nagad are confirmed instantly upon successful payment. Bookings requiring manual verification (e.g. bank transfer or corporate billing) are typically confirmed within 24 hours.",
    },
    {
      title: "Delivery of the Booked Service",
      content:
        "The actual service — your stay, package, or event — is delivered on-site at Dhali's Amber Nivaas on the dates specified in your booking. Standard check-in is at 2:00 PM and check-out at 12:00 PM (noon), as outlined in our Terms & Conditions.",
    },
    {
      title: "Undelivered Confirmations",
      content:
        "If you do not receive a booking confirmation within 1 hour of a successful payment, please check your spam/junk folder first, then contact our support team with your transaction ID so we can resend your confirmation or investigate the issue.",
    },
    {
      title: "Changes to Booking Details",
      content:
        "If any information on your confirmation is incorrect (e.g. name, dates, room type), please contact us as soon as possible so we can correct and redeliver an updated confirmation before your check-in date.",
    },
    {
      title: "Payment Gateway",
      content:
        "Online payments are processed through our secure, PCI-compliant third-party payment gateway. Delivery of your booking confirmation is dependent on receiving a successful payment response from the gateway; we are not responsible for delays caused by the payment provider or your bank.",
    },
    {
      title: "Contact Us",
      content:
        "For any questions or issues regarding the delivery of your booking confirmation, please reach out to info@ambernivaas.com or call our reservations desk, quoting your transaction ID or booking reference.",
    },
  ],
};

const DEFAULTS_BY_TYPE = {
  terms: DEFAULT_TERMS,
  privacy: DEFAULT_PRIVACY,
  refund: DEFAULT_REFUND,
  delivery: DEFAULT_DELIVERY,
};

export async function getLegalDocument(type) {
  await dbConnect();
  let doc = await LegalDocument.findOne({ type }).lean();
  if (!doc) {
    doc = await LegalDocument.create(DEFAULTS_BY_TYPE[type] || DEFAULT_TERMS);
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
  revalidatePath(`/${type}`);
  revalidatePath(`/admin/legal/${type}`);
  return { success: true };
}
