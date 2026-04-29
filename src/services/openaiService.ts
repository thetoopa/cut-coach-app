// src/services/openaiService.ts
// OpenAI integration for meal planning and fitness advice

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MealPlanResponse {
  meals: Array<{
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    description: string;
    notes: string;
    ingredients?: string[];
    instructions?: string[];
  }>;
  summary: string;
  totalCalories: number;
  totalProtein: number;
  recommendations: string[];
}

export interface WorkoutRoutineResponse {
  summary: string;
  physiqueFocus: string;
  weeklySchedule: string[];
  progressionRules: string[];
  recoveryNotes: string[];
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
}

export interface ProfileContext {
  name: string;
  goal: 'cut' | 'bulk' | 'maintain';
  calorieGoal: number;
  proteinGoal: number;
  carbGoal?: number;
  fatGoal?: number;
  age: number;
  weight: number;
  goalWeight?: number;
  heightIn?: number;
  weeklyLossRate?: number;
  gymDaysPerWeek?: number;
  activity?: number;
  sex: 'male' | 'female';
  mealPreferences?: {
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
  workoutPreferences?: {
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
}

export interface DayContext {
  caloriesLeft?: number;
  proteinLeft?: number;
  carbsLeft?: number;
  fatLeft?: number;
  calorieGoal?: number;
  carbGoal?: number;
  fatGoal?: number;
  caloriesLogged?: number;
  proteinLogged?: number;
  carbsLogged?: number;
  fatLogged?: number;
  cardioBurned?: number;
  cardioRemaining?: number;
}

export interface MealCatalogItem {
  id?: string;
  name: string;
  type?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  notes?: string;
}

function formatDayContext(dayContext?: DayContext): string {
  if (!dayContext) return '- Today context: not provided';
  return `- Calories left today: ${Math.round(dayContext.caloriesLeft ?? 0)}
- Protein left today: ${Math.round(dayContext.proteinLeft ?? 0)}g
- Carbs left today: ${Math.round(dayContext.carbsLeft ?? 0)}g
- Fat left today: ${Math.round(dayContext.fatLeft ?? 0)}g
- Calorie goal today: ${Math.round(dayContext.calorieGoal ?? 0)}
- Carb goal today: ${Math.round(dayContext.carbGoal ?? 0)}g
- Fat goal today: ${Math.round(dayContext.fatGoal ?? 0)}g
- Calories logged today: ${Math.round(dayContext.caloriesLogged ?? 0)}
- Protein logged today: ${Math.round(dayContext.proteinLogged ?? 0)}g
- Carbs logged today: ${Math.round(dayContext.carbsLogged ?? 0)}g
- Fat logged today: ${Math.round(dayContext.fatLogged ?? 0)}g
- Cardio burned today: ${Math.round(dayContext.cardioBurned ?? 0)} calories
- Cardio burn remaining today: ${Math.round(dayContext.cardioRemaining ?? 0)} calories`;
}

function formatList(items?: string[]): string {
  return items?.length ? items.join(', ') : 'not specified';
}

function formatMealPreferences(profile: ProfileContext): string {
  const prefs = profile.mealPreferences;
  if (!prefs) return '- Meal preferences: not provided';
  return `- Cooking time per meal: ${prefs.cookingTimePerMeal || 'not specified'}
- Breakfast prep/time preference: ${prefs.breakfastTime || 'not specified'}
- Lunch prep/time preference: ${prefs.lunchTime || 'not specified'}
- Dinner prep/time preference: ${prefs.dinnerTime || 'not specified'}
- Snack preference: ${prefs.snackPreference || 'not specified'}
- Favorite proteins: ${formatList(prefs.favoriteProteins)}
- Favorite carbs: ${formatList(prefs.favoriteCarbs)}
- Favorite vegetables: ${formatList(prefs.favoriteVeggies)}
- Favorite fruits: ${formatList(prefs.favoriteFruits)}
- Allergies/restrictions/dislikes: ${prefs.allergies || 'none specified'}
- Additional meal notes: ${prefs.additionalNotes || 'none'}`;
}

function formatWorkoutPreferences(profile: ProfileContext): string {
  const prefs = profile.workoutPreferences;
  if (!prefs) return '- Workout preferences: not provided';
  return `- Uses default workouts: ${prefs.useDefaults ? 'yes' : 'no'}
- Gym/equipment setup: ${prefs.equipmentAccess || prefs.gymType || 'not specified'}
- Preferred workout style: ${prefs.workoutStyle || 'not specified'}
- Time per workout: ${prefs.timePerWorkout || 'not specified'}
- Usual workout time: ${prefs.usualWorkoutTime || 'not specified'}
- Training goals/liked exercises: ${prefs.likedExercises || 'not specified'}
- Limitations/injuries/dislikes: ${prefs.trainingLimits || 'none specified'}
- Additional workout notes: ${prefs.additionalNotes || 'none'}`;
}

function formatCurrentMealMenu(currentMeals: MealCatalogItem[] = []): string {
  if (!currentMeals.length) return '- No current meals saved yet.';
  return currentMeals.map((meal, index) => {
    const macros = [
      Number.isFinite(Number(meal.calories)) ? `${meal.calories} calories` : null,
      Number.isFinite(Number(meal.protein)) ? `${meal.protein}g protein` : null,
      Number.isFinite(Number(meal.carbs)) ? `${meal.carbs}g carbs` : null,
      Number.isFinite(Number(meal.fat)) ? `${meal.fat}g fat` : null,
    ].filter(Boolean).join(', ');
    return `${index + 1}. ${meal.name}${meal.type ? ` (${meal.type})` : ''}${macros ? ` - ${macros}` : ''}${meal.notes ? ` - Notes: ${meal.notes}` : ''}`;
  }).join('\n');
}

function formatStringList(value: any): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === 'string' ? item : JSON.stringify(item)).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

function createSystemPrompt(profile: ProfileContext, dayContext?: DayContext, currentMeals: MealCatalogItem[] = []): string {
  return `You are an expert fitness nutrition coach helping ${profile.name} create individual meal recipes and estimate food logs.

THEIR GOALS:
- Primary Goal: ${profile.goal === 'cut' ? 'CUTTING (lose fat, maintain muscle)' : profile.goal === 'bulk' ? 'BULKING (build muscle)' : 'MAINTAINING (stay at current weight)'}
- Daily Calorie Target: ${profile.calorieGoal} calories
- Daily Protein Target: ${profile.proteinGoal}g
- Daily Carb Target: ${profile.carbGoal ?? 'not specified'}g
- Daily Fat Target: ${profile.fatGoal ?? 'not specified'}g
- Current Weight: ${profile.weight} lbs
- Goal Weight: ${profile.goalWeight ?? 'not specified'} lbs
- Height: ${profile.heightIn ?? 'not specified'} inches
- Weekly Weight-Loss Target: ${profile.weeklyLossRate ?? 1} lb/week
- Planned Lifting Frequency: ${profile.gymDaysPerWeek ?? 'not specified'} days/week
- Cardio Burn Target: derived from weekly weight-loss target
- Age: ${profile.age}, Gender: ${profile.sex}

SAVED MEAL PREFERENCES:
${formatMealPreferences(profile)}

TODAY:
${formatDayContext(dayContext)}

CURRENT SAVED MEAL MENU:
${formatCurrentMealMenu(currentMeals)}

YOUR JOB IS TO:
1. Be a creative meal partner, not a full-day meal-plan generator by default.
   Help the user create individual recipes they can add to their meal menu, fit one meal or snack to target macros, or estimate something they already ate.
   Do not build a full-day plan unless the user explicitly asks for a full day.
   Do not ask for the user's goal, calories, protein, carbs, fats, current weight, goal weight, weekly loss rate, gym frequency, or saved food preferences when already provided above.

2. If the user wants meal ideas, ask short targeted questions only if needed:
   - What meal type? breakfast, lunch, dinner, snack
   - Any macro target? calories, protein, carbs, fat
   - What ingredients do they want included or avoided?
   - What cuisine/flavor?
   - How much time do they want to spend?
   If enough detail is already provided, generate several addable recipes immediately.

3. If the user asks what to eat with calories/protein/carbs/fats remaining, give smart snack or meal options that fit the remaining numbers:
   - Use the calories, protein, carbs, and fat left from TODAY when available.
   - Prioritize high-protein options for fat loss.
   - Give exact portions and estimated macros.
   - If calories are low but protein is high, suggest lean protein-only options.
   - If calories are high and protein is low, suggest fuller meals.

4. If the user tells you what they already ate today, act like a nutrition estimator:
   - Ask targeted portion questions when needed before estimating, such as cooked/raw weight, restaurant size, sauce/oil amount, drink size, or number of servings.
   - If there is enough detail, estimate calories, protein, carbs, and fat, then return a saveable meal JSON item so the app can add it to the meal menu and log/select it.
   - Name it clearly, for example "Logged Chipotle Chicken Bowl Estimate".
   - Be transparent that it is an estimate and include the assumptions in notes.

5. GIVE EXAMPLES, not open-ended questions:
   Instead of: "What proteins do you like?"
   Say: "Do you prefer chicken and turkey, or would you rather include beef? And how about fish - like it or not a fan?"
   
6. Create meals SPECIFICALLY tailored to their answers:
   - For CUTTING: Higher protein, lower fat, filling foods
   - For BULKING: Calorie-dense options, muscle-building combinations
   - For MAINTAINING: Balanced macros, sustainable foods
   - For faster weekly loss targets: keep meals simpler, higher satiety, lower added fat, and explicitly protect protein intake
   - Use exact foods and exact measurements. Never write vague paired options like "fish/salmon", "chicken/turkey", "rice or potatoes", or "veggies". Pick one exact ingredient and measure it in grams, ounces, cups, tablespoons, or units.
   - Macro accuracy matters: base macros on the exact measured ingredients and cooked/raw state you specify. Say whether weights are raw or cooked. Make calories/protein/carbs/fat internally consistent with the ingredient amounts.

7. Build meals as modular "building blocks" for their daily target:
   - Breakfast blocks should usually be 20-30% of daily calories and 25-40g protein
   - Lunch/dinner blocks should usually be 25-35% of daily calories and 35-55g protein
   - Snack blocks should usually be 8-15% of daily calories and 15-30g protein
   - Every meal must clearly help them stay near ${profile.calorieGoal} calories, ${profile.proteinGoal}g protein, ${profile.carbGoal ?? 'their'}g carbs, and ${profile.fatGoal ?? 'their'}g fat
   - Avoid vague "healthy" meals; include portions and macro estimates
   - Include a full recipe: measured ingredients, raw/cooked weight notes, cooking steps, pan/oven/air-fryer temperature, approximate cook time, target internal temperature for meat/fish, doneness cues, storage/reheat notes, and a simple swap only when it preserves the macros
   - Prefer lean proteins, high-volume carbs/produce, and controlled fats when the goal is fat loss
   - If the user's usual workout time is provided, bias more daily carbs into the meal or snack before training and make the post-workout meal high-protein and filling.
   
8. When you generate any meals or food estimates that should be saved into the app, format them exactly as this importable JSON. Do not rename "meals" or the app cannot import them:
\`\`\`json
{
  "meals": [
    {
      "name": "meal name",
      "type": "Breakfast/Lunch/Dinner/Snack",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "ingredients": ["exact measured ingredient 1 with raw/cooked state", "exact measured ingredient 2 with raw/cooked state"],
      "instructions": ["step 1 with heat setting/temp and time", "step 2 with doneness cue or internal temp"],
      "description": "one-line summary of the finished meal",
      "notes": "prep timing, storage, reheat, weighing/macro accuracy notes, and macro-safe swap notes"
    }
  ],
  "summary": "Brief summary of the meal ideas or food estimate and why it fits",
  "totalCalories": number,
  "totalProtein": number,
  "recommendations": ["tip 1", "tip 2", "tip 3"]
}
\`\`\`

9. If the user wants to edit one existing meal, return the updated meal JSON for that meal. Do not replace the full menu unless they explicitly ask for a full menu replacement.

START by offering useful paths: recipe ideas, fit a meal to macros, or estimate what they ate. Do not ask what their fitness goal is.`;
}

function createMealBatchPrompt(
  profile: ProfileContext,
  dayContext?: DayContext,
  mealCount = 6,
  currentMeals: MealCatalogItem[] = []
): string {
  const existing = formatCurrentMealMenu(currentMeals);

  return `You are an expert fitness nutrition coach helping ${profile.name} generate individual meal recipes that can be added to the app.

THEIR GOALS:
- Primary Goal: ${profile.goal === 'cut' ? 'CUTTING (lose fat, maintain muscle)' : profile.goal === 'bulk' ? 'BULKING (build muscle)' : 'MAINTAINING (stay at current weight)'}
- Daily Calorie Target: ${profile.calorieGoal} calories
- Daily Protein Target: ${profile.proteinGoal}g
- Daily Carb Target: ${profile.carbGoal ?? 'not specified'}g
- Daily Fat Target: ${profile.fatGoal ?? 'not specified'}g
- Current Weight: ${profile.weight} lbs
- Goal Weight: ${profile.goalWeight ?? 'not specified'} lbs
- Height: ${profile.heightIn ?? 'not specified'} inches
- Weekly Weight-Loss Target: ${profile.weeklyLossRate ?? 1} lb/week
- Planned Lifting Frequency: ${profile.gymDaysPerWeek ?? 'not specified'} days/week

SAVED MEAL PREFERENCES:
${formatMealPreferences(profile)}

TODAY:
${formatDayContext(dayContext)}

CURRENT MEAL MENU TO AVOID REPEATING OR EDITING FROM:
${existing}

YOUR JOB:
1. Generate exactly ${mealCount} NEW individual meal recipe options unless the user explicitly asks for fewer. Do not create a full-day plan unless explicitly asked.
2. Avoid repeating any current meal name or obvious near-duplicate variants of current meals. If the user asked to edit existing meals, preserve unchanged meals and only modify what they requested.
3. If the user asked for a large batch without specifying meal type, spread the meals across breakfast, lunch, dinner, and snack options.
4. Make the meals different enough that the app has real variety for multiple days.
5. Keep each option useful as one modular meal for the daily macro targets: ${profile.calorieGoal} calories, ${profile.proteinGoal}g protein, ${profile.carbGoal ?? 'target'}g carbs, and ${profile.fatGoal ?? 'target'}g fat.
6. Every meal must be a complete exact recipe with measured ingredients and cooking instructions. Never use vague choices like "fish/salmon", "protein of choice", "mixed vegetables", or "sauce of choice"; choose one exact ingredient and measured amount.
7. Macro accuracy matters. Specify whether each measured ingredient is raw or cooked, and ensure calories/protein/carbs/fat match those exact amounts. Include oven/pan/air-fryer temperature, cooking time, target internal temperature for meat/fish, doneness cues, meal-prep storage, and reheating instructions.
8. Use importable JSON exactly in the "meals" field so the app can add one meal or all meals.
9. If you need more detail, ask at most one clarifying question about preferences; otherwise proceed.

Return only JSON in this exact structure:
\`\`\`json
{
  "meals": [
    {
      "name": "meal name",
      "type": "Breakfast/Lunch/Dinner/Snack",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "ingredients": ["exact measured ingredient 1 with raw/cooked state", "exact measured ingredient 2 with raw/cooked state"],
      "instructions": ["step 1 with heat setting/temp and time", "step 2 with doneness cue or internal temp"],
      "description": "one-line summary of the finished meal",
      "notes": "prep timing, storage, reheat, weighing/macro accuracy notes, and macro-safe swap notes"
    }
  ],
  "summary": "Brief summary of the batch and how it fits their goals",
  "totalCalories": number,
  "totalProtein": number,
  "recommendations": ["tip 1", "tip 2", "tip 3"]
}
\`\`\`

Do not include duplicate meals from the current menu. If this is an edit request, return the full updated meal list so the app can replace/save the complete set.`;
}

function createWorkoutSystemPrompt(profile: ProfileContext, workouts: any[] = [], dayContext?: DayContext): string {
  return `You are an expert strength coach for Calos. Your default job is to coach ${profile.name} on their CURRENT routine, not to replace it.

USER CONTEXT:
- Goal: ${profile.goal}
- Daily Calorie Target: ${profile.calorieGoal} calories
- Daily Protein Target: ${profile.proteinGoal}g
- Daily Carb Target: ${profile.carbGoal ?? 'not specified'}g
- Daily Fat Target: ${profile.fatGoal ?? 'not specified'}g
- Weekly Weight-Loss Target: ${profile.weeklyLossRate ?? 1} lb/week
- Planned Lifting Frequency: ${profile.gymDaysPerWeek ?? 'not specified'} days/week
- Current Weight: ${profile.weight} lbs
- Goal Weight: ${profile.goalWeight ?? 'not specified'} lbs
- Height: ${profile.heightIn ?? 'not specified'} inches
- Activity Multiplier: ${profile.activity ?? 'not specified'}
- Age: ${profile.age}, Sex: ${profile.sex}

SAVED WORKOUT PREFERENCES:
${formatWorkoutPreferences(profile)}

TODAY:
${formatDayContext(dayContext)}

CURRENT ROUTINE JSON:
${JSON.stringify(workouts, null, 2)}

DEFAULT BEHAVIOR:
1. Talk to the user about their current plan and results. Answer whether they are on track, what to improve, and what to watch.
2. Do NOT generate a brand-new routine or change the full split unless the user explicitly asks to "change split", "switch split", "rebuild", or "replace my routine".
3. If the user asks to change split or rebuild, interview them like the intake flow first: goals, weekly lift days, fixed/irregular schedule, equipment, limitations, priorities, and exercises they want to keep. Do not output JSON until they explicitly say they are ready to build/save the replacement.
4. If the user asks to swap ONE exercise, backup, equipment option, day, or constraint, use CURRENT ROUTINE JSON as source of truth. Make the smallest useful change and preserve all unaffected workout days/exercises/sets/reps/cardio/backups as much as possible. Return the full updated routine JSON only for that saveable edit.
5. If the user asks how to do an exercise, explain setup, form cues, common mistakes, and include a YouTube search link like https://www.youtube.com/results?search_query=bench+press+proper+form. Do not output workout JSON for form help.
6. If reviewing the plan, evaluate chest, back, shoulders, quads, hamstrings/glutes, calves, biceps, triceps, core, progression, recovery, missed-workout backups, and cardio. Give concise, practical recommendations. Do not output JSON for plain review.
7. If the user asks whether results are on track, use the day context, macro targets, weight goal, weekly pace, and routine. Be honest about likely bottlenecks.
8. If calories are high or they ask how to make up calories, suggest realistic cardio/conditioning without punishment. Preserve recovery.

ONLY when generating a saveable exercise edit or explicitly approved replacement routine, include this exact JSON format inside a \`\`\`json code block. Do not rename "workouts" or the app cannot import it:
{
  "summary": "why this routine fits the user's profile, calorie intake, weight loss rate, and physique goal",
  "physiqueFocus": "specific physique emphasis, for example broad shoulders, upper chest, back width, arms, lean waist, glutes/legs",
  "weeklySchedule": ["Day 1: Push", "Day 2: Pull", "Day 3: Rest or cardio"],
  "progressionRules": ["rule 1", "rule 2"],
  "recoveryNotes": ["note 1", "note 2"],
  "workouts": [
    {
      "id": "push",
      "name": "Push / Chest Focus",
      "cardioMin": 10,
      "backup": ["backup movement 1", "backup movement 2"],
      "exercises": [
        {
          "id": "bench",
          "name": "Bench Press",
          "sets": 4,
          "minReps": 6,
          "maxReps": 8,
          "weight": 0,
          "lastReps": [0, 0, 0, 0],
          "lastWeights": [0, 0, 0, 0],
          "backup": "Dumbbell press or push-ups",
          "backupOptions": ["Dumbbell press", "Machine chest press", "Push-ups"],
          "selectedBackup": "Dumbbell press"
        }
      ]
    }
  ]
}

When editing an existing routine, preserve current weights, lastReps, lastWeights, backups, exercise order, day order, and cardio unless the changed exercise makes them invalid. Keep ids short lowercase strings. Be direct and specific. Avoid vague motivational advice.`;
}

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string,
  profile: ProfileContext,
  mode: 'nutrition' | 'workout' = 'nutrition',
  workouts: any[] = [],
  dayContext?: DayContext,
  mealCount?: number,
  currentMeals: MealCatalogItem[] = []
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Error: OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.";
  }

  try {
    const systemPrompt = mode === 'workout'
      ? createWorkoutSystemPrompt(profile, workouts, dayContext)
      : mealCount && mealCount > 1
        ? createMealBatchPrompt(profile, dayContext, mealCount, currentMeals)
        : createSystemPrompt(profile, dayContext, currentMeals);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: mode === 'workout' ? 2200 : 1600,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return `Error: ${error.error?.message || 'Failed to get response from AI'}`;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  } catch (error) {
    console.error('Chat error:', error);
    return `Error communicating with AI: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export function parseMealPlanFromResponse(response: string): MealPlanResponse | null {
  try {
    const parsedObjects = parseJsonCandidates(response);
    const meals = parsedObjects.flatMap((parsed) => {
      const mealsSource = Array.isArray(parsed)
        ? parsed
        : parsed.meals ?? parsed.mealPlan ?? parsed.meal_plan ?? parsed.mealOptions ?? parsed.meal_options ?? parsed.options ?? parsed.foods;
      if (!mealsSource || !Array.isArray(mealsSource)) return [];
      return mealsSource.map((meal: any, index: number) => {
        const calories = Number(meal.calories ?? meal.cals ?? meal.kcal ?? 0) || 0;
        const protein = Number(meal.protein ?? meal.proteinGrams ?? meal.protein_g ?? 0) || 0;
        const ingredients = formatStringList(meal.ingredients ?? meal.ingredientList);
        const instructions = formatStringList(meal.instructions ?? meal.steps ?? meal.method ?? meal.cookingInstructions);
        const recipeNotes = [
          ingredients.length ? `Ingredients: ${ingredients.join('; ')}.` : '',
          instructions.length ? `Instructions: ${instructions.map((step, stepIndex) => `${stepIndex + 1}. ${step}`).join(' ')}` : '',
          meal.notes ?? meal.prep ?? meal.storage ?? meal.timing ?? '',
        ].filter(Boolean).join('\n\n');
        return {
          name: String(meal.name ?? meal.title ?? `AI Meal ${index + 1}`),
          type: normalizeMealType(meal.type ?? meal.mealType ?? meal.category),
          calories,
          protein,
          carbs: Number(meal.carbs ?? meal.carbohydrates ?? meal.carbs_g ?? 0) || 0,
          fat: Number(meal.fat ?? meal.fats ?? meal.fat_g ?? 0) || 0,
          description: String(meal.description ?? meal.recipe ?? 'AI suggested meal.'),
          notes: recipeNotes,
          ingredients,
          instructions,
        };
      });
    });
    if (meals.length) {
      const first = parsedObjects.find(parsed => !Array.isArray(parsed)) ?? {};
      return {
        meals,
        summary: first.summary || 'Personalized meal plan created',
        totalCalories: first.totalCalories || meals.reduce((total: number, meal: any) => total + meal.calories, 0),
        totalProtein: first.totalProtein || meals.reduce((total: number, meal: any) => total + meal.protein, 0),
        recommendations: first.recommendations || [],
      };
    }
  } catch (e) {
    console.log('Could not parse meal plan JSON from response');
  }
  return null;
}

export function parseWorkoutRoutineFromResponse(response: string): WorkoutRoutineResponse | null {
  try {
    const parsedObjects = parseJsonCandidates(response);
    const workouts = parsedObjects.flatMap((parsed) => {
      const workoutSource = Array.isArray(parsed)
        ? parsed
        : parsed.workouts ?? parsed.routine ?? parsed.days ?? parsed.weeklyPlan ?? parsed.weekly_plan ?? parsed.plan;
      if (!workoutSource || !Array.isArray(workoutSource)) return [];
      return workoutSource.map((workout: any, workoutIndex: number) => {
      const exercises = Array.isArray(workout.exercises) ? workout.exercises : Array.isArray(workout.movements) ? workout.movements : [];
      return {
        id: String(workout.id || `ai-day-${workoutIndex + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        name: String(workout.name || workout.day || workout.title || `Workout ${workoutIndex + 1}`),
        cardioMin: Number.isFinite(Number(workout.cardioMin)) ? Number(workout.cardioMin) : 0,
        backup: Array.isArray(workout.backup) ? workout.backup.map(String) : [],
        exercises: exercises.map((exercise: any, exerciseIndex: number) => {
          const sets = Math.max(1, Number.isFinite(Number(exercise.sets)) ? Number(exercise.sets) : 3);
          const lastReps = Array.isArray(exercise.lastReps) && exercise.lastReps.length === sets
            ? exercise.lastReps.map((rep: any) => Number(rep) || 0)
            : Array.from({ length: sets }).map(() => 0);

          return {
            id: String(exercise.id || `exercise-${exerciseIndex + 1}`).toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            name: String(exercise.name || `Exercise ${exerciseIndex + 1}`),
            sets,
            minReps: Number.isFinite(Number(exercise.minReps)) ? Number(exercise.minReps) : 8,
            maxReps: Number.isFinite(Number(exercise.maxReps)) ? Number(exercise.maxReps) : 12,
            weight: Number.isFinite(Number(exercise.weight)) ? Number(exercise.weight) : 0,
            lastReps,
            lastWeights: Array.isArray(exercise.lastWeights) ? exercise.lastWeights.map((weight: any) => Number(weight) || 0) : Array.from({ length: sets }).map(() => Number(exercise.weight) || 0),
            backup: String(exercise.selectedBackup || exercise.backup || 'Use the closest available machine, cable, dumbbell, or bodyweight alternative.'),
            backupOptions: Array.isArray(exercise.backupOptions) ? exercise.backupOptions.map(String) : [String(exercise.backup || 'Dumbbell equivalent'), 'Machine equivalent', 'Bodyweight equivalent'],
            selectedBackup: String(exercise.selectedBackup || exercise.backup || 'Dumbbell equivalent'),
          };
        }),
      };
      });
    }).filter((workout: any) => workout.exercises.length > 0);

    if (workouts.length === 0) return null;
    const first = parsedObjects.find(parsed => !Array.isArray(parsed)) ?? {};

    return {
      summary: String(first.summary || 'Personalized workout routine created.'),
      physiqueFocus: String(first.physiqueFocus || 'Balanced muscle retention and physique development.'),
      weeklySchedule: Array.isArray(first.weeklySchedule) ? first.weeklySchedule.map(String) : [],
      progressionRules: Array.isArray(first.progressionRules) ? first.progressionRules.map(String) : [],
      recoveryNotes: Array.isArray(first.recoveryNotes) ? first.recoveryNotes.map(String) : [],
      workouts,
    };
  } catch (e) {
    console.log('Could not parse workout routine JSON from response');
  }
  return null;
}

function parseJsonCandidates(response: string): any[] {
  const blocks = [...response.matchAll(/```(?:json)?\n?([\s\S]*?)\n?```/g)].map(match => match[1]);
  const parsed: any[] = [];

  for (const candidate of [response, ...blocks]) {
    try {
      parsed.push(JSON.parse(candidate.trim()));
    } catch {}
  }

  const starts = [...response].map((char, index) => (char === '{' || char === '[' ? index : -1)).filter(index => index >= 0);
  for (const start of starts) {
    for (let end = response.length; end > start; end--) {
      const slice = response.slice(start, end).trim();
      if (!slice.endsWith('}') && !slice.endsWith(']')) continue;
      try {
        parsed.push(JSON.parse(slice));
        break;
      } catch {}
    }
  }

  return parsed;
}

function normalizeMealType(value: any): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('breakfast')) return 'Breakfast';
  if (normalized.includes('dinner')) return 'Dinner';
  if (normalized.includes('snack')) return 'Snack';
  return 'Lunch';
}
