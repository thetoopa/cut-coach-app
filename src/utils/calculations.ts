// src/utils/calculations.ts
// Calculations for progress, macros, and metrics

export interface MacroProgress {
  calories: {
    logged: number;
    goal: number;
    remaining: number;
    percentOfGoal: number;
  };
  protein: {
    logged: number;
    goal: number;
    remaining: number;
    percentOfGoal: number;
  };
  carbs: {
    logged: number;
    goal: number;
    remaining: number;
    percentOfGoal: number;
  };
  fat: {
    logged: number;
    goal: number;
    remaining: number;
    percentOfGoal: number;
  };
}

export function calculateMacroProgress(
  loggedMacros: { calories: number; protein: number; carbs: number; fat: number },
  goals: { calorieGoal: number; proteinGoal: number; carbGoal?: number; fatGoal?: number }
): MacroProgress {
  const carbGoal = goals.carbGoal ?? goals.calorieGoal * 0.45 / 4; // ~45% of calories
  const fatGoal = goals.fatGoal ?? goals.calorieGoal * 0.30 / 9;   // ~30% of calories

  return {
    calories: {
      logged: loggedMacros.calories,
      goal: goals.calorieGoal,
      remaining: goals.calorieGoal - loggedMacros.calories,
      percentOfGoal: (loggedMacros.calories / goals.calorieGoal) * 100,
    },
    protein: {
      logged: loggedMacros.protein,
      goal: goals.proteinGoal,
      remaining: goals.proteinGoal - loggedMacros.protein,
      percentOfGoal: (loggedMacros.protein / goals.proteinGoal) * 100,
    },
    carbs: {
      logged: loggedMacros.carbs,
      goal: carbGoal,
      remaining: carbGoal - loggedMacros.carbs,
      percentOfGoal: (loggedMacros.carbs / carbGoal) * 100,
    },
    fat: {
      logged: loggedMacros.fat,
      goal: fatGoal,
      remaining: fatGoal - loggedMacros.fat,
      percentOfGoal: (loggedMacros.fat / fatGoal) * 100,
    },
  };
}

export function calculateWeeklyStreak(
  dayLogs: Record<string, any>,
  endDate: string
): { streak: number; days: string[] } {
  const streakDays: string[] = [];
  const currentDate = new Date(endDate);

  for (let i = 0; i < 7; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const log = dayLogs[key];

    if (log && isLogComplete(log)) {
      streakDays.push(key);
    } else {
      break;
    }
  }

  return { streak: streakDays.length, days: streakDays };
}

export function isLogComplete(log: any): boolean {
  return (
    (log?.calories ?? 0) > 0 &&
    (log?.protein ?? 0) > 0 &&
    (log?.workoutDone || (log?.outdoorWalk ?? 0) + (log?.inclineWalk ?? 0) > 0)
  );
}

export function calculateConsecutiveGreenDays(
  dayLogs: Record<string, any>,
  endDate: string,
  profile: any
): number {
  let consecutive = 0;
  const currentDate = new Date(endDate);

  for (let i = 0; i < 365; i++) {
    const date = new Date(currentDate);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    const log = dayLogs[key];

    if (!log) break;

    // Check if day was "green" (on target)
    const isCalorieOk = Math.abs((log.calories ?? 0) - profile.calorieGoal) <= 100;
    const isProteinOk = Math.abs((log.protein ?? 0) - profile.proteinGoal) <= 10;
    const hasActivity = log.workoutDone || (log.outdoorWalk ?? 0) + (log.inclineWalk ?? 0) > 0;

    if (isCalorieOk && isProteinOk && hasActivity) {
      consecutive++;
    } else {
      break;
    }
  }

  return consecutive;
}
