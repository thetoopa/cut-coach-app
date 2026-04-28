// src/utils/colorScheme.ts
// Color-coding logic for DayLog entries

import { calculateCardioPlan, calculateEffectiveCalorieGoal } from './calculations';

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
    workoutRequired: boolean;
    cardioRequired: boolean;
    cardioStatus: 'target' | 'under' | 'none';
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
  const hasAnyData = !!dayLog && (
    (dayLog.selectedMeals?.length ?? 0) > 0 ||
    (dayLog.calories ?? 0) > 0 ||
    (dayLog.protein ?? 0) > 0 ||
    (dayLog.weight ?? 0) > 0 ||
    (dayLog.waterOz ?? 0) > 0 ||
    (dayLog.outdoorWalk ?? 0) > 0 ||
    (dayLog.inclineWalk ?? 0) > 0 ||
    (dayLog.cardioBurnedCalories ?? 0) > 0 ||
    (dayLog.golfBurnedCalories ?? 0) > 0 ||
    (dayLog.otherBurnedCalories ?? 0) > 0 ||
    dayLog.golf ||
    dayLog.workoutDone
  );

  // If no logging data at all
  if (!dayLog || dayLog.date === '' || !hasAnyData) {
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
        workoutRequired: false,
        cardioRequired: false,
        cardioStatus: 'none',
        hasLogging: false,
      },
    };
  }

  const cardioMinutes = (dayLog.outdoorWalk ?? 0) + (dayLog.inclineWalk ?? 0);

  const effectiveCalories = calculateEffectiveCalorieGoal(profile, dayLog);
  const cardioPlan = calculateCardioPlan(dayLog, profile);
  const workoutRequired = dayLog.plannedLift !== false;
  const cardioRequired = cardioPlan.targetCalories > 0;
  const hasCardio = cardioMinutes > 0 || cardioPlan.burnedCalories > 0;
  const cardioComplete = !cardioRequired || cardioPlan.burnedCalories >= cardioPlan.targetCalories;
  const details: DayStatusBreakdown['details'] = {
    hasCalories: (dayLog.calories ?? 0) > 0,
    calorieStatus: getCalorieStatus(dayLog.calories ?? 0, effectiveCalories.goal, tolerance.calories),
    hasProtein: (dayLog.protein ?? 0) > 0,
    proteinStatus: getProteinStatus(dayLog.protein ?? 0, profile.proteinGoal, tolerance.protein),
    hasWorkout: dayLog.workoutDone ?? false,
    hasCardio,
    workoutRequired,
    cardioRequired,
    cardioStatus: cardioComplete ? 'target' : hasCardio ? 'under' : 'none',
    hasLogging: true,
  };

  // Determine status
  let status: DayStatus = 'gray';

  const isCalorieGreen =
    profile.goal === 'cut'
      ? (dayLog.calories ?? 0) <= effectiveCalories.goal + tolerance.calories
      : Math.abs((dayLog.calories ?? 0) - effectiveCalories.goal) <= tolerance.calories;
  const isProteinGreen = (dayLog.protein ?? 0) >= profile.proteinGoal - tolerance.protein;
  const workoutComplete = !workoutRequired || details.hasWorkout;

  const isOnTarget =
    isCalorieGreen &&
    isProteinGreen &&
    workoutComplete &&
    cardioComplete;

  // GREEN: Logged food, hit protein, stayed within calories, and completed planned activity.
  if (details.hasCalories && details.hasProtein && isOnTarget) {
    status = 'green';
  }
  // RED: Exceeded significantly or missed multiple targets
  else if (
    (details.calorieStatus === 'over' && (dayLog.calories ?? 0) > effectiveCalories.goal + 200) ||
    (details.proteinStatus === 'under' && (dayLog.protein ?? 0) < profile.proteinGoal - 20) ||
    (!details.hasCalories && !details.hasProtein)
  ) {
    status = 'red';
  }
  // YELLOW: Partially logged or slightly off
  else {
    status = 'yellow';
  }

  return {
    status,
    reason: getStatusReason(status, details, dayLog, profile, effectiveCalories.goal, cardioPlan.targetCalories, cardioPlan.burnedCalories),
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

function getStatusReason(
  status: DayStatus,
  details: DayStatusBreakdown['details'],
  dayLog: any,
  profile: any,
  calorieGoal: number,
  cardioTarget: number,
  cardioBurned: number
): string {
  if (status === 'green') return 'On track! 🎉';
  const missing = getMissingItems(details, dayLog, profile, calorieGoal, cardioTarget, cardioBurned);
  if (status === 'red') {
    if (missing.length) return missing.slice(0, 2).join(', ');
    return 'Off track';
  }
  if (status === 'yellow') return missing.length ? missing.slice(0, 2).join(', ') : 'Partial logging';
  return 'No data';
}

function getMissingItems(
  details: DayStatusBreakdown['details'],
  dayLog: any,
  profile: any,
  calorieGoal: number,
  cardioTarget: number,
  cardioBurned: number
): string[] {
  const missing: string[] = [];
  const calories = dayLog.calories ?? 0;
  const protein = dayLog.protein ?? 0;

  if (!details.hasCalories) {
    missing.push('Log meals');
  } else if (calories > calorieGoal + 100) {
    missing.push(`Over calories by ${Math.round(calories - calorieGoal)}`);
  }

  if (!details.hasProtein) {
    missing.push('Log protein');
  } else if (protein < profile.proteinGoal - 10) {
    missing.push(`Need ${Math.round(profile.proteinGoal - protein)}g protein`);
  }

  if (details.workoutRequired && !details.hasWorkout) {
    missing.push('Log workout');
  }

  if (details.cardioRequired && details.cardioStatus !== 'target') {
    missing.push(`Need ${Math.max(0, Math.round(cardioTarget - cardioBurned))} cardio cal`);
  }

  return missing;
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
