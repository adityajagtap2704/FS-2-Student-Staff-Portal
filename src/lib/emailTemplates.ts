/**
 * Centralized Email Templates
 * Professional, branded, and customizable email templates for KALNET School
 * All templates use consistent styling and branding
 */

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Base HTML wrapper for all emails
 */
function getEmailWrapper(headerGradient: string, headerTitle: string, headerSubtitle: string, content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${headerTitle} - KALNET</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
          .wrapper { background-color: #f3f4f6; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
          .header { background: ${headerGradient}; color: white; padding: 40px 20px; text-align: center; }
          .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
          .header p { font-size: 14px; opacity: 0.9; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
          .footer-text { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
          .footer-links { font-size: 12px; }
          .footer-links a { text-decoration: none; margin: 0 8px; }
          .footer-links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <h1>${headerTitle}</h1>
              <p>${headerSubtitle}</p>
            </div>
            <div class="content">
              ${content}
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

// ============================================================================
// OTP & VERIFICATION TEMPLATES
// ============================================================================

export function getOTPEmailTemplate(otp: string, email: string): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Hello,</p>
    <p style="font-size: 14px; color: #4b5563; margin-bottom: 32px; line-height: 1.8;">Thank you for submitting your admission enquiry to KALNET School. To verify your email address and proceed with your application, please use the verification code below:</p>
    
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 30px; text-align: center; margin: 32px 0;">
      <div style="font-size: 12px; font-weight: 600; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Verification Code</div>
      <div style="font-size: 42px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
    </div>
    
    <div style="font-size: 12px; color: #6b7280; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0;">
      ⏱️ This code will expire in <strong>10 minutes</strong>. Please enter it promptly.
    </div>
    
    <div style="font-size: 13px; color: #4b5563; margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #6b7280;">
      <strong>🔒 Security Tip:</strong> Never share this code with anyone. KALNET staff will never ask for your verification code via email or phone.
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you didn't request this verification code, please ignore this email or contact our support team immediately.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    "🔐 Email Verification",
    "KALNET School Management System",
    content
  );
}

export function getSignUpVerificationTemplate(otp: string, email: string): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Hello,</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Thank you for creating an account with KALNET School Management System. We're excited to have you on board!</p>
    
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px;">To verify your email address and complete your registration, please use the verification code below:</p>
    
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 30px; text-align: center; margin: 32px 0;">
      <div style="font-size: 12px; font-weight: 600; color: #0369a1; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Verification Code</div>
      <div style="font-size: 42px; font-weight: 700; color: #1e40af; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
    </div>
    
    <div style="font-size: 12px; color: #6b7280; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0;">
      ⏱️ This code will expire in <strong>10 minutes</strong>. Please enter it promptly.
    </div>
    
    <div style="margin: 32px 0;">
      <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">📝 What's Next?</h3>
      <ol style="margin-left: 20px;">
        <li style="font-size: 14px; color: #4b5563; margin-bottom: 10px; line-height: 1.6;">Enter this verification code on the verification page</li>
        <li style="font-size: 14px; color: #4b5563; margin-bottom: 10px; line-height: 1.6;">Complete your admission enquiry form</li>
        <li style="font-size: 14px; color: #4b5563; margin-bottom: 10px; line-height: 1.6;">Upload required documents</li>
        <li style="font-size: 14px; color: #4b5563; margin-bottom: 10px; line-height: 1.6;">Track your application status in real-time</li>
      </ol>
    </div>
    
    <div style="font-size: 13px; color: #4b5563; margin: 24px 0; padding: 16px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #6b7280;">
      <strong>🔒 Security Tip:</strong> Never share this code with anyone. KALNET staff will never ask for your verification code via email or phone.
    </div>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    "🎓 Welcome to KALNET!",
    "School Management System",
    content
  );
}

export function getPasswordResetEmailTemplate(otp: string, email: string): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Hello,</p>
    <p style="font-size: 14px; color: #4b5563; margin-bottom: 32px; line-height: 1.8;">We received a request to reset your password. If you didn't make this request, you can safely ignore this email. Your account remains secure.</p>
    
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px;">To reset your password, use the verification code below:</p>
    
    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 30px; text-align: center; margin: 32px 0;">
      <div style="font-size: 12px; font-weight: 600; color: #92400e; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Your Verification Code</div>
      <div style="font-size: 42px; font-weight: 700; color: #d97706; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</div>
    </div>
    
    <div style="font-size: 12px; color: #6b7280; background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 4px; margin: 24px 0;">
      ⏱️ This code will expire in <strong>15 minutes</strong>. Please use it promptly.
    </div>
    
    <div style="font-size: 13px; color: #4b5563; margin: 24px 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
      <strong>🔒 Security Reminder:</strong> Never share this code with anyone. KALNET staff will never ask for your verification code via email or phone.
    </div>
    
    <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="color: #7f1d1d; margin: 0; font-size: 14px;"><strong>⚠️ Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your account is secure. If you believe your account has been compromised, contact our support team immediately.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;"><strong>Next Steps:</strong></p>
    <ol style="font-size: 14px; color: #4b5563; margin-left: 20px; margin-top: 12px;">
      <li>Enter this code on the password reset page</li>
      <li>Create a new strong password</li>
      <li>Log in with your new password</li>
    </ol>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    "🔐 Password Reset Request",
    "KALNET School Management System",
    content
  );
}

// ============================================================================
// ADMISSION TEMPLATES
// ============================================================================

export function getAdmissionEnquiryConfirmationTemplate(
  studentName: string,
  referenceNumber: string,
  grade: string,
  trackingLink: string
): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 14px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Thank you for submitting your admission enquiry to KALNET School. We have received your application and will review it shortly.</p>
    
    <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #2563eb; margin-top: 0; margin-bottom: 15px;">Your Application Reference</h3>
      <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Reference Number:</strong> <span style="font-size: 18px; color: #2563eb; font-weight: bold;">${referenceNumber}</span></p>
      <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Class Applied For:</strong> ${grade}</p>
      <p style="margin: 8px 0; font-size: 14px; color: #4b5563;"><strong>Submitted Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>

    <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <h3 style="color: #d97706; margin-top: 0; margin-bottom: 15px;">📧 Track Your Application</h3>
      <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;">You can track your application status using your reference number:</p>
      <p style="font-size: 14px; color: #4b5563; margin-bottom: 15px;"><strong>${referenceNumber}</strong></p>
      <p style="text-align: center; margin: 0;">
        <a href="${trackingLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: 600;">Check Application Status</a>
      </p>
    </div>

    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #1f2937;">What's Next?</h3>
      <ol style="margin-left: 20px; font-size: 14px; color: #4b5563;">
        <li style="margin-bottom: 8px;">We will review your application within 2 business days</li>
        <li style="margin-bottom: 8px;">You will receive an email notification with the decision</li>
        <li style="margin-bottom: 8px;">If approved, you will receive login credentials to access the student portal</li>
        <li>If you have any questions, please contact our admissions office</li>
      </ol>
    </div>

    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Best regards,<br/><strong>KALNET School Management System</strong></p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)",
    "📋 Admission Enquiry Received",
    "KALNET School Management System",
    content
  );
}

export function getAdmissionApprovalTemplate(
  studentName: string,
  referenceNumber: string,
  email: string,
  setupLink: string,
  rollNumber: string
): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear Parent/Guardian,</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">We are delighted to inform you that <strong>${studentName}</strong>'s admission enquiry has been <span style="display: inline-block; background: #d1fae5; color: #065f46; padding: 8px 16px; border-radius: 6px; font-weight: 600; font-size: 13px;">APPROVED</span>. Congratulations!</p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📋 Enquiry Reference Number</div>
        <div style="font-size: 16px; font-weight: 700; color: #065f46; margin-top: 4px;">${referenceNumber}</div>
      </div>
    </div>
    
    <p style="font-size: 15px; color: #4b5563; margin: 24px 0;">Your student account has been created and is ready to use. Please click the button below to set up your password and complete the account setup process:</p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${setupLink}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Complete Account Setup</a>
      <p style="font-size: 12px; color: #6b7280; margin-top: 12px;">⏱️ This link will expire in 24 hours</p>
    </div>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #10b981;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">📧 Email Address</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${email}</div>
      </div>
      <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #10b981;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">🎓 Roll Number</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${rollNumber}</div>
      </div>
    </div>
    
    <div style="margin: 32px 0;">
      <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">📝 Next Steps:</h3>
      <ol style="margin-left: 20px; font-size: 14px; color: #4b5563;">
        <li style="margin-bottom: 10px; line-height: 1.6;">Click the "Complete Account Setup" button above</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Create a secure password for your account</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Log in to the student portal</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Complete your profile information</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Upload required documents</li>
        <li>Review and pay the application fees</li>
      </ol>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>Need Help?</strong> If you have any questions or encounter any issues during the setup process, please don't hesitate to contact our admissions office. We're here to help!</p>
    </div>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "🎉 Admission Approved!",
    "Welcome to KALNET School",
    content
  );
}

export function getAdmissionRejectionTemplate(
  studentName: string,
  referenceNumber: string
): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear Parent/Guardian,</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Thank you for your interest in KALNET School. We appreciate the time and effort you invested in the admission process.</p>
    
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">We regret to inform you that the admission enquiry for <strong>${studentName}</strong> has not been approved at this time. This decision was made after careful consideration of all applications received.</p>
    
    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #9ca3af; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">📋 Reference Number</div>
        <div style="font-size: 16px; font-weight: 700; color: #1f2937; margin-top: 4px;">${referenceNumber}</div>
      </div>
    </div>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>What Next?</strong></p>
      <p style="font-size: 14px; color: #4b5563; margin-top: 12px;">We encourage you to apply again in future admission cycles. Your child may also be considered for other programs or classes that might be a better fit. Please feel free to reach out to our admissions office to discuss alternative options.</p>
    </div>
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>📞 Contact Our Admissions Office</strong></p>
      <p style="font-size: 14px; color: #4b5563; margin-top: 8px;">We're here to help and answer any questions you may have about the admission process or future opportunities.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">We wish your child all the best in their academic journey.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    "📋 Admission Status Update",
    "KALNET School Management System",
    content
  );
}

// ============================================================================
// LEAVE TEMPLATES
// ============================================================================

export function getLeaveApprovedTemplate(
  studentName: string,
  fromDate: Date,
  toDate: Date,
  leaveType: string
): string {
  const fromStr = fromDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });
  const toStr = toDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Your leave request has been <strong>APPROVED</strong>. You are authorized to be absent during the specified period.</p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📋 Leave Type</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${leaveType}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📅 From Date</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${fromStr}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📅 To Date</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${toStr}</div>
      </div>
    </div>
    
    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>⚠️ Important Reminder:</strong> Please ensure you complete any pending assignments and coursework before your leave. Inform your class teacher about any important deadlines.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions or need to modify your leave dates, please contact your class teacher or the school office.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "✅ Leave Request Approved",
    "KALNET School Management System",
    content
  );
}

export function getLeaveRejectedTemplate(
  studentName: string,
  fromDate: Date,
  toDate: Date,
  leaveType: string,
  rejectionReason?: string
): string {
  const fromStr = fromDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });
  const toStr = toDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Your leave request has been reviewed and unfortunately cannot be approved at this time.</p>
    
    <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #9ca3af; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">📋 Leave Type</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${leaveType}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">📅 From Date</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${fromStr}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px;">📅 To Date</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${toStr}</div>
      </div>
    </div>
    
    ${rejectionReason ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="color: #4b5563; margin: 0; font-size: 14px;"><strong>Reason:</strong> ${rejectionReason}</p>
    </div>
    ` : ''}
    
    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>What Next?</strong></p>
      <p style="font-size: 14px; color: #4b5563; margin-top: 12px;">Please contact your class teacher or the school office to discuss alternative dates or to understand the reason for rejection. We encourage you to resubmit your leave request for different dates if needed.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions or concerns, please reach out to your class teacher or the school administration.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    "📋 Leave Request Status Update",
    "KALNET School Management System",
    content
  );
}

// ============================================================================
// FEE TEMPLATES
// ============================================================================

export function getFeeOverdueTemplate(
  studentName: string,
  amount: number,
  dueDate: Date,
  term: string
): string {
  const dueDateStr = dueDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">This is a reminder that your fee payment is <strong>OVERDUE</strong>. Please make the payment at your earliest convenience to avoid any inconvenience or penalties.</p>
    
    <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">📚 Term</div>
        <div style="font-size: 16px; font-weight: 700; color: #7f1d1d; margin-top: 4px;">${term}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">💰 Amount Due</div>
        <div style="font-size: 16px; font-weight: 700; color: #7f1d1d; margin-top: 4px;">₹${amount.toFixed(2)}</div>
      </div>
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">📅 Due Date</div>
        <div style="font-size: 16px; font-weight: 700; color: #7f1d1d; margin-top: 4px;">${dueDateStr}</div>
      </div>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>🔔 Action Required:</strong></p>
      <p style="font-size: 14px; color: #4b5563; margin-top: 12px;">Please visit the school office or use the online payment portal to settle your outstanding fees. If you have any questions regarding the fee structure or payment options, please contact the finance department.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Timely payment helps us maintain the quality of education and services provided to your child.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
    "⚠️ Fee Payment Overdue",
    "KALNET School Management System",
    content
  );
}

export function getFeePaymentConfirmationTemplate(
  studentName: string,
  amount: number,
  term: string,
  transactionId: string
): string {
  const paymentDate = new Date().toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Thank you for your payment! Your fee payment has been <strong>successfully processed</strong>. Please find your payment receipt details below.</p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <div style="margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📚 Term</div>
        <div style="font-size: 16px; font-weight: 600; color: #065f46; margin-top: 6px;">${term}</div>
      </div>
      <div style="margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">💰 Amount Paid</div>
        <div style="font-size: 24px; font-weight: 700; color: #10b981; margin-top: 6px;">₹${amount.toFixed(2)}</div>
      </div>
      <div style="margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #d1fae5;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">🔐 Transaction ID</div>
        <div style="font-size: 16px; font-weight: 600; color: #065f46; margin-top: 6px;">${transactionId}</div>
      </div>
      <div style="margin: 16px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📅 Payment Date</div>
        <div style="font-size: 16px; font-weight: 600; color: #065f46; margin-top: 6px;">${paymentDate}</div>
      </div>
    </div>
    
    <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>📋 Important:</strong> Please keep this email for your records. You can also download your receipt from the student portal anytime.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions regarding your payment or need a detailed invoice, please contact the finance department.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "✅ Payment Confirmed",
    "KALNET School Management System",
    content
  );
}

export function getInstallmentConfirmationTemplate(
  studentName: string,
  term: string,
  totalFee: number,
  firstInstallment: number,
  remainingBalance: number
): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${studentName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Your installment request has been successfully submitted and is now under review by the administration.</p>
    
    <div style="background: white; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">Request Details:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Term:</td>
          <td style="padding: 10px 0; color: #1f2937; text-align: right;">${term}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Total Fee:</td>
          <td style="padding: 10px 0; color: #1f2937; text-align: right;">₹${Number(totalFee).toLocaleString()}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">1st Installment:</td>
          <td style="padding: 10px 0; color: #10b981; text-align: right; font-weight: bold;">₹${Number(firstInstallment).toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; color: #6b7280; font-weight: 500;">Remaining Balance:</td>
          <td style="padding: 10px 0; color: #f59e0b; text-align: right; font-weight: bold;">₹${Number(remainingBalance).toLocaleString()}</td>
        </tr>
      </table>
    </div>
    
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>Status:</strong> Your request is pending review. You will receive an email notification once the administration has reviewed your request.
      </p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-bottom: 20px;">
      If you have any questions, please contact the administration at <a href="mailto:fees@kalnet.edu" style="color: #10b981; text-decoration: none;">fees@kalnet.edu</a>
    </p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "Installment Request Received",
    "KALNET School Management System",
    content
  );
}

// ============================================================================
// STAFF TEMPLATES
// ============================================================================

export function getStaffApprovalTemplate(
  staffName: string,
  email: string,
  role: string,
  assignedClass: string | null,
  loginLink: string
): string {
  const roleDisplay = role === "CLASS_TEACHER" ? "Class Teacher" : "Head of Department";
  const classInfo = assignedClass ? `
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">🎓 Assigned Class</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${assignedClass}</div>
      </div>` : "";

  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${staffName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Congratulations! Your staff account has been <strong>APPROVED</strong> by the administration. You now have full access to the KALNET School Management System.</p>
    
    <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">👤 Role</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${roleDisplay}</div>
      </div>
      ${classInfo}
      <div style="margin: 12px 0;">
        <div style="font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">📧 Email</div>
        <div style="font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px;">${email}</div>
      </div>
    </div>
    
    <p style="font-size: 15px; color: #4b5563; margin: 24px 0;">You can now log in to the staff portal using your email and password:</p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${loginLink}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">Go to Staff Portal</a>
    </div>
    
    <div style="margin: 32px 0;">
      <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">📝 Getting Started:</h3>
      <ol style="margin-left: 20px; font-size: 14px; color: #4b5563;">
        <li style="margin-bottom: 10px; line-height: 1.6;">Log in to the staff portal with your email and password</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Complete your profile information</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Review your assigned class and students</li>
        <li style="margin-bottom: 10px; line-height: 1.6;">Set up your availability and preferences</li>
        <li>Start managing your classes and students</li>
      </ol>
    </div>
    
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #10b981;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">📧 Email Address</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">${email}</div>
      </div>
      <div style="margin: 12px 0; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 4px solid #10b981;">
        <div style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">🔐 Password</div>
        <div style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px;">Use the password you created during registration</div>
      </div>
    </div>
    
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>Need Help?</strong> If you have any questions or encounter any issues, please contact the administration office. We're here to support you!</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Welcome to the KALNET team! We look forward to working with you.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    "✅ Account Approved!",
    "Welcome to KALNET School",
    content
  );
}

export function getStaffRejectionTemplate(
  staffName: string,
  email: string,
  rejectionReason?: string
): string {
  const content = `
    <p style="font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px;">Dear ${staffName},</p>
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">Thank you for your interest in joining KALNET School. We appreciate your application and the time you invested in the registration process.</p>
    
    <p style="font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8;">We regret to inform you that your staff registration has not been approved at this time.</p>
    
    ${rejectionReason ? `
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="color: #4b5563; margin: 0; font-size: 14px;"><strong>Reason:</strong> ${rejectionReason}</p>
    </div>
    ` : ''}
    
    <div style="background-color: #f9fafb; border-left: 4px solid #6b7280; padding: 16px; border-radius: 6px; margin: 24px 0;">
      <p style="font-size: 14px; color: #4b5563; margin: 0;"><strong>What Next?</strong></p>
      <p style="font-size: 14px; color: #4b5563; margin-top: 12px;">We encourage you to apply again in the future. If you have any questions about the decision or would like more information, please contact the administration office.</p>
    </div>
    
    <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">We wish you all the best in your career.</p>
  `;

  return getEmailWrapper(
    "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)",
    "📋 Registration Status Update",
    "KALNET School Management System",
    content
  );
}
