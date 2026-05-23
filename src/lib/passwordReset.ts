import db from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { generateOTP } from "@/lib/otp";

/**
 * Password Reset Flow:
 * 1. User requests password reset with email
 * 2. Generate OTP and send via email
 * 3. User verifies OTP
 * 4. User sets new password
 */

export async function requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists (Student or Staff)
    const student = await db.student.findUnique({ where: { email: normalizedEmail } });
    const staff = await db.staff.findUnique({ where: { email: normalizedEmail } });

    if (!student && !staff) {
      // Don't reveal if email exists for security
      return { success: true, message: "If an account exists, you will receive a password reset email" };
    }

    // Delete any existing password reset OTP for this email
    await db.oTP.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate new OTP
    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes for password reset

    // Store OTP in database
    await db.oTP.create({
      data: {
        email: normalizedEmail,
        code,
        status: "PENDING",
        expiresAt,
      },
    });

    console.log("[PASSWORD RESET] OTP created for:", normalizedEmail);

    // Send password reset email
    const emailSent = await sendEmail({
      to: normalizedEmail,
      subject: "🔐 Password Reset Request - KALNET School",
      html: getPasswordResetEmailTemplate(code, normalizedEmail),
    });

    if (!emailSent) {
      console.log("[PASSWORD RESET] Failed to send email to:", normalizedEmail);
      return { success: false, message: "Failed to send password reset email" };
    }

    console.log("[PASSWORD RESET] Email sent to:", normalizedEmail);
    return { success: true, message: "Password reset email sent successfully" };
  } catch (error) {
    console.error("[PASSWORD RESET] Error:", error);
    return { success: false, message: "Error processing password reset request" };
  }
}

export function getPasswordResetEmailTemplate(otp: string, email: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - KALNET</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
          .wrapper { background-color: #f3f4f6; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
          .description { font-size: 14px; color: #4b5563; margin-bottom: 32px; line-height: 1.8; }
          .otp-container { background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 30px; text-align: center; margin: 32px 0; }
          .otp-label { font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
          .otp-code { font-size: 42px; font-weight: 700; color: #d97706; letter-spacing: 8px; font-family: 'Courier New', monospace; }
          .expiry-notice { font-size: 12px; color: #6b7280; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0; }
          .security-note { font-size: 13px; color: #4b5563; margin: 24px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b; }
          .security-note strong { color: #92400e; }
          .warning-box { background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0; }
          .warning-box p { font-size: 14px; color: #7f1d1d; }
          .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-text { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
          .footer-links { font-size: 12px; }
          .footer-links a { color: #f59e0b; text-decoration: none; margin: 0 8px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>KALNET School Management System</p>
            </div>
            <div class="content">
              <p class="greeting">Hello,</p>
              <p class="description">We received a request to reset your password. If you didn't make this request, you can safely ignore this email. Your account remains secure.</p>
              
              <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px;">To reset your password, use the verification code below:</p>
              
              <div class="otp-container">
                <div class="otp-label">Your Verification Code</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <div class="expiry-notice">
                ⏱️ This code will expire in <strong>15 minutes</strong>. Please use it promptly.
              </div>
              
              <div class="security-note">
                <strong>🔒 Security Reminder:</strong> Never share this code with anyone. KALNET staff will never ask for your verification code via email or phone.
              </div>
              
              <div class="warning-box">
                <p><strong>⚠️ Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account is secure. If you believe your account has been compromised, contact our support team immediately.</p>
              </div>
              
              <p style="font-size: 14px; color: #4b5563; margin-top: 24px;"><strong>Next Steps:</strong></p>
              <ol style="font-size: 14px; color: #4b5563; margin-left: 20px; margin-top: 12px;">
                <li>Enter this code on the password reset page</li>
                <li>Create a new strong password</li>
                <li>Log in with your new password</li>
              </ol>
            </div>
            <div class="footer">
              <p class="footer-text">© 2024 KALNET School Management System. All rights reserved.</p>
              <div class="footer-links">
                <a href="#">Help Center</a> | <a href="#">Contact Support</a> | <a href="#">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}
