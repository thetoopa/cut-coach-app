import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarView } from './src/components/CalendarView';
import { DayDetailModal } from './src/components/DayDetailModal';
import { AICoachModal } from './src/components/AICoachModal';
import { IntakeFlow } from './src/components/intake/IntakeFlow';
import { MealEditModal } from './src/components/MealEditModal';
import { ImportExportModal } from './src/components/ImportExportModal';
import { SplashScreen } from './src/components/SplashScreen';
import { BottomTabBar, MainTab } from './src/components/BottomTabBar';
import { MoreMenu, MoreTab } from './src/components/MoreMenu';
import { HomeScreen } from './src/components/home/HomeScreen';
import { CuratedMealLibrary } from './src/components/meals/CuratedMealLibrary';
import { CommunityMealLibrary } from './src/components/meals/CommunityMealLibrary';
import { CuratedMeal, curatedMealToAppMeal, curatedMeals } from './src/data/curatedMeals';
import { AuthScreen } from './src/components/auth/AuthScreen';
import { ProfileCompletionScreen } from './src/components/auth/ProfileCompletionScreen';
import { EditProfileScreen } from './src/components/profile/EditProfileScreen';
import { ProfileAvatar } from './src/components/profile/ProfileAvatar';
import { UserSearchScreen } from './src/components/social/UserSearchScreen';
import { calculateCardioPlan, calculateWaterPlan, WeeklyLossRate, calculateEffectiveCalorieGoal, calculateNutritionTargets, getProgressionRecommendation, suggestedRestSeconds, weeklyLossOptions } from './src/utils/calculations';
import { parseMealJSON, parseWorkoutJSON } from './src/utils/exportImport';
import { getCurrentSession, onAuthStateChange, signOut } from './src/services/authService';
import { getCloudAppState, getCurrentProfile, upsertCloudAppState } from './src/services/profileService';
import { uploadMealToCommunity } from './src/services/communityMealService';
import { isSupabaseConfigured } from './src/services/supabaseClient';
import { UserProfile } from './src/types/social';
type Tab = 'Today' | 'Calendar' | 'Meals' | 'Workout' | 'Cardio' | 'Water' | 'Grocery' | 'Weight' | 'Profile';
type Meal = { id: string; name: string; type: 'Breakfast'|'Lunch'|'Dinner'|'Snack'; calories: number; protein: number; carbs: number; fat: number; notes: string; custom?: boolean };
type Exercise = { id: string; name: string; sets: number; minReps: number; maxReps: number; weight: number; lastReps: number[]; lastWeights?: number[]; backup?: string };
type WorkoutDay = { id: string; name: string; exercises: Exercise[]; cardioMin: number; backup: string[] };
type WorkoutExerciseLog = { id: string; name: string; weight: number; sets: { set: number; reps: number; weight: number }[] };
type MealPreferences = {
  cookingTimePerMeal?: string;
  breakfastTime?: string;
  lunchTime?: string;
  dinnerTime?: string;
  snackPreference?: string;
  favoriteProteins?: string[];
  favoriteCarbs?: string[];
  favoriteVeggies?: string[];
  favoriteFruits?: string[];
  allergies?: string;
  additionalNotes?: string;
};
type WorkoutPreferences = {
  useDefaults?: boolean;
  gymType?: string;
  workoutStyle?: string;
  timePerWorkout?: string;
  usualWorkoutTime?: string;
  equipmentAccess?: string;
  likedExercises?: string;
  trainingLimits?: string;
  additionalNotes?: string;
};
type Profile = { 
  name: string; 
  goal?: 'cut'|'bulk'|'maintain'; 
  age: number; 
  sex: 'male'|'female'; 
  heightIn: number; 
  weight: number; 
  goalWeight: number; 
  activity: number; 
  aggression: number; 
  proteinGoal: number; 
  calorieGoal: number; 
  carbGoal?: number;
  fatGoal?: number;
  weeklyLossRate?: WeeklyLossRate; 
  gymDaysPerWeek?: number;
  mealPreferences?: MealPreferences;
  workoutPreferences?: WorkoutPreferences;
  programTemplate?: any;
  nutritionPlan?: any;
  cardioPlan?: any;
  activityPresets?: any[];
  mealPortfolio?: any[];
  selectedCuratedMealIds?: string[];
};
type DayLog = { date: string; weight?: number; calories: number; protein: number; outdoorWalk: number; inclineWalk: number; cardioBurnedCalories?: number; golfBurnedCalories?: number; otherBurnedCalories?: number; workoutBurnedCalories?: number; alcoholCalories?: number; golf: boolean; golfHoles?: number; golfMode?: 'riding'|'walking'; waterOz?: number; plannedLift?: boolean; drinking: boolean; drinks: number; workoutDone: boolean; selectedMeals: string[]; notes: string; workoutName?: string; workoutEntries?: WorkoutExerciseLog[] };
type GroceryItem = { id: string; name: string; source: string; store: string; needed: boolean; bought: boolean };
type WeightRange = 'Week' | 'Month' | 'Quarter' | 'Year' | 'All' | 'Custom';
type CloudAppStateSnapshot = {
  version: number;
  profile: Profile;
  log: DayLog;
  workouts: WorkoutDay[];
  dayLogs: Record<string, DayLog>;
  meals: Meal[];
  groceryItems: GroceryItem[];
  selectedStores: string[];
  savedAt: string;
};

const todayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const num = (v: string, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
const blankMeal = (): Meal => ({ id: '', type: 'Lunch', name: '', calories: 0, protein: 0, carbs: 0, fat: 0, notes: '', custom: true });
const STORE_OPTIONS = ['Costco', 'Sam’s Club', 'Amazon', 'Trader Joe’s', 'Whole Foods', 'Kroger', 'Walmart', 'Target'];
const STORAGE_KEY = 'calorieCounter';
const LEGACY_STORAGE_KEY = 'cutCoach';
const RESET_LOCAL_DATA_ON_START = process.env.EXPO_PUBLIC_RESET_LOCAL_DATA === '1';
const DRINK_CALORIES = 115;

const defaultProfile: Profile = { name: 'Cooper', goal: 'cut', age: 24, sex: 'male', heightIn: 69, weight: 170, goalWeight: 155, activity: 1.5, aggression: 500, proteinGoal: 170, calorieGoal: 1900, carbGoal: 145, fatGoal: 71, weeklyLossRate: 1, gymDaysPerWeek: 4 };
const defaultDayLog = (date = todayKey()): DayLog => ({
  date,
  calories: 0,
  protein: 0,
  outdoorWalk: 0,
  inclineWalk: 0,
  cardioBurnedCalories: undefined,
  golfBurnedCalories: undefined,
  otherBurnedCalories: 0,
  workoutBurnedCalories: undefined,
  alcoholCalories: undefined,
  golf: false,
  golfHoles: 18,
  golfMode: 'riding',
  waterOz: 0,
  plannedLift: true,
  drinking: false,
  drinks: 0,
  workoutDone: false,
  selectedMeals: [],
  notes: '',
});
const hasCompletedCalosIntake = (loadedProfile?: Partial<Profile> | null) => !!(
  loadedProfile?.name &&
  loadedProfile?.weight &&
  loadedProfile?.calorieGoal &&
  loadedProfile?.programTemplate?.workouts?.length &&
  loadedProfile?.nutritionPlan &&
  loadedProfile?.cardioPlan
);

const meals: Meal[] = [
  { id:'shake', type:'Breakfast', name:'Legion Plant+ Cinnamon Shake', calories:390, protein:48, carbs:35, fat:6, notes:'2 scoops Legion Plant+ + banana + unsweet almond milk/water.' },
  { id:'eggs-potato', type:'Breakfast', name:'Eggs + Potatoes', calories:485, protein:39, carbs:34, fat:21, notes:'3 whole eggs + 150g egg whites + 150g potatoes.' },
  { id:'sausage-plate', type:'Breakfast', name:'Chicken Sausage Plate', calories:520, protein:42, carbs:33, fat:24, notes:'2 chicken sausages + 2 eggs + 150g potatoes.' },
  { id:'savory-rice', type:'Breakfast', name:'Savory Chicken Rice Bowl', calories:510, protein:42, carbs:58, fat:10, notes:'4 oz cooked chicken + 1 cup cooked rice + soy sauce.' },
  { id:'chicken-bowl', type:'Lunch', name:'Chicken Rice Bowl', calories:620, protein:52, carbs:55, fat:18, notes:'6 oz cooked chicken + 1 cup cooked rice + 1 tbsp olive oil/light sauce.' },
  { id:'beef-bowl', type:'Lunch', name:'Beef Potato Bowl', calories:675, protein:47, carbs:45, fat:32, notes:'6 oz 90/10 beef + 250g potatoes + sauce.' },
  { id:'sushi-bowl', type:'Lunch', name:'Raw Tuna/Salmon Sushi Bowl', calories:585, protein:44, carbs:65, fat:15, notes:'6 oz raw fish + 1 cup rice + soy sauce + cucumber/seaweed.' },
  { id:'steak-potato', type:'Dinner', name:'Steak + Sweet Potato', calories:710, protein:55, carbs:55, fat:28, notes:'7 oz lean steak + 250g sweet potato + 1 tsp oil.' },
  { id:'salmon-rice', type:'Dinner', name:'Salmon + Rice', calories:660, protein:45, carbs:55, fat:28, notes:'6 oz salmon + 1 cup cooked rice.' },
  { id:'chicken-sandwich', type:'Dinner', name:'Clean Chicken Sandwich', calories:620, protein:52, carbs:58, fat:16, notes:'6 oz grilled/air-fried chicken + bun + light ranch.' },
  { id:'comfort-pasta', type:'Dinner', name:'Controlled Beef Pasta', calories:720, protein:52, carbs:75, fat:22, notes:'6 oz 93/7 beef + 75g dry pasta + light sauce/seasoning.' },
  { id:'bar', type:'Snack', name:'Dairy-Free Protein Bar', calories:230, protein:20, carbs:25, fat:7, notes:'Check label. Use when busy.' },
  { id:'turkey', type:'Snack', name:'Turkey + Mustard', calories:140, protein:28, carbs:2, fat:2, notes:'4 oz deli turkey.' },
  { id:'rice-cakes-pb', type:'Snack', name:'Rice Cakes + PB', calories:210, protein:7, carbs:26, fat:10, notes:'2 rice cakes + 1 tbsp peanut butter.' },
  { id:'chips', type:'Snack', name:'Measured Chips', calories:160, protein:2, carbs:16, fat:10, notes:'One weighed serving. Do not eat from the bag.' },
];

const baseWorkouts: WorkoutDay[] = [
  { id:'push', name:'Push / Chest Focus', cardioMin:15, backup:['Push-ups 4 sets near failure','DB/floor press 4x8-12','Pike push-ups 3x8-12','Chair dips 3x8-12','10-20 min brisk walk'], exercises:[
    {id:'bench', name:'Bench Press', sets:4, minReps:6, maxReps:8, weight:135, lastReps:[0,0,0,0], backup:'Push-ups or DB floor press'},
    {id:'incline-db', name:'Incline DB Press', sets:3, minReps:8, maxReps:10, weight:50, lastReps:[0,0,0], backup:'Feet-elevated push-ups'},
    {id:'fly', name:'Machine/Cable Chest Fly', sets:3, minReps:10, maxReps:12, weight:80, lastReps:[0,0,0], backup:'Slow push-up squeeze reps'},
    {id:'shoulder', name:'Shoulder Press', sets:3, minReps:8, maxReps:10, weight:45, lastReps:[0,0,0], backup:'Pike push-ups'},
    {id:'tri', name:'Tricep Pushdown', sets:3, minReps:10, maxReps:12, weight:60, lastReps:[0,0,0], backup:'Chair dips'},
  ]},
  { id:'pull', name:'Pull / Back Focus', cardioMin:15, backup:['Pull-ups/chin-ups 4 sets if available','1-arm backpack/DB rows 4x10-15','Band rows 4x12-20','Rear delt raises 3x15','Hammer curls 3x12'], exercises:[
    {id:'pulldown', name:'Lat Pulldown or Pull-ups', sets:4, minReps:6, maxReps:10, weight:120, lastReps:[0,0,0,0], backup:'Pull-ups/chin-ups'},
    {id:'row', name:'Barbell Row', sets:3, minReps:6, maxReps:8, weight:135, lastReps:[0,0,0], backup:'DB/backpack row'},
    {id:'cable-row', name:'Seated Cable Row', sets:3, minReps:8, maxReps:10, weight:120, lastReps:[0,0,0], backup:'Band row'},
    {id:'facepull', name:'Face Pull', sets:3, minReps:12, maxReps:15, weight:40, lastReps:[0,0,0], backup:'Band pull-aparts'},
    {id:'curl', name:'Bicep Curl', sets:3, minReps:10, maxReps:12, weight:30, lastReps:[0,0,0], backup:'Backpack curls'},
  ]},
  { id:'legs', name:'Legs', cardioMin:10, backup:['Goblet squats 4x10-15','Reverse lunges 3x10/leg','DB/backpack RDL 4x10-12','Single-leg glute bridge 3x12/leg','Calf raises 4x15-25'], exercises:[
    {id:'squat', name:'Squat', sets:4, minReps:5, maxReps:8, weight:185, lastReps:[0,0,0,0], backup:'Goblet squat'},
    {id:'legpress', name:'Leg Press', sets:3, minReps:10, maxReps:10, weight:270, lastReps:[0,0,0], backup:'Walking lunges'},
    {id:'rdl', name:'Romanian Deadlift', sets:3, minReps:8, maxReps:8, weight:155, lastReps:[0,0,0], backup:'DB/backpack RDL'},
    {id:'hamcurl', name:'Hamstring Curl', sets:3, minReps:10, maxReps:12, weight:80, lastReps:[0,0,0], backup:'Hamstring sliders'},
    {id:'calves', name:'Calf Raise', sets:3, minReps:12, maxReps:15, weight:90, lastReps:[0,0,0], backup:'Stair calf raises'},
  ]},
  { id:'upper', name:'Upper Light / Pump', cardioMin:15, backup:['Push-ups 3 sets','Band/DB row 3 sets','Lateral raises 4x15','Curls + triceps superset 3 rounds','Easy walk'], exercises:[
    {id:'incline-light', name:'Incline DB Press', sets:3, minReps:10, maxReps:10, weight:45, lastReps:[0,0,0], backup:'Push-ups'},
    {id:'lat-light', name:'Lat Pulldown', sets:3, minReps:10, maxReps:10, weight:110, lastReps:[0,0,0], backup:'Band rows'},
    {id:'latraise', name:'Lateral Raise', sets:4, minReps:12, maxReps:15, weight:15, lastReps:[0,0,0,0], backup:'Light DB/water jug lateral raise'},
    {id:'arms', name:'Arms Superset', sets:3, minReps:10, maxReps:12, weight:30, lastReps:[0,0,0], backup:'Curls + dips'},
  ]},
];

function calcCalories(p: Profile){
  const kg = p.weight * 0.453592, cm = p.heightIn * 2.54;
  const bmr = p.sex === 'male' ? 10*kg + 6.25*cm - 5*p.age + 5 : 10*kg + 6.25*cm - 5*p.age - 161;
  return Math.round(Math.max(1500, bmr * p.activity - p.aggression));
}

const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const prefList = (items: string[] | undefined, fallback: string[]) => (items?.filter(item => item && !item.toLowerCase().includes('no ')).length ? items.filter(item => item && !item.toLowerCase().includes('no ')) : fallback);
const pick = (items: string[], index: number) => items[index % items.length];
const cleanFood = (value: string) => value.replace(/\s*\([^)]*\)/g, '').split('/')[0].trim();

function recipeNotes(recipe: {
  servings?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  prep?: string;
  extra?: string;
}) {
  return [
    `Serving: ${recipe.servings ?? 1} meal. Macros: ${recipe.calories} calories, ${recipe.protein}g protein, ${recipe.carbs}g carbs, ${recipe.fat}g fat.`,
    `Ingredients: ${recipe.ingredients.join('; ')}.`,
    `Instructions: ${recipe.instructions.map((step, index) => `${index + 1}. ${step}`).join(' ')}`,
    recipe.prep ? `Prep: ${recipe.prep}.` : '',
    recipe.extra ? `Notes: ${recipe.extra}.` : '',
  ].filter(Boolean).join('\n\n');
}

const mealSlotRatios: Record<Meal['type'], { calories: number; protein: number; carbs: number; fat: number }> = {
  Breakfast: { calories: 0.24, protein: 0.22, carbs: 0.25, fat: 0.22 },
  Lunch: { calories: 0.31, protein: 0.30, carbs: 0.33, fat: 0.30 },
  Dinner: { calories: 0.32, protein: 0.34, carbs: 0.30, fat: 0.34 },
  Snack: { calories: 0.13, protein: 0.14, carbs: 0.12, fat: 0.14 },
};

function mealsFromCuratedIds(ids?: string[]): Meal[] {
  if (!ids?.length) return [];
  const selected = curatedMeals.filter(meal => ids.includes(meal.id));
  return selected.map(meal => curatedMealToAppMeal(meal) as Meal);
}

function mealMacroTarget(profile: Profile, type: Meal['type']) {
  const targets = calculateNutritionTargets(profile);
  const calorieTarget = profile.calorieGoal ?? targets.calorieGoal;
  const proteinTarget = profile.proteinGoal ?? targets.proteinGoal;
  const carbTarget = profile.carbGoal ?? targets.carbGoal;
  const fatTarget = profile.fatGoal ?? targets.fatGoal;
  const ratios = mealSlotRatios[type];
  return {
    calories: Math.round(calorieTarget * ratios.calories),
    protein: Math.round(proteinTarget * ratios.protein),
    carbs: Math.round(carbTarget * ratios.carbs),
    fat: Math.round(fatTarget * ratios.fat),
  };
}

function withMacroVariance(base: ReturnType<typeof mealMacroTarget>, index: number) {
  const factor = [0.92, 1, 1.08, 0.96, 1.04, 0.88][index % 6];
  return {
    calories: Math.round(base.calories * factor),
    protein: Math.max(18, Math.round(base.protein * factor)),
    carbs: Math.max(8, Math.round(base.carbs * factor)),
    fat: Math.max(4, Math.round(base.fat * factor)),
  };
}

function macroPortions(macro: { protein: number; carbs: number; fat: number }) {
  return {
    proteinOz: Math.max(3, Math.round((macro.protein / 8) * 2) / 2),
    carbGrams: Math.max(60, Math.round((macro.carbs / 28) * 100 / 5) * 5),
    fatGrams: Math.max(3, Math.round((macro.fat / 4.5) * 5)),
    fruitGrams: Math.max(60, Math.round((macro.carbs / 3) * 5)),
    veggieGrams: Math.max(100, Math.round((macro.carbs / 4) * 10)),
  };
}

function makeMeal(id: string, type: Meal['type'], name: string, calories: number, protein: number, carbs: number, fat: number, notes: string): Meal {
  return { id, type, name, calories, protein, carbs, fat, notes, custom: true };
}

function generateMealsFromPreferences(profile: Profile): Meal[] {
  const prefs = profile.mealPreferences ?? {};
  const proteins = prefList(prefs.favoriteProteins, ['Chicken breast', '93/7 ground turkey', '90/10 ground beef', 'Salmon fillet', 'Eggs']);
  const carbs = prefList(prefs.favoriteCarbs, ['Rice', 'Potatoes', 'Oats', 'Bread', 'Sweet Potatoes']);
  const veggies = prefList(prefs.favoriteVeggies, ['Broccoli', 'Spinach', 'Bell Peppers', 'Asparagus']);
  const fruits = prefList(prefs.favoriteFruits, ['Bananas', 'Berries', 'Apples']);
  const snackPref = (prefs.snackPreference || '').toLowerCase();
  const allergyNote = prefs.allergies ? ` Avoid: ${prefs.allergies}.` : '';
  const extraNote = prefs.additionalNotes ? ` Notes: ${prefs.additionalNotes}.` : '';
  const breakfastTime = prefs.breakfastTime || prefs.cookingTimePerMeal || 'moderate';
  const lunchTime = prefs.lunchTime || prefs.cookingTimePerMeal || 'moderate';
  const dinnerTime = prefs.dinnerTime || prefs.cookingTimePerMeal || 'moderate';
  const workoutTime = profile.workoutPreferences?.usualWorkoutTime || 'not specified';
  const breakfastBase = mealMacroTarget(profile, 'Breakfast');
  const lunchBase = mealMacroTarget(profile, 'Lunch');
  const dinnerBase = mealMacroTarget(profile, 'Dinner');
  const snackBase = mealMacroTarget(profile, 'Snack');

  const breakfast = Array.from({ length: 5 }).map((_, index) => {
    const protein = cleanFood(pick(proteins, index));
    const carb = cleanFood(pick(carbs, index));
    const fruit = cleanFood(pick(fruits, index));
    const macro = withMacroVariance(breakfastBase, index);
    const portions = macroPortions(macro);
    const names = [
      `${protein} ${carb} Breakfast Bowl`,
      `${fruit} Protein Oats`,
      `${protein} Breakfast Sandwich`,
      `${protein} and ${carb} Scramble`,
      `${fruit} High-Protein Smoothie`,
    ];
    return makeMeal(
      `pref-breakfast-${index + 1}-${slug(protein)}`,
      'Breakfast',
      names[index],
      macro.calories,
      macro.protein,
      macro.carbs,
      macro.fat,
      recipeNotes({
        calories: macro.calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
        ingredients: [`${portions.proteinOz} oz cooked ${protein}`, `${portions.carbGrams} g cooked ${carb}`, `${portions.fruitGrams} g ${fruit}`, `${portions.fatGrams} g olive oil`, '1 g kosher salt', '1 g black pepper', '1 g garlic powder'],
        instructions: [`Preheat a nonstick pan over medium heat, about 350 F surface temperature, for 2 minutes`, `Add olive oil, then cook ${protein} for 4-6 minutes per side if sliced, or 8-10 minutes total if ground, until chicken/turkey reaches 165 F, beef reaches 160 F, salmon reaches 145 F, or eggs are fully set`, `Warm ${carb} in a pan or microwave for 60-90 seconds and season it with salt, black pepper, and garlic powder`, `Plate with ${fruit}, then weigh the finished portion before eating if you want the tightest macro tracking`],
        prep: `Breakfast prep target: ${breakfastTime}. Batch cook the protein and carb up to 3 days ahead; store in airtight containers`,
        extra: `${workoutTime !== 'not specified' ? `Usual workout time: ${workoutTime}; this meal is sized as a steady pre-workout or morning carb base. ` : ''}${allergyNote}${extraNote}`.trim(),
      })
    );
  });

  const lunch = Array.from({ length: 6 }).map((_, index) => {
    const protein = cleanFood(pick(proteins, index + 1));
    const carb = cleanFood(pick(carbs, index + 2));
    const veggie = cleanFood(pick(veggies, index));
    const macro = withMacroVariance(lunchBase, index);
    const portions = macroPortions(macro);
    const names = [
      `${protein} ${carb} Power Bowl`,
      `${protein} and ${veggie} Plate`,
      `${protein} Wrap with ${veggie}`,
      `${protein} Meal Prep Box`,
      `${protein} ${carb} Salad Bowl`,
      `${protein} Lean Lunch Stack`,
    ];
    return makeMeal(
      `pref-lunch-${index + 1}-${slug(protein)}`,
      'Lunch',
      names[index],
      macro.calories,
      macro.protein,
      macro.carbs,
      macro.fat,
      recipeNotes({
        calories: macro.calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
        ingredients: [`${portions.proteinOz} oz cooked ${protein}`, `${portions.carbGrams} g cooked ${carb}`, `${portions.veggieGrams} g ${veggie}`, '15 g low-sodium teriyaki sauce', `${portions.fatGrams} g olive oil`],
        instructions: [`Preheat a skillet over medium-high heat, about 375 F surface temperature, for 2 minutes`, `Cook ${protein} with olive oil until it reaches a safe internal temperature: 165 F for poultry, 160 F for ground beef, 145 F for salmon or fish`, `Steam ${veggie} for 4-6 minutes or saute for 5-7 minutes until crisp-tender`, `Warm ${carb}, combine everything with teriyaki sauce, and portion into one meal-prep container`, `Cool uncovered for 10 minutes before sealing so condensation does not make the meal soggy`],
        prep: `Lunch prep target: ${lunchTime}. Keeps 3-4 days refrigerated. Reheat covered for 90-120 seconds, stirring halfway`,
        extra: `${workoutTime !== 'not specified' ? `Usual workout time: ${workoutTime}; lunch options carry more carbs when they may be used before training. ` : ''}${allergyNote}${extraNote}`.trim(),
      })
    );
  });

  const dinner = Array.from({ length: 5 }).map((_, index) => {
    const protein = cleanFood(pick(proteins, index + 2));
    const carb = cleanFood(pick(carbs, index + 1));
    const veggie = cleanFood(pick(veggies, index + 2));
    const macro = withMacroVariance(dinnerBase, index);
    const portions = macroPortions(macro);
    const names = [
      `${protein} Dinner with ${carb}`,
      `${protein} ${veggie} Skillet`,
      `${protein} Performance Plate`,
      `${protein} and Roasted ${carb}`,
      `${protein} Lean Comfort Bowl`,
    ];
    return makeMeal(
      `pref-dinner-${index + 1}-${slug(protein)}`,
      'Dinner',
      names[index],
      macro.calories,
      macro.protein,
      macro.carbs,
      macro.fat,
      recipeNotes({
        calories: macro.calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
        ingredients: [`${portions.proteinOz} oz cooked ${protein}`, `${portions.carbGrams} g cooked ${carb}`, `${portions.veggieGrams} g ${veggie}`, `${portions.fatGrams} g olive oil`, '2 g kosher salt', '1 g black pepper', '1 g smoked paprika'],
        instructions: [`Preheat oven to 425 F if roasting, or preheat a skillet over medium-high heat if cooking stovetop`, `Season ${protein} with salt, black pepper, and smoked paprika`, `Cook ${protein} for 10-16 minutes depending on thickness, flipping halfway, until it reaches the correct internal temperature: 165 F poultry, 160 F ground beef, 145 F fish/salmon`, `Roast ${veggie} for 12-18 minutes at 425 F, or saute for 6-8 minutes until browned at the edges`, `Warm ${carb}, plate everything, and drizzle the measured olive oil after cooking so calories stay accurate`],
        prep: `Dinner prep target: ${dinnerTime}. For meal prep, store protein/carb/vegetable together up to 4 days; reheat covered with 1 tsp water for 2 minutes`,
        extra: `${workoutTime !== 'not specified' ? `Usual workout time: ${workoutTime}; dinner is treated as the most filling high-protein post-workout option when training is later in the day. ` : ''}${allergyNote}${extraNote}`.trim(),
      })
    );
  });

  const snacks = Array.from({ length: 4 }).map((_, index) => {
    const protein = cleanFood(pick(proteins, index + 3));
    const fruit = cleanFood(pick(fruits, index));
    const carb = cleanFood(pick(carbs, index));
    const grab = snackPref.includes('grab') || snackPref.includes('no preference');
    const macro = withMacroVariance(snackBase, index);
    const portions = macroPortions(macro);
    const names = [
      `${protein} Grab-and-Go Snack`,
      `${fruit} Protein Snack Box`,
      `${protein} Prep Cup`,
      `${carb} and ${protein} Mini Meal`,
    ];
    return makeMeal(
      `pref-snack-${index + 1}-${slug(protein)}`,
      'Snack',
      names[index],
      macro.calories,
      macro.protein,
      macro.carbs,
      macro.fat,
      recipeNotes({
        calories: macro.calories,
        protein: macro.protein,
        carbs: macro.carbs,
        fat: macro.fat,
        ingredients: [`${Math.max(2.5, portions.proteinOz - 1)} oz cooked ${protein}`, `${portions.fruitGrams} g ${fruit}`, `${Math.max(40, Math.round(portions.carbGrams * 0.55))} g cooked ${carb}`, '1 g cinnamon'],
        instructions: [grab ? 'Pack ingredients into a grab-and-go container' : 'Portion ingredients into a meal-prep cup', 'If eating cold, chill at least 30 minutes before serving', 'If warming, microwave the protein and carb for 45-60 seconds, then add fruit after heating', 'Keep refrigerated below 40 F and eat within 3 days'],
        prep: `Snack preference: ${prefs.snackPreference || 'No preference'}. Weigh each ingredient separately before packing for best macro accuracy`,
        extra: `${workoutTime !== 'not specified' ? `Usual workout time: ${workoutTime}; this snack can work 60-90 minutes pre-workout if a full meal is too heavy. ` : ''}${allergyNote}${extraNote}`.trim(),
      })
    );
  });

  return [...breakfast, ...lunch, ...dinner, ...snacks];
}

function generateWorkoutsFromPreferences(profile: Profile): WorkoutDay[] {
  const prefs = profile.workoutPreferences ?? {};
  if (prefs.useDefaults) return baseWorkouts;

  const equipment = `${prefs.equipmentAccess || prefs.gymType || ''}`.toLowerCase();
  const dumbbellsOnly = equipment.includes('dumbbell') || equipment.includes('home');
  const bodyweightOnly = equipment.includes('bodyweight') || equipment.includes('no equipment');
  const avoidBands = `${prefs.trainingLimits || ''} ${prefs.additionalNotes || ''}`.toLowerCase().includes('no band');
  const backupRow = avoidBands ? '1-arm dumbbell row or backpack row' : dumbbellsOnly ? '1-arm dumbbell row' : 'Cable row or dumbbell row';
  const press = bodyweightOnly ? 'Push-up' : dumbbellsOnly ? 'Dumbbell Floor Press' : 'Bench Press';
  const row = bodyweightOnly ? 'Table/Inverted Row' : dumbbellsOnly ? '1-Arm Dumbbell Row' : 'Barbell Row';
  const squat = bodyweightOnly ? 'Tempo Squat' : dumbbellsOnly ? 'Goblet Squat' : 'Squat';
  const hinge = bodyweightOnly ? 'Single-Leg Hip Hinge' : dumbbellsOnly ? 'Dumbbell Romanian Deadlift' : 'Romanian Deadlift';

  return [
    { id:'push', name:'Push / Chest Focus', cardioMin:15, backup:['Push-ups 4 sets near failure','Dumbbell floor press 4x8-12','Pike push-ups 3x8-12','Chair dips 3x8-12'], exercises:[
      {id:'press', name:press, sets:4, minReps:6, maxReps:10, weight:0, lastReps:[0,0,0,0], backup:'Dumbbell press or push-ups'},
      {id:'incline-press', name:bodyweightOnly ? 'Feet-Elevated Push-up' : 'Incline Dumbbell Press', sets:3, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Push-ups with slow tempo'},
      {id:'shoulder-press', name:bodyweightOnly ? 'Pike Push-up' : 'Dumbbell Shoulder Press', sets:3, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Pike push-ups'},
      {id:'lateral-raise', name:bodyweightOnly ? 'Wall Handstand Hold' : 'Lateral Raise', sets:3, minReps:12, maxReps:15, weight:0, lastReps:[0,0,0], backup:'Light dumbbell or water jug lateral raise'},
      {id:'triceps', name:'Triceps Dips', sets:3, minReps:10, maxReps:15, weight:0, lastReps:[0,0,0], backup:'Close-grip push-ups'},
    ]},
    { id:'pull', name:'Pull / Back Focus', cardioMin:15, backup:[backupRow,'Rear delt raises 3x15','Hammer curls 3x12','Easy incline walk'], exercises:[
      {id:'row', name:row, sets:4, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0,0], backup:backupRow},
      {id:'pullover', name:bodyweightOnly ? 'Prone Lat Sweep' : 'Dumbbell Pullover', sets:3, minReps:10, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Slow backpack pullover'},
      {id:'rear-delt', name:bodyweightOnly ? 'Prone Y Raise' : 'Rear Delt Raise', sets:3, minReps:12, maxReps:15, weight:0, lastReps:[0,0,0], backup:'Prone rear delt raise'},
      {id:'curl', name:bodyweightOnly ? 'Towel Curl Isometric' : 'Hammer Curl', sets:3, minReps:10, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Backpack curls'},
    ]},
    { id:'legs', name:'Legs', cardioMin:10, backup:['Reverse lunges 3x10/leg','Glute bridges 3x12','Calf raises 4x15-25'], exercises:[
      {id:'squat', name:squat, sets:4, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0,0], backup:'Tempo bodyweight squat'},
      {id:'lunge', name:bodyweightOnly ? 'Reverse Lunge' : 'Dumbbell Reverse Lunge', sets:3, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Split squat'},
      {id:'hinge', name:hinge, sets:3, minReps:8, maxReps:12, weight:0, lastReps:[0,0,0], backup:'Hip bridge'},
      {id:'calves', name:'Calf Raise', sets:4, minReps:12, maxReps:20, weight:0, lastReps:[0,0,0,0], backup:'Stair calf raise'},
    ]},
    { id:'upper', name:'Upper Light / Pump', cardioMin:15, backup:['Push-ups 3 sets', backupRow, 'Lateral raises 4x15', 'Curls + triceps superset'], exercises:[
      {id:'pushup', name:'Push-up', sets:3, minReps:10, maxReps:20, weight:0, lastReps:[0,0,0], backup:'Incline push-up'},
      {id:'light-row', name:row, sets:3, minReps:10, maxReps:15, weight:0, lastReps:[0,0,0], backup:backupRow},
      {id:'arms', name:bodyweightOnly ? 'Dips + Towel Curl' : 'Curl + Triceps Superset', sets:3, minReps:10, maxReps:15, weight:0, lastReps:[0,0,0], backup:'Close-grip push-up + backpack curl'},
    ]},
  ];
}

function Section({title, children}:{title:string; children:React.ReactNode}){ return <View style={s.card}><Text style={s.h2}>{title}</Text>{children}</View> }
function Pill({children, onPress, active=false}:{children:React.ReactNode; onPress?:()=>void; active?:boolean}){ return <Pressable onPress={onPress} style={[s.pill, active && s.pillActive]}><Text style={[s.pillText, active && s.pillTextActive]}>{children}</Text></Pressable> }
function Input({label, value, onChange, keyboardType = 'default'}:{label:string; value:string; onChange:(x:string)=>void; keyboardType?: any}){ return <View style={{marginBottom:10}}><Text style={s.label}>{label}</Text><TextInput style={s.input} value={value} onChangeText={onChange} keyboardType={keyboardType} /></View> }

function MacroBar({calories, calorieGoal, protein, proteinGoal, carbs, carbGoal, fat, fatGoal}:{calories:number; calorieGoal:number; protein:number; proteinGoal:number; carbs:number; carbGoal:number; fat:number; fatGoal:number}) {
  const item = (label: string, value: number, goal: number) => (
    <View style={s.macroBarItem}>
      <Text style={s.macroBarLabel}>{label}</Text>
      <Text style={s.macroBarValue}>{Math.round(value)}/{Math.round(goal)}</Text>
    </View>
  );
  return (
    <View style={s.macroBar}>
      {item('kCal', calories, calorieGoal)}
      {item('P', protein, proteinGoal)}
      {item('C', carbs, carbGoal)}
      {item('F', fat, fatGoal)}
    </View>
  );
}

function WorkoutTimerBar({seconds, restActive, low, detail, onSkipRest}:{seconds:number; restActive:boolean; low:boolean; detail:string; onSkipRest:()=>void}) {
  return (
    <View style={[{position:'absolute',left:14,right:14,bottom:104,minHeight:74,backgroundColor:'rgba(15,23,42,0.86)',borderWidth:1,borderColor:'rgba(52,211,153,0.45)',borderRadius:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14,paddingVertical:10,zIndex:21,elevation:9}, low && {borderColor:'rgba(239,68,68,0.72)'}]}>
      <View>
        <Text style={{color:'#34d399',fontSize:12,fontWeight:'900',textTransform:'uppercase'}}>{restActive ? 'Rest timer' : 'Workout timer'}</Text>
        <Text style={{color:'#cbd5e1',fontSize:13,fontWeight:'700',maxWidth:210,marginTop:3}} numberOfLines={1}>{detail}</Text>
      </View>
      <Pressable onPress={onSkipRest} style={{alignItems:'center',justifyContent:'center'}}>
        <Text style={[{color:'#f8fafc',fontSize:30,fontWeight:'900'}, low && {color:'#ef4444'}]}>{formatSeconds(seconds)}</Text>
        <Text style={{color:'#94a3b8',fontSize:11,fontWeight:'900'}}>{restActive ? 'Skip' : 'Running'}</Text>
      </Pressable>
    </View>
  );
}

function workoutLogFromWorkout(workout?: WorkoutDay) {
  if (!workout) return { workoutName: undefined, workoutEntries: [] as WorkoutExerciseLog[] };
  return {
    workoutName: workout.name,
    workoutEntries: workout.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      weight: exercise.weight,
      sets: Array.from({ length: exercise.sets }).map((_, index) => ({
        set: index + 1,
        reps: exercise.lastReps[index] || 0,
        weight: exercise.lastWeights?.[index] ?? exercise.weight ?? 0,
      })),
    })),
  };
}

function AppInner(){
  const [tab,setTab]=useState<Tab>('Today');
  const [profile,setProfile]=useState<Profile>(defaultProfile);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingCloud, setIsLoadingCloud] = useState(true);
  const [cloudSession, setCloudSession] = useState<any | null>(null);
  const [cloudProfile, setCloudProfile] = useState<UserProfile | null>(null);
  const [cloudProfileChecked, setCloudProfileChecked] = useState(false);
  const [cloudLocalOnly, setCloudLocalOnly] = useState(false);
  const [isCompletingCloudProfile, setIsCompletingCloudProfile] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [mealsState, setMealsState] = useState<Meal[]>(meals);
  const [log,setLog]=useState<DayLog>({date:todayKey(), calories:0, protein:0, outdoorWalk:0, inclineWalk:0, golf:false, golfHoles:18, golfMode:'riding', waterOz:0, drinking:false, drinks:0, workoutDone:false, selectedMeals:[], notes:''});
  const [workouts,setWorkouts]=useState<WorkoutDay[]>(baseWorkouts);
  const [selectedWorkout,setSelectedWorkout]=useState(0);
  const [rest,setRest]=useState(0);
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>({});
  const [selectedDateForModal, setSelectedDateForModal] = useState<string>('');
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
  const [showAIWorkout, setShowAIWorkout] = useState(false);
  const [showManualMeal, setShowManualMeal] = useState(false);
  const [showMealLibrary, setShowMealLibrary] = useState(false);
  const [showCommunityMeals, setShowCommunityMeals] = useState(false);
  const [showEditCloudProfile, setShowEditCloudProfile] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [manualMeal, setManualMeal] = useState<Meal>(blankMeal());
  const [manualMealPrivate, setManualMealPrivate] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [showMealEdit, setShowMealEdit] = useState(false);
  const [showImportExportMeals, setShowImportExportMeals] = useState(false);
  const [showImportExportWorkouts, setShowImportExportWorkouts] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>(['Costco', 'Trader Joe’s']);
  const [weightRange, setWeightRange] = useState<WeightRange>('Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const picked = mealsState.filter(m=>log.selectedMeals.includes(m.id));
  const mealCals = picked.reduce((a,m)=>a+m.calories,0), mealProtein=picked.reduce((a,m)=>a+m.protein,0);
  const mealCarbs = picked.reduce((a,m)=>a+m.carbs,0), mealFat = picked.reduce((a,m)=>a+m.fat,0);
  const estimatedAlcoholCalories = log.drinking ? log.drinks * DRINK_CALORIES : 0;
  const alcoholCals = log.drinking ? (log.alcoholCalories ?? estimatedAlcoholCalories) : 0;
  const cardioPlan = calculateCardioPlan(log, profile);
  const waterPlan = calculateWaterPlan(log, profile);
  const effectiveCalories = calculateEffectiveCalorieGoal(profile, log);
  const calorieGoal = effectiveCalories.goal;
  const derivedTargets = calculateNutritionTargets(profile);
  const carbGoal = profile.carbGoal ?? derivedTargets.carbGoal;
  const fatGoal = profile.fatGoal ?? derivedTargets.fatGoal;
  const caloriesLeft = calorieGoal - mealCals - alcoholCals;
  const proteinLeft = profile.proteinGoal - mealProtein;
  const carbsLeft = carbGoal - mealCarbs;
  const fatLeft = fatGoal - mealFat;
  const liftMessage = log.plannedLift === false
    ? `No lift planned today. Base target is active at ${effectiveCalories.baseGoal} calories.`
    : log.workoutDone
      ? `Lift completed. Added ${effectiveCalories.workoutCredit} workout calories to today's food target.`
      : `Lift planned but not completed yet. Base target is active. Mark done to add about ${effectiveCalories.workoutCalories} workout calories.`;

  function buildCloudSnapshot(): CloudAppStateSnapshot {
    return {
      version: 1,
      profile,
      log,
      workouts,
      dayLogs,
      meals: mealsState,
      groceryItems,
      selectedStores,
      savedAt: new Date().toISOString(),
    };
  }

  function applyCloudSnapshot(snapshot?: Partial<CloudAppStateSnapshot> | null) {
    if (!snapshot?.profile) return;
    const nextProfile = snapshot.profile as Profile;
    const nextLog = snapshot.log?.date === todayKey() ? snapshot.log : defaultDayLog(todayKey());
    setProfile(nextProfile);
    setLog(nextLog);
    setWorkouts(snapshot.workouts ?? baseWorkouts);
    setDayLogs(snapshot.dayLogs ?? {});
    setMealsState(snapshot.meals ?? meals);
    setGroceryItems(snapshot.groceryItems ?? []);
    setSelectedStores(snapshot.selectedStores ?? ['Costco', 'Trader Joe’s']);
    setHasSeenOnboarding(hasCompletedCalosIntake(nextProfile));
  }

  function toggleMeal(id:string){ setLog(l=>({...l, selectedMeals: l.selectedMeals.includes(id) ? l.selectedMeals.filter(x=>x!==id) : [...l.selectedMeals,id]})); }
  function toggleMealRecipe(id:string){ setExpandedMeals(current=>({...current,[id]:!current[id]})); }
  function updateExercise(wi:number, ei:number, patch:Partial<Exercise>){
    setWorkouts(ws=>{
      const next = ws.map((w,i)=> i!==wi?w:{...w, exercises:w.exercises.map((e,j)=>j!==ei?e:{...e,...patch})});
      if (wi === selectedWorkout) {
        const snapshot = workoutLogFromWorkout(next[wi]);
        setLog(current => ({...current, ...snapshot, plannedLift: true}));
      }
      return next;
    });
  }
  function progressionText(e:Exercise){ return getProgressionRecommendation(e).text; }
  function startRestTimer(seconds:number){ setRestSeconds(seconds); Vibration.vibrate(30); }
  function startWorkoutFlow(){
    setWorkoutRunning(true);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
    setRestSeconds(0);
    Vibration.vibrate(40);
  }
  function saveWorkoutSet(wi:number, ei:number, si:number, rawValue:string, fallbackWeight:number, fallbackReps:number, startRest = true){
    const exercise = workouts[wi]?.exercises[ei];
    if (!exercise) return;
    const match = String(rawValue || '').match(/(\d+(?:\.\d+)?)\s*(?:x|,|\s)\s*(\d+)/i);
    const weight = match ? Number(match[1]) : fallbackWeight;
    const reps = match ? Number(match[2]) : fallbackReps;
    const repsList = [...exercise.lastReps];
    const weightsList = [...(exercise.lastWeights ?? Array.from({length: exercise.sets}).map(() => exercise.weight))];
    repsList[si] = reps;
    weightsList[si] = weight;
    updateExercise(wi, ei, { lastReps: repsList, lastWeights: weightsList });
    setWorkoutRunning(true);
    const nextSet = si + 1;
    if (nextSet < exercise.sets) {
      setActiveExerciseIndex(ei);
      setActiveSetIndex(nextSet);
    } else {
      setActiveExerciseIndex(Math.min(ei + 1, workouts[wi].exercises.length - 1));
      setActiveSetIndex(0);
    }
    if (startRest) startRestTimer(suggestedRestSeconds(exercise));
  }
  function logWorkoutSet(wi:number, ei:number, si:number){
    const exercise = workouts[wi]?.exercises[ei];
    if (!exercise) return;
    const currentWeight = exercise.lastWeights?.[si] ?? exercise.weight ?? 0;
    const currentReps = exercise.lastReps?.[si] || exercise.maxReps || 0;
    const defaultValue = `${currentWeight}x${currentReps || exercise.minReps || 8}`;
    const prompt = (Alert as any).prompt;
    if (typeof prompt !== 'function') {
      saveWorkoutSet(wi, ei, si, defaultValue, currentWeight, currentReps || exercise.minReps || 8);
      return;
    }
    setWorkoutRunning(true);
    startRestTimer(suggestedRestSeconds(exercise));
    prompt(
      `Log ${exercise.name} set ${si + 1}`,
      'Enter weight and reps as weight x reps, like 135x8.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (value?: string) => saveWorkoutSet(wi, ei, si, value || defaultValue, currentWeight, currentReps || exercise.minReps || 8, false),
        },
      ],
      'plain-text',
      defaultValue
    );
  }
  function applyProgression(wi:number, ei:number){ const rec=getProgressionRecommendation(workouts[wi].exercises[ei]); if(rec.action==='increase') updateExercise(wi,ei,{weight:rec.nextWeight,lastReps:Array.from({length:workouts[wi].exercises[ei].sets}).map(()=>0),lastWeights:Array.from({length:workouts[wi].exercises[ei].sets}).map(()=>rec.nextWeight)}); }
  function addExerciseToWorkout(wi:number){
    setWorkouts(ws=>ws.map((w,i)=>i!==wi?w:{...w,exercises:[...w.exercises,{id:`custom-${Date.now()}`,name:'New Exercise',sets:3,minReps:8,maxReps:12,weight:0,lastReps:[0,0,0],lastWeights:[0,0,0],backup:'Choose a similar movement you can do safely.'}]}));
  }
  function removeExerciseFromWorkout(wi:number, ei:number){
    setWorkouts(ws=>ws.map((w,i)=>i!==wi?w:{...w,exercises:w.exercises.filter((_,j)=>j!==ei)}));
  }

  // Update today's log macros whenever meals change
  // Load profile and check if user has completed onboarding
  useEffect(() => {
    (async () => {
      if (RESET_LOCAL_DATA_ON_START) {
        await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY]);
        setHasSeenOnboarding(false);
        setIsLoadingProfile(false);
        return;
      }
      const raw = await AsyncStorage.getItem(STORAGE_KEY) ?? await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw);
        const loadedProfile = v.profile ?? defaultProfile;
        setProfile(loadedProfile);
        setLog(v.log?.date === todayKey() ? v.log : defaultDayLog(todayKey()));
        setWorkouts(v.workouts ?? baseWorkouts);
        setDayLogs(v.dayLogs ?? {});
        setMealsState(v.meals ?? meals);
        setGroceryItems(v.groceryItems ?? []);
        setSelectedStores(v.selectedStores ?? ['Costco', 'Trader Joe’s']);
        // Require the new Calos intake system to be completed before the app can bypass onboarding.
        setHasSeenOnboarding(hasCompletedCalosIntake(loadedProfile));
      } else {
        // First time - no saved data
        setHasSeenOnboarding(false);
      }
      setIsLoadingProfile(false);
    })();
  }, []);

  useEffect(() => {
    if (cloudLocalOnly || !isSupabaseConfigured) {
      setCloudProfileChecked(true);
      setIsLoadingCloud(false);
      return;
    }
    let mounted = true;
    const loadCloud = async () => {
      try {
        const session = await getCurrentSession();
        if (!mounted) return;
        const nextCloudProfile = session ? await getCurrentProfile() : null;
        const cloudAppState = nextCloudProfile ? await getCloudAppState().catch(() => null) : null;
        setCloudSession(session);
        setCloudProfile(nextCloudProfile);
        if (cloudAppState) applyCloudSnapshot(cloudAppState);
        setCloudProfileChecked(true);
      } catch (error: any) {
        Alert.alert('Cloud unavailable', error?.message ?? 'Calos will keep working locally.');
        setCloudProfileChecked(true);
      } finally {
        if (mounted) setIsLoadingCloud(false);
      }
    };
    loadCloud();
    const subscription = onAuthStateChange(async (session) => {
      if (isCompletingCloudProfile) return;
      setIsLoadingCloud(true);
      setCloudProfileChecked(false);
      try {
        const nextCloudProfile = session ? await getCurrentProfile().catch(() => null) : null;
        const cloudAppState = nextCloudProfile ? await getCloudAppState().catch(() => null) : null;
        setCloudSession(session);
        setCloudProfile(nextCloudProfile);
        if (cloudAppState) applyCloudSnapshot(cloudAppState);
        setCloudProfileChecked(true);
      } finally {
        setIsLoadingCloud(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [cloudLocalOnly, isCompletingCloudProfile]);

  // Auto-save whenever profile changes
  useEffect(() => {
    setLog(current => current.calories === mealCals && current.protein === mealProtein
      ? current
      : {...current, calories: mealCals, protein: mealProtein}
    );
  }, [mealCals, mealProtein]);

  useEffect(() => {
    if (!isLoadingProfile) {
      const snapshot = buildCloudSnapshot();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      if (!cloudLocalOnly && cloudProfile && isSupabaseConfigured) {
        const timeout = setTimeout(() => {
          upsertCloudAppState(snapshot).catch(error => {
            console.warn('Cloud app-state save failed', error?.message ?? error);
          });
        }, 1200);
        return () => clearTimeout(timeout);
      }
    }
  }, [profile, log, workouts, dayLogs, mealsState, groceryItems, selectedStores, isLoadingProfile, cloudProfile?.id, cloudLocalOnly]);

  useEffect(() => {
    if (!isLoadingProfile && log.date === todayKey()) {
      setDayLogs(current => ({...current, [log.date]: log}));
    }
  }, [log, isLoadingProfile]);

  useEffect(() => {
    if (!workoutRunning && restSeconds <= 0) return;
    const timer = setInterval(() => {
      if (workoutRunning) setWorkoutSeconds(seconds => seconds + 1);
      setRestSeconds(seconds => {
        if (seconds <= 1 && seconds > 0) {
          Vibration.vibrate([0, 250, 120, 250]);
          Alert.alert('Rest complete', 'Start your next set.');
          return 0;
        }
        return Math.max(0, seconds - 1);
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [workoutRunning, restSeconds]);

  // Handle onboarding completion
  const handleOnboardingComplete = (completedProfile: Profile) => {
    const completedTargets = calculateNutritionTargets(completedProfile);
    const profileWithMacroTargets = {
      ...completedProfile,
      carbGoal: completedProfile.carbGoal ?? completedTargets.carbGoal,
      fatGoal: completedProfile.fatGoal ?? completedTargets.fatGoal,
    };
    const curatedSelectedMeals = mealsFromCuratedIds(profileWithMacroTargets.selectedCuratedMealIds);
    const generatedMeals = curatedSelectedMeals.length ? curatedSelectedMeals : generateMealsFromPreferences(profileWithMacroTargets);
    const generatedWorkouts = (profileWithMacroTargets.programTemplate?.workouts?.length
      ? profileWithMacroTargets.programTemplate.workouts
      : generateWorkoutsFromPreferences(profileWithMacroTargets)) as WorkoutDay[];
    setProfile(profileWithMacroTargets);
    setMealsState(generatedMeals);
    setWorkouts(generatedWorkouts);
    setSelectedWorkout(0);
    setHasSeenOnboarding(true);
    // Save completed profile
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: profileWithMacroTargets, log, workouts: generatedWorkouts, dayLogs, meals: generatedMeals, groceryItems, selectedStores }));
  };

  const resetLocalData = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY]);
    setProfile(defaultProfile);
    setLog(defaultDayLog(todayKey()));
    setWorkouts(baseWorkouts);
    setDayLogs({});
    setMealsState(meals);
    setGroceryItems([]);
    setSelectedStores(['Costco', 'Trader Joe’s']);
    setHasSeenOnboarding(false);
  };

  // Handle day modal open
  const handleDayPress = (dateKey: string) => {
    setSelectedDateForModal(dateKey);
    setShowDayModal(true);
  };

  // Handle day modal save
  const handleSaveDayLog = (updatedLog: DayLog) => {
    setDayLogs(logs => ({...logs, [updatedLog.date]: updatedLog}));
    if (updatedLog.date === todayKey()) {
      setLog(updatedLog);
    }
  };

  // Get current modal log
  const currentModalLog = selectedDateForModal ? (dayLogs[selectedDateForModal] || {
    date: selectedDateForModal,
    calories: 0,
    protein: 0,
    outdoorWalk: 0,
    inclineWalk: 0,
    cardioBurnedCalories: undefined,
    golfBurnedCalories: undefined,
    otherBurnedCalories: 0,
    workoutBurnedCalories: undefined,
    alcoholCalories: undefined,
    golf: false,
    golfHoles: 18,
    golfMode: 'riding',
    waterOz: 0,
    plannedLift: true,
    drinking: false,
    drinks: 0,
    workoutDone: false,
    selectedMeals: [],
    notes: ''
  }) : null;

  // Handle saving meals from AI Coach
  const handleSaveAIMeals = (customMeals: Meal[]) => {
    const allMeals = [...mealsState, ...customMeals.map(meal => ({...meal, custom: true}))];
    setMealsState(allMeals);
    setLog(current => ({...current, selectedMeals: [...current.selectedMeals, ...customMeals.map(meal => meal.id)]}));
  };

  const handleAddCuratedMeal = (curatedMeal: CuratedMeal) => {
    const appMeal = curatedMealToAppMeal(curatedMeal) as Meal;
    setMealsState(current => current.some(meal => meal.id === appMeal.id) ? current : [...current, appMeal]);
    setLog(current => current.selectedMeals.includes(appMeal.id) ? current : {...current, selectedMeals: [...current.selectedMeals, appMeal.id]});
  };

  const handleAddCommunityMeal = (meal: Meal) => {
    setMealsState(current => current.some(item => item.id === meal.id) ? current : [...current, meal]);
    setLog(current => current.selectedMeals.includes(meal.id) ? current : {...current, selectedMeals: [...current.selectedMeals, meal.id]});
  };

  const handleSaveAIWorkout = (generatedWorkouts: WorkoutDay[]) => {
    setWorkouts(generatedWorkouts);
    setSelectedWorkout(0);
    setWorkoutRunning(false);
    setWorkoutSeconds(0);
    setRestSeconds(0);
    setLog(current => ({...current, plannedLift: true}));
  };

  const handleSaveManualMeal = async () => {
    if (!manualMeal.name.trim()) {
      Alert.alert('Meal name required', 'Add a meal name before saving.');
      return;
    }

    const newMeal = {
      ...manualMeal,
      id: `manual-${Date.now()}`,
      name: manualMeal.name.trim(),
      notes: manualMeal.notes.trim() || 'Manual meal entry.',
      custom: true,
    };
    setMealsState(current => [...current, newMeal]);
    setLog(current => ({...current, selectedMeals: [...current.selectedMeals, newMeal.id]}));
    if (cloudProfile && isSupabaseConfigured) {
      uploadMealToCommunity(newMeal, manualMealPrivate, cloudProfile).catch(error => {
        Alert.alert('Meal saved locally', `Cloud sharing failed: ${error?.message ?? 'try again later.'}`);
      });
    }
    setManualMeal(blankMeal());
    setManualMealPrivate(false);
    setShowManualMeal(false);
  };

  // Handle meal editing
  const handleEditMeal = (meal: Meal) => {
    setEditingMeal(meal);
    setShowMealEdit(true);
  };

  const handleSaveEditedMeal = (updatedMeal: Meal) => {
    setMealsState(current =>
      current.map(m => m.id === updatedMeal.id ? updatedMeal : m)
    );
    setShowMealEdit(false);
    setEditingMeal(null);
  };

  const handleDeleteMeal = (mealId: string) => {
    setMealsState(current => current.filter(m => m.id !== mealId));
    setLog(current => ({...current, selectedMeals: current.selectedMeals.filter(id => id !== mealId)}));
  };

  // Handle meal import
  const handleImportMeals = (importedMeals: Meal[]) => {
    setMealsState(current => [...current, ...importedMeals]);
  };

  // Handle workout import
  const handleImportWorkouts = (importedWorkouts: WorkoutDay[]) => {
    setWorkouts(current => [...current, ...importedWorkouts]);
  };

  const regenerateMealsFromCurrentProfile = () => {
    const generatedMeals = generateMealsFromPreferences(profile);
    setMealsState(generatedMeals);
    setLog(current => ({...current, selectedMeals: current.selectedMeals.filter(id => generatedMeals.some(meal => meal.id === id))}));
    Alert.alert('Meals regenerated', `Created ${generatedMeals.length} meal options from your current meal preferences.`);
  };

  const regenerateWorkoutsFromCurrentProfile = () => {
    const generatedWorkouts = generateWorkoutsFromPreferences(profile);
    setWorkouts(generatedWorkouts);
    setSelectedWorkout(0);
    setWorkoutRunning(false);
    setWorkoutSeconds(0);
    setRestSeconds(0);
    Alert.alert('Workouts regenerated', `Created ${generatedWorkouts.length} workout days from your current workout preferences.`);
  };

  const toggleStore = (store: string) => {
    setSelectedStores(current => current.includes(store) ? current.filter(item => item !== store) : [...current, store]);
  };

  const recommendedStoreFor = (item: string) => {
    const lower = item.toLowerCase();
    if (lower.includes('protein') || lower.includes('chicken') || lower.includes('beef') || lower.includes('egg')) return selectedStores.includes('Costco') ? 'Costco' : selectedStores.includes('Sam’s Club') ? 'Sam’s Club' : selectedStores[0] ?? 'Any store';
    if (lower.includes('protein powder') || lower.includes('bar') || lower.includes('rice cake')) return selectedStores.includes('Amazon') ? 'Amazon' : selectedStores[0] ?? 'Any store';
    if (lower.includes('sauce') || lower.includes('rice cake') || lower.includes('snack')) return selectedStores.includes('Trader Joe’s') ? 'Trader Joe’s' : selectedStores[0] ?? 'Any store';
    if (lower.includes('salmon') || lower.includes('tuna') || lower.includes('fish')) return selectedStores.includes('Whole Foods') ? 'Whole Foods' : selectedStores[0] ?? 'Any store';
    return selectedStores[0] ?? 'Any store';
  };

  const buildGroceryList = () => {
    const sourceMeals = mealsState;
    const previousItems = new Map(groceryItems.map(item => [item.id, item]));
    const nextItems = sourceMeals.flatMap(meal => ingredientsFromMeal(meal).map(name => ({
      id: `${meal.id}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      source: meal.name,
      store: recommendedStoreFor(name),
      needed: true,
      bought: false,
    })));
    const unique = Array.from(new Map(nextItems.map(item => [item.name.toLowerCase(), item])).values()).map(item => {
      const previous = previousItems.get(item.id);
      return previous ? { ...item, ...previous } : item;
    });
    setGroceryItems(unique);
  };

  const toggleGroceryField = (id: string, field: 'needed'|'bought') => {
    setGroceryItems(items => items.map(item => item.id === id ? {...item, [field]: !item[field]} : item));
  };

  const updateGroceryStore = (id: string, store: string) => {
    setGroceryItems(items => items.map(item => item.id === id ? {...item, store} : item));
  };

  const cycleGroceryStore = (id: string) => {
    setGroceryItems(items => items.map(item => {
      if (item.id !== id) return item;
      const currentIndex = STORE_OPTIONS.indexOf(item.store);
      const nextStore = STORE_OPTIONS[(currentIndex + 1) % STORE_OPTIONS.length] ?? STORE_OPTIONS[0];
      return { ...item, store: nextStore };
    }));
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} duration={1500} />;
  }

  if (isLoadingProfile) {
    return <View style={{flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center'}}><Text style={{color: '#cbd5e1', fontSize: 16}}>Loading...</Text></View>;
  }

  if (isLoadingCloud) {
    return <View style={{flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center'}}><Text style={{color: '#cbd5e1', fontSize: 16}}>Loading Calos cloud...</Text></View>;
  }

  if (!cloudLocalOnly && !cloudSession) {
    return <AuthScreen onAuthenticated={async () => {
      setIsLoadingCloud(true);
      setCloudProfileChecked(false);
      try {
        const session = await getCurrentSession();
        const nextCloudProfile = session ? await getCurrentProfile().catch(() => null) : null;
        const cloudAppState = nextCloudProfile ? await getCloudAppState().catch(() => null) : null;
        setCloudSession(session);
        setCloudProfile(nextCloudProfile);
        if (cloudAppState) applyCloudSnapshot(cloudAppState);
        setCloudProfileChecked(true);
      } finally {
        setIsLoadingCloud(false);
      }
    }} onSkipCloud={() => setCloudLocalOnly(true)} />;
  }

  if (!cloudLocalOnly && cloudSession && !cloudProfileChecked) {
    return <View style={{flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center'}}><Text style={{color: '#cbd5e1', fontSize: 16}}>Checking Calos profile...</Text></View>;
  }

  if (!cloudLocalOnly && cloudSession && cloudProfileChecked && !cloudProfile) {
    if (!isCompletingCloudProfile) {
      setTimeout(() => setIsCompletingCloudProfile(true), 0);
    }
    return <ProfileCompletionScreen onComplete={(nextProfile) => {
      setCloudProfile(nextProfile);
      setCloudProfileChecked(true);
      setIsCompletingCloudProfile(false);
      setProfile(current => ({ ...current, name: nextProfile.displayName || current.name }));
    }} />;
  }

  // Show onboarding if user hasn't completed it
  if (!hasSeenOnboarding) {
    return <IntakeFlow initialName={cloudProfile?.displayName} onComplete={handleOnboardingComplete} />;
  }

  const secondaryTabs: MoreTab[] = ['Calendar', 'Grocery', 'Weight', 'Profile'];
  const parseCsv = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);
  const formatCsv = (items?: string[]) => items?.join(', ') ?? '';
  const updateMealPreferences = (patch: Partial<MealPreferences>) => {
    setProfile(current => ({
      ...current,
      mealPreferences: {
        cookingTimePerMeal: 'moderate',
        favoriteProteins: [],
        favoriteCarbs: [],
        favoriteVeggies: [],
        favoriteFruits: [],
        allergies: '',
        ...(current.mealPreferences ?? {}),
        ...patch,
      },
    }));
  };
  const updateWorkoutPreferences = (patch: Partial<WorkoutPreferences>) => {
    setProfile(current => ({
      ...current,
      workoutPreferences: {
        useDefaults: false,
        timePerWorkout: '45-60 minutes',
        usualWorkoutTime: '',
        equipmentAccess: 'full gym',
        likedExercises: '',
        trainingLimits: '',
        ...(current.workoutPreferences ?? {}),
        ...patch,
      },
    }));
  };
  const activeWorkout = workouts[selectedWorkout] ?? workouts[0] ?? baseWorkouts[0];
  const activeExercise = activeWorkout?.exercises[activeExerciseIndex];
  const workoutTimerDetail = activeExercise
    ? `${activeExercise.name} · next set ${Math.min(activeSetIndex + 1, activeExercise.sets)}`
    : 'Ready for your next set';

  return <SafeAreaView style={s.app}><StatusBar style="light"/><View style={s.header}><Text style={s.title}>Calos</Text><Text style={s.sub}>Track, analyze, thrive</Text></View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:tab === 'Meals' || tab === 'Workout' ? 150 : 28}}>
      {tab==='Today' && <HomeScreen
        profile={profile}
        log={log}
        dayLogs={dayLogs}
        workouts={workouts}
        selectedWorkout={selectedWorkout}
        caloriesLogged={mealCals + alcoholCals}
        calorieGoal={calorieGoal}
        proteinLogged={mealProtein}
        proteinGoal={profile.proteinGoal}
        onLogWeight={(weight) => setLog(current => ({...current, weight}))}
        onStartWorkout={() => { setTab('Workout'); startWorkoutFlow(); }}
        onLogFood={() => setTab('Meals')}
      />}

      {tab==='Calendar' && <Section title="Calendar & Logging"><CalendarView dayLogs={dayLogs} profile={profile} currentLog={log} allMeals={mealsState} onDayPress={handleDayPress} /></Section>}

      {tab==='Meals' && <>
        <Section title="🍽️ Your Meal Menu">
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
            <Pressable style={{flex: 1}} onPress={() => setShowAICoach(true)}><View style={s.aiButton}><MaterialIcons name="smart-toy" size={16} color="#fff" /><Text style={s.aiButtonText}>Ask AI Coach</Text></View></Pressable>
            <Pressable style={{flex: 1}} onPress={() => setShowManualMeal(true)}><View style={s.manualButton}><MaterialIcons name="add-circle-outline" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Add Meal</Text></View></Pressable>
          </View>
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
            <Pressable style={{flex: 1}} onPress={() => setShowMealLibrary(true)}><View style={s.manualButton}><MaterialIcons name="restaurant-menu" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Browse Meal Library</Text></View></Pressable>
            <Pressable style={{flex: 1}} onPress={() => setShowCommunityMeals(true)}><View style={s.manualButton}><MaterialIcons name="groups" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Community Meals</Text></View></Pressable>
          </View>
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
            <Pressable style={{flex: 1}} onPress={() => setShowImportExportMeals(true)}><View style={s.manualButton}><MaterialIcons name="import-export" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Import/Export</Text></View></Pressable>
          </View>
          <Text style={s.note}>Tap meals to add/remove for today. Long-press or tap the meal to edit/delete. AI meals and imports show with ✨.</Text>
        </Section>
        {(['Breakfast','Lunch','Dinner','Snack'] as const).map(type=><Section key={type} title={type}>{mealsState.filter(m=>m.type===type).map(m=><View key={m.id} style={{marginBottom:10}}><Pressable onPress={()=>toggleMeal(m.id)} style={[s.meal, log.selectedMeals.includes(m.id)&&s.mealActive]}><Text style={s.mealTitle}>{m.name}{m.custom ? ' ✨' : ''}</Text><Text style={s.mealSub}>{m.calories} cal · {m.protein}g protein · {m.carbs}C/{m.fat}F</Text><Text style={s.note} numberOfLines={expandedMeals[m.id] ? undefined : 2}>{m.notes}</Text></Pressable><View style={s.mealActions}><Pressable onPress={()=>toggleMealRecipe(m.id)} style={s.smallActionButton}><MaterialIcons name={expandedMeals[m.id] ? 'expand-less' : 'expand-more'} size={16} color="#cbd5e1" /><Text style={s.smallActionText}>{expandedMeals[m.id] ? 'Hide recipe' : 'Recipe'}</Text></Pressable><Pressable onPress={()=>handleEditMeal(m)} style={s.smallActionButton}><MaterialIcons name="edit" size={14} color="#cbd5e1" /><Text style={s.smallActionText}>Edit/Delete</Text></Pressable></View></View>)}</Section>)}
      </>}

      {tab==='Workout' && <>
        <Section title="Workout Guide">
          <Text style={s.note}>Start the session, then tap each set as you complete it. Calos asks for weight and reps, starts the right rest timer, and moves you to the next set.</Text>
          <View style={{flexDirection: 'row', gap: 8, marginTop: 10}}>
            <Pressable style={{flex: 1}} onPress={() => setShowAIWorkout(true)}><View style={s.manualButton}><MaterialIcons name="fitness-center" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>AI Workout Review</Text></View></Pressable>
            <Pressable style={{flex: 1}} onPress={() => setShowImportExportWorkouts(true)}><View style={s.manualButton}><MaterialIcons name="import-export" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Import/Export</Text></View></Pressable>
          </View>
        </Section>
        <Section title="Pick Workout"><View style={s.row}>{workouts.map((w,i)=><Pill key={w.id} active={i===selectedWorkout} onPress={()=>setSelectedWorkout(i)}>{w.name.split(' ')[0]}</Pill>)}</View></Section>
        <Section title={activeWorkout.name}>
          <View style={s.timerPanel}>
            <Pressable onPress={workoutRunning ? () => setWorkoutRunning(false) : startWorkoutFlow} style={[s.restHero, restSeconds > 0 && restSeconds <= 15 && {borderColor:'#ef4444',backgroundColor:'#1f0b0b'}]}>
              <Text style={s.restHeroLabel}>{restSeconds > 0 ? 'REST TIMER' : workoutRunning ? 'WORKOUT TIMER' : 'START SESSION'}</Text>
              <Text style={[s.restHeroValue, restSeconds > 0 && restSeconds <= 15 && {color:'#ef4444'}]}>{formatSeconds(restSeconds > 0 ? restSeconds : workoutSeconds)}</Text>
              <Text style={s.cardioLabel}>{restSeconds > 0 ? 'recover, breathe, then hit the next set' : workoutRunning ? `workout running · total ${formatSeconds(workoutSeconds)}` : 'tap Start to begin the workout flow'}</Text>
            </Pressable>
            <View style={s.row}><Pill active={workoutRunning} onPress={workoutRunning ? ()=>setWorkoutRunning(false) : startWorkoutFlow}>{workoutRunning ? 'Pause' : 'Start Workout'}</Pill><Pill onPress={()=>{setWorkoutRunning(false);setWorkoutSeconds(0);setRestSeconds(0);setActiveExerciseIndex(0);setActiveSetIndex(0);}}>Reset</Pill><Pill active={log.workoutDone} onPress={()=>setLog(l=>({...l,workoutDone:!l.workoutDone,plannedLift:true,...workoutLogFromWorkout(activeWorkout)}))}>Mark done</Pill></View>
            <Text style={s.note}>The rest timer starts automatically after you log a set. It stays pinned above the tabs so you can scroll without losing it.</Text>
            <Text style={s.note}>Workout calorie estimate: {effectiveCalories.estimatedWorkoutCalories}. Food target credit when marked done: {effectiveCalories.workoutCredit}.</Text>
            <Input label="Workout calories burned" value={String(log.workoutBurnedCalories ?? effectiveCalories.estimatedWorkoutCalories)} onChange={v=>setLog(l=>({...l,workoutBurnedCalories:v === '' ? undefined : num(v)}))}/>
          </View>
          <Pressable onPress={()=>addExerciseToWorkout(selectedWorkout)} style={s.addExerciseButton}><MaterialIcons name="add" size={17} color="#052e1c" /><Text style={s.addExerciseText}>Add exercise</Text></Pressable>
          {activeWorkout.exercises.map((e,ei)=>{ const restTime = suggestedRestSeconds(e); return <View key={e.id} style={[s.exercise, ei===activeExerciseIndex && {borderColor:'#34d399',backgroundColor:'#0d1f19'}]}><Input label="Exercise name" value={e.name} onChange={v=>updateExercise(selectedWorkout,ei,{name:v})}/><Text style={s.mealSub}>{e.sets} sets · {e.minReps}-{e.maxReps} reps · target {e.weight} lb</Text><Text style={s.restHint}>Suggested rest: {formatSeconds(restTime)}</Text><View style={s.formGrid}><View style={s.formHalf}><Input label="Sets" value={String(e.sets)} onChange={v=>{const sets=Math.max(1,num(v,1)); updateExercise(selectedWorkout,ei,{sets,lastReps:Array.from({length:sets}).map((_,idx)=>e.lastReps[idx]??0),lastWeights:Array.from({length:sets}).map((_,idx)=>e.lastWeights?.[idx]??e.weight)})}}/></View><View style={s.formHalf}><Input label="Target lb" value={String(e.weight)} onChange={v=>updateExercise(selectedWorkout,ei,{weight:num(v),lastWeights:e.lastWeights?.length ? e.lastWeights : Array.from({length:e.sets}).map(()=>num(v))})}/></View></View>
            <View style={s.setRow}>{Array.from({length:e.sets}).map((_,si)=>{ const loggedReps = e.lastReps[si] || 0; const loggedWeight = e.lastWeights?.[si] ?? e.weight ?? 0; const completed = loggedReps > 0; const active = ei===activeExerciseIndex && si===activeSetIndex; return <Pressable key={si} onPress={()=>logWorkoutSet(selectedWorkout,ei,si)} style={[{width:'47%',minHeight:72,backgroundColor:'#111827',borderWidth:1,borderColor:'#334155',borderRadius:12,padding:10,justifyContent:'center'}, completed && {borderColor:'#34d399',backgroundColor:'#082016'}, active && {borderColor:'#f8fafc'}]}><Text style={[{color:'#94a3b8',fontSize:12,fontWeight:'900',marginBottom:5}, active && {color:'#f8fafc'}]}>Set {si+1}</Text><Text style={{color:'#fff',fontSize:15,fontWeight:'900'}}>{completed ? `${loggedWeight} x ${loggedReps}` : `${loggedWeight || e.weight || '-'} lb · ${e.minReps}-${e.maxReps}`}</Text></Pressable>})}</View>
            <View style={s.workoutActionRow}><Pill active={ei===activeExerciseIndex} onPress={()=>{setActiveExerciseIndex(ei);setActiveSetIndex(0);}}>Focus</Pill><Pill onPress={()=>startRestTimer(restTime)}>Start {formatSeconds(restTime)} rest</Pill><Pill onPress={()=>removeExerciseFromWorkout(selectedWorkout,ei)}>Remove</Pill></View>
            <Text style={s.note}>{progressionText(e)} Backup: {e.backup}</Text></View>})}
        </Section>
        <Section title="If You Miss Gym">
          <Text style={s.note}>💪 Full backup workout:</Text>
          {activeWorkout.backup.map((item, idx) => (
            <Text key={idx} style={[s.note, {marginLeft: 8, marginTop: 4}]}>• {item}</Text>
          ))}
        </Section>
      </>}

      {tab==='Cardio' && <>
        <Section title="Required Cardio">
          <View style={s.cardioHero}>
            <Text style={s.cardioValue}>{cardioPlan.burnedCalories}/{cardioPlan.targetCalories}</Text>
            <Text style={s.cardioLabel}>cardio calories burned</Text>
            <View style={s.progressTrack}><View style={[s.progressFill, {width: `${cardioPlan.progress * 100}%`}]} /></View>
            <Text style={s.note}>Target heart-rate zone: {cardioPlan.heartRateZone.minHR}-{cardioPlan.heartRateZone.maxHR} bpm. This target is based on your {cardioPlan.lossOption.label} loss goal.</Text>
          </View>
          <View style={s.grid}>
            <Metric label="Flat minutes left" value={cardioPlan.outdoorMinutesNeeded}/>
            <Metric label="Incline minutes left" value={cardioPlan.inclineMinutesNeeded}/>
            <Metric label="Cardio burn" value={cardioPlan.cardioCalories}/>
            <Metric label="Golf burn" value={cardioPlan.golfCalories}/>
            <Metric label="Flat estimate" value={cardioPlan.outdoorCalories}/>
            <Metric label="Other burn" value={cardioPlan.otherCalories}/>
          </View>
          <Text style={s.note}>The app now targets calorie burn, not raw minutes. Incline walking counts more per minute than flat walking. Golf counts based on holes and riding/walking mode.</Text>
        </Section>
        <Section title="Cardio Log"><Input label="Outdoor walk minutes" value={String(log.outdoorWalk)} onChange={v=>setLog(l=>({...l,outdoorWalk:num(v),cardioBurnedCalories:undefined}))}/><Input label="Incline treadmill minutes" value={String(log.inclineWalk)} onChange={v=>setLog(l=>({...l,inclineWalk:num(v),cardioBurnedCalories:undefined}))}/><Input label="Cardio calories burned" value={String(log.cardioBurnedCalories ?? cardioPlan.estimatedCardioCalories)} onChange={v=>setLog(l=>({...l,cardioBurnedCalories:v === '' ? undefined : num(v)}))}/><Text style={s.helpText}>Estimated cardio burn from walking: {cardioPlan.estimatedCardioCalories} calories. Wearables can overestimate activity calories; use device numbers only when they seem reasonable.</Text><Input label="Other burned calories" value={String(log.otherBurnedCalories ?? 0)} onChange={v=>setLog(l=>({...l,otherBurnedCalories:num(v)}))}/><Text style={s.helpText}>Add manual calories only for activity not already logged as walking, incline, or golf.</Text><View style={s.row}><Pill active={log.golf} onPress={()=>setLog(l=>({...l,golf:!l.golf}))}>Golf</Pill>{log.golf && <><Pill active={(log.golfMode ?? 'riding')==='riding'} onPress={()=>setLog(l=>({...l,golfMode:'riding',golfBurnedCalories:undefined}))}>Riding</Pill><Pill active={log.golfMode==='walking'} onPress={()=>setLog(l=>({...l,golfMode:'walking',golfBurnedCalories:undefined}))}>Walking</Pill></>}</View>{log.golf && <><Input label="Golf holes" value={String(log.golfHoles ?? 18)} onChange={v=>setLog(l=>({...l,golfHoles:num(v),golfBurnedCalories:undefined}))}/><Text style={s.helpText}>Estimated golf burn: {cardioPlan.estimatedGolfCalories} calories.</Text><Input label="Golf calories burned" value={String(log.golfBurnedCalories ?? cardioPlan.estimatedGolfCalories)} onChange={v=>setLog(l=>({...l,golfBurnedCalories:v === '' ? undefined : num(v)}))}/></>}</Section>
      </>}

      {tab==='Water' && <>
        <Section title="Water Target">
          <View style={s.cardioHero}>
            <Text style={s.cardioValue}>{waterPlan.loggedOunces}/{waterPlan.targetOunces}</Text>
            <Text style={s.cardioLabel}>ounces today ({waterPlan.liters} L target)</Text>
            <View style={s.progressTrack}><View style={[s.progressFill, {width: `${waterPlan.progress * 100}%`}]} /></View>
            <Text style={s.note}>{waterPlan.note}</Text>
          </View>
          <View style={s.row}><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+8}))}>+8 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+16}))}>+16 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+24}))}>+24 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+32}))}>+32 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+64}))}>+64 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:0}))}>Reset</Pill></View>
        </Section>
        <Section title="Water Log"><Input label="Water ounces" value={String(log.waterOz ?? 0)} onChange={v=>setLog(l=>({...l,waterOz:num(v)}))}/><Text style={s.note}>Water target rises with body weight, height, protein target, cardio burn, golf, alcohol, and weekly loss goal.</Text><Text style={s.helpText}>Count water and low-calorie fluids. Be consistent with what you count so the trend is useful.</Text></Section>
      </>}

      {tab==='Grocery' && <>
        <Section title="Grocery AI">
          <Text style={s.note}>Build a grocery list from every meal available in your meal menu, including default meals plus AI/manual meals you saved as selectable options. Store suggestions are based on what you like to shop and what usually makes sense to buy in bulk, online, or specialty stores.</Text>
          <Text style={s.label}>Preferred stores</Text>
          <View style={s.row}>{STORE_OPTIONS.map(store=><Pill key={store} active={selectedStores.includes(store)} onPress={()=>toggleStore(store)}>{store}</Pill>)}</View>
          <Pressable onPress={buildGroceryList}><View style={s.aiButton}><MaterialIcons name="shopping-cart" size={16} color="#052e1c" /><Text style={s.aiButtonText}>Build Grocery List</Text></View></Pressable>
        </Section>
        <Section title="Need To Buy">
          {groceryItems.length === 0 ? <Text style={s.note}>No grocery list yet. Add/select meals, then build the list.</Text> : groceryItems.map(item=><View key={item.id} style={s.groceryItem}>
            <View style={{flex:1}}>
              <Text style={[s.mealTitle, item.bought && s.crossed]}>{item.name}</Text>
              <Text style={s.mealSub}>{item.store} · from {item.source}</Text>
              <Pressable onPress={() => cycleGroceryStore(item.id)} style={s.storeChip}>
                <MaterialIcons name="store" size={12} color="#cbd5e1" />
                <Text style={s.storeChipText}>Store: {item.store}</Text>
              </Pressable>
            </View>
            <View style={s.groceryActions}>
              <Pill active={item.needed} onPress={()=>toggleGroceryField(item.id,'needed')}>Need</Pill>
              <Pill active={item.bought} onPress={()=>toggleGroceryField(item.id,'bought')}>Bought</Pill>
            </View>
          </View>)}
        </Section>
      </>}

      {tab==='Weight' && <>
        <Section title="Weight Trend">
          <View style={s.row}>{(['Week','Month','Quarter','Year','All','Custom'] as WeightRange[]).map(range=><Pill key={range} active={weightRange===range} onPress={()=>setWeightRange(range)}>{range}</Pill>)}</View>
          {weightRange === 'Custom' && <View style={s.formGrid}><View style={s.formHalf}><Input label="Start YYYY-MM-DD" value={customStart} onChange={setCustomStart}/></View><View style={s.formHalf}><Input label="End YYYY-MM-DD" value={customEnd} onChange={setCustomEnd}/></View></View>}
          <WeightTrend dayLogs={{...dayLogs, [log.date]: log}} range={weightRange} customStart={customStart} customEnd={customEnd} />
          <Text style={s.helpText}>Withings support would require a real Withings OAuth connection and API sync. This local view uses weights logged in Calos for now.</Text>
        </Section>
      </>}

      {tab==='Profile' && <>
        <Section title="Cloud Profile">
          {cloudProfile ? (
            <View style={{gap:10}}>
              <View style={{flexDirection:'row',alignItems:'center',gap:12}}>
                <ProfileAvatar avatarUrl={cloudProfile.avatarUrl} displayName={cloudProfile.displayName} />
                <View style={{flex:1}}>
                  <Text style={s.mealTitle}>{cloudProfile.displayName}</Text>
                  <Text style={s.mealSub}>@{cloudProfile.username}{cloudProfile.isPrivate ? ' · private' : ' · public'}</Text>
                </View>
              </View>
              <View style={{flexDirection:'row',gap:8}}>
                <Pressable style={{flex:1}} onPress={() => setShowEditCloudProfile(true)}><View style={s.manualButton}><MaterialIcons name="edit" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Edit Profile</Text></View></Pressable>
                <Pressable style={{flex:1}} onPress={() => setShowUserSearch(true)}><View style={s.manualButton}><MaterialIcons name="person-search" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Search Users</Text></View></Pressable>
              </View>
              <Pressable onPress={() => setShowCommunityMeals(true)}><View style={s.manualButton}><MaterialIcons name="restaurant-menu" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Community Meals</Text></View></Pressable>
              <Pressable onPress={async()=>{try{await signOut();setCloudSession(null);setCloudProfile(null);}catch(error:any){Alert.alert('Logout failed', error?.message ?? 'Please try again.')}}}><View style={s.manualButton}><MaterialIcons name="logout" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Log Out</Text></View></Pressable>
              <Text style={s.helpText}>Public meals can be discovered by other Calos users. Weight, calories, personal logs, and workout logs stay private.</Text>
            </View>
          ) : (
            <View style={{gap:10}}>
              <Text style={s.note}>{cloudLocalOnly ? 'Cloud is disabled for this session.' : 'No cloud profile found for this account.'}</Text>
              <Pressable onPress={() => cloudLocalOnly ? setCloudLocalOnly(false) : setShowEditCloudProfile(true)}><View style={s.aiButton}><MaterialIcons name="cloud" size={16} color="#052e1c" /><Text style={s.aiButtonText}>{cloudLocalOnly ? 'Enable Cloud Login' : 'Complete Profile'}</Text></View></Pressable>
            </View>
          )}
        </Section>
        <Section title="Your Settings">
          <Input label="Profile Name" value={String(profile.name)} onChange={v=>setProfile(p=>({...p,name:v}))}/>
          <Input label="Age" value={String(profile.age)} onChange={v=>setProfile(p=>({...p,age:num(v)}))}/><Input label="Height inches" value={String(profile.heightIn)} onChange={v=>setProfile(p=>({...p,heightIn:num(v)}))}/><Input label="Current weight" value={String(profile.weight)} onChange={v=>setProfile(p=>({...p,weight:num(v)}))}/><Input label="Goal weight" value={String(profile.goalWeight)} onChange={v=>setProfile(p=>({...p,goalWeight:num(v)}))}/><Input label="Gym days/week" value={String(profile.gymDaysPerWeek ?? 4)} onChange={v=>setProfile(p=>({...p,gymDaysPerWeek:num(v)}))}/><Input label="Daily calorie goal" value={String(profile.calorieGoal)} onChange={v=>setProfile(p=>({...p,calorieGoal:num(v)}))}/><Input label="Protein goal" value={String(profile.proteinGoal)} onChange={v=>setProfile(p=>({...p,proteinGoal:num(v)}))}/><Input label="Carb goal" value={String(profile.carbGoal ?? carbGoal)} onChange={v=>setProfile(p=>({...p,carbGoal:num(v)}))}/><Input label="Fat goal" value={String(profile.fatGoal ?? fatGoal)} onChange={v=>setProfile(p=>({...p,fatGoal:num(v)}))}/>
          <Text style={s.label}>Weight loss rate</Text>
          <View style={s.row}>{Object.values(weeklyLossOptions).map(option=><Pill key={option.rate} active={(profile.weeklyLossRate ?? 1)===option.rate} onPress={()=>{const targets=calculateNutritionTargets({...profile,weeklyLossRate:option.rate,goal:'cut'});setProfile(p=>({...p,goal:'cut',weeklyLossRate:option.rate,aggression:targets.deficit,calorieGoal:targets.calorieGoal,proteinGoal:targets.proteinGoal,carbGoal:targets.carbGoal,fatGoal:targets.fatGoal}))}}>{option.label}</Pill>)}</View>
          <Text style={s.note}>Maintenance estimate: {calculateNutritionTargets(profile).maintenance}. Current targets: {profile.calorieGoal} cal / {profile.proteinGoal}g P / {carbGoal}g C / {fatGoal}g F. You can override them above.</Text>
        </Section>

        <Section title="🍽️ Meal Preferences">
          <Text style={s.helpText}>These are passed into nutrition AI chats and meal generation.</Text>
          <Pressable onPress={regenerateMealsFromCurrentProfile} style={s.regenButton}>
            <MaterialIcons name="refresh" size={17} color="#052e1c" />
            <Text style={s.regenButtonText}>Regenerate Meals From Preferences</Text>
          </Pressable>
          <Input label="Cooking time per meal" value={profile.mealPreferences?.cookingTimePerMeal ?? ''} onChange={v=>updateMealPreferences({cookingTimePerMeal:v})}/>
          <Input label="Breakfast preference" value={profile.mealPreferences?.breakfastTime ?? ''} onChange={v=>updateMealPreferences({breakfastTime:v})}/>
          <Input label="Lunch preference" value={profile.mealPreferences?.lunchTime ?? ''} onChange={v=>updateMealPreferences({lunchTime:v})}/>
          <Input label="Dinner preference" value={profile.mealPreferences?.dinnerTime ?? ''} onChange={v=>updateMealPreferences({dinnerTime:v})}/>
          <Input label="Snack preference" value={profile.mealPreferences?.snackPreference ?? ''} onChange={v=>updateMealPreferences({snackPreference:v})}/>
          <Input label="Favorite proteins, comma-separated" value={formatCsv(profile.mealPreferences?.favoriteProteins)} onChange={v=>updateMealPreferences({favoriteProteins:parseCsv(v)})}/>
          <Input label="Favorite carbs, comma-separated" value={formatCsv(profile.mealPreferences?.favoriteCarbs)} onChange={v=>updateMealPreferences({favoriteCarbs:parseCsv(v)})}/>
          <Input label="Favorite veggies, comma-separated" value={formatCsv(profile.mealPreferences?.favoriteVeggies)} onChange={v=>updateMealPreferences({favoriteVeggies:parseCsv(v)})}/>
          <Input label="Favorite fruits, comma-separated" value={formatCsv(profile.mealPreferences?.favoriteFruits)} onChange={v=>updateMealPreferences({favoriteFruits:parseCsv(v)})}/>
          <Input label="Allergies, restrictions, or dislikes" value={profile.mealPreferences?.allergies ?? ''} onChange={v=>updateMealPreferences({allergies:v})}/>
          <Text style={s.label}>Additional meal notes</Text>
          <TextInput style={[s.input, s.notesInput]} value={profile.mealPreferences?.additionalNotes ?? ''} onChangeText={v=>updateMealPreferences({additionalNotes:v})} multiline placeholder="Anything else the AI should know about your food preferences." placeholderTextColor="#64748b" />
        </Section>

        <Section title="🏋️ Workout Preferences">
          <Text style={s.helpText}>These are passed into workout AI chats and routine generation.</Text>
          <Pressable onPress={regenerateWorkoutsFromCurrentProfile} style={s.regenButton}>
            <MaterialIcons name="refresh" size={17} color="#052e1c" />
            <Text style={s.regenButtonText}>Regenerate Workouts From Preferences</Text>
          </Pressable>
          <View style={s.row}><Pill active={!!profile.workoutPreferences?.useDefaults} onPress={()=>updateWorkoutPreferences({useDefaults:!profile.workoutPreferences?.useDefaults})}>Use default workouts</Pill></View>
          <Input label="Gym type" value={profile.workoutPreferences?.gymType ?? ''} onChange={v=>updateWorkoutPreferences({gymType:v})}/>
          <Input label="Workout style" value={profile.workoutPreferences?.workoutStyle ?? ''} onChange={v=>updateWorkoutPreferences({workoutStyle:v})}/>
          <Input label="Time per workout" value={profile.workoutPreferences?.timePerWorkout ?? ''} onChange={v=>updateWorkoutPreferences({timePerWorkout:v})}/>
          <Input label="Usual workout time" value={profile.workoutPreferences?.usualWorkoutTime ?? ''} onChange={v=>updateWorkoutPreferences({usualWorkoutTime:v})}/>
          <Input label="Equipment access" value={profile.workoutPreferences?.equipmentAccess ?? ''} onChange={v=>updateWorkoutPreferences({equipmentAccess:v})}/>
          <Input label="Training goals or exercises you like" value={profile.workoutPreferences?.likedExercises ?? ''} onChange={v=>updateWorkoutPreferences({likedExercises:v})}/>
          <Input label="Limitations, injuries, dislikes, or substitutions" value={profile.workoutPreferences?.trainingLimits ?? ''} onChange={v=>updateWorkoutPreferences({trainingLimits:v})}/>
          <Text style={s.label}>Additional workout notes</Text>
          <TextInput style={[s.input, s.notesInput]} value={profile.workoutPreferences?.additionalNotes ?? ''} onChangeText={v=>updateWorkoutPreferences({additionalNotes:v})} multiline placeholder="Anything else the AI should know about your training." placeholderTextColor="#64748b" />
        </Section>

        <Section title="Data & Reset">
          <Pill onPress={()=>Alert.alert('Saved locally','This app stores data on this phone using AsyncStorage.')}>Storage info</Pill>
          <View style={{marginTop:10}}><Pill onPress={()=>Alert.alert('Reset app data','This clears local Calos data and shows onboarding again.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:resetLocalData}])}>Reset intake / local data</Pill></View>
        </Section>
      </>}
      <View style={s.brandFooter}>
        <Text style={s.brandFooterText}>Created and owned by Toopa Group LLC</Text>
      </View>
    </ScrollView>
    <DayDetailModal
      visible={showDayModal}
      dateKey={selectedDateForModal}
      dayLog={currentModalLog || {date: '', calories: 0, protein: 0, outdoorWalk: 0, inclineWalk: 0, cardioBurnedCalories: undefined, golfBurnedCalories: undefined, otherBurnedCalories: 0, workoutBurnedCalories: undefined, alcoholCalories: undefined, golf: false, golfHoles: 18, golfMode: 'riding', waterOz: 0, plannedLift: true, drinking: false, drinks: 0, workoutDone: false, selectedMeals: [], notes: ''}}
      profile={profile}
      onClose={() => setShowDayModal(false)}
      onSave={handleSaveDayLog}
      allMeals={mealsState}
    />
    <AICoachModal
      visible={showAICoach}
      profile={profile}
      dayContext={{ caloriesLeft, proteinLeft: Math.max(0, proteinLeft), carbsLeft: Math.max(0, carbsLeft), fatLeft: Math.max(0, fatLeft), calorieGoal, carbGoal, fatGoal, caloriesLogged: mealCals + alcoholCals, proteinLogged: mealProtein, carbsLogged: mealCarbs, fatLogged: mealFat, cardioBurned: cardioPlan.burnedCalories, cardioRemaining: cardioPlan.remainingCalories }}
      currentMeals={mealsState}
      onClose={() => setShowAICoach(false)}
      onSaveMeals={handleSaveAIMeals}
    />
    <AICoachModal
      visible={showAIWorkout}
      profile={profile}
      mode="workout"
      workouts={workouts}
      dayContext={{ caloriesLeft, proteinLeft: Math.max(0, proteinLeft), carbsLeft: Math.max(0, carbsLeft), fatLeft: Math.max(0, fatLeft), calorieGoal, carbGoal, fatGoal, caloriesLogged: mealCals + alcoholCals, proteinLogged: mealProtein, carbsLogged: mealCarbs, fatLogged: mealFat, cardioBurned: cardioPlan.burnedCalories, cardioRemaining: cardioPlan.remainingCalories }}
      onClose={() => setShowAIWorkout(false)}
      onSaveMeals={() => {}}
      onSaveWorkout={handleSaveAIWorkout}
    />
    <ManualMealModal
      visible={showManualMeal}
      meal={manualMeal}
      onChange={setManualMeal}
      isPrivate={manualMealPrivate}
      onPrivacyChange={setManualMealPrivate}
      onClose={() => setShowManualMeal(false)}
      onSave={handleSaveManualMeal}
    />
    <Modal visible={showMealLibrary} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMealLibrary(false)}>
      <SafeAreaView style={s.app}>
        <View style={s.header}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <View style={{flex:1}}>
              <Text style={s.title}>Meal Library</Text>
              <Text style={s.sub}>Browse curated meals and add them to your menu</Text>
            </View>
            <Pressable onPress={() => setShowMealLibrary(false)} style={s.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:34}}>
          <CuratedMealLibrary
            selectedIds={mealsState.map(meal => meal.id.replace(/^curated-/, ''))}
            onAddMeal={handleAddCuratedMeal}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
    <Modal visible={showCommunityMeals} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCommunityMeals(false)}>
      <SafeAreaView style={s.app}>
        <View style={s.header}>
          <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <View style={{flex:1}}>
              <Text style={s.title}>Community Meals</Text>
              <Text style={s.sub}>Discover meals shared by Calos users</Text>
            </View>
            <Pressable onPress={() => setShowCommunityMeals(false)} style={s.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{padding:16,paddingBottom:34}}>
          <CommunityMealLibrary onAddMeal={handleAddCommunityMeal} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
    <EditProfileScreen visible={showEditCloudProfile} onClose={() => setShowEditCloudProfile(false)} onSaved={setCloudProfile} />
    <UserSearchScreen visible={showUserSearch} onClose={() => setShowUserSearch(false)} />
    {editingMeal && (
      <MealEditModal
        visible={showMealEdit}
        meal={editingMeal}
        onClose={() => setShowMealEdit(false)}
        onSave={handleSaveEditedMeal}
        onDelete={handleDeleteMeal}
      />
    )}
    <ImportExportModal
      visible={showImportExportMeals}
      type="meal"
      items={mealsState}
      onClose={() => setShowImportExportMeals(false)}
      onImport={handleImportMeals}
    />
    <ImportExportModal
      visible={showImportExportWorkouts}
      type="workout"
      items={workouts}
      onClose={() => setShowImportExportWorkouts(false)}
      onImport={handleImportWorkouts}
    />
    <MoreMenu
      visible={showMoreMenu}
      activeTab={tab}
      onClose={() => setShowMoreMenu(false)}
      onSelect={(nextTab) => setTab(nextTab)}
    />
    {tab === 'Meals' && (
      <MacroBar
        calories={mealCals + alcoholCals}
        calorieGoal={calorieGoal}
        protein={mealProtein}
        proteinGoal={profile.proteinGoal}
        carbs={mealCarbs}
        carbGoal={carbGoal}
        fat={mealFat}
        fatGoal={fatGoal}
      />
    )}
    {tab === 'Workout' && workoutRunning && (
      <WorkoutTimerBar
        seconds={restSeconds > 0 ? restSeconds : workoutSeconds}
        restActive={restSeconds > 0}
        low={restSeconds > 0 && restSeconds <= 15}
        detail={workoutTimerDetail}
        onSkipRest={() => setRestSeconds(0)}
      />
    )}
    <BottomTabBar
      activeTab={tab}
      moreActive={secondaryTabs.includes(tab as MoreTab)}
      onSelect={(nextTab: MainTab) => setTab(nextTab)}
      onMore={() => setShowMoreMenu(true)}
    />
  </SafeAreaView>
}

export default function App(){
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function Metric({label,value}:{label:string;value:number}){ return <View style={s.metric}><Text style={s.metricValue}>{Math.round(value)}</Text><Text style={s.metricLabel}>{label}</Text></View> }
function formatSeconds(seconds:number){ const mins=Math.floor(seconds/60); const secs=seconds%60; return `${mins}:${String(secs).padStart(2,'0')}`; }

function ingredientsFromMeal(meal: Meal) {
  const text = `${meal.name} ${meal.notes}`.toLowerCase();
  const known = [
    'chicken', 'turkey', 'beef', 'steak', 'salmon', 'tuna', 'eggs', 'egg whites',
    'protein powder', 'banana', 'bananas', 'berries', 'apple', 'apples', 'orange',
    'oranges', 'pineapple', 'grapes', 'melon', 'almond milk', 'potatoes',
    'sweet potato', 'sweet potatoes', 'rice', 'pasta', 'oats', 'bread',
    'whole grains', 'broccoli', 'spinach', 'carrots', 'bell peppers', 'asparagus',
    'kale', 'zucchini', 'tomatoes', 'olive oil', 'sauce', 'cucumber', 'seaweed',
    'bun', 'mustard', 'peanut butter', 'rice cakes', 'chips', 'chicken sausage',
    'dumbbell', 'yogurt', 'cottage cheese', 'tofu',
  ];
  const found = known.filter(item => text.includes(item));
  if (found.length > 0) {
    return Array.from(new Set(found.map(item => item.replace(/\b\w/g, char => char.toUpperCase()))));
  }
  const nameParts = meal.name
    .replace(/breakfast|lunch|dinner|snack|bowl|plate|box|with|and|lean|high-protein|protein|power|performance|comfort|mini meal/gi, ' ')
    .split(/\s+/)
    .map(part => part.trim())
    .filter(part => part.length > 3)
    .slice(0, 4);
  return nameParts.length ? nameParts.map(item => item.replace(/\b\w/g, char => char.toUpperCase())) : [meal.name];
}

function WeightTrend({dayLogs, range, customStart, customEnd}:{dayLogs:Record<string, DayLog>; range:WeightRange; customStart:string; customEnd:string}) {
  const entries = Object.values(dayLogs)
    .filter(log => Number.isFinite(Number(log.weight)))
    .map(log => ({date: log.date, weight: Number(log.weight)}))
    .sort((a,b)=>a.date.localeCompare(b.date));
  const now = new Date(todayKey());
  const startDate = new Date(now);
  if (range === 'Week') startDate.setDate(now.getDate() - 7);
  if (range === 'Month') startDate.setMonth(now.getMonth() - 1);
  if (range === 'Quarter') startDate.setMonth(now.getMonth() - 3);
  if (range === 'Year') startDate.setFullYear(now.getFullYear() - 1);
  const startKey = range === 'All' ? '' : range === 'Custom' ? customStart : todayKeyFromDate(startDate);
  const endKey = range === 'Custom' && customEnd ? customEnd : todayKey();
  const visible = entries.filter(entry => (!startKey || entry.date >= startKey) && (!endKey || entry.date <= endKey));
  const first = visible[0];
  const last = visible[visible.length - 1];
  const avg = visible.length ? visible.reduce((sum, entry)=>sum + entry.weight, 0) / visible.length : 0;
  const min = visible.length ? Math.min(...visible.map(entry=>entry.weight)) : 0;
  const max = visible.length ? Math.max(...visible.map(entry=>entry.weight)) : 0;
  const span = Math.max(1, max - min);

  if (visible.length === 0) return <Text style={s.note}>No weight data in this range yet. Log morning weight on Today to populate this view.</Text>;

  return <View>
    <View style={s.grid}><Metric label="Avg weight" value={avg}/><Metric label="Change" value={(last?.weight ?? 0) - (first?.weight ?? 0)}/><Metric label="Lowest" value={min}/><Metric label="Highest" value={max}/></View>
    <View style={s.chart}>{visible.slice(-40).map(entry => {
      const height = 18 + ((entry.weight - min) / span) * 82;
      return <View key={entry.date} style={s.chartBarWrap}><View style={[s.chartBar,{height}]} /><Text style={s.chartLabel}>{entry.date.slice(5)}</Text></View>;
    })}</View>
    <Text style={s.note}>Latest: {last?.weight} lb on {last?.date}. Trend uses saved local weigh-ins.</Text>
  </View>;
}

function todayKeyFromDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function ManualMealModal({visible, meal, onChange, isPrivate, onPrivacyChange, onClose, onSave}:{visible:boolean; meal:Meal; onChange:(meal:Meal)=>void; isPrivate:boolean; onPrivacyChange:(value:boolean)=>void; onClose:()=>void; onSave:()=>void}) {
  const update = (patch: Partial<Meal>) => onChange({...meal, ...patch});

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBackdrop}>
        <View style={s.modalCard}>
          <View style={s.modalHeader}>
            <Text style={s.h2}>Add Meal</Text>
            <Pressable onPress={onClose} style={s.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
          </View>
          <Input label="Meal name" value={meal.name} onChange={v=>update({name:v})}/>
          <Text style={s.label}>Meal type</Text>
          <View style={s.row}>{(['Breakfast','Lunch','Dinner','Snack'] as const).map(type=><Pill key={type} active={meal.type===type} onPress={()=>update({type})}>{type}</Pill>)}</View>
          <View style={s.formGrid}>
            <View style={s.formHalf}><Input label="Calories" value={String(meal.calories || '')} onChange={v=>update({calories:num(v)})}/></View>
            <View style={s.formHalf}><Input label="Protein" value={String(meal.protein || '')} onChange={v=>update({protein:num(v)})}/></View>
            <View style={s.formHalf}><Input label="Carbs" value={String(meal.carbs || '')} onChange={v=>update({carbs:num(v)})}/></View>
            <View style={s.formHalf}><Input label="Fat" value={String(meal.fat || '')} onChange={v=>update({fat:num(v)})}/></View>
          </View>
          <Input label="Notes" value={meal.notes} onChange={v=>update({notes:v})}/>
          <Pressable onPress={()=>onPrivacyChange(!isPrivate)} style={[s.manualButton, {marginBottom:10}]}>
            <MaterialIcons name={isPrivate ? 'lock' : 'public'} size={16} color="#cbd5e1" />
            <Text style={s.manualButtonText}>{isPrivate ? 'Private meal — stays only on your account' : 'Public meal — others can discover this'}</Text>
          </Pressable>
          <Pressable onPress={onSave} style={s.saveWide}><MaterialIcons name="check" size={18} color="#052e1c" /><Text style={s.saveWideText}>Save Meal</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s=StyleSheet.create({app:{flex:1,backgroundColor:'#0b0f14'},header:{padding:16,paddingBottom:8},title:{fontSize:34,fontWeight:'800',color:'#fff'},sub:{color:'#94a3b8',marginTop:2},pill:{borderRadius:999,paddingVertical:9,paddingHorizontal:13,backgroundColor:'#111827',borderWidth:1,borderColor:'#1f2937'},pillActive:{backgroundColor:'#34d399'},pillText:{color:'#cbd5e1',fontWeight:'700'},pillTextActive:{color:'#052e1c'},card:{backgroundColor:'#111827',borderColor:'#1f2937',borderWidth:1,borderRadius:16,padding:14,marginBottom:14},h2:{fontSize:20,fontWeight:'800',color:'#f8fafc',marginBottom:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',backgroundColor:'#0b1220',borderRadius:14,padding:14},metricValue:{fontSize:26,fontWeight:'900',color:'#fff'},metricLabel:{color:'#94a3b8',marginTop:4},note:{color:'#94a3b8',lineHeight:20,marginTop:6},helpText:{color:'#64748b',fontSize:12,lineHeight:18,marginTop:-4,marginBottom:10},restHint:{color:'#34d399',fontSize:12,fontWeight:'800',marginTop:6,marginBottom:4},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},label:{color:'#cbd5e1',fontWeight:'700',marginBottom:5},input:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:12,padding:11,color:'#fff'},notesInput:{minHeight:76,textAlignVertical:'top'},meal:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:10},mealActive:{borderColor:'#34d399',backgroundColor:'#082016'},mealActions:{flexDirection:'row',gap:8,marginTop:-2,marginBottom:8},smallActionButton:{flexDirection:'row',alignItems:'center',gap:5,paddingHorizontal:10,paddingVertical:7,backgroundColor:'#0b1220',borderRadius:8,borderWidth:1,borderColor:'#243244'},smallActionText:{color:'#cbd5e1',fontWeight:'700',fontSize:12},mealTitle:{fontSize:16,fontWeight:'800',color:'#fff'},mealSub:{color:'#cbd5e1',marginTop:4},crossed:{textDecorationLine:'line-through',color:'#64748b'},exercise:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:12},setRow:{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:12},setBox:{width:112,backgroundColor:'#111827',borderWidth:1,borderColor:'#334155',borderRadius:12,padding:8,gap:6},setLabel:{color:'#94a3b8',fontSize:11,fontWeight:'900',textAlign:'center'},setInputs:{flexDirection:'row',gap:6},repBox:{flex:1,minWidth:46,backgroundColor:'#0b1220',borderWidth:1,borderColor:'#334155',borderRadius:10,padding:8,color:'#fff',textAlign:'center'},workoutActionRow:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:6,marginBottom:8},timerPanel:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:14,marginBottom:12},restHero:{backgroundColor:'#111827',borderWidth:1,borderColor:'#34d399',borderRadius:14,paddingVertical:18,paddingHorizontal:12,alignItems:'center',marginBottom:12},restHeroLabel:{color:'#34d399',fontSize:12,fontWeight:'900'},restHeroValue:{fontSize:54,fontWeight:'900',color:'#fff',marginVertical:2},addExerciseButton:{backgroundColor:'#34d399',borderRadius:12,paddingVertical:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:7,marginBottom:12},addExerciseText:{color:'#052e1c',fontWeight:'900'},aiButton:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,paddingHorizontal:14,backgroundColor:'#34d399',borderRadius:12,justifyContent:'center'},aiButtonText:{color:'#052e1c',fontWeight:'700',fontSize:14},regenButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#34d399',borderRadius:12,paddingVertical:12,paddingHorizontal:14,marginBottom:12},regenButtonText:{color:'#052e1c',fontWeight:'900',fontSize:14},manualButton:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,paddingHorizontal:14,backgroundColor:'#0b1220',borderRadius:12,borderWidth:1,borderColor:'#243244',justifyContent:'center'},manualButtonText:{color:'#cbd5e1',fontWeight:'700',fontSize:14},cardioHero:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:14,marginBottom:10},cardioValue:{fontSize:34,fontWeight:'900',color:'#fff'},cardioLabel:{color:'#cbd5e1',fontWeight:'800'},progressTrack:{height:10,backgroundColor:'#1f2937',borderRadius:999,overflow:'hidden',marginTop:12},progressFill:{height:'100%',backgroundColor:'#34d399',borderRadius:999},groceryItem:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:10,flexDirection:'row',gap:10,alignItems:'center'},groceryActions:{gap:6,alignItems:'flex-end'},storeChip:{flexDirection:'row',alignItems:'center',gap:6,alignSelf:'flex-start',marginTop:8,paddingVertical:6,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#334155',backgroundColor:'#111827'},storeChipText:{color:'#cbd5e1',fontSize:12,fontWeight:'700'},chart:{height:150,backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:10,marginTop:12,flexDirection:'row',alignItems:'flex-end',gap:5},chartBarWrap:{flex:1,alignItems:'center',justifyContent:'flex-end'},chartBar:{width:'70%',backgroundColor:'#34d399',borderRadius:5},chartLabel:{color:'#64748b',fontSize:8,marginTop:5,transform:[{rotate:'-45deg'}]},macroBar:{position:'absolute',left:14,right:14,bottom:104,minHeight:60,backgroundColor:'rgba(15,23,42,0.72)',borderWidth:1,borderColor:'rgba(52,211,153,0.35)',borderRadius:14,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:12,paddingVertical:8,zIndex:20,elevation:8},macroBarItem:{flex:1,alignItems:'center',gap:2},macroBarLabel:{color:'#94a3b8',fontSize:11,fontWeight:'900'},macroBarValue:{color:'#f8fafc',fontSize:13,fontWeight:'900'},brandFooter:{paddingHorizontal:16,paddingTop:8,paddingBottom:20,alignItems:'center'},brandFooterText:{color:'#64748b',fontSize:11,letterSpacing:0},modalBackdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.55)'},modalCard:{backgroundColor:'#111827',borderTopLeftRadius:18,borderTopRightRadius:18,borderWidth:1,borderColor:'#243244',padding:16,paddingBottom:24},modalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},iconButton:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244'},formGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},formHalf:{width:'48%'},saveWide:{marginTop:4,backgroundColor:'#34d399',borderRadius:12,paddingVertical:13,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},saveWideText:{color:'#052e1c',fontWeight:'900',fontSize:15}});
