/**
 * Currency conversion rates relative to INR
 * These are approximate market rates. In production, you'd fetch these from an API.
 * Last updated: January 2, 2026
 */

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

// Exchange rates: 1 unit of currency = X INR
export const exchangeRates: Record<CurrencyCode, number> = {
  INR: 1,
  USD: 90.19,  // 1 USD = 90.19 INR (approximate)
  EUR: 105.71,  // 1 EUR = 105.71 INR (approximate)
  GBP: 121.20, // 1 GBP = 121.20 INR (approximate)
  JPY: 0.57,  // 1 JPY = 0.57 INR (approximate)
};

/**
 * Convert amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to INR first, then to target currency
  const amountInINR = amount * exchangeRates[fromCurrency];
  const converted = amountInINR / exchangeRates[toCurrency];
  
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

/**
 * Get conversion rate between two currencies
 */
export function getConversionRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode
): number {
  return convertCurrency(1, fromCurrency, toCurrency);
}

/**
 * Update exchange rates (in production, fetch from API)
 * This function could be called periodically to update rates from a service like:
 * - Open Exchange Rates (openexchangerates.org)
 * - Fixer.io
 * - Google Finance API
 * - Your own backend
 */
export async function updateExchangeRates(): Promise<void> {
  try {
    // In production, fetch from Open Exchange Rates, Fixer.io, or similar service
    // For now, rates are static (hardcoded above)
  } catch (error) {
    // Error updating exchange rates - rates remain static
  }
}
