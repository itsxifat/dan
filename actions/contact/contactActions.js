"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import ContactInfo from "@/models/ContactInfo";
import ContactMessage from "@/models/ContactMessage";
import { hasPermission } from "@/lib/permissions";
import nodemailer from "nodemailer";

// ── Public helpers ─────────────────────────────────────────────────────────────

export async function getContactInfo() {
  await dbConnect();
  let info = await ContactInfo.findOne().lean();
  if (!info) {
    info = await ContactInfo.create({});
  }
  return JSON.parse(JSON.stringify(info));
}

// ── Admin: update contact info ─────────────────────────────────────────────────

export async function updateContactInfo(data) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  const existing = await ContactInfo.findOne();
  const payload = { ...data, updatedAt: new Date() };
  if (existing) {
    await ContactInfo.findByIdAndUpdate(existing._id, payload);
  } else {
    await ContactInfo.create(payload);
  }
  revalidatePath("/contact");
  revalidatePath("/admin/contact");
  return { success: true };
}

// ── Public: submit contact form ────────────────────────────────────────────────

export async function submitContactForm({ name, email, phone, subject, message }) {
  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    throw new Error("Name, email, and message are required.");
  }

  await dbConnect();

  // Save to DB
  await ContactMessage.create({ name, email, phone, subject, message });

  // Send email notification
  const info = await ContactInfo.findOne().lean();
  const recipient = info?.contactFormEmail || process.env.EMAIL_USER;

  if (recipient) {
    const transporter = nodemailer.createTransport({
      host:   process.env.EMAIL_HOST,
      port:   Number(process.env.EMAIL_PORT) || 587,
      secure: false,
      auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      tls:    { rejectUnauthorized: false },
    });

    const fromName  = process.env.EMAIL_FROM_NAME || "Dhali's Amber Nivaas";
    const siteUrl   = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");

    await transporter.sendMail({
      from:    `"${fromName}" <${process.env.EMAIL_USER}>`,
      to:      recipient,
      subject: `[Contact Form] ${subject || "New Message"} — from ${name}`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F7F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F7F3EF;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

      <!-- Header -->
      <tr><td style="background:#1a1309;border-radius:16px 16px 0 0;padding:32px 36px 24px;text-align:center;">
        <a href="${siteUrl}" style="text-decoration:none;display:block;margin-bottom:16px;">
          <img src="${siteUrl}/logo.png" alt="Dhali's Amber Nivaas" width="120"
               style="max-width:120px;height:auto;display:block;margin:0 auto;" border="0"/>
        </a>
        <p style="margin:0 0 4px;font-size:9.5px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.35);">
          New Message
        </p>
        <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
          ${subject || "Contact Form Submission"}
        </h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.07);">

        <!-- Sender details -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-bottom:1px solid #ede5d8;padding-bottom:20px;">
          ${[
            ["Name",    name],
            ["Email",   `<a href="mailto:${email}" style="color:#7A2267;text-decoration:none;">${email}</a>`],
            ...(phone   ? [["Phone",   phone]]   : []),
            ...(subject ? [["Subject", subject]] : []),
          ].map(([k, v]) => `
          <tr>
            <td style="padding:6px 0;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#b09a8a;font-weight:600;width:80px;vertical-align:top;">${k}</td>
            <td style="padding:6px 0;font-size:13px;color:#2a1f18;vertical-align:top;">${v}</td>
          </tr>`).join("")}
        </table>

        <!-- Message -->
        <p style="margin:0 0 10px;font-size:10px;letter-spacing:0.15em;text-transform:uppercase;color:#b09a8a;font-weight:600;">Message</p>
        <div style="background:#faf8f5;border-left:3px solid #7A2267;border-radius:0 8px 8px 0;padding:16px 20px;font-size:14px;color:#2a1f18;line-height:1.85;white-space:pre-line;">
          ${message.replace(/\n/g, "<br/>")}
        </div>


      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 32px 0;text-align:center;">
        <p style="margin:0;font-size:10px;color:#c4b3a8;">
          © ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
    });
  }

  revalidatePath("/admin/contact");
  return { success: true };
}

// ── Admin: get messages ────────────────────────────────────────────────────────

export async function getContactMessages({ page = 1, limit = 20, status } = {}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  const filter = status ? { status } : {};
  const [messages, total] = await Promise.all([
    ContactMessage.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactMessage.countDocuments(filter),
  ]);
  return { messages: JSON.parse(JSON.stringify(messages)), total, page, pages: Math.ceil(total / limit) };
}

export async function updateMessageStatus(id, status) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  await ContactMessage.findByIdAndUpdate(id, { status });
  revalidatePath("/admin/contact");
  return { success: true };
}

export async function deleteContactMessage(id) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  await dbConnect();
  await ContactMessage.findByIdAndDelete(id);
  revalidatePath("/admin/contact");
  return { success: true };
}

// ── Admin: reply to a contact message ─────────────────────────────────────────

export async function replyToContactMessage(id, replyText) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !hasPermission(session.user.role, "settings.write")) {
    throw new Error("Unauthorized");
  }
  if (!replyText?.trim()) throw new Error("Reply cannot be empty.");

  await dbConnect();
  const msg = await ContactMessage.findById(id).lean();
  if (!msg) throw new Error("Message not found.");

  const siteUrl  = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
  const fromName = process.env.EMAIL_FROM_NAME || "Dhali's Amber Nivaas";

  const transporter = nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth:   { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    tls:    { rejectUnauthorized: false },
  });

  const replyLines = replyText.trim().replace(/\n/g, "<br/>");
  const originalLines = msg.message.replace(/\n/g, "<br/>");
  const subjectLabel = msg.subject ? `Re: ${msg.subject}` : "Re: Your Enquiry";

  await transporter.sendMail({
    from:    `"${fromName}" <${process.env.EMAIL_USER}>`,
    to:      `"${msg.name}" <${msg.email}>`,
    subject: `${subjectLabel} — Dhali's Amber Nivaas`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F7F3EF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F7F3EF;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;">

      <!-- Header -->
      <tr><td style="background:#1a1309;border-radius:16px 16px 0 0;padding:32px 36px 24px;text-align:center;">
        <a href="${siteUrl}" style="text-decoration:none;display:block;margin-bottom:16px;">
          <img src="${siteUrl}/logo.png" alt="Dhali's Amber Nivaas" width="120"
               style="max-width:120px;height:auto;display:block;margin:0 auto;" border="0"/>
        </a>
        <p style="margin:0 0 4px;font-size:9.5px;letter-spacing:0.28em;text-transform:uppercase;color:rgba(255,255,255,0.35);">
          Dhali's Amber Nivaas
        </p>
        <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
          ${subjectLabel}
        </h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.07);">

        <div style="margin:0 0 28px;font-size:15px;color:#2a1f18;line-height:1.9;white-space:pre-line;">
          ${replyLines}
        </div>

        <div style="height:1px;background:#ede5d8;margin:28px 0;"></div>

        <p style="margin:0 0 12px;font-size:9.5px;letter-spacing:0.2em;text-transform:uppercase;color:#b09a8a;font-weight:600;">
          Your original message
        </p>
        <div style="background:#faf8f5;border-left:3px solid #7A2267;border-radius:0 8px 8px 0;padding:16px 20px;font-size:13px;color:#7a6a52;line-height:1.8;">
          ${originalLines}
        </div>

        <div style="height:1px;background:#ede5d8;margin:28px 0;"></div>

        <p style="margin:0 0 20px;font-size:13px;color:#7a6a52;line-height:1.7;">
          If you have any further questions, please don't hesitate to reach out to us directly.
          We look forward to welcoming you.
        </p>

        <!-- CTA -->
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin:0 auto;">
          <tr><td style="background:#7A2267;border-radius:50px;text-align:center;">
            <a href="${siteUrl}/booking" style="display:inline-block;padding:13px 32px;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
              Reserve Your Stay
            </a>
          </td></tr>
        </table>

      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:20px 32px 0;text-align:center;">
        <p style="margin:0 0 5px;font-size:11px;color:#b09a8a;">
          <a href="mailto:${process.env.EMAIL_USER}" style="color:#7A2267;text-decoration:none;">${process.env.EMAIL_USER}</a>
          &nbsp;·&nbsp; Savar, Dhaka, Bangladesh
        </p>
        <p style="margin:0;font-size:10px;color:#c4b3a8;">
          © ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`,
  });

  await ContactMessage.findByIdAndUpdate(id, {
    status:    "replied",
    reply:     replyText.trim(),
    repliedAt: new Date(),
  });

  revalidatePath("/admin/contact");
  return { success: true };
}
