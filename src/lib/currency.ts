/**
 * Multi-currency formatting utilities
 * Supports: INR, USD, EUR, GBP, JPY
 */

import { convertCurrency } from './exchange';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

interface CurrencyConfig {
  symbol: string;
  locale: string;
  decimals: number;
  symbolPosition: 'prefix' | 'suffix';
}

const currencyConfigs: Record<CurrencyCode, CurrencyConfig> = {
  INR: { symbol: '₹', locale: 'en-IN', decimals: 0, symbolPosition: 'prefix' },
  USD: { symbol: '$', locale: 'en-US', decimals: 2, symbolPosition: 'prefix' },
  EUR: { symbol: '€', locale: 'de-DE', decimals: 2, symbolPosition: 'prefix' },
  GBP: { symbol: '£', locale: 'en-GB', decimals: 2, symbolPosition: 'prefix' },
  JPY: { symbol: '¥', locale: 'ja-JP', decimals: 0, symbolPosition: 'prefix' },
};

/**
 * Format a number to the specified currency with proper formatting
 * Automatically converts from INR if amount is in INR
 */
export function formatCurrency(
  amount: number,
  currency: CurrencyCode = 'INR',
  options?: { compact?: boolean; fromCurrency?: CurrencyCode }
): string {
  // Convert from source currency if specified
  const fromCurrency = options?.fromCurrency || 'INR';
  const convertedAmount = fromCurrency !== currency 
    ? convertCurrency(amount, fromCurrency, currency)
    : amount;

  if (convertedAmount === 0) return `${currencyConfigs[currency].symbol}0`;

  const config = currencyConfigs[currency];
  const absAmount = Math.abs(convertedAmount);
  const sign = convertedAmount < 0 ? '-' : '';

  if (options?.compact) {
    if (currency === 'INR') {
      // Indian numbering system: Lakhs and Crores
      if (absAmount >= 10000000) {
        return `${sign}${config.symbol}${(absAmount / 10000000).toFixed(1).replace(/\.0$/, '')} Cr`;
      }
      if (absAmount >= 100000) {
        return `${sign}${config.symbol}${(absAmount / 100000).toFixed(1).replace(/\.0$/, '')} L`;
      }
      if (absAmount >= 1000) {
        return `${sign}${config.symbol}${(absAmount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
    } else {
      // Western numbering system
      if (absAmount >= 1000000000) {
        return `${sign}${config.symbol}${(absAmount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
      }
      if (absAmount >= 1000000) {
        return `${sign}${config.symbol}${(absAmount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
      }
      if (absAmount >= 1000) {
        return `${sign}${config.symbol}${(absAmount / 1000).toFixed(1).replace(/\.0$/, '')}K`;
      }
    }
  }

  const formatted = new Intl.NumberFormat(config.locale, {
    maximumFractionDigits: config.decimals,
    minimumFractionDigits: config.decimals === 2 ? 2 : 0,
  }).format(absAmount);

  return `${sign}${config.symbol}${formatted}`;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: CurrencyCode = 'INR'): string {
  return currencyConfigs[currency].symbol;
}

/**
 * Format for chart Y-axis labels (compact)
 */
export function formatCurrencyCompact(value: number, currency: CurrencyCode = 'INR'): string {
  const config = currencyConfigs[currency];

  if (currency === 'INR') {
    if (value >= 10000000) {
      return `${config.symbol}${(value / 10000000).toFixed(0)}Cr`;
    }
    if (value >= 100000) {
      return `${config.symbol}${(value / 100000).toFixed(0)}L`;
    }
    if (value >= 1000) {
      return `${config.symbol}${(value / 1000).toFixed(0)}K`;
    }
  } else {
    if (value >= 1000000000) {
      return `${config.symbol}${(value / 1000000000).toFixed(0)}B`;
    }
    if (value >= 1000000) {
      return `${config.symbol}${(value / 1000000).toFixed(0)}M`;
    }
    if (value >= 1000) {
      return `${config.symbol}${(value / 1000).toFixed(0)}K`;
    }
  }

  return `${config.symbol}${value}`;
}

/**
 * Parse a currency formatted string back to number
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₹$€£¥,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

// Legacy exports for backward compatibility
export const formatINR = (amount: number, options?: { compact?: boolean }) =>
  formatCurrency(amount, 'INR', options);

export const formatINRCompact = (value: number) => formatCurrencyCompact(value, 'INR');

export const parseINR = parseCurrency;

export const CURRENCY_SYMBOL = '₹';

// Currency display names
export const currencyNames: Record<CurrencyCode, string> = {
  INR: 'Indian Rupee (₹)',
  USD: 'US Dollar ($)',
  EUR: 'Euro (€)',
  GBP: 'British Pound (£)',
  JPY: 'Japanese Yen (¥)',
};
