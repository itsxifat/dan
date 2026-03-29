import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "mail.enfinito.cloud",
  port: 587,
  secure: false,
  auth: {
    user: "info@enfinito.cloud",
    pass: "?,36,ogoRCU",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * Send an OTP email for signup or password reset.
 * @param {string} to - recipient email
 * @param {string} code - 6-digit OTP
 * @param {"signup"|"reset_password"} purpose
 */
export async function sendOtpEmail(to, code, purpose) {
  const subject = purpose === "signup"
    ? "Verify your email — Dhali's Amber Nivaas"
    : "Reset your password — Dhali's Amber Nivaas";

  const headline = purpose === "signup"
    ? "Email Verification"
    : "Password Reset";

  const message = purpose === "signup"
    ? "Use the code below to verify your email and complete registration."
    : "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#F7F4F0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4F0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,0.06);">
          <!-- Header -->
          <tr>
            <td style="background:#7A2267;padding:28px 32px;text-align:center;">
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;">Dhali's Amber Nivaas</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:600;letter-spacing:-0.01em;">${headline}</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 28px;">
              <p style="margin:0 0 24px;color:#555;font-size:14px;line-height:1.6;">${message}</p>
              <!-- OTP Box -->
              <div style="background:#F7F4F0;border:2px dashed #D4A8E0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                <p style="margin:0 0 6px;color:#9B8BAB;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;">Your Verification Code</p>
                <p style="margin:0;color:#7A2267;font-size:38px;font-weight:700;letter-spacing:0.25em;line-height:1;">${code}</p>
              </div>
              <p style="margin:0;color:#9B8BAB;font-size:12px;line-height:1.6;">This code expires in <strong style="color:#555;">10 minutes</strong>. Do not share this code with anyone.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#FAF8FC;padding:16px 32px;text-align:center;border-top:1px solid #F0E8F4;">
              <p style="margin:0;color:#C4B3CE;font-size:11px;">© ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from: `"Dhali's Amber Nivaas" <info@enfinito.cloud>`,
    to,
    subject,
    html,
  });
}
