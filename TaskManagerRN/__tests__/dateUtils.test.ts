import {
  formatToUiDate,
  formatToUiTime,
  formatToUiDateTime,
  formatToDbDate,
  parseDbDate,
  isOverdue,
  getGreeting,
  getRelativeDateLabel,
} from '../src/utils/dateUtils';

describe('Date Utilities', () => {
  const fixedTimestamp = new Date(2026, 9, 15, 14, 30, 0).getTime(); // 15-Oct-2026, 02:30 PM

  test('formats UI date correctly as dd-MMM-yyyy', () => {
    const formatted = formatToUiDate(fixedTimestamp);
    expect(formatted).toBe('15-Oct-2026');
  });

  test('formats UI time correctly with AM/PM', () => {
    const formatted = formatToUiTime(fixedTimestamp);
    expect(formatted).toBe('02:30 PM');
  });

  test('formats UI date time combined', () => {
    const formatted = formatToUiDateTime(fixedTimestamp);
    expect(formatted).toBe('15-Oct-2026, 02:30 PM');
  });

  test('formats database date as YYYY-MM-DD', () => {
    const formatted = formatToDbDate(fixedTimestamp);
    expect(formatted).toBe('2026-10-15');
  });

  test('parses database date correctly', () => {
    const parsed = parseDbDate('2026-10-15');
    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(9);
    expect(parsed?.getDate()).toBe(15);
  });

  test('detects overdue status correctly', () => {
    const past = Date.now() - 10000;
    const future = Date.now() + 10000;

    // Incomplete past task is overdue
    expect(isOverdue(past, false)).toBe(true);

    // Completed past task is not overdue
    expect(isOverdue(past, true)).toBe(false);

    // Future incomplete task is not overdue
    expect(isOverdue(future, false)).toBe(false);

    // Null due date is not overdue
    expect(isOverdue(null, false)).toBe(false);
  });

  test('returns proper greeting', () => {
    const greeting = getGreeting();
    expect(['Good morning', 'Good afternoon', 'Good evening']).toContain(greeting);
  });

  test('returns relative date label for today', () => {
    const now = Date.now();
    expect(getRelativeDateLabel(now)).toBe('Today');
  });
});
