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

export interface HeartRateZone {
  zone: string;
  minHR: number;
  maxHR: number;
  percentage: string;
  description: string;
}

export type CardioActivityType = 'outdoor-walk' | 'incline-walk' | 'golf-riding' | 'golf-walking';
export type WeeklyLossRate = 0.5 | 1 | 1.5 | 2;

const ACTIVITY_METS: Record<CardioActivityType, number> = {
  'outdoor-walk': 3.8,
  'incline-walk': 6.5,
  'golf-riding': 3.5,
  'golf-walking': 4.8,
};

export const weeklyLossOptions: Record<string, {
  rate: WeeklyLossRate;
  label: string;
  deficit: number;
  note: string;
  risk: 'low' | 'moderate' | 'high';
}> = {
  slow: {
    rate: 0.5,
    label: '0.5 lb/week',
    deficit: 250,
    note: 'Easiest to recover from and best for strength retention.',
    risk: 'low',
  },
  moderate: {
    rate: 1,
    label: '1 lb/week',
    deficit: 500,
    note: 'Good default for steady weight loss while preserving training quality.',
    risk: 'low',
  },
  aggressive: {
    rate: 1.5,
    label: '1.5 lb/week',
    deficit: 750,
    note: 'Faster loss with higher hunger and recovery cost.',
    risk: 'moderate',
  },
  rapid: {
    rate: 2,
    label: '2 lb/week',
    deficit: 1000,
    note: 'Large deficit. Muscle and strength loss risk is higher if protein, sleep, or lifting slip.',
    risk: 'high',
  },
};

/**
 * Calculate target heart rate zone for cardio based on Karvonen formula
 * Uses 50-70% of max heart rate for moderate cardio (fat burn/steady state)
 */
export function calculateHeartRateZone(age: number, weeklyLossRate: WeeklyLossRate = 1): HeartRateZone {
  // Estimate max heart rate
  const maxHR = Math.round(220 - age);
  const lossOption = getWeeklyLossOption(weeklyLossRate);
  const hrMinPercent = weeklyLossRate >= 1.5 ? 0.62 : 0.58;
  const hrMaxPercent = weeklyLossRate >= 2 ? 0.78 : weeklyLossRate >= 1.5 ? 0.75 : 0.70;
  
  const minHR = Math.round(maxHR * hrMinPercent);
  const maxHRTarget = Math.round(maxHR * hrMaxPercent);
  
  return {
    zone: `${lossOption.label} Cardio Zone`,
    minHR,
    maxHR: maxHRTarget,
    percentage: `${Math.round(hrMinPercent * 100)}-${Math.round(hrMaxPercent * 100)}%`,
    description: `${lossOption.note} Keep your heart rate between ${minHR}-${maxHRTarget} bpm during dedicated cardio.`,
  };
}

/**
 * Calculate estimated calories burned during cardio
 * Based on weight and type of cardio (walking, incline, etc)
 */
export function estimateCaloriesBurned(
  cardioMinutes: number,
  type: CardioActivityType,
  weight: number,
  age: number
): number {
  const kg = (weight || 180) * 0.453592;
  const met = ACTIVITY_METS[type];
  // Net activity calories subtract 1 MET resting cost to avoid double-counting baseline metabolism.
  const caloriesPerMinute = Math.max(0, (met - 1) * 3.5 * kg / 200);
  return Math.round(caloriesPerMinute * (cardioMinutes || 0));
}

export function estimateGolfCalories(
  holes: number,
  mode: 'riding' | 'walking',
  weight: number,
): number {
  const normalizedHoles = Math.max(0, Math.min(36, holes || 0));
  const minutesPerHole = mode === 'walking' ? 13 : 10;
  return estimateCaloriesBurned(normalizedHoles * minutesPerHole, mode === 'walking' ? 'golf-walking' : 'golf-riding', weight, 25);
}

export function calculateCardioPlan(log: any, profile: any) {
  const lossOption = getWeeklyLossOption(profile.weeklyLossRate ?? 1);
  const weight = profile.weight || 180;
  const age = profile.age || 25;
  const golfHoles = log.golf ? (log.golfHoles ?? 18) : 0;
  const golfMode = log.golfMode ?? 'riding';

  const estimatedOutdoorCalories = estimateCaloriesBurned(log.outdoorWalk ?? 0, 'outdoor-walk', weight, age);
  const estimatedInclineCalories = estimateCaloriesBurned(log.inclineWalk ?? 0, 'incline-walk', weight, age);
  const estimatedCardioCalories = estimatedOutdoorCalories + estimatedInclineCalories;
  const estimatedGolfCalories = estimateGolfCalories(golfHoles, golfMode, weight);
  const cardioCalories = Number.isFinite(Number(log.cardioBurnedCalories))
    ? Math.max(0, Number(log.cardioBurnedCalories))
    : estimatedCardioCalories;
  const golfCalories = Number.isFinite(Number(log.golfBurnedCalories))
    ? Math.max(0, Number(log.golfBurnedCalories))
    : estimatedGolfCalories;
  const otherCalories = Math.max(0, log.otherBurnedCalories ?? 0);
  const burnedCalories = cardioCalories + golfCalories + otherCalories;
  const targetCalories = Math.round(lossOption.deficit * 0.45);
  const remainingCalories = Math.max(0, targetCalories - burnedCalories);
  const outdoorCaloriesPerMinute = Math.max(1, estimateCaloriesBurned(10, 'outdoor-walk', weight, age) / 10);
  const inclineCaloriesPerMinute = Math.max(1, estimateCaloriesBurned(10, 'incline-walk', weight, age) / 10);

  return {
    lossOption,
    targetCalories,
    burnedCalories,
    remainingCalories,
    outdoorCalories: estimatedOutdoorCalories,
    inclineCalories: estimatedInclineCalories,
    estimatedCardioCalories,
    cardioCalories,
    golfCalories,
    estimatedGolfCalories,
    otherCalories,
    golfHoles,
    golfMode,
    outdoorMinutesNeeded: Math.ceil(remainingCalories / outdoorCaloriesPerMinute),
    inclineMinutesNeeded: Math.ceil(remainingCalories / inclineCaloriesPerMinute),
    progress: Math.min(1, burnedCalories / targetCalories),
    heartRateZone: calculateHeartRateZone(age, lossOption.rate),
  };
}

export function calculateWaterPlan(log: any, profile: any) {
  const weight = profile.weight || 180;
  const heightIn = profile.heightIn || 69;
  const lossOption = getWeeklyLossOption(profile.weeklyLossRate ?? 1);
  const cardioPlan = calculateCardioPlan(log ?? {}, profile ?? {});

  // National Academies fluid AI is about 101 oz/day for men and 74 oz/day for women from beverages.
  const baselineBeverageOunces = profile.sex === 'female' ? 74 : 101;
  const sizeAdjustment = (weight - (profile.sex === 'female' ? 150 : 180)) * 0.18 + Math.max(0, heightIn - 66) * 0.5;
  const proteinAdjustment = Math.max(0, (profile.proteinGoal ?? 0) - weight * 0.7) * 0.08;
  const cardioAdjustment = Math.round(cardioPlan.burnedCalories / 100) * 3;
  const golfAdjustment = log?.golf ? 12 : 0;
  const drinkingAdjustment = (log?.drinks ?? 0) * 8;
  const intensityAdjustment = lossOption.rate >= 2 ? 12 : lossOption.rate >= 1.5 ? 8 : 4;

  const targetOunces = Math.round(Math.max(64, baselineBeverageOunces + sizeAdjustment + proteinAdjustment + cardioAdjustment + golfAdjustment + drinkingAdjustment + intensityAdjustment) / 4) * 4;
  const loggedOunces = log?.waterOz ?? 0;
  const remainingOunces = Math.max(0, targetOunces - loggedOunces);

  return {
    targetOunces,
    loggedOunces,
    remainingOunces,
    progress: Math.min(1, loggedOunces / targetOunces),
    liters: Math.round(targetOunces * 0.0295735 * 10) / 10,
    note: `Based on sex-specific fluid baseline, ${Math.round(weight)} lb body weight, ${heightIn}" height, protein target, cardio burn, alcohol, and weekly loss goal.`,
  };
}

export function calculateBmr(profile: any): number {
  const weight = profile.weight || 180;
  const heightIn = profile.heightIn || 69;
  const age = profile.age || 25;
  const kg = weight * 0.453592;
  const cm = heightIn * 2.54;
  return Math.round(profile.sex === 'female'
    ? 10 * kg + 6.25 * cm - 5 * age - 161
    : 10 * kg + 6.25 * cm - 5 * age + 5);
}

export function getWeeklyLossOption(rate: number = 1) {
  return Object.values(weeklyLossOptions).find((option) => option.rate === rate) ?? weeklyLossOptions.moderate;
}

export function calculateNutritionTargets(profile: any) {
  const bmr = calculateBmr(profile);
  const activity = profile.activity || 1.5;
  const maintenance = Math.round(bmr * activity);
  const lossOption = getWeeklyLossOption(profile.weeklyLossRate ?? 1);
  const goal = profile.goal ?? (profile.goalWeight && profile.goalWeight < profile.weight ? 'cut' : 'maintain');
  const deficit = goal === 'cut' ? lossOption.deficit : goal === 'bulk' ? -300 : 0;
  const calorieGoal = Math.round(Math.max(profile.sex === 'female' ? 1300 : 1500, maintenance - deficit));
  const proteinGoal = Math.round(Math.max(profile.weight * 0.85, profile.goal === 'cut' ? profile.weight : profile.weight * 0.8));

  return {
    bmr,
    maintenance,
    calorieGoal,
    proteinGoal,
    deficit,
    lossOption,
  };
}

export function calculateEffectiveCalorieGoal(profile: any, log: any) {
  const baseGoal = profile.calorieGoal || calculateNutritionTargets(profile).calorieGoal;
  const lifted = log?.workoutDone ?? false;
  const estimatedWorkoutCalories = Math.round((profile.weight || 180) * 1.15);
  const workoutCalories = Number.isFinite(Number(log?.workoutBurnedCalories))
    ? Math.max(0, Number(log.workoutBurnedCalories))
    : estimatedWorkoutCalories;
  const workoutCredit = lifted ? workoutCalories : 0;
  return {
    goal: Math.max(profile.sex === 'female' ? 1200 : 1400, baseGoal + workoutCredit),
    baseGoal,
    workoutCredit,
    workoutCalories,
    estimatedWorkoutCalories,
  };
}

export function suggestedRestSeconds(exercise: any) {
  const name = `${exercise?.name ?? ''}`.toLowerCase();
  const maxReps = exercise?.maxReps ?? 10;
  const compound = ['squat', 'deadlift', 'bench', 'press', 'row', 'pulldown', 'pull-up', 'leg press'].some((term) => name.includes(term));
  if (compound && maxReps <= 8) return 180;
  if (compound) return 150;
  if (maxReps >= 12) return 75;
  return 90;
}

export function getProgressionRecommendation(exercise: any) {
  const reps = exercise?.lastReps ?? [];
  const sets = exercise?.sets ?? reps.length;
  const maxReps = exercise?.maxReps ?? 10;
  const minReps = exercise?.minReps ?? 8;
  const name = `${exercise?.name ?? ''}`.toLowerCase();
  const compoundLower = ['squat', 'deadlift', 'leg press'].some((term) => name.includes(term));
  const increment = compoundLower ? 10 : 5;
  const complete = reps.length >= sets && reps.slice(0, sets).every((rep: number) => rep >= maxReps);
  const underTarget = reps.some((rep: number) => rep > 0 && rep < minReps);
  const currentWeight = exercise?.weight ?? 0;

  if (complete) {
    return {
      action: 'increase' as const,
      nextWeight: currentWeight + increment,
      text: `Increase to ${currentWeight + increment} lb next time.`,
    };
  }

  if (underTarget) {
    return {
      action: 'hold' as const,
      nextWeight: currentWeight,
      text: `Hold ${currentWeight} lb until every set is at least ${minReps} reps.`,
    };
  }

  return {
    action: 'build' as const,
    nextWeight: currentWeight,
    text: `Stay at ${currentWeight} lb and add reps until all ${sets} sets hit ${maxReps}.`,
  };
}
