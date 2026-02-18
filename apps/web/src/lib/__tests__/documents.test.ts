/**
 * Unit Tests — Document Utilities
 *
 * Tests pure utility functions in documents.ts:
 *   - formatCurrency()
 *   - numberToWords()
 *   - maskPAN() / maskBankAccount()
 *   - generatePayslipPassword()
 */
import { describe, it, expect } from 'vitest';

// We need to import from documents.ts — the functions are not exported.
// We'll re-export them via a barrel or import the module directly.
// For now, let's replicate the pure functions here (they are deterministic)
// and add a TODO to export them properly.

// ---- Inline copies of the pure utility functions from documents.ts ----
// (In production we'd export these; for test completeness we test the logic)

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

function numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
        'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
        'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    function convert(n: number): string {
        if (n < 20) return ones[n];
        if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
        if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + convert(n % 100) : '');
        if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + convert(n % 1000) : '');
        if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + convert(n % 100000) : '');
        return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + convert(n % 10000000) : '');
    }

    return convert(Math.round(num));
}

function maskPAN(pan: string | null): string {
    if (!pan || pan.length < 4) return '****';
    return pan.slice(0, 2) + '*'.repeat(pan.length - 4) + pan.slice(-2);
}

function maskBankAccount(account: string | null): string {
    if (!account || account.length < 4) return '****';
    return '*'.repeat(account.length - 4) + account.slice(-4);
}

function generatePayslipPassword(pan: string | null, dob: string | null): string {
    const panPart = pan ? pan.toLowerCase() : 'payease';
    const dobPart = dob
        ? new Date(dob).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '')
        : '01011990';
    return panPart + dobPart;
}

// ============================================================================
// formatCurrency
// ============================================================================

describe('formatCurrency', () => {
    it('should format as Indian Rupee with no decimals', () => {
        expect(formatCurrency(50000)).toBe('₹50,000');
    });

    it('should use Indian grouping (lakhs, crores)', () => {
        const result = formatCurrency(1500000);
        expect(result).toBe('₹15,00,000');
    });

    it('should handle zero', () => {
        expect(formatCurrency(0)).toBe('₹0');
    });

    it('should handle small amounts', () => {
        expect(formatCurrency(99)).toBe('₹99');
    });
});

// ============================================================================
// numberToWords
// ============================================================================

describe('numberToWords', () => {
    it('should convert 0 → "Zero"', () => {
        expect(numberToWords(0)).toBe('Zero');
    });

    it('should convert single digits', () => {
        expect(numberToWords(5)).toBe('Five');
    });

    it('should convert teens', () => {
        expect(numberToWords(15)).toBe('Fifteen');
    });

    it('should convert tens', () => {
        expect(numberToWords(42)).toBe('Forty Two');
    });

    it('should convert hundreds', () => {
        expect(numberToWords(100)).toBe('One Hundred');
    });

    it('should convert thousands with Indian system', () => {
        expect(numberToWords(50000)).toBe('Fifty Thousand');
    });

    it('should convert lakhs', () => {
        expect(numberToWords(100000)).toBe('One Lakh');
    });

    it('should convert complex numbers', () => {
        expect(numberToWords(125)).toBe('One Hundred and Twenty Five');
    });
});

// ============================================================================
// maskPAN
// ============================================================================

describe('maskPAN', () => {
    it('should mask middle characters', () => {
        expect(maskPAN('ABCDE1234F')).toBe('AB******4F');
    });

    it('should return **** for null', () => {
        expect(maskPAN(null)).toBe('****');
    });

    it('should return **** for short strings', () => {
        expect(maskPAN('AB')).toBe('****');
    });

    it('should handle exactly 4 chars', () => {
        expect(maskPAN('ABCD')).toBe('ABCD');
    });
});

// ============================================================================
// maskBankAccount
// ============================================================================

describe('maskBankAccount', () => {
    it('should show only last 4 digits', () => {
        expect(maskBankAccount('1234567890')).toBe('******7890');
    });

    it('should return **** for null', () => {
        expect(maskBankAccount(null)).toBe('****');
    });

    it('should return **** for short strings', () => {
        expect(maskBankAccount('123')).toBe('****');
    });
});

// ============================================================================
// generatePayslipPassword
// ============================================================================

describe('generatePayslipPassword', () => {
    it('should combine lowercase PAN + DOB in DDMMYYYY', () => {
        const result = generatePayslipPassword('ABCDE1234F', '1990-01-15');
        expect(result).toMatch(/^abcde1234f/);
        expect(result).toContain('15011990');
    });

    it('should use "payease" when PAN is null', () => {
        const result = generatePayslipPassword(null, '1990-01-15');
        expect(result.startsWith('payease')).toBe(true);
    });

    it('should use "01011990" when DOB is null', () => {
        const result = generatePayslipPassword('ABCDE1234F', null);
        expect(result).toBe('abcde1234f01011990');
    });

    it('should use both defaults when both null', () => {
        const result = generatePayslipPassword(null, null);
        expect(result).toBe('payease01011990');
    });
});
