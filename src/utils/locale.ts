/**
 * Removes the India-only assumption baked into every money figure in the
 * native CRM (deal values, exports, backups all hardcoded ₹/en-IN).
 * Currency is a per-account business decision (what a subscriber actually
 * charges in), so it's explicit and stored - locale for formatting is left
 * undefined so it follows each viewer's own browser locale, which is the
 * more genuinely "global" default than forcing any one locale on everyone.
 */

export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'INR', label: 'Indian Rupee', symbol: '₹' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'GBP', label: 'British Pound', symbol: '£' },
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'AED', label: 'UAE Dirham', symbol: 'AED' },
  { code: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'C$' },
  { code: 'ZAR', label: 'South African Rand', symbol: 'R' },
  { code: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
];

export function formatMoney(value: number, currencyCode: string = 'INR'): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    // Unknown/unsupported currency code - fall back to a plain number rather than throwing.
    const fallback = CURRENCY_OPTIONS.find((c) => c.code === currencyCode);
    return `${fallback?.symbol || currencyCode} ${(value || 0).toLocaleString()}`;
  }
}

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(undefined, opts ?? { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString(
    undefined,
    opts ?? { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
  );
}
