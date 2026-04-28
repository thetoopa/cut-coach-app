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
  try {
    const data = JSON.parse(jsonString);
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
  } catch (e) {
    console.error('Failed to parse meal JSON:', e);
  }
  return null;
}

export function parseWorkoutJSON(jsonString: string): any[] | null {
  try {
    const data = JSON.parse(jsonString);
    if (data.type === 'workout_routine' && Array.isArray(data.workouts)) {
      return data.workouts.map((w: any) => ({
        id: w.id || `imported-workout-${Date.now()}`,
        name: w.name,
        cardioMin: w.cardioMin || 15,
        backup: w.backup || [],
        exercises: w.exercises || [],
      }));
    }
  } catch (e) {
    console.error('Failed to parse workout JSON:', e);
  }
  return null;
}
