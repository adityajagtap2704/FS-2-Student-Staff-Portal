import { sendEmail } from "@/lib/email";

/**
 * Phase 3: Email Notifications
 * Sends email notifications for important events
 */

/**
 * Send admission approved email
 */
export async function sendAdmissionApprovedEmail(
  studentName: string,
  email: string,
  referenceNumber: string,
  classApplied: string
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admission Approved - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .info-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .info-item { margin: 12px 0; }
            .info-label { font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px; }
            .next-steps { margin: 24px 0; }
            .next-steps h3 { font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
            .next-steps p { font-size: 14px; color: #4b5563; margin-bottom: 12px; line-height: 1.6; }
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
                <h1>🎉 Admission Approved!</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">Congratulations! We are pleased to inform you that your admission application has been <strong>APPROVED</strong>. Welcome to KALNET School!</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">📋 Reference Number</div>
                    <div class="info-value">${referenceNumber}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">🎓 Class Assigned</div>
                    <div class="info-value">${classApplied}</div>
                  </div>
                </div>
                
                <div class="next-steps">
                  <h3>📝 Next Steps:</h3>
                  <p>1. Contact the school office to schedule your orientation</p>
                  <p>2. Submit all required documents</p>
                  <p>3. Complete the fee payment process</p>
                  <p>4. Receive your student ID and login credentials</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions or need further assistance, please don't hesitate to contact our admissions office.</p>
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
      subject: "🎉 Admission Approved - Welcome to KALNET School!",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending admission approved email:", error);
    return false;
  }
}

/**
 * Send admission rejected email
 */
export async function sendAdmissionRejectedEmail(
  studentName: string,
  email: string,
  referenceNumber: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Admission Status Update - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .info-box { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #9ca3af; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .info-item { margin: 12px 0; }
            .info-label { font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px; }
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
                <h1>📋 Admission Status Update</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">Thank you for your interest in KALNET School. We appreciate the time and effort you invested in the admission process.</p>
                
                <p class="message">We regret to inform you that your admission application has not been approved at this time. This decision was made after careful consideration of all applications received.</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">📋 Reference Number</div>
                    <div class="info-value">${referenceNumber}</div>
                  </div>
                </div>
                
                ${rejectionReason ? `
                <div class="reason-box">
                  <p><strong>Reason:</strong> ${rejectionReason}</p>
                </div>
                ` : ''}
                
                <div class="next-steps">
                  <p><strong>What Next?</strong></p>
                  <p>We encourage you to apply again in future admission cycles. Your child may also be considered for other programs or classes that might be a better fit. Please feel free to reach out to our admissions office to discuss alternative options.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">We wish your child all the best in their academic journey. If you have any questions, please contact our admissions office.</p>
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
      subject: "Admission Status Update - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending admission rejected email:", error);
    return false;
  }
}

/**
 * Send leave approved email
 */
export async function sendLeaveApprovedEmail(
  studentName: string,
  email: string,
  fromDate: Date,
  toDate: Date,
  leaveType: string
): Promise<boolean> {
  try {
    const fromStr = fromDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });
    const toStr = toDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Leave Request Approved - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .info-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .info-item { margin: 12px 0; }
            .info-label { font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 15px; font-weight: 600; color: #065f46; margin-top: 4px; }
            .reminder-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .reminder-box p { font-size: 14px; color: #92400e; }
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
                <h1>✅ Leave Request Approved</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">Your leave request has been <strong>APPROVED</strong>. You are authorized to be absent during the specified period.</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">📋 Leave Type</div>
                    <div class="info-value">${leaveType}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📅 From Date</div>
                    <div class="info-value">${fromStr}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📅 To Date</div>
                    <div class="info-value">${toStr}</div>
                  </div>
                </div>
                
                <div class="reminder-box">
                  <p><strong>⚠️ Important Reminder:</strong> Please ensure you complete any pending assignments and coursework before your leave. Inform your class teacher about any important deadlines.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions or need to modify your leave dates, please contact your class teacher or the school office.</p>
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
      subject: "✅ Leave Request Approved - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending leave approved email:", error);
    return false;
  }
}

/**
 * Send leave rejected email
 */
export async function sendLeaveRejectedEmail(
  studentName: string,
  email: string,
  fromDate: Date,
  toDate: Date,
  leaveType: string,
  rejectionReason?: string
): Promise<boolean> {
  try {
    const fromStr = fromDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });
    const toStr = toDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Leave Request Status Update - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .info-box { background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 2px solid #9ca3af; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .info-item { margin: 12px 0; }
            .info-label { font-size: 12px; font-weight: 600; color: #4b5563; text-transform: uppercase; letter-spacing: 0.5px; }
            .info-value { font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 4px; }
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
                <h1>📋 Leave Request Status Update</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">Your leave request has been reviewed and unfortunately cannot be approved at this time.</p>
                
                <div class="info-box">
                  <div class="info-item">
                    <div class="info-label">📋 Leave Type</div>
                    <div class="info-value">${leaveType}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📅 From Date</div>
                    <div class="info-value">${fromStr}</div>
                  </div>
                  <div class="info-item">
                    <div class="info-label">📅 To Date</div>
                    <div class="info-value">${toStr}</div>
                  </div>
                </div>
                
                ${rejectionReason ? `
                <div class="reason-box">
                  <p><strong>Reason:</strong> ${rejectionReason}</p>
                </div>
                ` : ''}
                
                <div class="next-steps">
                  <p><strong>What Next?</strong></p>
                  <p>Please contact your class teacher or the school office to discuss alternative dates or to understand the reason for rejection. We encourage you to resubmit your leave request for different dates if needed.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions or concerns, please reach out to your class teacher or the school administration.</p>
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
      subject: "Leave Request Status Update - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending leave rejected email:", error);
    return false;
  }
}

/**
 * Send fee overdue notification
 */
export async function sendFeeOverdueEmail(
  studentName: string,
  email: string,
  amount: number,
  dueDate: Date,
  term: string
): Promise<boolean> {
  try {
    const dueDateStr = dueDate.toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fee Payment Overdue - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .alert-box { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border: 2px solid #ef4444; border-radius: 8px; padding: 20px; margin: 24px 0; }
            .alert-item { margin: 12px 0; }
            .alert-label { font-size: 12px; font-weight: 600; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px; }
            .alert-value { font-size: 16px; font-weight: 700; color: #7f1d1d; margin-top: 4px; }
            .action-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .action-box p { font-size: 14px; color: #4b5563; line-height: 1.8; }
            .action-box strong { color: #065f46; }
            .footer { background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer-text { font-size: 12px; color: #6b7280; margin-bottom: 12px; }
            .footer-links { font-size: 12px; }
            .footer-links a { color: #ef4444; text-decoration: none; margin: 0 8px; }
            .footer-links a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>⚠️ Fee Payment Overdue</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">This is a reminder that your fee payment is <strong>OVERDUE</strong>. Please make the payment at your earliest convenience to avoid any inconvenience or penalties.</p>
                
                <div class="alert-box">
                  <div class="alert-item">
                    <div class="alert-label">📚 Term</div>
                    <div class="alert-value">${term}</div>
                  </div>
                  <div class="alert-item">
                    <div class="alert-label">💰 Amount Due</div>
                    <div class="alert-value">₹${amount.toFixed(2)}</div>
                  </div>
                  <div class="alert-item">
                    <div class="alert-label">📅 Due Date</div>
                    <div class="alert-value">${dueDateStr}</div>
                  </div>
                </div>
                
                <div class="action-box">
                  <p><strong>🔔 Action Required:</strong></p>
                  <p>Please visit the school office or use the online payment portal to settle your outstanding fees. If you have any questions regarding the fee structure or payment options, please contact the finance department.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">Timely payment helps us maintain the quality of education and services provided to your child.</p>
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
      subject: "⚠️ Fee Payment Overdue - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending fee overdue email:", error);
    return false;
  }
}

/**
 * Send fee payment confirmation email
 */
export async function sendFeePaymentConfirmationEmail(
  studentName: string,
  email: string,
  amount: number,
  term: string,
  transactionId: string
): Promise<boolean> {
  try {
    const paymentDate = new Date().toLocaleDateString("en-IN", { year: 'numeric', month: 'long', day: 'numeric' });

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Fee Payment Confirmation - KALNET</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1f2937; background-color: #f3f4f6; line-height: 1.6; }
            .wrapper { background-color: #f3f4f6; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
            .content { padding: 40px 30px; }
            .greeting { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 16px; }
            .message { font-size: 15px; color: #4b5563; margin-bottom: 24px; line-height: 1.8; }
            .receipt-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #10b981; border-radius: 8px; padding: 24px; margin: 24px 0; }
            .receipt-item { margin: 16px 0; padding-bottom: 16px; border-bottom: 1px solid #d1fae5; }
            .receipt-item:last-child { border-bottom: none; }
            .receipt-label { font-size: 12px; font-weight: 600; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; }
            .receipt-value { font-size: 16px; font-weight: 600; color: #065f46; margin-top: 6px; }
            .amount-highlight { font-size: 24px; font-weight: 700; color: #10b981; }
            .info-box { background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 24px 0; }
            .info-box p { font-size: 14px; color: #4b5563; line-height: 1.8; }
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
                <h1>✅ Payment Confirmed</h1>
              </div>
              <div class="content">
                <p class="greeting">Dear ${studentName},</p>
                <p class="message">Thank you for your payment! Your fee payment has been <strong>successfully processed</strong>. Please find your payment receipt details below.</p>
                
                <div class="receipt-box">
                  <div class="receipt-item">
                    <div class="receipt-label">📚 Term</div>
                    <div class="receipt-value">${term}</div>
                  </div>
                  <div class="receipt-item">
                    <div class="receipt-label">💰 Amount Paid</div>
                    <div class="receipt-value amount-highlight">₹${amount.toFixed(2)}</div>
                  </div>
                  <div class="receipt-item">
                    <div class="receipt-label">🔐 Transaction ID</div>
                    <div class="receipt-value">${transactionId}</div>
                  </div>
                  <div class="receipt-item">
                    <div class="receipt-label">📅 Payment Date</div>
                    <div class="receipt-value">${paymentDate}</div>
                  </div>
                </div>
                
                <div class="info-box">
                  <p><strong>📋 Important:</strong> Please keep this email for your records. You can also download your receipt from the student portal anytime.</p>
                </div>
                
                <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">If you have any questions regarding your payment or need a detailed invoice, please contact the finance department.</p>
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
      subject: "✅ Fee Payment Confirmation - KALNET School",
      html,
    });
  } catch (error) {
    console.error("[EMAIL] Error sending fee payment confirmation email:", error);
    return false;
  }
}
