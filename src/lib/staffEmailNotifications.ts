import { sendEmail } from "@/lib/email";

/**
 * Staff Email Notifications
 * Sends professional emails to staff members for various events
 */

/**
 * Send staff approval email with login credentials
 */
export async function sendStaffApprovalEmail(
  staffName: string,
  email: string,
  role: string,
  assignedClass: string | null,
  loginLink: string
): Promise<boolean> {
  try {
    const roleDisplay = role === "CLASS_TEACHER" ? "Class Teacher" : "Head of Department";
    const classInfo = assignedClass ? `<div class="info-item">
                    <div class="info-label">🎓 Assigned Class</div>
                    <div class="info-value">${assignedClass}</div>
                  </div>` : "";

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Staff Account Approved - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .info-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .info-item { margin: 12px 0; }
            .info-label { font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 24px 0; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3); transition: transform 0.2s; }
            .cta-button:hover { transform: translateY(-2px); }
            .cta-container { text-align: center; }
            .next-steps { margin: 32px 0; }
            .next-steps h3 { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .next-steps ol { margin-left: 20px; }
            .next-steps li { font-size: 14px; color: #4b5563; margin-bottom: 10px; line-height: 1.6; }
            .credentials-box { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .credential-item { margin: 12px 0; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #10b981; }
            .credential-label { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
            .credential-value { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px; }
            .support-section { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .support-section p { font-size: 14px; color: #4b5563; }
            .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
            .footer-links { font-size: 12px; }
            .footer-links a { color: #10b981; text-decoration: none; margin: 0 8px; }
            .footer-links a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>✅ Account Approved!</h1>
                <p>Welcome to KALNET School</p>
              </div>
              <div class="content">
                <p class="greeting">Dear ${staffName},</p>
                <p class="message">Congratulations! Your staff account has been <strong>APPROVED</strong> by the administration. You now have full access to the KALNET School Management System.</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">👤 Role</div>
                    <div class="info-value">${roleDisplay}</div>
                  </div>
                  ${classInfo}
                  <div class="info-item">
                    <div class="info-label">📧 Email</div>
                    <div class="info-value">${email}</div>
                  </div>
                </div>
                
                <p style="font-size: 15px; color: #4b5563; margin: 24px 0;">You can now log in to the staff portal using your email and password:</p>
                
                <div class="cta-container">
                  <a href="${loginLink}" class="cta-button">Go to Staff Portal</a>
                </div>
                
                <div class="next-steps">
                  <h3>📝 Getting Started:</h3>
                  <ol>
                    <li>Log in to the staff portal with your email and password</li>
                    <li>Complete your profile information</li>
                    <li>Review your assigned class and students</li>
                    <li>Set up your availability and preferences</li>
                    <li>Start managing your classes and students</li>
                  </ol>
                </div>
                
                <div class="credentials-box">
                  <div class="credential-item">
                    <div class="credential-label">📧 Email Address</div>
                    <div class="credential-value">${email}</div>
                  </div>
                  <div class="credential-item">
                    <div class="credential-label">🔐 Password</div>
                    <div class="credential-value">Use the password you created during registration</div>
                  </div>
                </div>
                
                <div class="support-section">
                  <p><strong>Need Help?</strong> If you have any questions or encounter any issues, please contact the administration office. We're here to support you!</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Welcome to the KALNET team! We look forward to working with you.</p>
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

    return await sendEmail({
      to: email,
      subject: "✅ Staff Account Approved - Welcome to KALNET School!",
      html,
    });
  } catch (error) {
    console.error("[STAFF EMAIL] Error sending approval email:", error);
    return false;
  }
}

/**
 * Send staff rejection email
 */
export async function sendStaffRejectionEmail(
  staffName: string,
  email: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Staff Registration Status - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .header p { font-size: 14px; opacity: 0.9; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .reason-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .reason-box p { font-size: 14px; color: #4b5563; }
            .next-steps { background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .next-steps p { font-size: 14px; color: #4b5563; line-height: 1.8; }
            .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
            .footer-links { font-size: 12px; }
            .footer-links a { color: #6b7280; text-decoration: none; margin: 0 8px; }
            .footer-links a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>📋 Registration Status Update</h1>
                <p>KALNET School Management System</p>
              </div>
              <div class="content">
                <p class="greeting">Dear ${staffName},</p>
                <p class="message">Thank you for your interest in joining KALNET School. We appreciate your application and the time you invested in the registration process.</p>
                
                <p class="message">We regret to inform you that your staff registration has not been approved at this time.</p>
                
                ${rejectionReason ? `
                <div class="reason-box">
                  <p><strong>Reason:</strong> ${rejectionReason}</p>
                </div>
                ` : ''}
                
                <div class="next-steps">
                  <p><strong>What Next?</strong></p>
                  <p>We encourage you to apply again in the future. If you have any questions about the decision or would like more information, please contact the administration office.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">We wish you all the best in your career.</p>
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

    return await sendEmail({
      to: email,
      subject: "Staff Registration Status Update - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[STAFF EMAIL] Error sending rejection email:", error);
    return false;
  }
}
