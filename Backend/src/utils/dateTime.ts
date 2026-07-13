/**
 * Unified date/time utility for handling appointment dates and times consistently
 * All dates are stored in UTC in the database, but we need to handle them
 * consistently when converting between frontend and backend formats.
 */

/**
 * Convert a date and time string to UTC ISO string for database storage
 * @param date - Date object (local timezone)
 * @param time - Time string in format "HH:mm" (local timezone)
 * @returns ISO string in UTC
 */
export function combineDateAndTime(date: Date, time: string): string {
  // Parse time components
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date in local timezone with the specified date and time
  const localDateTime = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
  
  // Convert to ISO string (which is in UTC)
  // This ensures the database stores the correct UTC time
  return localDateTime.toISOString();
}

/**
 * Convert UTC ISO string to local date and time components
 * @param isoString - ISO string from database (UTC)
 * @returns Object with date (Date object, local timezone) and time (string "HH:mm")
 */
export function parseDateTime(isoString: string): { date: Date; time: string } {
  const utcDate = new Date(isoString);
  
  // Get local date components
  const year = utcDate.getFullYear();
  const month = utcDate.getMonth();
  const day = utcDate.getDate();
  const hours = utcDate.getHours();
  const minutes = utcDate.getMinutes();
  
  // Create date object in local timezone (for date picker)
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  
  // Format time as HH:mm
  const time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  return { date, time };
}

/**
 * Format date for display (YYYY-MM-DD)
 * @param date - Date object
 * @returns Date string in format YYYY-MM-DD
 */
export function formatDateForDisplay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for display (HH:mm)
 * @param isoString - ISO string from database (UTC)
 * @returns Time string in format HH:mm (Morocco timezone UTC+1)
 */
export function formatTimeForDisplay(isoString: string): string {
  const utcDate = new Date(isoString);
  
  // Extract UTC time components
  const utcHours = utcDate.getUTCHours();
  const utcMinutes = utcDate.getUTCMinutes();
  
  // Convert UTC to Morocco time (UTC+1) by adding 1 hour
  let moroccoHours = utcHours + 1;
  const moroccoMinutes = utcMinutes;
  
  // Handle hour overflow (e.g., 23:30 UTC + 1 hour = 00:30 next day)
  if (moroccoHours >= 24) {
    moroccoHours = moroccoHours - 24;
  }
  
  const hours = moroccoHours.toString().padStart(2, '0');
  const minutes = moroccoMinutes.toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format date and time for API response (consistent format)
 * @param isoString - ISO string from database
 * @returns Object with date (YYYY-MM-DD) and time (HH:mm) in local timezone
 */
export function formatDateTimeForAPI(isoString: string): { date: string; time: string } {
  const date = new Date(isoString);
  const dateStr = formatDateForDisplay(date);
  const timeStr = formatTimeForDisplay(isoString);
  return { date: dateStr, time: timeStr };
}

/**
 * Create a date range for querying appointments
 * @param startDate - Start date (local timezone)
 * @param endDate - End date (local timezone)
 * @returns Object with start and end dates in UTC for database queries
 */
export function createDateRange(startDate: Date, endDate: Date): { start: Date; end: Date } {
  // Set start date to beginning of day in local timezone
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  
  // Set end date to end of day in local timezone
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  
  // Return as Date objects - Prisma will handle UTC conversion
  return { start, end };
}

/**
 * Format a UTC date string to a localized date string in Morocco timezone
 * @param utcDateString - ISO string from database (UTC)
 * @param timezone - Timezone string (default: 'Africa/Casablanca')
 * @returns Formatted date string in French locale with Morocco timezone
 */
export function formatDateForNotification(utcDateString: string, timezone: string = 'Africa/Casablanca'): string {
  // Create a date object from the UTC string
  const utcDate = new Date(utcDateString);
  
  // Use Intl.DateTimeFormat to format in the specified timezone
  const formatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  return formatter.format(utcDate);
}



