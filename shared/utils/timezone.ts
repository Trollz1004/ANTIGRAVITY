/**
 * Timezone utility functions for consistent UTC-to-local date display.
 * All timestamps from the API are assumed to be UTC ISO strings.
 * These helpers convert them to the user's local timezone for display.
 */

export interface FormatDateTimeOptions {
  /** Include the date portion (year-month-day). Default: true */
  date?: boolean;
  /** Include the time portion (hours:minutes:seconds). Default: true */
  time?: boolean;
  /** Use 12-hour clock. Default: false (24-hour) */
  hour12?: boolean;
  /** Include seconds in time. Default: true */
  seconds?: boolean;
  /** Locale for formatting. Default: undefined (browser locale) */
  locale?: string;
}

const DEFAULT_OPTIONS: FormatDateTimeOptions = {
  date: true,
  time: true,
  hour12: false,
  seconds: true,
};

/**
 * Parse a timestamp (ISO string, number, or Date) into a Date object.
 * Returns null if the value is invalid.
 */
function parseTimestamp(timestamp: string | number | Date): Date | null {
  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }
  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Format a UTC timestamp into a localized date/time string.
 * Uses Intl.DateTimeFormat for consistent locale-aware formatting.
 *
 * @param timestamp - ISO string, epoch ms, or Date object (assumed UTC)
 * @param options - Formatting options
 * @returns Formatted string, or fallback if timestamp is invalid
 */
export function formatDateTime(
  timestamp: string | number | Date | null | undefined,
  options?: FormatDateTimeOptions
): string {
  if (!timestamp) return '—';

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const date = parseTimestamp(timestamp);
  if (!date) return String(timestamp);

  const dateOpts: Intl.DateTimeFormatOptions = {};
  const timeOpts: Intl.DateTimeFormatOptions = {};

  if (opts.date) {
    dateOpts.year = 'numeric';
    dateOpts.month = '2-digit';
    dateOpts.day = '2-digit';
  }

  if (opts.time) {
    timeOpts.hour = '2-digit';
    timeOpts.minute = '2-digit';
    timeOpts.hour12 = opts.hour12;
    if (opts.seconds) {
      timeOpts.second = '2-digit';
    }
  }

  const parts: string[] = [];

  if (opts.date) {
    const dateFormatter = new Intl.DateTimeFormat(opts.locale, {
      ...dateOpts,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    parts.push(dateFormatter.format(date));
  }

  if (opts.time) {
    const timeFormatter = new Intl.DateTimeFormat(opts.locale, {
      ...timeOpts,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    parts.push(timeFormatter.format(date));
  }

  return parts.join(' ');
}

/**
 * Format a UTC timestamp as a date string (YYYY-MM-DD) in local time.
 *
 * @param timestamp - ISO string, epoch ms, or Date object (assumed UTC)
 * @returns Date string in YYYY-MM-DD format, or fallback
 */
export function formatDate(
  timestamp: string | number | Date | null | undefined
): string {
  if (!timestamp) return '—';

  const date = parseTimestamp(timestamp);
  if (!date) return String(timestamp);

  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  return formatter.format(date);
}

/**
 * Format a UTC timestamp as a compact time string (HH:MM:SS) in local time.
 * Useful for log timestamps and "last checked" displays.
 *
 * @param timestamp - ISO string, epoch ms, or Date object (assumed UTC)
 * @param hour12 - Use 12-hour clock. Default: false
 * @returns Time string, or fallback
 */
export function formatTime(
  timestamp: string | number | Date | null | undefined,
  hour12: boolean = false
): string {
  return formatDateTime(timestamp, { date: false, time: true, hour12, seconds: true });
}

/**
 * Convert a timestamp to a UTC ISO string for API responses.
 * Ensures consistent UTC representation regardless of local timezone.
 *
 * @param timestamp - ISO string, epoch ms, or Date object
 * @returns UTC ISO string, or empty string if invalid
 */
export function toUTCISOString(
  timestamp: string | number | Date | null | undefined
): string {
  if (!timestamp) return '';

  const date = parseTimestamp(timestamp);
  if (!date) return '';

  return date.toISOString();
}

/**
 * Get the current time as a UTC ISO string.
 *
 * @returns Current time as UTC ISO string
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Get the current date as YYYY-MM-DD in local time.
 *
 * @returns Current date string
 */
export function todayLocal(): string {
  return formatDate(new Date());
}
