/**
 * Resend Email Service for Gyrex
 * Supports sending transactional emails via Resend API.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  apiKey?: string;
  fromEmail?: string;
  attachments?: Array<{ filename: string; content: string | Buffer }>;
}

export async function sendEmail({ to, subject, html, apiKey, fromEmail, attachments }: SendEmailOptions) {
  const finalApiKey = apiKey || process.env.RESEND_API_KEY;
  const finalFromEmail = fromEmail || process.env.RESEND_FROM_EMAIL || "Gyrex Verification <verify@updates.gyrex.in>";

  if (!finalApiKey) {
    console.log(`[DEV MODE - NO RESEND API KEY] Email to ${to}`);
    console.log(`Subject: ${subject}`);
    return { success: true, devMode: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${finalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: finalFromEmail,
        to: [to],
        subject,
        html,
        attachments: attachments ? attachments.map(a => ({
          filename: a.filename,
          content: Buffer.isBuffer(a.content) ? a.content.toString('base64') : a.content
        })) : undefined
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("[Resend Email Service] Resend API responded with error:", data?.message || data);
      return { success: false, error: data?.message || "Failed to send email via Resend" };
    }

    console.log(`[RESEND SUCCESS] Email sent to ${to}, ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error: any) {
    console.warn("[Resend Email Service] Error in sendEmail:", error?.message || error);
    return { success: false, error: error?.message || "Failed to send email" };
  }
}

/**
 * Send Verification Email with Gyrex Blue Branding & Resend API
 */
export async function sendVerificationEmail(email: string, rawToken: string, name?: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const firstName = name ? name.trim().split(" ")[0] : "Doctor";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your Gyrex Account</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; }
        .content { padding: 32px; }
        .content p { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #0066FF; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; shadow: 0 4px 12px rgba(0,102,255,0.25); }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
        .link-alt { word-break: break-all; font-size: 12px; color: #0066FF; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/logo.svg" alt="Gyrex Logo" height="36" style="display: block; margin: 0 auto; height: 36px; width: auto;" />
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Thank you for signing up for Gyrex! Please confirm your email address to activate your clinic account and verify your identity.</p>
          
          <div class="btn-container">
            <a href="${verifyUrl}" target="_blank" class="btn">Verify Email Address</a>
          </div>
          
          <p>This verification link is valid for 24 hours. If you did not create a Gyrex account, you can safely ignore this email.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${verifyUrl}" class="link-alt">${verifyUrl}</a></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gyrex Healthcare Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Verify your email address - Gyrex",
    html,
  });
}

/**
 * Send Password Reset Email with Gyrex Branding & Resend API
 */
export async function sendPasswordResetEmail(email: string, rawToken: string, name?: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
  const resetUrl = `${baseUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const firstName = name ? name.trim().split(" ")[0] : "Doctor";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your Gyrex Password</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
        .container { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { padding: 40px 32px 24px; text-align: center; border-bottom: 1px solid #f1f5f9; background: #ffffff; }
        .content { padding: 32px; }
        .content p { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 12px rgba(79,70,229,0.25); }
        .footer { padding: 24px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
        .link-alt { word-break: break-all; font-size: 12px; color: #4f46e5; }
        .warning-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 14px 16px; border-radius: 8px; font-size: 13px; color: #92400e; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${baseUrl}/logo.svg" alt="Gyrex Logo" height="36" style="display: block; margin: 0 auto; height: 36px; width: auto;" />
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>We received a request to reset the password for your Gyrex account. Click the button below to set a new password:</p>
          
          <div class="btn-container">
            <a href="${resetUrl}" target="_blank" class="btn">Reset Password</a>
          </div>

          <div class="warning-box">
            <strong>Security Notice:</strong> This password reset link will expire in <strong>1 hour</strong>. If you did not request a password reset, you can safely ignore this email and your password will remain unchanged.
          </div>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">If the button above doesn't work, copy and paste this link into your browser:<br>
          <a href="${resetUrl}" class="link-alt">${resetUrl}</a></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gyrex Healthcare Platform. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: "Reset your Gyrex Password",
    html,
  });
}

/**
 * Send Subscription Payment Success Email
 */
export async function sendPaymentSuccessEmail(email: string, name: string, planName: string, amount: string, invoiceUrl?: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
        .header { font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Payment Successful! 🎉</div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your payment of <strong>${amount}</strong> for the <strong>${planName}</strong> has been successfully processed.</p>
        <p>Thank you for subscribing to Gyrex! Your account is fully active.</p>
        ${invoiceUrl ? `<p><a href="${invoiceUrl}">Download your Invoice here</a></p>` : ''}
        <p>Best regards,<br>The Gyrex Team</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: "Payment Successful - Gyrex", html });
}

/**
 * Send Subscription Payment Failed Email
 */
export async function sendPaymentFailedEmail(email: string, name: string, planName: string, actionUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
        .header { font-size: 20px; font-weight: bold; color: #ef4444; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #0066FF; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Payment Failed ⚠️</div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>We attempted to process your renewal for the <strong>${planName}</strong>, but the payment failed.</p>
        <p>To avoid any interruption in your service, please update your payment method or retry the payment.</p>
        <a href="${actionUrl}" class="btn">Update Payment Method</a>
        <p>Best regards,<br>The Gyrex Team</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: "Action Required: Payment Failed - Gyrex", html });
}

/**
 * Send Plan Expiry Warning Email
 */
export async function sendPlanExpiryEmail(email: string, name: string, daysLeft: number, actionUrl: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e2e8f0; }
        .header { font-size: 20px; font-weight: bold; color: #f59e0b; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #0066FF; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">Your Plan is Expiring Soon</div>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your Gyrex subscription is scheduled to expire in <strong>${daysLeft} days</strong>.</p>
        <p>Please ensure your payment method is up to date so your subscription can renew automatically without any interruption.</p>
        <a href="${actionUrl}" class="btn">Manage Subscription</a>
        <p>Best regards,<br>The Gyrex Team</p>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject: "Subscription Expiring Soon - Gyrex", html });
}

/**
 * 4. Send Support Ticket Alert to Admin / Support Team
 */
export async function sendSupportTicketAlertToAdmin({
  ticketNumber,
  doctorName,
  clinicName,
  doctorEmail,
  doctorPhone,
  category,
  priority,
  subject,
  description,
  packageTier,
}: {
  ticketNumber: string;
  doctorName: string;
  clinicName: string;
  doctorEmail: string;
  doctorPhone?: string;
  category: string;
  priority: string;
  subject: string;
  description: string;
  packageTier?: string;
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.ADMIN_EMAIL || "support@gyrex.in";
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
  const ticketUrl = `${baseUrl}/admin/tickets`;

  const priorityColor =
    priority === "URGENT"
      ? "#e11d48"
      : priority === "HIGH"
      ? "#ea580c"
      : priority === "MEDIUM"
      ? "#d97706"
      : "#2563eb";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #0f172a; padding: 24px; color: #ffffff; }
        .header h2 { margin: 0; font-size: 18px; font-weight: 700; }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #ffffff; margin-top: 8px; }
        .content { padding: 28px; }
        .doctor-card { background: #f1f5f9; border-radius: 10px; padding: 16px; margin-bottom: 20px; font-size: 13px; line-height: 1.6; }
        .detail-row { margin-bottom: 6px; }
        .detail-row strong { color: #334155; }
        .problem-box { background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin: 18px 0; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 24px; border-radius: 8px; }
        .footer { padding: 16px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 11px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎫 New Support Ticket Raised</h2>
          <span class="badge" style="background-color: ${priorityColor};">${priority} PRIORITY</span>
          <span class="badge" style="background-color: #334155;">#${ticketNumber}</span>
        </div>
        <div class="content">
          <div class="doctor-card">
            <div class="detail-row"><strong>Doctor:</strong> ${doctorName}</div>
            <div class="detail-row"><strong>Clinic:</strong> ${clinicName}</div>
            <div class="detail-row"><strong>Email:</strong> <a href="mailto:${doctorEmail}">${doctorEmail}</a></div>
            <div class="detail-row"><strong>Phone:</strong> ${doctorPhone || "N/A"}</div>
            <div class="detail-row"><strong>Plan / Tier:</strong> ${packageTier || "Trial / Standard"}</div>
            <div class="detail-row"><strong>Category:</strong> ${category}</div>
          </div>

          <h3 style="margin: 0 0 8px; font-size: 16px; color: #0f172a;">${subject}</h3>
          <div class="problem-box">
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${description}</p>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="${ticketUrl}" class="btn">Open Ticket in Admin Dashboard &rarr;</a>
          </div>
        </div>
        <div class="footer">
          Gyrex Practice Growth Platform &bull; Automated Support Router
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: supportEmail,
    subject: `[${priority}] Support Ticket #${ticketNumber}: ${subject} (${clinicName})`,
    html,
  });
}

/**
 * 5. Send Acknowledgment Email to Doctor
 */
export async function sendSupportTicketAcknowledgmentToDoctor({
  ticketNumber,
  doctorName,
  doctorEmail,
  subject,
  description,
  category,
}: {
  ticketNumber: string;
  doctorName: string;
  doctorEmail: string;
  subject: string;
  description: string;
  category: string;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
  const supportPortalUrl = `${baseUrl}/support`;
  const firstName = doctorName.trim().split(" ")[0] || "Doctor";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #4f46e5; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .content p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 18px; }
        .ticket-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; font-size: 13px; }
        .ticket-number { font-size: 16px; font-weight: 800; color: #4f46e5; margin-bottom: 8px; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .footer { padding: 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>We've Received Your Support Request</h2>
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Thank you for reaching out to Gyrex Support. Your ticket has been logged in our system and assigned to a dedicated specialist.</p>

          <div class="ticket-box">
            <div class="ticket-number">Ticket #${ticketNumber}</div>
            <p style="margin: 4px 0; color: #64748b;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 4px 0; color: #64748b;"><strong>Category:</strong> ${category}</p>
            <p style="margin: 8px 0 0; color: #334155; font-style: italic;">"${description}"</p>
          </div>

          <p><strong>Estimated Response Time:</strong> Our support engineers typically review and respond within <strong>1 to 2 business hours</strong>.</p>
          <p>You can track updates or reply directly from your doctor dashboard:</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${supportPortalUrl}" class="btn">View & Track Support Ticket &rarr;</a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Best regards,<br><strong>Gyrex Support & Practice Growth Team</strong></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gyrex &bull; Built for Healthcare Growth
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: doctorEmail,
    subject: `[Received] Support Ticket #${ticketNumber}: ${subject}`,
    html,
  });
}

/**
 * 6. Send Support Reply / Resolution Email to Doctor
 */
export async function sendSupportTicketReplyToDoctor({
  ticketNumber,
  doctorName,
  doctorEmail,
  subject,
  replyMessage,
  isResolved,
}: {
  ticketNumber: string;
  doctorName: string;
  doctorEmail: string;
  subject: string;
  replyMessage: string;
  isResolved?: boolean;
}) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "https://gyrex.in";
  const supportPortalUrl = `${baseUrl}/support`;
  const firstName = doctorName.trim().split(" ")[0] || "Doctor";

  const statusTitle = isResolved ? "Your Support Ticket Has Been Resolved" : "New Reply on Your Support Ticket";
  const headerBg = isResolved ? "#059669" : "#4f46e5";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }
        .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: ${headerBg}; padding: 28px 24px; text-align: center; color: #ffffff; }
        .header h2 { margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 32px 24px; }
        .content p { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 18px; }
        .reply-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; padding: 18px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 700; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; }
        .footer { padding: 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>${statusTitle}</h2>
          <div style="font-size: 13px; opacity: 0.9; margin-top: 6px;">Ticket #${ticketNumber} &bull; ${subject}</div>
        </div>
        <div class="content">
          <p>Hello <strong>${firstName}</strong>,</p>
          <p>Our support team has updated your ticket:</p>

          <div class="reply-box">${replyMessage}</div>

          <p>You can view the full thread, add attachments, or respond directly anytime from your dashboard:</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${supportPortalUrl}" class="btn">Open Support Portal &rarr;</a>
          </div>

          <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Best regards,<br><strong>Gyrex Support Team</strong></p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Gyrex &bull; Practice Growth Platform
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: doctorEmail,
    subject: `[${isResolved ? "Resolved" : "Update"}] Support Ticket #${ticketNumber}: ${subject}`,
    html,
  });
}
