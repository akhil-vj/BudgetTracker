/**
 * Multi-format date formatting utilities
 */

import { format, parseISO } from 'date-fns';

export type DateFormatType = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD MMM YYYY';

const formatMappings: Record<DateFormatType, string> = {
  'DD/MM/YYYY': 'dd/MM/yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
  'DD MMM YYYY': 'dd MMM yyyy',
};

/**
 * Format a date string to the specified format
 */
export function formatDate(dateString: string, dateFormat: DateFormatType = 'DD/MM/YYYY'): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatMappings[dateFormat]);
  } catch {
    return dateString;
  }
}

/**
 * Format a date string to Indian format (DD/MM/YYYY)
 * Legacy function for backward compatibility
 */
export function formatDateIN(dateString: string): string {
  return formatDate(dateString, 'DD/MM/YYYY');
}

/**
 * Format a date to short format (DD MMM YYYY)
 */
export function formatDateShort(dateString: string): string {
  return formatDate(dateString, 'DD MMM YYYY');
}

/**
 * Format date for display in lists (DD MMM)
 */
export function formatDateCompact(dateString: string): string {
  try {
    const date = parseISO(dateString);
    return format(date, 'dd MMM');
  } catch {
    return dateString;
  }
}

/**
 * Get current date in YYYY-MM-DD format for input fields
 */
export function getCurrentDateISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Format date for display with time
 */
export function formatDateTime(dateString: string, dateFormat: DateFormatType = 'DD/MM/YYYY'): string {
  try {
    const date = parseISO(dateString);
    return format(date, `${formatMappings[dateFormat]} h:mm a`);
  } catch {
    return dateString;
  }
}

/**
 * Get relative time (e.g., "2 days ago", "just now")
 */
export function getRelativeTime(dateString: string): string {
  try {
    const date = parseISO(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  } catch {
    return dateString;
  }
}

// Date format display names
export const dateFormatNames: Record<DateFormatType, string> = {
  'DD/MM/YYYY': 'DD/MM/YYYY (Indian/UK)',
  'MM/DD/YYYY': 'MM/DD/YYYY (US)',
  'YYYY-MM-DD': 'YYYY-MM-DD (ISO)',
  'DD MMM YYYY': 'DD MMM YYYY (15 Jan 2024)',
};

// Timezone display names
export const timezoneNames: Record<string, string> = {
  'Asia/Kolkata': 'India Standard Time (IST)',
  'America/Los_Angeles': 'Pacific Time (PT)',
  'America/New_York': 'Eastern Time (ET)',
  'Europe/London': 'British Time (GMT/BST)',
  'UTC': 'Coordinated Universal Time (UTC)',
};
