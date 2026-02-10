import { jsPDF } from 'jspdf';
import { supabase } from './supabase';
import type { Database } from '../types/supabase';

type Employee = Database['public']['Tables']['employees']['Row'];
type PayrollItem = Database['public']['Tables']['payroll_items']['Row'];

// ============================================================================
// Types
// ============================================================================

export interface CompanyInfo {
    name: string;
    address: string;
    logo?: string;
}

export interface PayslipData {
    employee: Employee;
    payrollItem: PayrollItem;
    company: CompanyInfo;
    month: string;
    year: number;
    paymentDate: string;
}

export interface GeneratedPayslip {
    blob: Blob;
    filename: string;
    password: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format number as Indian currency
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(Math.round(amount));
}

/**
 * Convert number to words (Indian system)
 */
function numberToWords(num: number): string {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if (num === 0) return 'Zero';
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' and ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
}

/**
 * Mask sensitive data
 */
function maskPAN(pan: string | null): string {
    if (!pan || pan.length < 10) return 'XXXXX****X';
    return pan.substring(0, 5) + '****' + pan.substring(9);
}

function maskBankAccount(account: string | null): string {
    if (!account || account.length < 4) return '****';
    return '****' + account.substring(account.length - 4);
}

/**
 * Generate password from PAN (lowercase) + DOB (DDMMYYYY)
 */
export function generatePayslipPassword(pan: string | null, dob: string | null): string {
    const panPart = (pan || 'xxxxxxxxxx').toLowerCase();
    const dobPart = dob ? dob.split('-').reverse().join('') : '01011990';
    return panPart + dobPart;
}

// ============================================================================
// PDF Generation
// ============================================================================

/**
 * Generate a payslip PDF using jsPDF
 */
export async function generatePayslipPDF(data: PayslipData): Promise<GeneratedPayslip> {
    const { employee, payrollItem, company, month, year, paymentDate } = data;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Colors
    const primaryColor: [number, number, number] = [79, 70, 229]; // #4f46e5
    const grayText: [number, number, number] = [100, 100, 100];
    const blackText: [number, number, number] = [0, 0, 0];

    let y = 15;

    // ===== Header =====
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 30, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name, 15, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payslip for ${month} ${year}`, pageWidth - 15, 15, { align: 'right' });

    y = 45;

    // ===== Employee Details =====
    doc.setTextColor(...blackText);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee Details', 15, y);

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayText);

    const details = [
        ['Name', employee.name],
        ['Employee ID', employee.employee_id || '-'],
        ['Department', employee.department || '-'],
        ['Designation', employee.designation || '-'],
        ['PAN', maskPAN(employee.pan_number)],
        ['Bank Account', maskBankAccount(employee.bank_account)],
    ];

    for (let i = 0; i < details.length; i += 2) {
        doc.setTextColor(...grayText);
        doc.text(details[i][0] + ':', 15, y);
        doc.setTextColor(...blackText);
        doc.text(details[i][1], 55, y);

        if (details[i + 1]) {
            doc.setTextColor(...grayText);
            doc.text(details[i + 1][0] + ':', 110, y);
            doc.setTextColor(...blackText);
            doc.text(details[i + 1][1], 150, y);
        }
        y += 6;
    }

    y += 10;

    // ===== Earnings =====
    doc.setFillColor(240, 240, 240);
    doc.rect(15, y - 5, 85, 8, 'F');
    doc.setTextColor(...blackText);
    doc.setFont('helvetica', 'bold');
    doc.text('Earnings', 17, y);

    // Deductions header (same line)
    doc.rect(105, y - 5, 90, 8, 'F');
    doc.text('Deductions', 107, y);

    y += 10;
    doc.setFont('helvetica', 'normal');

    // Earnings list
    const earnings = [
        ['Basic Salary', payrollItem.basic || 0],
        ['HRA', payrollItem.hra || 0],
        ['Special Allowance', payrollItem.special_allowance || 0],
    ];

    const deductions = [
        ['PF (Employee)', payrollItem.pf_employee || 0],
        ['ESI (Employee)', payrollItem.esi_employee || 0],
        ['Professional Tax', payrollItem.professional_tax || 0],
        ['TDS', payrollItem.tds || 0],
    ];

    const maxRows = Math.max(earnings.length, deductions.length);

    for (let i = 0; i < maxRows; i++) {
        if (earnings[i]) {
            doc.text(earnings[i][0] as string, 17, y);
            doc.text(`₹ ${formatCurrency(earnings[i][1] as number)}`, 95, y, { align: 'right' });
        }
        if (deductions[i]) {
            doc.text(deductions[i][0] as string, 107, y);
            doc.setTextColor(200, 50, 50);
            doc.text(`₹ ${formatCurrency(deductions[i][1] as number)}`, 190, y, { align: 'right' });
            doc.setTextColor(...blackText);
        }
        y += 7;
    }

    y += 3;

    // Totals row
    doc.setDrawColor(200, 200, 200);
    doc.line(15, y, 100, y);
    doc.line(105, y, 195, y);
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.text('Gross Salary', 17, y);
    doc.text(`₹ ${formatCurrency(payrollItem.gross_salary || 0)}`, 95, y, { align: 'right' });

    doc.text('Total Deductions', 107, y);
    doc.setTextColor(200, 50, 50);
    doc.text(`₹ ${formatCurrency(payrollItem.total_deductions || 0)}`, 190, y, { align: 'right' });
    doc.setTextColor(...blackText);

    y += 15;

    // ===== Net Salary =====
    doc.setFillColor(...primaryColor);
    doc.rect(15, y - 5, 180, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Net Salary Payable', 20, y + 2);
    doc.setFontSize(14);
    doc.text(`₹ ${formatCurrency(payrollItem.net_salary || 0)}`, 190, y + 2, { align: 'right' });

    y += 18;

    // Amount in words
    doc.setFontSize(10);
    doc.setTextColor(...grayText);
    doc.text('Amount in Words:', 15, y);
    doc.setTextColor(...blackText);
    doc.text(`Rupees ${numberToWords(Math.round(payrollItem.net_salary || 0))} Only`, 50, y);

    y += 15;

    // ===== Employer Contributions =====
    doc.setFillColor(245, 245, 245);
    doc.rect(15, y - 5, 180, 10, 'F');
    doc.setTextColor(...grayText);
    doc.setFontSize(9);
    doc.text(
        `Employer Contributions (not deducted): PF: ₹${formatCurrency(payrollItem.pf_employer || 0)} | ESI: ₹${formatCurrency(payrollItem.esi_employer || 0)}`,
        20, y
    );

    y += 20;

    // ===== Footer =====
    doc.setFontSize(8);
    doc.setTextColor(...grayText);
    doc.text('This is a computer-generated document and does not require a signature.', pageWidth / 2, y, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')} | ${company.name}`, pageWidth / 2, y + 5, { align: 'center' });

    // Generate filename and password
    const filename = `Payslip_${month}_${year}_${employee.name.replace(/\s+/g, '_')}.pdf`;
    const password = generatePayslipPassword(employee.pan_number, employee.date_of_birth);

    // Get blob
    const blob = doc.output('blob');

    return { blob, filename, password };
}

// ============================================================================
// Bulk Generation
// ============================================================================

/**
 * Generate payslips for all employees in a payroll run
 */
export async function generatePayslipsForRun(
    payrollRunId: string,
    company: CompanyInfo
): Promise<GeneratedPayslip[]> {
    // Get payroll run details
    const { data: payrollRun, error: runError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', payrollRunId)
        .single();

    if (runError) throw runError;

    // Get payroll items with employee data
    const { data: items, error: itemsError } = await supabase
        .from('payroll_items')
        .select('*, employees(*)')
        .eq('payroll_run_id', payrollRunId);

    if (itemsError) throw itemsError;
    if (!items) return [];

    const months = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const payslips: GeneratedPayslip[] = [];

    for (const item of items) {
        const employee = (item as any).employees as Employee;
        if (!employee) continue;

        const payslip = await generatePayslipPDF({
            employee,
            payrollItem: item,
            company,
            month: months[payrollRun.month - 1],
            year: payrollRun.year,
            paymentDate: new Date().toLocaleDateString('en-IN'),
        });

        payslips.push(payslip);
    }

    return payslips;
}

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Download a single payslip
 */
export function downloadPayslip(payslip: GeneratedPayslip): void {
    const url = URL.createObjectURL(payslip.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = payslip.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Download all payslips as a zip (requires JSZip)
 */
export async function downloadAllPayslipsAsZip(payslips: GeneratedPayslip[], zipFilename: string): Promise<void> {
    // For now, download individually
    // TODO: Implement zip using JSZip
    for (const payslip of payslips) {
        downloadPayslip(payslip);
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
    }
}

// ============================================================================
// Payslip Storage (Supabase)
// ============================================================================

/**
 * Upload payslip to Supabase Storage
 */
export async function uploadPayslipToStorage(
    payslip: GeneratedPayslip,
    payrollRunId: string,
    payrollItemId: string,
    employeeId: string
): Promise<string> {
    const path = `payslips/${payrollRunId}/${payslip.filename}`;

    const { error } = await supabase.storage
        .from('documents')
        .upload(path, payslip.blob, {
            contentType: 'application/pdf',
            upsert: true,
        });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(path);

    // Update payslips table with storage info
    await supabase
        .from('payslips')
        .upsert({
            payroll_item_id: payrollItemId,
            employee_id: employeeId,
            file_url: urlData.publicUrl,
            file_name: payslip.filename,
            is_password_protected: true,
        });

    return path;
}

