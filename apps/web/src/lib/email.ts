/**
 * Email Service for PayEase
 * 
 * This module handles email sending via Supabase Edge Functions.
 * In production, integrate with SendGrid, SES, or Resend.
 */

import { supabase } from './supabase';

// ============================================================================
// Types
// ============================================================================

export interface EmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    filename: string;
    content: Blob | string; // Blob for files, base64 string
    contentType: string;
}

export interface PayslipEmailParams {
    employeeEmail: string;
    employeeName: string;
    companyName: string;
    month: string;
    year: number;
    pdfBlob: Blob;
    password: string;
}

// ============================================================================
// Email Templates
// ============================================================================

function getPayslipEmailHTML(params: {
    employeeName: string;
    companyName: string;
    month: string;
    year: number;
    passwordHint: string;
}): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9fafb; }
    .password-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${params.companyName}</h1>
    </div>
    <div class="content">
      <p>Dear ${params.employeeName},</p>
      
      <p>Please find attached your payslip for <strong>${params.month} ${params.year}</strong>.</p>
      
      <div class="password-box">
        <strong>🔒 To open the PDF:</strong><br>
        Password format: ${params.passwordHint}<br>
        <small>(Your PAN in lowercase + Date of Birth as DDMMYYYY)</small>
      </div>
      
      <p>If you have any questions about your payslip, please contact HR.</p>
      
      <p>Best regards,<br>${params.companyName} HR Team</p>
    </div>
    <div class="footer">
      <p>This is an automated email. Please do not reply.</p>
      <p>© ${new Date().getFullYear()} ${params.companyName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;
}

function getPayslipEmailText(params: {
    employeeName: string;
    companyName: string;
    month: string;
    year: number;
}): string {
    return `
Dear ${params.employeeName},

Please find attached your payslip for ${params.month} ${params.year}.

To open the PDF:
Password format: PAN (lowercase) + DOB (DDMMYYYY)
Example: For PAN "ABCDE1234F" and DOB "15 Jan 1990" → abcde1234f15011990

If you have any questions about your payslip, please contact HR.

Best regards,
${params.companyName} HR Team

---
This is an automated email. Please do not reply.
© ${new Date().getFullYear()} ${params.companyName}. All rights reserved.
`;
}

// ============================================================================
// Email Sending (via Edge Function)
// ============================================================================

/**
 * Send email via Supabase Edge Function
 * 
 * Note: This requires setting up an Edge Function named 'send-email'
 * that integrates with an email provider (SendGrid, SES, Resend, etc.)
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                to: params.to,
                subject: params.subject,
                html: params.html,
                text: params.text,
                // Attachments would need base64 encoding
                attachments: params.attachments?.map(att => ({
                    filename: att.filename,
                    content: typeof att.content === 'string' ? att.content : '', // Would need blob-to-base64
                    contentType: att.contentType,
                })),
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        return {
            success: false,
            error: err instanceof Error ? err.message : 'Failed to send email'
        };
    }
}

/**
 * Send payslip email to employee
 */
export async function sendPayslipEmail(params: PayslipEmailParams): Promise<{ success: boolean; error?: string }> {
    const html = getPayslipEmailHTML({
        employeeName: params.employeeName,
        companyName: params.companyName,
        month: params.month,
        year: params.year,
        passwordHint: 'PAN (lowercase) + DOB (DDMMYYYY)',
    });

    const text = getPayslipEmailText({
        employeeName: params.employeeName,
        companyName: params.companyName,
        month: params.month,
        year: params.year,
    });

    // Convert blob to base64 for attachment
    const arrayBuffer = await params.pdfBlob.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    return sendEmail({
        to: params.employeeEmail,
        subject: `Payslip for ${params.month} ${params.year} - ${params.companyName}`,
        html,
        text,
        attachments: [{
            filename: `Payslip_${params.month}_${params.year}.pdf`,
            content: base64,
            contentType: 'application/pdf',
        }],
    });
}

/**
 * Simulate email sending (for development/testing)
 */
export async function sendEmailMock(params: EmailParams): Promise<{ success: boolean }> {
    console.log('📧 Mock Email Sent:', {
        to: params.to,
        subject: params.subject,
        hasAttachments: params.attachments?.length || 0,
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true };
}

// ============================================================================
// Bulk Email Distribution
// ============================================================================

export interface DistributionResult {
    sent: number;
    failed: number;
    errors: { email: string; error: string }[];
}

/**
 * Distribute payslips via email to all employees
 */
export async function distributePayslipsViaEmail(
    payslips: { email: string; name: string; pdfBlob: Blob; password: string }[],
    companyName: string,
    month: string,
    year: number,
    useMock = true // Use mock by default for development
): Promise<DistributionResult> {
    const result: DistributionResult = {
        sent: 0,
        failed: 0,
        errors: [],
    };

    for (const payslip of payslips) {
        const sendFn = useMock ? sendEmailMock : sendPayslipEmail;

        const response = await (useMock
            ? sendEmailMock({
                to: payslip.email,
                subject: `Payslip for ${month} ${year}`,
                html: '',
            })
            : sendPayslipEmail({
                employeeEmail: payslip.email,
                employeeName: payslip.name,
                companyName,
                month,
                year,
                pdfBlob: payslip.pdfBlob,
                password: payslip.password,
            })
        );

        if (response.success) {
            result.sent++;
        } else {
            result.failed++;
            result.errors.push({
                email: payslip.email,
                error: (response as any).error || 'Unknown error'
            });
        }
    }

    return result;
}
