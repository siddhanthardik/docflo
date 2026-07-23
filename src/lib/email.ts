/**
 * Resend Email Service for Gyrex
 * Supports sending transactional emails via Resend API.
 */

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "Gyrex Verification <verify@updates.gyrex.in>";

  if (!apiKey) {
    console.log(`[DEV MODE - NO RESEND API KEY] Email to ${to}`);
    console.log(`Subject: ${subject}`);
    return { success: true, devMode: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend API error:", data);
      throw new Error(data.message || "Failed to send email via Resend");
    }

    console.log(`[RESEND SUCCESS] Email sent to ${to}, ID: ${data.id}`);
    return { success: true, id: data.id };
  } catch (error) {
    console.error("Error in sendEmail:", error);
    throw error;
  }
}

/**
 * Send Verification Email with Gyrex Blue Branding & Resend API
 */
export async function sendVerificationEmail(email: string, rawToken: string, name?: string) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(email)}`;

  const recipientName = name ? name : "Doctor";

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
        .header { background: #0066FF; padding: 32px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
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
          <h1>Gyrex</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${recipientName}</strong>,</p>
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
