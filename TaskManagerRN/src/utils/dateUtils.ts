const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const FULL_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

/**
 * Formats milliseconds timestamp to "dd-MMM-yyyy" (e.g. "15-Oct-2026")
 */
export function formatToUiDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Formats milliseconds timestamp to "hh:mm a" (e.g. "05:30 PM")
 */
export function formatToUiTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  const strHours = String(hours).padStart(2, '0');
  return `${strHours}:${minutes} ${ampm}`;
}

/**
 * Formats milliseconds timestamp to "dd-MMM-yyyy, hh:mm a"
 */
export function formatToUiDateTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  return `${formatToUiDate(timestamp)}, ${formatToUiTime(timestamp)}`;
}

/**
 * Formats timestamp to database date string "YYYY-MM-DD"
 */
export function formatToDbDate(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses database date "YYYY-MM-DD" into Date object
 */
export function parseDbDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  const parts = dateString.split('-');
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return new Date(year, month, day);
}

/**
 * Checks if a task is overdue
 */
export function isOverdue(dueDateTime: number | null | undefined, isCompleted: boolean): boolean {
  if (isCompleted || !dueDateTime) return false;
  return dueDateTime < Date.now();
}

/**
 * Returns a human-friendly relative date string
 */
export function getRelativeDateLabel(timestamp: number | null | undefined): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  // Reset time portions for comparison
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const diffDays = Math.round((dDate - dNow) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  return formatToUiDate(timestamp);
}

/**
 * Returns greeting string based on the current hour (matches Kotlin implementation)
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

/**
 * Returns formatted today's header date "Thursday, 15-Oct-2026"
 */
export function getTodayHeaderDate(): string {
  const date = new Date();
  const dayName = DAY_NAMES[date.getDay()];
  return `${dayName}, ${formatToUiDate(date.getTime())}`;
}
