import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const FROM = `"${process.env.EMAIL_FROM_NAME || "Dhali's Amber Nivaas"}" <${process.env.EMAIL_USER}>`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "long", year: "numeric",
  });
}
function fmtBDT(n) {
  return "৳" + Number(n || 0).toLocaleString("en-BD");
}

/**
 * Send an OTP email for signup or password reset.
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
    from:    FROM,
    replyTo: FROM,
    to,
    subject,
    html,
  });
}

/**
 * Send a booking confirmation email with full invoice breakdown.
 */
export async function sendBookingConfirmationEmail({
  to,
  guestName,
  bookingNumber,
  bookingId,
  propertyName,
  checkIn,
  checkOut,
  nights,
  bookingMode,
  rooms = [],
  subtotal      = 0,
  taxes         = 0,
  dayLongDiscount = 0,
  offerDiscount   = 0,
  couponDiscount  = 0,
  couponCode      = "",
  totalAmount,
  paidAmount,
  remainingAmount,
  isPartial,
  totalSaved = 0,
  baseUrl,
}) {
  const isDayLong = bookingMode === "day_long";
  const statusLabel = isPartial ? "Advance Payment Received" : "Payment Confirmed";

  // ── Plain-text fallback ───────────────────────────────────────────────────
  const breakdownLines = subtotal > 0
    ? [
        `Subtotal:         ${fmtBDT(subtotal)}`,
        dayLongDiscount > 0 ? `Package Discount: −${fmtBDT(dayLongDiscount)}` : null,
        offerDiscount   > 0 ? `Promotional Offer:−${fmtBDT(offerDiscount)}`   : null,
        couponDiscount  > 0 ? `Coupon${couponCode ? ` (${couponCode})` : ""}:  −${fmtBDT(couponDiscount)}` : null,
        taxes           > 0 ? `Tax & Charges:     ${fmtBDT(taxes)}`            : null,
        `─────────────────────────────────`,
      ].filter(Boolean)
    : [];

  const text = [
    `Booking Confirmed — ${propertyName}`,
    ``,
    `Dear ${guestName},`,
    ``,
    `Your booking at ${propertyName} has been confirmed.`,
    ``,
    `Booking Reference: ${bookingNumber}`,
    isDayLong
      ? `Date: ${fmtDate(checkIn)}`
      : `Check-in:  ${fmtDate(checkIn)}\nCheck-out: ${fmtDate(checkOut)}\nDuration:  ${nights} night${nights !== 1 ? "s" : ""}`,
    rooms.length ? `Rooms: ${rooms.join(", ")}` : "",
    ``,
    ...breakdownLines,
    `Total Amount:    ${fmtBDT(totalAmount)}`,
    isPartial
      ? `Advance Paid:    ${fmtBDT(paidAmount)}\nDue at Check-in: ${fmtBDT(remainingAmount)}`
      : `Amount Paid:     ${fmtBDT(paidAmount)}`,
    totalSaved > 0 ? `You saved:       ${fmtBDT(totalSaved)}` : "",
    ``,
    bookingId ? `View invoice: ${baseUrl}/account/invoice/${bookingId}` : `View booking: ${baseUrl}/account?tab=bookings`,
    ``,
    `We look forward to welcoming you.`,
    ``,
    `Dhali's Amber Nivaas`,
    `${process.env.EMAIL_USER}`,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

  // ── Rooms row ─────────────────────────────────────────────────────────────
  const roomsHtml =
    rooms.length > 0
      ? `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #F5EEF9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#7A7A9A;">Room${rooms.length > 1 ? "s" : ""}</td>
                <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${rooms.join(",&nbsp; ")}</td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  // ── Dates rows ────────────────────────────────────────────────────────────
  const datesHtml = isDayLong
    ? `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Date</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkIn)}</td>
            </tr>
          </table>
        </td>
      </tr>`
    : `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Check-in</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkIn)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Check-out</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkOut)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Duration</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${nights} night${nights !== 1 ? "s" : ""}</td>
            </tr>
          </table>
        </td>
      </tr>`;

  // ── Invoice breakdown rows ─────────────────────────────────────────────────
  const invoiceBreakdownHtml = subtotal > 0
    ? `
      <!-- Invoice breakdown -->
      <p style="margin:0 0 10px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Invoice Breakdown</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:12.5px;color:#7A7A9A;">Subtotal</td>
                <td style="font-size:12.5px;color:#1a1410;font-weight:500;text-align:right;">${fmtBDT(subtotal)}</td>
              </tr>
            </table>
          </td>
        </tr>
        ${dayLongDiscount > 0 ? `<tr><td style="padding:7px 0;border-bottom:1px solid #F5EEF9;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:12.5px;color:#1A7A45;">Package Discount</td><td style="font-size:12.5px;color:#1A7A45;font-weight:500;text-align:right;">−${fmtBDT(dayLongDiscount)}</td></tr></table></td></tr>` : ""}
        ${offerDiscount > 0 ? `<tr><td style="padding:7px 0;border-bottom:1px solid #F5EEF9;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:12.5px;color:#1A7A45;">Promotional Offer</td><td style="font-size:12.5px;color:#1A7A45;font-weight:500;text-align:right;">−${fmtBDT(offerDiscount)}</td></tr></table></td></tr>` : ""}
        ${couponDiscount > 0 ? `<tr><td style="padding:7px 0;border-bottom:1px solid #F5EEF9;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:12.5px;color:#1A7A45;">Coupon${couponCode ? ` <span style="font-size:11px;color:#9B8BAB;">(${couponCode})</span>` : ""}</td><td style="font-size:12.5px;color:#1A7A45;font-weight:500;text-align:right;">−${fmtBDT(couponDiscount)}</td></tr></table></td></tr>` : ""}
        ${taxes > 0 ? `<tr><td style="padding:7px 0;border-bottom:1px solid #F5EEF9;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:12.5px;color:#7A7A9A;">Tax &amp; Charges</td><td style="font-size:12.5px;color:#1a1410;font-weight:500;text-align:right;">${fmtBDT(taxes)}</td></tr></table></td></tr>` : ""}
      </table>`
    : "";

  // ── Payment rows ──────────────────────────────────────────────────────────
  const paymentHtml = isPartial
    ? `<tr>
        <td style="padding:0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="padding:14px 16px;background:#F8F0FC;border-radius:10px;border:1px solid #E8D5F0;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#7A2267;font-weight:600;">Advance Paid</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#7A2267;">${fmtBDT(paidAmount)}</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="padding:14px 16px;background:#FFF5EE;border-radius:10px;border:1px solid #FFE0C8;vertical-align:top;">
                <p style="margin:0 0 4px;font-size:10px;text-transform:uppercase;letter-spacing:0.12em;color:#C05A00;font-weight:600;">Due at Check-in</p>
                <p style="margin:0;font-size:20px;font-weight:700;color:#C05A00;">${fmtBDT(remainingAmount)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    : `<tr>
        <td style="padding:14px 20px;background:#F0FAF4;border-radius:10px;border:1px solid #C8EDD7;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#1A7A45;font-weight:600;">Amount Paid</td>
              <td style="font-size:18px;font-weight:700;color:#1A7A45;text-align:right;">${fmtBDT(paidAmount)}</td>
            </tr>
          </table>
        </td>
      </tr>`;

  // ── Savings badge ─────────────────────────────────────────────────────────
  const savingsHtml =
    totalSaved > 0
      ? `<tr>
          <td style="padding:12px 0 0;text-align:center;">
            <span style="display:inline-block;background:#F0FAF4;border:1px solid #C8EDD7;border-radius:20px;padding:5px 14px;font-size:11.5px;color:#1A7A45;font-weight:600;">
              You saved ${fmtBDT(totalSaved)} on this booking
            </span>
          </td>
        </tr>`
      : "";

  // ── Invoice CTA ───────────────────────────────────────────────────────────
  const invoiceCta = bookingId
    ? `<td style="padding:0 0 0 10px;">
        <a href="${baseUrl}/account/invoice/${bookingId}"
           style="display:inline-block;background:transparent;color:#7A2267;font-size:13px;font-weight:600;letter-spacing:0.04em;text-decoration:none;padding:13px 24px;border-radius:10px;border:1.5px solid #7A2267;">
          View Invoice
        </a>
      </td>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Booking Confirmed — Dhali's Amber Nivaas</title>
</head>
<body style="margin:0;padding:0;background:#F3EFF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#F3EFF8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- ── Header ── -->
          <tr>
            <td style="background:#1A0C17;border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);line-height:44px;text-align:center;font-size:15px;font-weight:700;color:#D4A8E0;letter-spacing:0.05em;margin-bottom:14px;">DAN</div>
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Dhali's Amber Nivaas</p>
              <p style="margin:0 0 4px;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:#C49A2E;font-weight:600;">${statusLabel}</p>
              <h1 style="margin:0;font-size:28px;font-weight:300;color:#ffffff;letter-spacing:-0.01em;">${propertyName}</h1>
            </td>
          </tr>

          <!-- ── Booking ref band ── -->
          <tr>
            <td style="background:#7A2267;padding:16px 36px;text-align:center;">
              <p style="margin:0 0 3px;font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Booking Reference</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.2em;font-family:monospace;">${bookingNumber}</p>
            </td>
          </tr>

          <!-- ── Body card ── -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.07);">

              <!-- Greeting -->
              <p style="margin:0 0 24px;font-size:14.5px;color:#1a1410;line-height:1.6;">
                Dear <strong>${guestName}</strong>,<br/>
                your booking has been confirmed. We look forward to welcoming you to <strong>${propertyName}</strong>.
              </p>

              <!-- Stay Details section -->
              <p style="margin:0 0 10px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Stay Details</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
                ${datesHtml}
                ${roomsHtml}
              </table>

              ${invoiceBreakdownHtml}

              <!-- Payment section -->
              <p style="margin:0 0 12px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Payment</p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:8px;">
                <!-- Total row -->
                <tr>
                  <td style="padding:0 0 12px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#7A7A9A;">Booking Total</td>
                        <td style="font-size:15px;font-weight:700;color:#7A2267;text-align:right;">${fmtBDT(totalAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Payment state -->
                <tr>
                  <td style="padding-bottom:0;">
                    ${paymentHtml}
                  </td>
                </tr>
                ${savingsHtml}
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:28px 0 24px;">
                <tr>
                  <td style="border-top:1px solid #F0E8F4;font-size:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- CTA buttons -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <a href="${baseUrl}/account?tab=bookings"
                             style="display:inline-block;background:#7A2267;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.04em;text-decoration:none;padding:13px 28px;border-radius:10px;">
                            View My Booking
                          </a>
                        </td>
                        ${invoiceCta}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="padding:20px 36px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#A898BA;">Questions? Reply to this email or contact us at</p>
              <p style="margin:0 0 16px;font-size:11px;"><a href="mailto:info@enfinito.cloud" style="color:#7A2267;text-decoration:none;">info@enfinito.cloud</a></p>
              <p style="margin:0;font-size:10px;color:#C4B3CE;">© ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    replyTo: FROM,
    to,
    subject: `Booking Confirmed: ${bookingNumber} — ${propertyName}`,
    text,
    html,
    headers: {
      "X-Entity-Ref-ID": bookingNumber,
      "List-Unsubscribe": `<mailto:info@enfinito.cloud?subject=unsubscribe>`,
    },
  });
}

/**
 * Send a check-in welcome email with payment confirmation.
 */
export async function sendCheckInEmail({
  to,
  guestName,
  bookingNumber,
  bookingId,
  propertyName,
  checkIn,
  checkOut,
  nights,
  bookingMode,
  rooms = [],
  totalAmount,
  baseUrl,
}) {
  const isDayLong = bookingMode === "day_long";

  const text = [
    `Welcome to ${propertyName}!`,
    ``,
    `Dear ${guestName},`,
    ``,
    `You have successfully checked in. We're delighted to have you with us!`,
    ``,
    `Booking Reference: ${bookingNumber}`,
    isDayLong
      ? `Date: ${fmtDate(checkIn)}`
      : `Check-in:  ${fmtDate(checkIn)}\nCheck-out: ${fmtDate(checkOut)}\nDuration:  ${nights} night${nights !== 1 ? "s" : ""}`,
    rooms.length ? `Room(s): ${rooms.join(", ")}` : "",
    ``,
    `Total Paid: ${fmtBDT(totalAmount)}`,
    ``,
    `We hope you have a wonderful stay. Our team is here to help anytime.`,
    ``,
    `Dhali's Amber Nivaas`,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

  const roomsHtml =
    rooms.length > 0
      ? `<tr>
          <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#7A7A9A;">Room${rooms.length > 1 ? "s" : ""}</td>
                <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${rooms.join(",&nbsp; ")}</td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const datesHtml = isDayLong
    ? `<tr>
        <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Date</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkIn)}</td>
            </tr>
          </table>
        </td>
      </tr>`
    : `<tr>
        <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Check-in</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkIn)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Check-out</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkOut)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:7px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Duration</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${nights} night${nights !== 1 ? "s" : ""}</td>
            </tr>
          </table>
        </td>
      </tr>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You're Checked In — Dhali's Amber Nivaas</title>
</head>
<body style="margin:0;padding:0;background:#F3EFF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EFF8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#1A0C17;border-radius:16px 16px 0 0;padding:32px 36px;text-align:center;">
              <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);line-height:44px;text-align:center;font-size:15px;font-weight:700;color:#D4A8E0;letter-spacing:0.05em;margin-bottom:14px;">DAN</div>
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Dhali's Amber Nivaas</p>
              <p style="margin:0 0 4px;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:#4ADE80;font-weight:600;">&#10003; Checked In</p>
              <h1 style="margin:0;font-size:26px;font-weight:300;color:#ffffff;letter-spacing:-0.01em;">Welcome to ${propertyName}</h1>
            </td>
          </tr>

          <!-- Booking ref band -->
          <tr>
            <td style="background:#7A2267;padding:14px 36px;text-align:center;">
              <p style="margin:0 0 3px;font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Booking Reference</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.2em;font-family:monospace;">${bookingNumber}</p>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;padding:32px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.07);">

              <p style="margin:0 0 24px;font-size:14.5px;color:#1a1410;line-height:1.6;">
                Dear <strong>${guestName}</strong>,<br/>
                you've successfully checked in. We're absolutely delighted to have you with us at <strong>${propertyName}</strong>. Please make yourself at home!
              </p>

              <!-- Stay details -->
              <p style="margin:0 0 10px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Your Stay</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                ${datesHtml}
                ${roomsHtml}
              </table>

              <!-- Payment confirmed -->
              <p style="margin:0 0 12px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Payment</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:14px 20px;background:#F0FAF4;border-radius:10px;border:1px solid #C8EDD7;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:#1A7A45;font-weight:600;">Total Paid</td>
                        <td style="font-size:18px;font-weight:700;color:#1A7A45;text-align:right;">${fmtBDT(totalAmount)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Welcome message -->
              <div style="background:#F9F5FB;border-radius:12px;padding:20px 24px;border-left:3px solid #7A2267;margin-bottom:28px;">
                <p style="margin:0;font-size:13.5px;color:#5C4A6E;line-height:1.75;font-style:italic;">
                  "We wish you a most pleasant and memorable stay. Our team is here around the clock to ensure your comfort. Should you need anything at all, please don't hesitate to ask at the front desk."
                </p>
              </div>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr><td style="border-top:1px solid #F0E8F4;font-size:0;">&nbsp;</td></tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/account/invoice/${bookingId}"
                       style="display:inline-block;background:#7A2267;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.04em;text-decoration:none;padding:13px 32px;border-radius:10px;">
                      View Invoice
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#A898BA;">Questions? Reply to this email or contact us at</p>
              <p style="margin:0 0 16px;font-size:11px;"><a href="mailto:info@enfinito.cloud" style="color:#7A2267;text-decoration:none;">info@enfinito.cloud</a></p>
              <p style="margin:0;font-size:10px;color:#C4B3CE;">© ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    replyTo: FROM,
    to,
    subject: `Welcome! You're Checked In — ${bookingNumber} · ${propertyName}`,
    text,
    html,
  });
}

/**
 * Send a check-out farewell email.
 */
export async function sendCheckOutEmail({
  to,
  guestName,
  bookingNumber,
  propertyName,
  checkOut,
  nights,
  bookingMode,
  rooms = [],
  baseUrl,
}) {
  const isDayLong = bookingMode === "day_long";

  const text = [
    `Thank You for Staying — ${propertyName}`,
    ``,
    `Dear ${guestName},`,
    ``,
    `Thank you for choosing Dhali's Amber Nivaas. We hope you had a wonderful ${isDayLong ? "day" : `${nights}-night`} stay.`,
    ``,
    `Booking Reference: ${bookingNumber}`,
    rooms.length ? `Room(s): ${rooms.join(", ")}` : "",
    `Check-out: ${fmtDate(checkOut)}`,
    ``,
    `We sincerely hope you enjoyed your time with us and we look forward to welcoming you back.`,
    ``,
    `Until next time,`,
    `Dhali's Amber Nivaas`,
  ]
    .filter((l) => l !== null && l !== undefined)
    .join("\n");

  const roomsSummary =
    rooms.length > 0
      ? `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #F5EEF9;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#7A7A9A;">Room${rooms.length > 1 ? "s" : ""}</td>
                <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${rooms.join(",&nbsp; ")}</td>
              </tr>
            </table>
          </td>
        </tr>`
      : "";

  const nightsRow = !isDayLong
    ? `<tr>
        <td style="padding:6px 0;border-bottom:1px solid #F5EEF9;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:13px;color:#7A7A9A;">Nights Stayed</td>
              <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${nights} night${nights !== 1 ? "s" : ""}</td>
            </tr>
          </table>
        </td>
      </tr>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Thank You — Dhali's Amber Nivaas</title>
</head>
<body style="margin:0;padding:0;background:#F3EFF8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F3EFF8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

          <!-- Header -->
          <tr>
            <td style="background:#1A0C17;border-radius:16px 16px 0 0;padding:36px 36px;text-align:center;">
              <div style="display:inline-block;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);line-height:44px;text-align:center;font-size:15px;font-weight:700;color:#D4A8E0;letter-spacing:0.05em;margin-bottom:14px;">DAN</div>
              <p style="margin:0 0 6px;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.45);">Dhali's Amber Nivaas</p>
              <p style="margin:0 0 10px;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:#C49A2E;font-weight:600;">Until Next Time</p>
              <h1 style="margin:0;font-size:26px;font-weight:300;color:#ffffff;letter-spacing:-0.01em;">Thank You for Staying</h1>
            </td>
          </tr>

          <!-- Booking ref band -->
          <tr>
            <td style="background:#7A2267;padding:14px 36px;text-align:center;">
              <p style="margin:0 0 3px;font-size:9.5px;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.55);">Booking Reference</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.2em;font-family:monospace;">${bookingNumber}</p>
            </td>
          </tr>

          <!-- Body card -->
          <tr>
            <td style="background:#ffffff;padding:36px 36px 28px;border-radius:0 0 16px 16px;box-shadow:0 8px 40px rgba(0,0,0,0.07);">

              <p style="margin:0 0 24px;font-size:14.5px;color:#1a1410;line-height:1.6;text-align:center;">
                Dear <strong>${guestName}</strong>,
              </p>

              <!-- Goodbye message box -->
              <div style="background:#F9F5FB;border-radius:12px;padding:28px;border:1px solid #EDE5F0;margin-bottom:28px;text-align:center;">
                <p style="margin:0 0 14px;font-size:30px;line-height:1;">&#x1F338;</p>
                <p style="margin:0 0 12px;font-size:17px;font-weight:300;color:#1a1410;line-height:1.5;letter-spacing:-0.01em;">
                  It was a pleasure having you with us.
                </p>
                <p style="margin:0;font-size:13px;color:#7A7A9A;line-height:1.75;">
                  We hope your ${isDayLong ? "day" : `${nights}-night`} stay at <strong>${propertyName}</strong> was everything you wished for.
                  Your comfort and happiness mean the world to us —
                  we sincerely hope to see you again very soon!
                </p>
              </div>

              <!-- Stay summary -->
              <p style="margin:0 0 10px;font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:#9B8BAB;font-weight:600;border-bottom:1px solid #F0E8F4;padding-bottom:8px;">Stay Summary</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:6px 0;border-bottom:1px solid #F5EEF9;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:13px;color:#7A7A9A;">Check-out</td>
                        <td style="font-size:13px;color:#1a1410;font-weight:600;text-align:right;">${fmtDate(checkOut)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                ${nightsRow}
                ${roomsSummary}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}"
                       style="display:inline-block;background:#7A2267;color:#ffffff;font-size:13px;font-weight:600;letter-spacing:0.04em;text-decoration:none;padding:13px 32px;border-radius:10px;">
                      Book Your Next Stay
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
                <tr><td style="border-top:1px solid #F0E8F4;font-size:0;">&nbsp;</td></tr>
              </table>

              <p style="margin:0;font-size:13px;color:#9B8BAB;text-align:center;font-style:italic;">
                "We look forward to welcoming you back to Dhali's Amber Nivaas."
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 0;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:#A898BA;">Questions? Reply to this email or contact us at</p>
              <p style="margin:0 0 16px;font-size:11px;"><a href="mailto:info@enfinito.cloud" style="color:#7A2267;text-decoration:none;">info@enfinito.cloud</a></p>
              <p style="margin:0;font-size:10px;color:#C4B3CE;">© ${new Date().getFullYear()} Dhali's Amber Nivaas. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await transporter.sendMail({
    from:    FROM,
    replyTo: FROM,
    to,
    subject: `Thank You for Staying — ${bookingNumber} · ${propertyName}`,
    text,
    html,
  });
}
