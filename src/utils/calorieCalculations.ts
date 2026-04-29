export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'very_high';
export type CalorieStrategy =
  | 'cut_mild'
  | 'cut_moderate'
  | 'cut_aggressive'
  | 'recomp'
  | 'bulk_lean'
  | 'bulk_moderate'
  | 'bulk_aggressive';

export type CalorieProfile = {
  sex: 'male' | 'female';
  age: number;
  heightIn: number;
  weightLb: number;
  activityLevel: ActivityLevel;
};

export type CalorieTarget = {
  id: CalorieStrategy;
  label: string;
  dailyDelta: number;
  targetCalories: number;
  targetCaloriesWorkoutDay: number;
  targetCaloriesRestDay: number;
  weeklyDelta: number;
  estimatedWeeklyWeightChange: number;
};

export type MaintenanceBreakdown = {
  bmr: number;
  baseTDEE: number;
  exerciseCaloriesPerDay: number;
  weeklyExerciseCalories: number;
  maintenanceLow: number;
  maintenanceMid: number;
  maintenanceHigh: number;
};

export const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.3,
  moderate: 1.4,
  high: 1.5,
  very_high: 1.65,
};

export const activityLevelLabels: Record<ActivityLevel, { label: string; description: string }> = {
  sedentary: { label: 'Sedentary', description: 'Desk job, <5k steps, minimal movement' },
  light: { label: 'Light', description: 'Some walking, about 5-7k steps' },
  moderate: { label: 'Moderate', description: 'Active lifestyle, about 7-10k steps' },
  high: { label: 'Active', description: 'On your feet often, 10k+ steps' },
  very_high: { label: 'Very Active', description: 'Physical job or very high daily movement' },
};

const roundToNearest25 = (value: number) => Math.round(value / 25) * 25;

export function calculateBmr(profile: Omit<CalorieProfile, 'activityLevel'>) {
  const weightKg = profile.weightLb * 0.45359237;
  const heightCm = profile.heightIn * 2.54;
  const sexAdjustment = profile.sex === 'male' ? 5 : -161;
  return roundToNearest25((10 * weightKg) + (6.25 * heightCm) - (5 * profile.age) + sexAdjustment);
}

export function estimateLiftingCaloriesPerSession(minutes = 60) {
  return roundToNearest25(Math.max(175, Math.min(450, (minutes / 30) * 100)));
}

export function estimateCardioCalories(type: 'walking' | 'incline' | 'unknown', minutes: number, weightLb: number) {
  const weightFactor = Math.max(0.85, Math.min(1.25, weightLb / 180));
  const perMinute = type === 'incline' ? 10 : type === 'walking' ? 4 : 6;
  return roundToNearest25(perMinute * minutes * weightFactor);
}

export function calculateMaintenanceBreakdown(profile: CalorieProfile & {
  liftingDaysPerWeek?: number;
  liftingMinutes?: number;
  walkingSessionsPerWeek?: number;
  walkingMinutesPerSession?: number;
  inclineSessionsPerWeek?: number;
  inclineMinutesPerSession?: number;
}) {
  const bmr = calculateBmr(profile);
  const baseTDEE = roundToNearest25(bmr * activityMultipliers[profile.activityLevel]);
  const liftingCalories = (profile.liftingDaysPerWeek ?? 0) * estimateLiftingCaloriesPerSession(profile.liftingMinutes ?? 60);
  const walkingCalories = (profile.walkingSessionsPerWeek ?? 0) * estimateCardioCalories('walking', profile.walkingMinutesPerSession ?? 30, profile.weightLb);
  const inclineCalories = (profile.inclineSessionsPerWeek ?? 0) * estimateCardioCalories('incline', profile.inclineMinutesPerSession ?? 15, profile.weightLb);
  const weeklyExerciseCalories = roundToNearest25(liftingCalories + walkingCalories + inclineCalories);
  const exerciseCaloriesPerDay = roundToNearest25(weeklyExerciseCalories / 7);
  const maintenanceMid = roundToNearest25(baseTDEE + exerciseCaloriesPerDay);
  return {
    bmr,
    baseTDEE,
    exerciseCaloriesPerDay,
    weeklyExerciseCalories,
    maintenanceLow: roundToNearest25(maintenanceMid - 100),
    maintenanceMid,
    maintenanceHigh: roundToNearest25(maintenanceMid + 100),
  };
}

export function calculateMaintenanceCalories(profile: CalorieProfile) {
  return calculateMaintenanceBreakdown(profile).maintenanceMid;
}

export function getWeightChangeEstimate(calorieDelta: number) {
  const weeklyDelta = calorieDelta * 7;
  return {
    dailyDelta: calorieDelta,
    weeklyDelta,
    estimatedWeeklyWeightChange: Math.round((weeklyDelta / 3500) * 10) / 10,
  };
}

export function calculateDeficitTargets(maintenanceCalories: number, sex: 'male' | 'female' = 'male', liftingDaysPerWeek = 4): CalorieTarget[] {
  const floor = sex === 'female' ? 1200 : 1500;
  return [
    { id: 'cut_aggressive', label: 'Aggressive cut', dailyDelta: -600 },
    { id: 'cut_moderate', label: 'Moderate cut', dailyDelta: -400 },
    { id: 'cut_mild', label: 'Mild cut', dailyDelta: -200 },
  ].map(target => targetFromDelta(target.id as CalorieStrategy, target.label, target.dailyDelta, maintenanceCalories, floor, liftingDaysPerWeek));
}

export function calculateSurplusTargets(maintenanceCalories: number, liftingDaysPerWeek = 4): CalorieTarget[] {
  return [
    { id: 'bulk_lean', label: 'Lean bulk', dailyDelta: 200 },
    { id: 'bulk_moderate', label: 'Moderate bulk', dailyDelta: 400 },
    { id: 'bulk_aggressive', label: 'Aggressive bulk', dailyDelta: 600 },
  ].map(target => targetFromDelta(target.id as CalorieStrategy, target.label, target.dailyDelta, maintenanceCalories, 0, liftingDaysPerWeek));
}

export function calculateRecompTargets(maintenanceCalories: number, sex: 'male' | 'female' = 'male', liftingDaysPerWeek = 4): CalorieTarget[] {
  const floor = sex === 'female' ? 1200 : 1500;
  return [
    { id: 'recomp', label: 'Recomp / maintenance', dailyDelta: 0 },
    { id: 'cut_mild', label: 'Slight deficit', dailyDelta: -200 },
    { id: 'bulk_lean', label: 'Slight surplus', dailyDelta: 200 },
  ].map(target => targetFromDelta(target.id as CalorieStrategy, target.label, target.dailyDelta, maintenanceCalories, floor, liftingDaysPerWeek));
}

export function targetFromDelta(id: CalorieStrategy, label: string, dailyDelta: number, maintenanceCalories: number, floor = 0, liftingDaysPerWeek = 4): CalorieTarget {
  const estimate = getWeightChangeEstimate(dailyDelta);
  const averageTarget = roundToNearest25(Math.max(floor, maintenanceCalories + dailyDelta));
  const daySwing = id === 'recomp' ? 150 : 200;
  const liftDays = Math.max(0, Math.min(7, Math.round(liftingDaysPerWeek)));
  const restDays = Math.max(0, 7 - liftDays);
  const targetCaloriesWorkoutDay = liftDays > 0
    ? roundToNearest25(Math.max(floor, averageTarget + daySwing))
    : averageTarget;
  const targetCaloriesRestDay = restDays > 0 && liftDays > 0
    ? roundToNearest25(Math.max(floor, ((averageTarget * 7) - (targetCaloriesWorkoutDay * liftDays)) / restDays))
    : averageTarget;
  return {
    id,
    label,
    dailyDelta,
    weeklyDelta: estimate.weeklyDelta,
    estimatedWeeklyWeightChange: estimate.estimatedWeeklyWeightChange,
    targetCalories: averageTarget,
    targetCaloriesWorkoutDay,
    targetCaloriesRestDay,
  };
}
