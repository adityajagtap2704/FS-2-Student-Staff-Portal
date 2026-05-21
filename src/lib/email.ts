import nodemailer from "nodemailer";

// Configure your email service here
// For development, use Ethereal Email (fake SMTP)
// For production, use SendGrid, Gmail, or other services

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || "noreply@kalnet.edu",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

// Import and re-export all templates from emailTemplates.ts
export {
  getOTPEmailTemplate,
  getSignUpVerificationTemplate,
  getPasswordResetEmailTemplate,
  getAdmissionApprovalTemplate,
  getAdmissionRejectionTemplate,
  getAdmissionEnquiryConfirmationTemplate,
  getLeaveApprovedTemplate,
  getLeaveRejectedTemplate,
  getFeeOverdueTemplate,
  getFeePaymentConfirmationTemplate,
  getInstallmentConfirmationTemplate,
  getStaffApprovalTemplate,
  getStaffRejectionTemplate,
} from "./emailTemplates";
