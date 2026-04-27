// src/utils/colorScheme.ts
// Color-coding logic for DayLog entries

export type DayStatus = 'green' | 'yellow' | 'red' | 'gray';

export interface DayStatusBreakdown {
  status: DayStatus;
  reason: string;
  details: {
    hasCalories: boolean;
    calorieStatus: 'target' | 'over' | 'under' | 'none';
    hasProtein: boolean;
    proteinStatus: 'target' | 'over' | 'under' | 'none';
    hasWorkout: boolean;
    hasCardio: boolean;
    hasLogging: boolean;
  };
}

/**
 * Determine the color status for a day based on their logging and goals.
 * 
 * GREEN: Logged all key metrics and hit goals (within tolerance)
 * YELLOW: Partially logged or close to goals but not perfect
 * RED: Exceeded goals significantly or missed multiple targets
 * GRAY: No logging at all (new day)
 */
export function getDayStatus(
  dayLog: any, // DayLog type
  profile: any, // Profile type
  tolerance: { calories: number; protein: number } = { calories: 100, protein: 10 }
): DayStatusBreakdown {
  // If no logging data at all
  if (!dayLog || dayLog.date === '') {
    return {
      status: 'gray',
      reason: 'No data logged',
      details: {
        hasCalories: false,
        calorieStatus: 'none',
        hasProtein: false,
        proteinStatus: 'none',
        hasWorkout: false,
        hasCardio: false,
        hasLogging: false,
      },
    };
  }

  const details = {
    hasCalories: (dayLog.calories ?? 0) > 0,
    calorieStatus: getCalorieStatus(dayLog.calories ?? 0, profile.calorieGoal, tolerance.calories),
    hasProtein: (dayLog.protein ?? 0) > 0,
    proteinStatus: getProteinStatus(dayLog.protein ?? 0, profile.proteinGoal, tolerance.protein),
    hasWorkout: dayLog.workoutDone ?? false,
    hasCardio: (dayLog.outdoorWalk ?? 0) + (dayLog.inclineWalk ?? 0) > 0,
    hasLogging: true,
  };

  // Determine status
  let status: DayStatus = 'gray';

  const loggingScore = [
    details.hasCalories ? 1 : 0,
    details.hasProtein ? 1 : 0,
    (details.hasWorkout || details.hasCardio) ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const isOnTarget =
    details.calorieStatus === 'target' &&
    details.proteinStatus === 'target' &&
    (details.hasWorkout || details.hasCardio);

  // GREEN: Logged everything and on target
  if (loggingScore === 3 && isOnTarget) {
    status = 'green';
  }
  // RED: Exceeded significantly or missed multiple targets
  else if (
    (details.calorieStatus === 'over' && (dayLog.calories ?? 0) > profile.calorieGoal + 200) ||
    (details.proteinStatus === 'under' && (dayLog.protein ?? 0) < profile.proteinGoal - 20) ||
    loggingScore <= 1
  ) {
    status = 'red';
  }
  // YELLOW: Partially logged or slightly off
  else {
    status = 'yellow';
  }

  return {
    status,
    reason: getStatusReason(status, details),
    details,
  };
}

function getCalorieStatus(
  actual: number,
  goal: number,
  tolerance: number
): 'target' | 'over' | 'under' | 'none' {
  if (actual === 0) return 'none';
  const diff = actual - goal;
  if (Math.abs(diff) <= tolerance) return 'target';
  return diff > 0 ? 'over' : 'under';
}

function getProteinStatus(
  actual: number,
  goal: number,
  tolerance: number
): 'target' | 'over' | 'under' | 'none' {
  if (actual === 0) return 'none';
  const diff = actual - goal;
  if (Math.abs(diff) <= tolerance) return 'target';
  return diff > 0 ? 'over' : 'under';
}

function getStatusReason(status: DayStatus, details: DayStatusBreakdown['details']): string {
  if (status === 'green') return 'On track! 🎉';
  if (status === 'red') {
    if (!details.hasCalories) return 'No meals logged';
    if (details.calorieStatus === 'over') return 'Over calorie goal';
    if (details.proteinStatus === 'under') return 'Under protein goal';
    if (!details.hasWorkout && !details.hasCardio) return 'No workout/cardio';
    return 'Off track';
  }
  if (status === 'yellow') return 'Partial logging';
  return 'No data';
}

export const ColorMap = {
  green: '#10b981',  // Emerald
  yellow: '#fbbf24', // Amber
  red: '#ef4444',    // Red
  gray: '#6b7280',   // Gray
} as const;

export const ColorMapBg = {
  green: '#064e3b',  // Dark emerald
  yellow: '#78350f', // Dark amber
  red: '#7f1d1d',    // Dark red
  gray: '#374151',   // Dark gray
} as const;
