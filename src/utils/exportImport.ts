// Export/Import utilities for meals and workouts

export interface MealExportData {
  type: 'meal_batch';
  meals: Array<{
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    notes: string;
  }>;
  version: string;
  exportedAt: string;
}

export interface WorkoutExportData {
  type: 'workout_routine';
  workouts: Array<{
    id: string;
    name: string;
    cardioMin: number;
    backup: string[];
    exercises: Array<{
      id: string;
      name: string;
      sets: number;
      minReps: number;
      maxReps: number;
      weight: number;
      lastReps: number[];
      backup: string;
    }>;
  }>;
  version: string;
  exportedAt: string;
}

export function generateMealJSON(meals: any[]): string {
  const exportData: MealExportData = {
    type: 'meal_batch',
    meals: meals.map(m => ({
      name: m.name,
      type: m.type,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      notes: m.notes,
    })),
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function generateWorkoutJSON(workouts: any[]): string {
  const exportData: WorkoutExportData = {
    type: 'workout_routine',
    workouts: workouts.map(w => ({
      id: w.id,
      name: w.name,
      cardioMin: w.cardioMin,
      backup: w.backup,
      exercises: w.exercises,
    })),
    version: '1.0',
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(exportData, null, 2);
}

export function parseMealJSON(jsonString: string): any[] | null {
  const parsedMeals = parseJsonCandidates(jsonString).flatMap(data => {
    if (data.type === 'meal_batch' && Array.isArray(data.meals)) {
      return data.meals.map((m: any, i: number) => ({
        id: `imported-meal-${Date.now()}-${i}`,
        name: m.name,
        type: m.type,
        calories: m.calories || 0,
        protein: m.protein || 0,
        carbs: m.carbs || 0,
        fat: m.fat || 0,
        notes: m.notes || '',
        custom: true,
      }));
    }
    if (Array.isArray(data)) {
      return data.filter((m: any) => m?.name && m?.calories !== undefined).map((m: any, i: number) => ({
        id: `imported-meal-${Date.now()}-${i}`,
        name: m.name,
        type: normalizeMealType(m.type ?? m.category),
        calories: Number(m.calories) || 0,
        protein: Number(m.protein) || 0,
        carbs: Number(m.carbs) || 0,
        fat: Number(m.fat) || 0,
        notes: m.notes || m.description || '',
        custom: true,
      }));
    }
    return [];
  });
  return parsedMeals.length ? parsedMeals : null;
}

export function parseWorkoutJSON(jsonString: string): any[] | null {
  const parsedWorkouts = parseJsonCandidates(jsonString).flatMap(data => {
    if (data.type === 'workout_routine' && Array.isArray(data.workouts)) {
      return data.workouts.map(normalizeWorkout);
    }
    if (Array.isArray(data)) {
      return data.filter((w: any) => w?.name && Array.isArray(w?.exercises)).map(normalizeWorkout);
    }
    if (data?.name && Array.isArray(data?.exercises)) return [normalizeWorkout(data)];
    return [];
  });
  return parsedWorkouts.length ? parsedWorkouts : null;
}

function normalizeWorkout(w: any) {
  return {
    id: w.id || `imported-workout-${Date.now()}`,
    name: w.name,
    cardioMin: Number(w.cardioMin) || 15,
    backup: Array.isArray(w.backup) ? w.backup : [],
    exercises: Array.isArray(w.exercises) ? w.exercises.map((e: any, i: number) => {
      const sets = Number(e.sets) || 3;
      const weight = Number(e.weight) || 0;
      return {
        id: e.id || `imported-exercise-${Date.now()}-${i}`,
        name: e.name || 'Imported Exercise',
        sets,
        minReps: Number(e.minReps) || Number(e.reps) || 8,
        maxReps: Number(e.maxReps) || Number(e.reps) || 12,
        weight,
        lastReps: Array.isArray(e.lastReps) ? e.lastReps : Array.from({ length: sets }).map(() => 0),
        lastWeights: Array.isArray(e.lastWeights) ? e.lastWeights : Array.from({ length: sets }).map(() => weight),
        backup: e.selectedBackup || e.backup || 'Dumbbell or machine equivalent',
        backupOptions: Array.isArray(e.backupOptions) ? e.backupOptions : [e.backup || 'Dumbbell equivalent', 'Machine equivalent', 'Bodyweight equivalent'],
        selectedBackup: e.selectedBackup || e.backup || 'Dumbbell equivalent',
      };
    }) : [],
  };
}

function normalizeMealType(value: any) {
  const text = String(value || 'Lunch').toLowerCase();
  if (text.includes('breakfast')) return 'Breakfast';
  if (text.includes('dinner')) return 'Dinner';
  if (text.includes('snack')) return 'Snack';
  return 'Lunch';
}

function parseJsonCandidates(input: string): any[] {
  const candidates: any[] = [];
  try {
    candidates.push(JSON.parse(input));
    return candidates;
  } catch {}

  const fenced = Array.from(input.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)).map(match => match[1]);
  for (const block of fenced) {
    try { candidates.push(JSON.parse(block)); } catch {}
  }

  const starts = [...input].map((char, index) => (char === '{' || char === '[' ? index : -1)).filter(index => index >= 0);
  for (const start of starts) {
    for (let end = input.length; end > start; end--) {
      const slice = input.slice(start, end).trim();
      if (!slice.endsWith('}') && !slice.endsWith(']')) continue;
      try {
        candidates.push(JSON.parse(slice));
        break;
      } catch {}
    }
  }
  return candidates;
}
