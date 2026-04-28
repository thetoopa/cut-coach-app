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
  return `You are an expert fitness nutrition coach helping ${profile.name} create a personalized meal plan.

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
1. Do not ask for the user's goal, calories, protein, carbs, fats, current weight, goal weight, weekly loss rate, gym frequency, or saved food preferences when already provided above. The app already provided those. Only ask for missing food preferences when needed.
   Make it clear that any meal JSON you generate can be imported into the app as available meal options for daily use, and the user can add one meal at a time or add all meals.
   If the user asks to change, replace, remove, or fix one existing meal, use CURRENT SAVED MEAL MENU as the source of truth and preserve everything else unless the user asks for broader changes.

2. If the user asks what to eat with calories/protein/carbs/fats remaining, give smart snack or meal options that fit the remaining numbers:
   - Use the calories, protein, carbs, and fat left from TODAY when available.
   - Prioritize high-protein options for fat loss.
   - Give exact portions and estimated macros.
   - If calories are low but protein is high, suggest lean protein-only options.
   - If calories are high and protein is low, suggest fuller meals.

3. Ask SPECIFIC questions about food preferences in this order only when building a broader meal plan:
   - PROTEINS first: Give examples like "chicken, turkey, beef, fish, Greek yogurt, cottage cheese, etc." and ask which they like/hate
   - CARBS: Examples: "rice, pasta, oats, bread, potatoes, fruits, etc."
   - FATS: Examples: "olive oil, nuts, nut butters, avocado, etc."
   - FLAVOR PROFILES: Sweet, savory, spicy, bland? Prefer sauces or plain?
   - SNACKS: What do they snack on? Healthy or indulgent preferences?
   - PREPARATION TIME: How much time to spend cooking? (quick meals vs. meal prep?)
   - ALLERGIES/RESTRICTIONS: Any dietary restrictions, intolerances, or foods they absolutely won't eat?

4. GIVE EXAMPLES, not open-ended questions:
   Instead of: "What proteins do you like?"
   Say: "Do you prefer chicken and turkey, or would you rather include beef? And how about fish - like it or not a fan?"
   
5. Create meals SPECIFICALLY tailored to their answers:
   - For CUTTING: Higher protein, lower fat, filling foods
   - For BULKING: Calorie-dense options, muscle-building combinations
   - For MAINTAINING: Balanced macros, sustainable foods
   - For faster weekly loss targets: keep meals simpler, higher satiety, lower added fat, and explicitly protect protein intake
   - Use exact foods and exact measurements. Never write vague paired options like "fish/salmon", "chicken/turkey", "rice or potatoes", or "veggies". Pick one exact ingredient and measure it in grams, ounces, cups, tablespoons, or units.
   - Macro accuracy matters: base macros on the exact measured ingredients and cooked/raw state you specify. Say whether weights are raw or cooked. Make calories/protein/carbs/fat internally consistent with the ingredient amounts.

6. Build the meals as modular "building blocks" for their daily target:
   - Breakfast blocks should usually be 20-30% of daily calories and 25-40g protein
   - Lunch/dinner blocks should usually be 25-35% of daily calories and 35-55g protein
   - Snack blocks should usually be 8-15% of daily calories and 15-30g protein
   - Every meal must clearly help them stay near ${profile.calorieGoal} calories, ${profile.proteinGoal}g protein, ${profile.carbGoal ?? 'their'}g carbs, and ${profile.fatGoal ?? 'their'}g fat
   - Avoid vague "healthy" meals; include portions and macro estimates
   - Include a full recipe: measured ingredients, raw/cooked weight notes, cooking steps, pan/oven/air-fryer temperature, approximate cook time, target internal temperature for meat/fish, doneness cues, storage/reheat notes, and a simple swap only when it preserves the macros
   - Prefer lean proteins, high-volume carbs/produce, and controlled fats when the goal is fat loss
   - If the user's usual workout time is provided, bias more daily carbs into the meal or snack before training and make the post-workout meal high-protein and filling.
   
7. Build a complete meal plan (5-6 meals) that:
   - Hits their calorie target (${profile.calorieGoal} ± 50)
   - Hits their protein target (${profile.proteinGoal}g ± 5)
   - Stays near their carb target (${profile.carbGoal ?? 'not specified'}g) and fat target (${profile.fatGoal ?? 'not specified'}g) when those targets are provided
   - Uses ONLY foods they said they like
   - Avoids foods they dislike/can't eat
   - Matches their prep time preference
   - Includes flavor profiles they prefer

8. When you generate any meals that should be saved into the app, format them exactly as this importable JSON. Do not rename "meals" or the app cannot import them:
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
  "summary": "Brief summary of the meal plan and why it fits their goals",
  "totalCalories": number,
  "totalProtein": number,
  "recommendations": ["tip 1", "tip 2", "tip 3"]
}
\`\`\`

9. If the user wants to edit the current meal menu, return the full replacement meal list in the same JSON format with the requested change applied and all unchanged meals preserved. Keep existing meal names/macros/notes unchanged unless they conflict with the user's request.

START by greeting ${profile.name} and summarizing the targets you already know, including calories, protein, carbs, and fat when provided. Offer two paths: quick foods for today's remaining macros, or a full meal plan based on food preferences. Do not ask what their fitness goal is.`;
}

function createMealBatchPrompt(
  profile: ProfileContext,
  dayContext?: DayContext,
  mealCount = 6,
  currentMeals: MealCatalogItem[] = []
): string {
  const existing = formatCurrentMealMenu(currentMeals);

  return `You are an expert fitness nutrition coach helping ${profile.name} generate new meal options that can be added to the app.

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
1. Generate exactly ${mealCount} NEW meal options unless the user explicitly asks for fewer.
2. Avoid repeating any current meal name or obvious near-duplicate variants of current meals. If the user asked to edit existing meals, preserve unchanged meals and only modify what they requested.
3. If the user asked for a large batch, spread the meals across breakfast, lunch, dinner, and snack options.
4. Make the meals different enough that the app has real variety for multiple days.
5. Keep each option useful for the daily macro targets: ${profile.calorieGoal} calories, ${profile.proteinGoal}g protein, ${profile.carbGoal ?? 'target'}g carbs, and ${profile.fatGoal ?? 'target'}g fat.
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
  return `You are an expert strength coach reviewing and building workout routines for ${profile.name}.

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

YOUR JOB:
1. Review whether the routine covers chest, back, shoulders, quads, hamstrings/glutes, calves, biceps, triceps, and core.
2. Identify lazy or low-quality programming: too few hard sets, missing compounds, no progression, too much overlap, poor recovery, or ignored legs/back.
3. Recommend ideal exercises, sets, rep ranges, and rest times for the user's planned days per week.
4. Keep advice practical for fat loss: preserve muscle, keep progressive overload, avoid junk volume, and manage recovery.
5. Before replacing the user's full workout plan, ask targeted questions until you are confident. Do not re-ask for workout length, equipment, limitations, style, or liked exercises if they are already present in SAVED WORKOUT PREFERENCES. If the user explicitly says to build now, you may create a draft and say they can ask to swap exercises before saving.
6. Personalize the routine to their calorie/protein/carb/fat targets, weekly loss rate, gym days, current body weight, goal weight, height, recovery capacity, equipment access, exercise likes/dislikes, injuries, and ideal physique focus.
7. Avoid lazy workouts. Every day should have enough high-quality hard sets, clear compounds, useful accessories, and a reason it exists.
8. If the user ate too many calories or asks how to make up calories, suggest realistic add-on cardio or conditioning based on the extra calories, their current cardio burn, recovery, and whether they already lifted. Do not suggest excessive punishment workouts. Preserve muscle and recovery.
9. If the user asks to change one exercise, backup, equipment option, day, or constraint in the current routine, use CURRENT ROUTINE JSON as the source of truth. Make the smallest useful change, preserve all unaffected workout days/exercises/sets/reps/cardio/backups exactly as much as possible, and return the full updated routine JSON so the app can replace the current routine without losing anything.

When you generate a savable routine, include this exact JSON format inside a \`\`\`json code block. Do not rename "workouts" or the app cannot import it:
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
          "backup": "Dumbbell press or push-ups"
        }
      ]
    }
  ]
}

Use 0 for starting weights unless the user gives known working weights or the current routine already has weights. When editing an existing routine, preserve current weights and lastReps unless the changed exercise makes them invalid. Keep ids short lowercase strings. Keep lastReps length equal to sets. Make clear the user can reject exercises after the draft and ask for substitutions before tapping Save as My Routine. Be direct and specific. Avoid vague motivational advice.`;
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
    const parsed = parseFirstJsonObject(response);
    const mealsSource = Array.isArray(parsed)
      ? parsed
      : parsed.meals ?? parsed.mealPlan ?? parsed.meal_plan ?? parsed.mealOptions ?? parsed.meal_options ?? parsed.options ?? parsed.foods;

    if (mealsSource && Array.isArray(mealsSource)) {
      const meals = mealsSource.map((meal: any, index: number) => {
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
      return {
        meals,
        summary: parsed.summary || 'Personalized meal plan created',
        totalCalories: parsed.totalCalories || meals.reduce((total: number, meal: any) => total + meal.calories, 0),
        totalProtein: parsed.totalProtein || meals.reduce((total: number, meal: any) => total + meal.protein, 0),
        recommendations: parsed.recommendations || [],
      };
    }
  } catch (e) {
    console.log('Could not parse meal plan JSON from response');
  }
  return null;
}

export function parseWorkoutRoutineFromResponse(response: string): WorkoutRoutineResponse | null {
  try {
    const parsed = parseFirstJsonObject(response);
    const workoutSource = parsed.workouts ?? parsed.routine ?? parsed.days ?? parsed.weeklyPlan ?? parsed.weekly_plan ?? parsed.plan;
    if (!workoutSource || !Array.isArray(workoutSource)) return null;

    const workouts = workoutSource.map((workout: any, workoutIndex: number) => {
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
            backup: String(exercise.backup || 'Use the closest available machine, cable, dumbbell, or bodyweight alternative.'),
          };
        }),
      };
    }).filter((workout: any) => workout.exercises.length > 0);

    if (workouts.length === 0) return null;

    return {
      summary: String(parsed.summary || 'Personalized workout routine created.'),
      physiqueFocus: String(parsed.physiqueFocus || 'Balanced muscle retention and physique development.'),
      weeklySchedule: Array.isArray(parsed.weeklySchedule) ? parsed.weeklySchedule.map(String) : [],
      progressionRules: Array.isArray(parsed.progressionRules) ? parsed.progressionRules.map(String) : [],
      recoveryNotes: Array.isArray(parsed.recoveryNotes) ? parsed.recoveryNotes.map(String) : [],
      workouts,
    };
  } catch (e) {
    console.log('Could not parse workout routine JSON from response');
  }
  return null;
}

function parseFirstJsonObject(response: string): any {
  const blocks = [...response.matchAll(/```(?:json)?\n?([\s\S]*?)\n?```/g)].map(match => match[1]);
  const candidates = blocks.length > 0 ? blocks : [response];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate.trim());
    } catch {}
  }

  const firstObject = response.indexOf('{');
  const lastObject = response.lastIndexOf('}');
  if (firstObject >= 0 && lastObject > firstObject) {
    return JSON.parse(response.slice(firstObject, lastObject + 1));
  }

  const firstArray = response.indexOf('[');
  const lastArray = response.lastIndexOf(']');
  if (firstArray >= 0 && lastArray > firstArray) {
    return JSON.parse(response.slice(firstArray, lastArray + 1));
  }

  throw new Error('No JSON found');
}

function normalizeMealType(value: any): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' {
  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('breakfast')) return 'Breakfast';
  if (normalized.includes('dinner')) return 'Dinner';
  if (normalized.includes('snack')) return 'Snack';
  return 'Lunch';
}
