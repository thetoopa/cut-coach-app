// src/utils/dateHelpers.ts
// Date and calendar utilities

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dateFromKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function keyFromDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function getMonthDays(year: number, month: number): (number | null)[] {
  // month is 0-indexed (0 = January)
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

  const days: (number | null)[] = Array(startingDayOfWeek).fill(null);
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }
  return days;
}

export function getMonthName(month: number): string {
  return new Date(2024, month, 1).toLocaleDateString('en-US', { month: 'long' });
}

export function isToday(dateKey: string): boolean {
  return dateKey === todayKey();
}

export function isPast(dateKey: string): boolean {
  return dateKey < todayKey();
}

export function isFuture(dateKey: string): boolean {
  return dateKey > todayKey();
}

export function getDateString(dateKey: string): string {
  const date = dateFromKey(dateKey);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getDayOfWeekShort(dateKey: string): string {
  const date = dateFromKey(dateKey);
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff));
}

export function getStreakDates(dayLogs: Record<string, any>, endDate: string, minDays = 1): number {
  let streak = 0;
  let currentDate = dateFromKey(endDate);

  while (true) {
    const key = keyFromDate(currentDate);
    const log = dayLogs[key];
    
    if (!log || !isLogComplete(log)) {
      break;
    }
    
    streak++;
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return streak >= minDays ? streak : 0;
}

export function isLogComplete(log: any): boolean {
  // A log is "complete" if it has meaningful data
  return (
    (log?.calories ?? 0) > 0 &&
    (log?.protein ?? 0) > 0 &&
    (log?.workoutDone || (log?.outdoorWalk ?? 0) + (log?.inclineWalk ?? 0) > 0)
  );
}
