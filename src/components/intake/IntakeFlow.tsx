import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Vibration } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { calculateNutritionTargets } from '../../utils/calculations';
import { ActivityLevel, CalorieStrategy, activityLevelLabels, activityMultipliers, calculateDeficitTargets, calculateMaintenanceBreakdown, calculateRecompTargets, calculateSurplusTargets } from '../../utils/calorieCalculations';
import { CuratedMeal, curatedMeals } from '../../data/curatedMeals';
import { CuratedMealLibrary } from '../meals/CuratedMealLibrary';
import { IntakeActivityPreset, IntakeGeneratedPlan, IntakeWorkoutDay, PlanReview } from './PlanReview';

type IntakeFlowProps = {
  onComplete: (profile: any) => void;
};

type Sex = 'male' | 'female';
type Goal = 'lose fat' | 'look more defined' | 'build muscle' | 'improve strength' | 'improve cardio' | 'athletic build' | 'bigger shoulders' | 'bigger arms' | 'bigger legs/glutes' | 'tighter waist' | 'visible abs' | 'better jawline/face definition' | 'sport performance' | 'general health';
type LiftingMode = 'weekly' | 'irregular';
type SplitOption = {
  id: string;
  name: string;
  why: string;
  weeklyLayout: string[];
  emphasis: string;
  recovery: string;
  recommended?: boolean;
};
type ParsedWorkoutTemplate = {
  splitName: string;
  days: IntakeWorkoutDay[];
  muscleGroups: string[];
  frequency: number;
  confidence: 'high' | 'medium' | 'low';
  clarification?: string;
};
type MealSet = {
  id: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: MealPortfolioMeal[];
};
type MealPortfolioMeal = {
  id: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  ingredients: string[];
  instructions: string[];
};
type IntakeState = {
  name: string;
  sex: Sex;
  age: string;
  heightFt: string;
  heightInPart: string;
  weight: string;
  goalWeight: string;
  goalDirection: 'cut' | 'gain' | 'recomp';
  activityLevel: ActivityLevel;
  calorieStrategy: CalorieStrategy;
  stepEstimate: string;
  goals: Goal[];
  customGoals: string;
  goalNarrative: string;
  liftingMode: LiftingMode;
  preferredLiftDays: string[];
  liftDaysPerWeek: string;
  liftTime: string;
  sessionMinutes: string;
  importedWorkoutRaw: string;
  parsedWorkoutTemplate?: ParsedWorkoutTemplate;
  walkMode: LiftingMode;
  preferredWalkDays: string[];
  cardioLocationPreference: number;
  mealTimeFilter: 'all' | 'quick' | 'moderate' | 'prep';
  breakfastStyle: string;
  proteins: string[];
  carbs: string[];
  flavors: string[];
  snacks: string[];
  allergies: string;
  foodNotes: string;
  selectedSplitId: string;
  splitFeedback: string;
  selectedMealOptionIds: string[];
};

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const goalGroups: { title: string; options: Goal[] }[] = [
  { title: 'Fat Loss / Aesthetic', options: ['lose fat', 'look more defined', 'tighter waist', 'visible abs', 'better jawline/face definition'] },
  { title: 'Muscle / Size', options: ['build muscle', 'bigger shoulders', 'bigger arms', 'bigger legs/glutes'] },
  { title: 'Performance', options: ['improve strength', 'improve cardio', 'athletic build', 'sport performance'] },
  { title: 'General', options: ['general health'] },
];

const initialState: IntakeState = {
  name: '',
  sex: 'male',
  age: '',
  heightFt: '',
  heightInPart: '',
  weight: '',
  goalWeight: '',
  goalDirection: 'cut',
  activityLevel: 'moderate',
  calorieStrategy: 'cut_moderate',
  stepEstimate: '',
  goals: [],
  customGoals: '',
  goalNarrative: '',
  liftingMode: 'weekly',
  preferredLiftDays: [],
  liftDaysPerWeek: '',
  liftTime: '',
  sessionMinutes: '60',
  importedWorkoutRaw: '',
  walkMode: 'weekly',
  preferredWalkDays: [],
  cardioLocationPreference: 50,
  mealTimeFilter: 'all',
  breakfastStyle: 'shake + banana',
  proteins: ['chicken', 'lean beef', 'eggs', 'Greek yogurt'],
  carbs: ['rice', 'potatoes', 'oats', 'fruit'],
  flavors: ['Mexican', 'Mediterranean', 'comfort food'],
  snacks: ['protein bar', 'Greek yogurt', 'fruit'],
  allergies: '',
  foodNotes: '',
  selectedSplitId: '',
  splitFeedback: '',
  selectedMealOptionIds: [],
};

const phases = [
  'Profile',
  'Goals',
  'Calories',
  'Lifting',
  'Cardio',
  'Diagnosis',
  'Split',
  'Meals',
  'Save',
];

export function IntakeFlow({ onComplete }: IntakeFlowProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [phase, setPhase] = useState(0);
  const [state, setState] = useState<IntakeState>(initialState);
  const [plan, setPlan] = useState<IntakeGeneratedPlan | null>(null);
  const [answered, setAnswered] = useState<Record<number, boolean>>({ 0: true, 1: true });

  const parsedWorkout = useMemo(() => parseWorkout(state.importedWorkoutRaw, state), [state.importedWorkoutRaw, state.weight, state.sessionMinutes]);
  const splitOptions = useMemo(() => generateSplitOptions({ ...state, parsedWorkoutTemplate: parsedWorkout }), [state, parsedWorkout]);
  const activeSplit = splitOptions.find(option => option.id === state.selectedSplitId) ?? splitOptions.find(option => option.recommended) ?? splitOptions[0];

  const update = (patch: Partial<IntakeState>, shouldMark = true) => {
    setState(current => ({ ...current, ...patch }));
    if (shouldMark) setAnswered(current => ({ ...current, [phase]: true }));
  };
  const next = () => {
    setPhase(current => Math.min(phases.length - 1, current + 1));
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };
  const back = () => {
    setPhase(current => Math.max(0, current - 1));
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ y: 0, animated: false }));
  };
  const canContinue = answered[phase] || phase <= 2 || phase >= 5;

  const generate = () => {
    const current = { ...state, parsedWorkoutTemplate: parsedWorkout, selectedSplitId: state.selectedSplitId || activeSplit.id };
    setPlan(buildSystem(current, splitOptions, activeSplit));
  };
  const lockIn = (finalPlan: IntakeGeneratedPlan) => onComplete(profileFromPlan(state, finalPlan, parsedWorkout));

  if (plan) {
    return <PlanReview plan={plan} onBack={() => setPlan(null)} onLockIn={lockIn} />;
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        style={s.scroller}
        contentContainerStyle={[s.content, { paddingTop: Math.max(18, insets.top + 8), paddingBottom: 30 }]}
      >
        <View style={s.top}>
          <Text style={s.kicker}>Calos intake</Text>
          <Text style={s.title}>Build your fitness system</Text>
          <View style={s.progressTrack}><View style={[s.progressFill, { width: `${((phase + 1) / phases.length) * 100}%` as any }]} /></View>
          <Text style={s.stepText}>{phase + 1}/{phases.length} · {phases[phase]}</Text>
        </View>

        <PhaseView
          phase={phase}
          state={{ ...state, parsedWorkoutTemplate: parsedWorkout }}
          splitOptions={splitOptions}
          activeSplit={activeSplit}
            update={update}
            markAnswered={() => setAnswered(current => ({ ...current, [phase]: true }))}
            generate={generate}
            onRequestScrollTop={() => scrollRef.current?.scrollTo({ y: 0, animated: false })}
          />
      </ScrollView>
      <View style={[s.nav, { paddingBottom: Math.max(10, insets.bottom + 4) }]}>
        {phase > 0 ? <Pressable onPress={back} style={s.secondary}><Text style={s.secondaryText}>Back</Text></Pressable> : <View style={{ flex: 1 }} />}
        {phase < phases.length - 1
          ? <Pressable onPress={next} disabled={!canContinue} style={[s.primary, !canContinue && s.disabled]}><Text style={s.primaryText}>Continue</Text></Pressable>
          : <Pressable onPress={generate} style={s.primary}><Text style={s.primaryText}>Review System</Text></Pressable>}
      </View>
    </SafeAreaView>
  );
}

function PhaseView({
  phase,
  state,
  splitOptions,
  activeSplit,
  update,
  markAnswered,
  generate,
  onRequestScrollTop,
}: {
  phase: number;
  state: IntakeState;
  splitOptions: SplitOption[];
  activeSplit: SplitOption;
  update: (patch: Partial<IntakeState>, shouldMark?: boolean) => void;
  markAnswered: () => void;
  generate: () => void;
  onRequestScrollTop: () => void;
}) {
  if (phase === 0) {
    const maintenance = estimatedMaintenanceFromState(state);
    return (
      <CoachCard prompt="First I need your baseline and daily activity. This lets Calos estimate maintenance before recommending calories." summary={maintenance ? `Estimated maintenance: ${maintenance.toLocaleString()} calories/day.` : 'Maintenance will update once age, height, weight, sex, and activity are entered.'}>
        <Input label="Name" value={state.name} onChange={name => update({ name })} />
        <ResponseChips value={state.sex} options={[['male', 'Male'], ['female', 'Female']]} onSelect={sex => update({ sex: sex as Sex })} />
        <Row>
          <Input label="Age" value={state.age} onChange={age => update({ age })} numeric />
          <Input label="Weight" value={state.weight} onChange={weight => update({ weight })} numeric />
        </Row>
        <Row>
          <Input label="Height ft" value={state.heightFt} onChange={heightFt => update({ heightFt })} numeric />
          <Input label="Height in" value={state.heightInPart} onChange={heightInPart => update({ heightInPart })} numeric />
        </Row>
        <Text style={s.label}>Activity level</Text>
        <Text style={s.warning}>Choose based on your average day outside the gym, not your workouts.</Text>
        <ActivityLevelPicker value={state.activityLevel} onChange={activityLevel => update({ activityLevel })} />
        <Input label="Average daily steps optional" value={state.stepEstimate} onChange={stepEstimate => update({ stepEstimate })} numeric />
        {maintenance ? <MaintenancePreview state={state} /> : <Text style={s.note}>This is an estimate, not perfect science. Calos will adjust later from weigh-ins and performance.</Text>}
      </CoachCard>
    );
  }

  if (phase === 1) {
    return (
      <CoachCard prompt="What are we optimizing for? Select everything that matters — Calos will prioritize it intelligently." summary={goalSummary(state.goals, state.customGoals)}>
        <GroupedGoalOptions selected={state.goals} onChange={goals => update({ goals })} />
        {state.goals.length > 0 && <Text style={s.goalSummary}>{goalSummary(state.goals, state.customGoals)}</Text>}
        <FreeText label="Add specifics (optional)" value={state.customGoals} onChange={customGoals => update({ customGoals })} placeholder="e.g. Lean out my waist, build broader shoulders, stay athletic — not bulky" />
      </CoachCard>
    );
  }

  if (phase === 2) {
    const recommendation = recommendedGoalDirection(state);
    return (
      <CoachCard prompt="Now choose the calorie strategy. Calos estimates maintenance first, then shows what each target likely means for weekly weight change." summary={calorieStrategySummary(state)}>
        <Text style={s.label}>System goal</Text>
        <ResponseChips value={state.goalDirection} options={[['cut', 'Cut weight'], ['gain', 'Gain weight'], ['recomp', 'Recomp / maintain']]} onSelect={goalDirection => {
          const nextDirection = goalDirection as IntakeState['goalDirection'];
          update({ goalDirection: nextDirection, calorieStrategy: defaultStrategyForDirection(nextDirection) });
        }} />
        <Text style={s.note}>Recommended from your goals: {recommendation === 'gain' ? 'gain / build' : recommendation === 'cut' ? 'cut' : 'recomp'}.</Text>
        <Input label="Goal weight optional" value={state.goalWeight} onChange={goalWeight => update({ goalWeight })} numeric />
        <CalorieTargetPicker state={state} onSelect={calorieStrategy => update({ calorieStrategy })} />
        <Text style={s.note}>{goalConsistencyNote(state)}</Text>
      </CoachCard>
    );
  }

  if (phase === 3) {
    return (
      <CoachCard prompt="Now the lifting schedule. Give me the repeatable version of your week, not the heroic version." summary={state.liftingMode === 'irregular' ? `${state.liftDaysPerWeek} lift days/week, schedule changes week to week.` : `${state.liftDaysPerWeek} lift days/week on ${state.preferredLiftDays.join(', ')}.`}>
        <ModeSwitch mode={state.liftingMode} onChange={liftingMode => update({
          liftingMode,
          liftDaysPerWeek: liftingMode === 'weekly' && state.preferredLiftDays.length ? String(state.preferredLiftDays.length) : state.liftDaysPerWeek,
        })} />
        {state.liftingMode === 'weekly' && <WeekdayPicker selected={state.preferredLiftDays} onChange={preferredLiftDays => update({ preferredLiftDays, liftDaysPerWeek: String(preferredLiftDays.length) })} />}
        <Input label="Lift days per week" value={state.liftDaysPerWeek} onChange={liftDaysPerWeek => update({ liftDaysPerWeek })} numeric />
        <Text style={s.note}>Calos will size the program around what the optimal plan requires, then keep volume realistic for your selected weekly frequency.</Text>
        <Text style={s.label}>Usual lifting time</Text>
        <ResponseChips value={state.liftTime} options={[['Early morning', 'Early AM'], ['Morning', 'Morning'], ['Lunch', 'Lunch'], ['Afternoon', 'Afternoon'], ['Evening', 'Evening'], ['Late night', 'Late night'], ['Varies', 'Varies']]} onSelect={liftTime => update({ liftTime })} />
        <Text style={s.note}>I’ll bias more carbs into the meal or snack before this window, then make the post-workout meal high-protein and filling.</Text>
        <Text style={s.note}>{scheduleAdvice(state)}</Text>
        <FreeText label="Paste your current workout optional" value={state.importedWorkoutRaw} onChange={text => update({ importedWorkoutRaw: text, parsedWorkoutTemplate: parseWorkout(text, state) })} placeholder={'Push:\nBench 3x10\nIncline DB Press 3x10\n\nPull:\nLat Pulldown 4x10'} />
        {state.parsedWorkoutTemplate && <ParsedWorkoutSummary parsed={state.parsedWorkoutTemplate} />}
      </CoachCard>
    );
  }

  if (phase === 4) {
    const outdoorShare = 100 - state.cardioLocationPreference;
    const gymShare = state.cardioLocationPreference;
    return (
      <CoachCard prompt="When can you walk outside on days you are not at the gym? Pick the days that are realistically available. Calos will assign that portion outdoors and put the remaining cardio after lifting." summary={`${state.walkMode === 'irregular' ? 'Outdoor walks are flexible' : `Outdoor walk days: ${state.preferredWalkDays.join(', ') || 'none selected'}`}. Outdoor ${outdoorShare}% / gym ${gymShare}%.`}>
        <ModeSwitch mode={state.walkMode} onChange={walkMode => update({ walkMode })} weeklyLabel="My outdoor walk days are predictable" irregularLabel="Outdoor walking changes week to week" />
        {state.walkMode === 'weekly' && <WeekdayPicker selected={state.preferredWalkDays} onChange={preferredWalkDays => update({ preferredWalkDays })} />}
        <Text style={s.label}>How much cardio should happen at the gym?</Text>
        <CardioLocationSlider value={state.cardioLocationPreference} onChange={cardioLocationPreference => update({ cardioLocationPreference })} />
        <Text style={s.note}>Example: if outdoor walks cover {outdoorShare}% of cardio, the other {gymShare}% gets assigned to 15% incline treadmill after lifting.</Text>
      </CoachCard>
    );
  }

  if (phase === 5) {
    const summary = diagnosisSummary(state);
    return (
      <CoachCard prompt={summary} summary={state.goalNarrative || 'No extra body goal added.'}>
        <CoachPrompt text="Anything about your body goal that was not listed? Optional." />
        <FreeText label="Optional body goal note" value={state.goalNarrative} onChange={goalNarrative => update({ goalNarrative })} placeholder="Example: I want a tighter waist without losing shoulder size." />
      </CoachCard>
    );
  }

  if (phase === 6) {
    return (
      <CoachCard prompt="Based on what you told me, I ranked a lot of possible splits. The recommended one is based on your goals, schedule, recovery, and any imported workout." summary={`${activeSplit.name}: ${activeSplit.emphasis}`}>
        {splitOptions.map(option => <SplitCard key={option.id} option={option} active={(state.selectedSplitId || activeSplit.id) === option.id} onPress={() => update({ selectedSplitId: option.id })} />)}
        <FreeText label="Optional split feedback" value={state.splitFeedback} onChange={splitFeedback => update({ splitFeedback })} placeholder="Example: I like upper/lower but want shoulders hit more often." />
      </CoachCard>
    );
  }

  if (phase === 7) {
    const selectedMeals = curatedMeals.filter(meal => state.selectedMealOptionIds.includes(meal.id));
    const validation = mealSelectionSummary(selectedMeals);
    return (
      <CoachCard prompt="Now build your meal menu. Pick meals you would actually eat. Calos will use these for daily suggestions and logging, and you can add more later with AI or manually. Don't worry, recipes, ingredients, portions, instructions, and macros will all be attached after intake. The built-in Calos AI Chef can also curate more meals later." summary={validation}>
        <CuratedMealLibrary
          selectionMode
          compact
          selectedIds={state.selectedMealOptionIds}
          onToggleMeal={(meal) => update({ selectedMealOptionIds: toggleValue(state.selectedMealOptionIds, meal.id) })}
          onRequestScrollTop={onRequestScrollTop}
        />
      </CoachCard>
    );
  }

  return (
    <CoachCard prompt="I have enough to generate the first Calos system. You’ll review it before saving, and you can swap pieces before locking it in." summary="Generator builds options, local validator checks fit and balance, optimizer trims junk volume and aligns meals/cardio with your week.">
      <View style={s.finalGrid}>
        <MiniCheck text="Workout program" />
        <MiniCheck text="Nutrition targets" />
        <MiniCheck text="Cardio plan" />
        <MiniCheck text="Activity presets" />
        <MiniCheck text="Meal portfolio" />
        <MiniCheck text="Progression rules" />
      </View>
    </CoachCard>
  );
}

function buildSystem(state: IntakeState, splitOptions: SplitOption[], activeSplit: SplitOption): IntakeGeneratedPlan {
  const goal = primaryGoal(state);
  const weight = toNum(state.weight, 170);
  const caloriePlan = caloriePlanFromState(state);
  const baseTargets = calculateNutritionTargets({
    goal,
    sex: state.sex,
    age: toNum(state.age, 24),
    heightIn: heightIn(state),
    weight,
    goalWeight: state.goalWeight ? toNum(state.goalWeight, weight) : undefined,
    activity: activityMultipliers[state.activityLevel],
    weeklyLossRate: Math.max(0.25, Math.min(2.5, Math.abs(caloriePlan.estimatedWeeklyWeightChange))),
  });
  const targets = nutritionTargetsFromCalories(baseTargets, caloriePlan.targetCalories, goal, state.sex);
  const workouts = generateWorkouts(state, activeSplit);
  const mealPortfolio = generateMealPortfolio(state, targets);
  const activityPresets: IntakeActivityPreset[] = [];
  const cardio = buildCardioPlan(state);
  return {
    splitType: activeSplit.name,
    validationSummary: validatePlan(state, workouts, targets),
    optimizationSummary: optimizePlan(state),
    weeklySchedule: buildSchedule(state, workouts, activityPresets),
    workouts,
    nutrition: {
      calorieGoal: targets.calorieGoal,
      proteinGoal: targets.proteinGoal,
      carbGoal: targets.carbGoal,
      fatGoal: targets.fatGoal,
      bmr: caloriePlan.bmr,
      baseTDEE: caloriePlan.baseTDEE,
      exerciseCaloriesPerDay: caloriePlan.exerciseCaloriesPerDay,
      maintenanceLow: caloriePlan.maintenanceLow,
      maintenanceCalories: caloriePlan.maintenanceCalories,
      maintenanceHigh: caloriePlan.maintenanceHigh,
      targetCalories: caloriePlan.targetCalories,
      targetCaloriesWorkoutDay: caloriePlan.targetCaloriesWorkoutDay,
      targetCaloriesRestDay: caloriePlan.targetCaloriesRestDay,
      calorieStrategy: state.calorieStrategy,
      estimatedWeeklyChange: caloriePlan.estimatedWeeklyWeightChange,
      strategy: `${caloriePlan.label}: estimated maintenance ${caloriePlan.maintenanceLow}-${caloriePlan.maintenanceHigh} calories. Average target ${caloriePlan.targetCalories} calories, workout days ${caloriePlan.targetCaloriesWorkoutDay}, rest days ${caloriePlan.targetCaloriesRestDay}. Estimated ${Math.abs(caloriePlan.estimatedWeeklyWeightChange)} lb/week ${caloriePlan.estimatedWeeklyWeightChange < 0 ? 'loss' : caloriePlan.estimatedWeeklyWeightChange > 0 ? 'gain' : 'change'}. Protein is anchored first and carbs are placed around ${state.liftTime}.`,
      mealTiming: `Pre-workout: carbs plus lean protein 60-120 minutes before ${state.liftTime}. Post-workout: high-protein meal with enough carbs to recover without blowing calories.`,
      alcoholStrategy: 'Alcohol is handled as a flexible calorie budget item. Log actual drink calories when possible.',
      eatingOutStrategy: 'Eating out defaults to lean protein, measured carb, sauce on the side, and a simple swap rather than skipping meals.',
    },
    cardio,
    activityPresets,
    progressionRules: [
      'Double progression: add reps until every set hits the top of the range, then add load.',
      'Start conservative. First week should leave 1-3 reps in reserve on most working sets.',
      'If the first set misses the bottom of the rep range, reduce the load immediately.',
    ],
    deloadLogic: 'Deload after 4-6 hard weeks, or sooner if performance drops in two sessions in a row while sleep and food are normal.',
    absIncluded: state.goals.includes('visible abs') || state.goals.includes('tighter waist') || state.goalNarrative.toLowerCase().includes('abs'),
    goals: state.goals,
    goalNarrative: state.goalNarrative,
    liftingMode: state.liftingMode,
    preferredLiftDays: state.liftingMode === 'weekly' ? state.preferredLiftDays : [],
    walkMode: state.walkMode,
    preferredWalkDays: state.walkMode === 'weekly' ? state.preferredWalkDays : [],
    cardioLocationPreference: state.cardioLocationPreference,
    importedWorkoutRaw: state.importedWorkoutRaw,
    parsedWorkoutTemplate: state.parsedWorkoutTemplate,
    splitOptions,
    selectedSplit: activeSplit,
    mealPortfolio,
  };
}

function maintenanceBreakdownFromState(state: IntakeState) {
  const age = toNum(state.age, 0);
  const weight = toNum(state.weight, 0);
  const height = heightIn(state);
  if (!age || !weight || height < 36) return 0;
  const liftDays = toNum(state.liftDaysPerWeek, state.liftingMode === 'weekly' ? state.preferredLiftDays.length : 4);
  const walkDays = state.walkMode === 'weekly' ? state.preferredWalkDays.length : 3;
  const gymShare = state.cardioLocationPreference / 100;
  return calculateMaintenanceBreakdown({
    sex: state.sex,
    age,
    heightIn: height,
    weightLb: weight,
    activityLevel: state.activityLevel,
    liftingDaysPerWeek: liftDays,
    liftingMinutes: 60,
    walkingSessionsPerWeek: Math.round(walkDays * (1 - gymShare)),
    walkingMinutesPerSession: 30,
    inclineSessionsPerWeek: Math.round(liftDays * gymShare),
    inclineMinutesPerSession: 15,
  });
}

function estimatedMaintenanceFromState(state: IntakeState) {
  const breakdown = maintenanceBreakdownFromState(state);
  return breakdown ? breakdown.maintenanceMid : 0;
}

function caloriePlanFromState(state: IntakeState) {
  const breakdown = maintenanceBreakdownFromState(state) || {
    bmr: 0,
    baseTDEE: 0,
    exerciseCaloriesPerDay: 0,
    weeklyExerciseCalories: 0,
    maintenanceLow: 2150,
    maintenanceMid: 2250,
    maintenanceHigh: 2350,
  };
  const maintenanceCalories = breakdown.maintenanceMid;
  const options = calorieOptionsForState(state, maintenanceCalories);
  return {
    maintenanceCalories,
    ...breakdown,
    ...(options.find(option => option.id === state.calorieStrategy) ?? options[0]),
  };
}

function calorieOptionsForState(state: IntakeState, maintenanceCalories = estimatedMaintenanceFromState(state) || 2250) {
  const liftDays = toNum(state.liftDaysPerWeek, state.liftingMode === 'weekly' ? state.preferredLiftDays.length : 4);
  if (state.goalDirection === 'gain') return calculateSurplusTargets(maintenanceCalories, liftDays);
  if (state.goalDirection === 'recomp') return calculateRecompTargets(maintenanceCalories, state.sex, liftDays);
  return calculateDeficitTargets(maintenanceCalories, state.sex, liftDays);
}

function nutritionTargetsFromCalories(baseTargets: ReturnType<typeof calculateNutritionTargets>, calorieGoal: number, goal: 'cut' | 'bulk' | 'maintain', sex: Sex) {
  const proteinGoal = baseTargets.proteinGoal;
  const remainingCalories = Math.max(0, calorieGoal - proteinGoal * 4);
  const carbRatio = goal === 'bulk' ? 0.58 : goal === 'maintain' ? 0.52 : 0.45;
  const carbGoal = Math.round(Math.max(goal === 'cut' ? 80 : 120, (remainingCalories * carbRatio) / 4));
  const fatGoal = Math.round(Math.max(sex === 'female' ? 45 : 50, (remainingCalories - carbGoal * 4) / 9));
  return { ...baseTargets, calorieGoal, carbGoal, fatGoal };
}

function profileFromPlan(state: IntakeState, plan: IntakeGeneratedPlan, parsedWorkout?: ParsedWorkoutTemplate) {
  const caloriePlan = caloriePlanFromState(state);
  return {
    name: state.name,
    goal: primaryGoal(state),
    age: toNum(state.age, 24),
    sex: state.sex,
    heightIn: heightIn(state),
    weight: toNum(state.weight, 170),
    goalWeight: state.goalWeight ? toNum(state.goalWeight, toNum(state.weight, 170)) : undefined,
    activity: activityMultipliers[state.activityLevel],
    activityLevel: state.activityLevel,
    stepEstimate: toNum(state.stepEstimate, 0) || undefined,
    aggression: state.goals.includes('lose fat') ? 500 : 250,
    bmr: caloriePlan.bmr,
    baseTDEE: caloriePlan.baseTDEE,
    exerciseCaloriesPerDay: caloriePlan.exerciseCaloriesPerDay,
    weeklyExerciseCalories: caloriePlan.weeklyExerciseCalories,
    maintenanceLow: caloriePlan.maintenanceLow,
    maintenanceCalories: caloriePlan.maintenanceCalories,
    maintenanceMid: caloriePlan.maintenanceCalories,
    maintenanceHigh: caloriePlan.maintenanceHigh,
    targetCalories: caloriePlan.targetCalories,
    targetCaloriesWorkoutDay: caloriePlan.targetCaloriesWorkoutDay,
    targetCaloriesRestDay: caloriePlan.targetCaloriesRestDay,
    calorieStrategy: state.calorieStrategy,
    estimatedWeeklyChange: caloriePlan.estimatedWeeklyWeightChange,
    proteinGoal: plan.nutrition.proteinGoal,
    calorieGoal: plan.nutrition.calorieGoal,
    carbGoal: plan.nutrition.carbGoal,
    fatGoal: plan.nutrition.fatGoal,
    weeklyLossRate: Math.max(0.25, Math.min(2.5, Math.abs(caloriePlan.estimatedWeeklyWeightChange || 0.25))),
    gymDaysPerWeek: toNum(state.liftDaysPerWeek, plan.workouts.length),
    goals: state.goals,
    goalNarrative: state.goalNarrative,
    liftingMode: state.liftingMode,
    preferredLiftDays: state.liftingMode === 'weekly' ? state.preferredLiftDays : [],
    walkMode: state.walkMode,
    preferredWalkDays: state.walkMode === 'weekly' ? state.preferredWalkDays : [],
    cardioLocationPreference: state.cardioLocationPreference,
    importedWorkoutRaw: state.importedWorkoutRaw,
    parsedWorkoutTemplate: parsedWorkout,
    mealPreferences: {
      cookingTimePerMeal: state.mealTimeFilter,
      breakfastTime: state.breakfastStyle,
      lunchTime: state.mealTimeFilter,
      dinnerTime: state.mealTimeFilter,
      snackPreference: state.snacks.join(', '),
      favoriteProteins: state.proteins,
      favoriteCarbs: state.carbs,
      favoriteVeggies: state.flavors,
      favoriteFruits: ['berries', 'banana', 'apple'],
      allergies: state.allergies,
      additionalNotes: `Selected intake meals: ${state.selectedMealOptionIds.length}. Flavors: ${state.flavors.join(', ')}. Notes: ${state.foodNotes}`,
    },
    workoutPreferences: {
      useDefaults: false,
      gymType: 'full gym',
      workoutStyle: plan.splitType,
      timePerWorkout: 'Optimized by Calos based on program requirements',
      usualWorkoutTime: state.liftTime,
      equipmentAccess: 'Selected during intake',
      likedExercises: parsedWorkout?.days.flatMap(day => day.exercises.map(exercise => exercise.name)).slice(0, 8).join(', ') ?? '',
      trainingLimits: state.splitFeedback,
      additionalNotes: `Goals: ${state.goals.join(', ')}. Narrative: ${state.goalNarrative || 'none'}. Split feedback: ${state.splitFeedback || 'none'}`,
    },
    programTemplate: plan,
    nutritionPlan: plan.nutrition,
    cardioPlan: plan.cardio,
    activityPresets: plan.activityPresets,
    mealPortfolio: plan.mealPortfolio,
    selectedCuratedMealIds: state.selectedMealOptionIds,
  };
}

function parseWorkout(raw: string, state: IntakeState): ParsedWorkoutTemplate | undefined {
  if (!raw.trim()) return undefined;
  const lines = raw.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const days: IntakeWorkoutDay[] = [];
  let currentName = 'Imported Day 1';
  let exercises: ReturnType<typeof ex>[] = [];
  const flush = () => {
    if (!exercises.length) return;
    days.push({ id: slug(currentName), name: currentName, focus: inferFocus(exercises.map(item => item.muscle)), cardioMin: 0, backup: ['Keep movement pattern and swap only if needed'], exercises });
    exercises = [];
  };
  lines.forEach((line, index) => {
    const header = line.endsWith(':') || (!/\d+\s*x\s*\d+/i.test(line) && index === 0);
    if (header) {
      flush();
      currentName = line.replace(':', '').trim() || `Imported Day ${days.length + 1}`;
      return;
    }
    const match = line.match(/(.+?)\s+(\d+)\s*x\s*(\d+)(?:\s*-\s*(\d+))?/i);
    if (!match) return;
    const name = match[1].trim();
    const sets = toNum(match[2], 3);
    const minReps = toNum(match[3], 8);
    const maxReps = toNum(match[4], minReps);
    exercises.push(ex(`${slug(name)}-${index}`, name, inferMuscle(name), sets, minReps, maxReps, estimateWeight(state, inferMuscle(name))));
  });
  flush();
  if (!days.length) return { splitName: 'Imported workout', days: [], muscleGroups: [], frequency: 0, confidence: 'low', clarification: 'I found text, but could not confidently parse sets and reps. Try lines like Bench Press 3x10.' };
  const muscles = Array.from(new Set(days.flatMap(day => day.exercises.map(exercise => exercise.muscle))));
  return { splitName: days.map(day => day.name).join(' / '), days, muscleGroups: muscles, frequency: days.length, confidence: days.length >= 2 ? 'high' : 'medium' };
}

function generateSplitOptions(state: IntakeState): SplitOption[] {
  const days = Math.max(2, Math.min(6, toNum(state.liftDaysPerWeek, 4)));
  const options: SplitOption[] = [];
  const hasShoulderArmGoal = state.goals.includes('bigger shoulders') || state.goals.includes('bigger arms') || /shoulder|arm|delts|biceps|triceps/i.test(state.goalNarrative);
  const hasStrengthGoal = state.goals.includes('improve strength') || /strength|power|bench|squat|deadlift/i.test(state.goalNarrative);
  const hasLegGluteGoal = state.goals.includes('bigger legs/glutes') || /glute|legs|lower/i.test(state.goalNarrative);
  const preferred = state.liftingMode === 'irregular'
    ? 'rotating'
    : days <= 3
      ? 'full-body'
      : hasStrengthGoal
        ? 'powerbuilding'
        : days >= 5 && hasShoulderArmGoal
          ? 'chest-tris-back-bis'
          : days >= 5
            ? 'ppl-upper'
            : hasLegGluteGoal
              ? 'upper-lower'
              : hasShoulderArmGoal
                ? 'chest-back-legs-delts'
                : 'upper-lower';
  if (state.parsedWorkoutTemplate?.days.length) {
    options.push({
      id: 'optimized-import',
      name: `Optimized ${state.parsedWorkoutTemplate.splitName}`,
      why: 'Keeps the exercises and structure you already know, then fixes balance, progression, and recovery.',
      weeklyLayout: state.parsedWorkoutTemplate.days.map(day => day.name),
      emphasis: 'Preserve current routine while tightening weak spots.',
      recovery: 'Lowest friction because it starts from familiar training.',
      recommended: true,
    });
  }
  const library: SplitOption[] = [
    { id: 'full-body', name: `${days}-Day Full Body`, why: `This fits because you entered ${days} lift days${state.liftingMode === 'irregular' ? ' with an irregular schedule' : ''}. Full-body keeps every major muscle trained even if a day gets moved.`, weeklyLayout: Array.from({ length: days }).map((_, i) => `Full Body ${String.fromCharCode(65 + i)}`), emphasis: 'High frequency, simple progression, strong consistency.', recovery: 'Easy to move sessions around without missing a muscle group.' },
    { id: 'upper-lower', name: 'Upper / Lower', why: `This fits ${days} days/week because it separates hard upper and lower sessions while still hitting muscles twice weekly.`, weeklyLayout: ['Upper A', 'Lower A', 'Upper B', 'Lower B', 'Upper C', 'Lower C'].slice(0, days), emphasis: hasShoulderArmGoal ? 'Upper body frequency with shoulder and arm bias while keeping legs covered.' : 'Balanced physique and strength.', recovery: 'Reliable recovery because heavy compounds are separated.' },
    { id: 'ppl-upper', name: 'Push / Pull / Legs + Upper', why: 'This fits higher-frequency training because push, pull, and legs get dedicated work, then the extra day biases the muscles tied to your stated goals.', weeklyLayout: ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Arms/Delts'].slice(0, days), emphasis: hasShoulderArmGoal ? 'Extra upper, delt, and arm volume.' : 'More volume for selected muscles without bloating each session.', recovery: 'Needs steadier weekly availability than upper/lower.' },
    { id: 'chest-back-legs-delts', name: 'Chest/Bis + Back/Tris + Legs/Shoulders', why: 'This fits physique goals because it gives chest/back priority while pairing arms so they are trained more than once per week.', weeklyLayout: ['Chest + Biceps', 'Back + Triceps', 'Legs + Shoulders', 'Upper Pump', 'Lower/Weak Points'].slice(0, days), emphasis: 'Physique-style volume with arm frequency.', recovery: 'Moderate fatigue; good if you enjoy body-part days.' },
    { id: 'chest-tris-back-bis', name: 'Chest/Tris + Back/Bis + Legs + Shoulders/Arms', why: 'This fits shoulder/arm aesthetic goals because it gives direct arm and delt work its own space instead of hiding it at the end of every workout.', weeklyLayout: ['Chest + Triceps', 'Back + Biceps', 'Legs', 'Shoulders + Arms', 'Upper Weak Points'].slice(0, days), emphasis: 'Chest, arms, shoulders, and visible upper-body changes.', recovery: 'Works best with consistent weekly days.' },
    { id: 'arnold', name: 'Chest/Back + Shoulders/Arms + Legs', why: 'This fits advanced physique training if you like dense sessions and can recover from paired torso days.', weeklyLayout: ['Chest + Back', 'Shoulders + Arms', 'Legs', 'Chest + Back B', 'Shoulders + Arms B'].slice(0, days), emphasis: 'Upper-body density and aesthetics.', recovery: 'Higher fatigue; best if recovery and food are strong.' },
    { id: 'powerbuilding', name: 'Powerbuilding Upper/Lower', why: 'This fits strength goals because heavy upper/lower work is paired with hypertrophy days for muscle growth.', weeklyLayout: ['Upper Strength', 'Lower Strength', 'Upper Hypertrophy', 'Lower Hypertrophy', 'Arms/Delts'].slice(0, days), emphasis: 'Strength plus muscle growth.', recovery: 'Clear heavy/light rhythm.' },
    { id: 'rotating', name: 'Rotating Flexible Split', why: 'Best for changing schedules because the app serves the next needed session instead of tying it to a weekday.', weeklyLayout: ['Session 1', 'Session 2', 'Session 3', 'Session 4', 'Session 5'].slice(0, days), emphasis: 'Consistency when life is messy.', recovery: 'Adapts dynamically and prevents skipped weekdays from breaking the week.' },
  ].map(option => ({ ...option, recommended: !state.parsedWorkoutTemplate && option.id === preferred }));
  return [...options, ...library].filter(option => option.weeklyLayout.length > 0);
}

function generateWorkouts(state: IntakeState, split: SplitOption): IntakeWorkoutDay[] {
  if (split.id === 'optimized-import' && state.parsedWorkoutTemplate?.days.length) {
    return state.parsedWorkoutTemplate.days.map((day, index) => ({
      ...day,
      cardioMin: cardioForDay(state, index),
      backup: homeBackupForDay(day.name),
      exercises: optimizeImportedExercises(day.exercises, state),
    }));
  }
  return split.weeklyLayout.map((name, index) => {
    const lower = /lower|legs/i.test(name);
    const full = /full body|session/i.test(name);
    const push = /push|chest|triceps/i.test(name) && !/back/i.test(name);
    const pull = /pull|back|biceps/i.test(name) && !/chest/i.test(name);
    const shouldersArms = /shoulders|arms|delts/i.test(name) && !/legs/i.test(name);
    const chestBack = /chest.*back|back.*chest/i.test(name);
    const exercises = full
      ? fullBodyExercises(state, index)
      : chestBack
        ? chestBackExercises(state, index)
        : lower
          ? lowerExercises(state)
          : push
            ? pushExercises(state, index)
            : pull
              ? pullExercises(state, index)
              : shouldersArms
                ? shouldersArmsExercises(state, index)
                : upperExercises(state, index);
    return { id: slug(name), name, focus: inferFocus(exercises.map(item => item.muscle)), cardioMin: cardioForDay(state, index), backup: homeBackupForDay(name), exercises };
  });
}

function homeBackupForDay(dayName: string) {
  const lower = dayName.toLowerCase();
  if (/lower|legs/.test(lower)) return ['Backpack goblet squat 4x12-20', 'Backpack Romanian deadlift 4x10-15', 'Reverse lunge holding backpack 3x10/leg', 'Single-leg glute bridge 3x12/leg', 'Stair calf raise 4x15-25'];
  if (/pull|back/.test(lower)) return ['Backpack 1-arm row 4x12-20/side', 'Towel row isometric 4x20-30 sec', 'Prone Y-T-W raise 3x12 each', 'Backpack curl 3x12-20', 'Doorframe rear delt row 3x10-15'];
  if (/push|chest/.test(lower)) return ['Backpack floor press 4x10-15', 'Feet-elevated push-up 4 sets near failure', 'Pike push-up 3x8-12', 'Water-jug lateral raise 4x15-25', 'Chair dip 3x8-15'];
  if (/shoulder|arms|delts/.test(lower)) return ['Pike push-up 4x8-12', 'Water-jug lateral raise 4x15-25', 'Backpack curl 4x12-20', 'Chair dip 4x8-15', 'Towel triceps extension 3x12-20'];
  return ['Backpack squat 3x12-20', 'Push-up 3 sets near failure', 'Backpack row 3x12-20/side', 'Backpack Romanian deadlift 3x12-15', 'Plank 3x45-60 sec'];
}

function optimizeImportedExercises(exercises: IntakeWorkoutDay['exercises'], state: IntakeState) {
  const names = new Set(exercises.map(item => item.name.toLowerCase()));
  const optimized = exercises.map(item => {
    const options = backupOptionsFor(item.name, item.muscle);
    return { ...item, restSeconds: item.sets >= 4 ? 150 : item.restSeconds, backupOptions: options, selectedBackup: item.selectedBackup ?? options[0], backup: item.backup || options[0] };
  });
  if (!Array.from(names).some(name => name.includes('row'))) optimized.push(ex('added-row', 'Chest-Supported Row', 'back', 3, 8, 12, estimateWeight(state, 'back')));
  if (!Array.from(names).some(name => name.includes('rdl') || name.includes('deadlift'))) optimized.push(ex('added-hinge', 'Romanian Deadlift', 'glutes', 3, 8, 12, estimateWeight(state, 'glutes')));
  return optimized.slice(0, 7);
}

function upperExercises(state: IntakeState, index: number) {
  const shoulderBias = state.goals.includes('bigger shoulders') || state.goalNarrative.toLowerCase().includes('shoulder');
  const armBias = state.goals.includes('bigger arms');
  const list = [
    ex(`press-${index}`, index % 2 ? 'Machine Chest Press' : 'Incline Dumbbell Press', 'chest', 3, 6, 10, estimateWeight(state, 'chest')),
    ex(`row-${index}`, 'Chest-Supported Row', 'back', 3, 8, 12, estimateWeight(state, 'back')),
    ex(`lat-${index}`, 'Lat Pulldown', 'back', 3, 8, 12, estimateWeight(state, 'back')),
    ex(`shoulder-${index}`, 'Dumbbell Shoulder Press', 'shoulders', shoulderBias ? 4 : 3, 8, 12, estimateWeight(state, 'shoulders')),
    ex(`arms-${index}`, 'Cable Curl + Rope Pressdown', 'arms', armBias ? 4 : 3, 10, 15, estimateWeight(state, 'arms')),
  ];
  if (state.goals.includes('visible abs')) list.push(coreExercise(index));
  return list;
}

function pushExercises(state: IntakeState, index: number) {
  const shoulderBias = state.goals.includes('bigger shoulders');
  return [
    ex(`push-press-${index}`, 'Incline Dumbbell Press', 'chest', 4, 6, 10, estimateWeight(state, 'chest')),
    ex(`push-flat-${index}`, 'Machine Chest Press', 'chest', 3, 8, 12, estimateWeight(state, 'chest')),
    ex(`push-shoulder-${index}`, 'Dumbbell Shoulder Press', 'shoulders', shoulderBias ? 4 : 3, 8, 12, estimateWeight(state, 'shoulders')),
    ex(`push-lateral-${index}`, 'Cable Lateral Raise', 'shoulders', 3, 12, 20, estimateWeight(state, 'shoulders') * 0.35),
    ex(`push-triceps-${index}`, 'Rope Pressdown', 'arms', 3, 10, 15, estimateWeight(state, 'arms')),
  ];
}

function pullExercises(state: IntakeState, index: number) {
  const armBias = state.goals.includes('bigger arms');
  return [
    ex(`pull-pulldown-${index}`, 'Lat Pulldown', 'back', 4, 8, 12, estimateWeight(state, 'back')),
    ex(`pull-row-${index}`, 'Chest-Supported Row', 'back', 4, 8, 12, estimateWeight(state, 'back')),
    ex(`pull-rear-${index}`, 'Rear Delt Cable Fly', 'shoulders', 3, 12, 20, estimateWeight(state, 'shoulders') * 0.35),
    ex(`pull-curl-${index}`, 'Incline Dumbbell Curl', 'arms', armBias ? 4 : 3, 10, 15, estimateWeight(state, 'arms')),
    ex(`pull-hammer-${index}`, 'Hammer Curl', 'arms', 3, 10, 15, estimateWeight(state, 'arms')),
  ];
}

function shouldersArmsExercises(state: IntakeState, index: number) {
  return [
    ex(`sa-press-${index}`, 'Machine Shoulder Press', 'shoulders', 4, 8, 12, estimateWeight(state, 'shoulders')),
    ex(`sa-lateral-${index}`, 'Cable Lateral Raise', 'shoulders', 4, 12, 20, estimateWeight(state, 'shoulders') * 0.35),
    ex(`sa-rear-${index}`, 'Reverse Pec Deck', 'shoulders', 3, 12, 20, estimateWeight(state, 'shoulders') * 0.35),
    ex(`sa-curl-${index}`, 'Cable Curl', 'arms', 4, 10, 15, estimateWeight(state, 'arms')),
    ex(`sa-triceps-${index}`, 'Overhead Cable Triceps Extension', 'arms', 4, 10, 15, estimateWeight(state, 'arms')),
  ];
}

function chestBackExercises(state: IntakeState, index: number) {
  return [
    ex(`cb-incline-${index}`, 'Incline Dumbbell Press', 'chest', 4, 6, 10, estimateWeight(state, 'chest')),
    ex(`cb-row-${index}`, 'Chest-Supported Row', 'back', 4, 8, 12, estimateWeight(state, 'back')),
    ex(`cb-flat-${index}`, 'Machine Chest Press', 'chest', 3, 8, 12, estimateWeight(state, 'chest')),
    ex(`cb-pulldown-${index}`, 'Lat Pulldown', 'back', 3, 8, 12, estimateWeight(state, 'back')),
    ex(`cb-fly-${index}`, 'Cable Fly', 'chest', 3, 12, 15, estimateWeight(state, 'chest') * 0.35),
  ];
}

function lowerExercises(state: IntakeState) {
  const gluteBias = state.goals.includes('bigger legs/glutes');
  return [
    ex('leg-press', 'Leg Press', 'legs', gluteBias ? 4 : 3, 8, 12, estimateWeight(state, 'legs')),
    ex('rdl', 'Romanian Deadlift', 'glutes', gluteBias ? 4 : 3, 8, 12, estimateWeight(state, 'glutes')),
    ex('leg-curl', 'Seated Leg Curl', 'legs', 3, 10, 15, estimateWeight(state, 'legs') * 0.4),
    ex('calf-raise', 'Standing Calf Raise', 'calves', 3, 10, 15, estimateWeight(state, 'calves')),
    coreExercise(2),
  ];
}

function fullBodyExercises(state: IntakeState, index: number) {
  return [
    ex(`squat-${index}`, index % 2 ? 'Goblet Squat' : 'Leg Press', 'legs', 3, 8, 12, estimateWeight(state, 'legs')),
    ex(`press-${index}`, 'Dumbbell Bench Press', 'chest', 3, 8, 12, estimateWeight(state, 'chest')),
    ex(`row-${index}`, 'Chest-Supported Row', 'back', 3, 8, 12, estimateWeight(state, 'back')),
    ex(`hinge-${index}`, 'Romanian Deadlift', 'glutes', 2, 8, 10, estimateWeight(state, 'glutes')),
    ex(`shoulder-${index}`, 'Lateral Raise', 'shoulders', 3, 12, 15, estimateWeight(state, 'shoulders')),
  ];
}

function generateMealPortfolio(state: IntakeState, targets: ReturnType<typeof calculateNutritionTargets>): MealSet[] {
  const selectedCuratedMeals = curatedMeals.filter(meal => state.selectedMealOptionIds.includes(meal.id));
  if (selectedCuratedMeals.length) {
    const meals = selectedCuratedMeals.map(curatedMealToPortfolioMeal);
    return Array.from({ length: Math.ceil(meals.length / 4) }).map((_, index) => {
      const dayMeals = meals.slice(index * 4, index * 4 + 4);
      return {
        id: `curated-day-${index + 1}`,
        name: `Curated Menu ${index + 1}`,
        totalCalories: dayMeals.reduce((sum, meal) => sum + meal.calories, 0),
        totalProtein: dayMeals.reduce((sum, meal) => sum + meal.protein, 0),
        totalCarbs: dayMeals.reduce((sum, meal) => sum + meal.carbs, 0),
        totalFat: dayMeals.reduce((sum, meal) => sum + meal.fat, 0),
        meals: dayMeals,
      };
    });
  }
  return Array.from({ length: 5 }).map((_, index) => {
    const breakfast = portfolioMeal(state, targets, 'Breakfast', index);
    const lunch = portfolioMeal(state, targets, 'Lunch', index);
    const dinner = portfolioMeal(state, targets, 'Dinner', index);
    const snack = portfolioMeal(state, targets, 'Snack', index);
    const meals = [breakfast, lunch, dinner, snack];
    return {
      id: `day-${index + 1}`,
      name: ['Training Day', 'Meal Prep Day', 'Busy Workday', 'Eating Out Buffer', 'High Satiety Day'][index],
      totalCalories: meals.reduce((sum, meal) => sum + meal.calories, 0),
      totalProtein: meals.reduce((sum, meal) => sum + meal.protein, 0),
      totalCarbs: meals.reduce((sum, meal) => sum + meal.carbs, 0),
      totalFat: meals.reduce((sum, meal) => sum + meal.fat, 0),
      meals,
    };
  });
}

function curatedMealToPortfolioMeal(meal: CuratedMeal): MealPortfolioMeal {
  return {
    id: meal.id,
    type: meal.category === 'breakfast' ? 'Breakfast' : meal.category === 'lunch' ? 'Lunch' : meal.category === 'dinner' ? 'Dinner' : 'Snack',
    name: meal.name,
    calories: meal.calories,
    protein: meal.protein,
    carbs: meal.carbs,
    fat: meal.fat,
    serving: meal.servingSize,
    ingredients: meal.ingredients,
    instructions: [...meal.instructions, `Storage: ${meal.storageNotes}`, meal.reheatingNotes ? `Reheating: ${meal.reheatingNotes}` : ''],
  };
}

type MealOption = { id: string; type: MealPortfolioMeal['type']; name: string; time: 'quick' | 'moderate' | 'prep'; flavor: string };

function generateMealOptions(state: IntakeState): MealOption[] {
  const types: MealPortfolioMeal['type'][] = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const templates = [
    'bowl', 'wrap', 'plate', 'skillet', 'salad', 'sandwich', 'stir fry', 'taco bowl', 'pasta', 'rice bowl',
    'potato plate', 'oats', 'shake', 'egg plate', 'yogurt bowl', 'grab-and-go', 'meal prep tray', 'air fryer plate',
    'sushi bowl', 'burger bowl',
  ];
  return types.flatMap((type, typeIndex) => templates.slice(0, 10).map((template, index) => {
    const protein = pick(state.proteins, index + typeIndex);
    const carb = pick(state.carbs, index);
    const flavor = pick(state.flavors, index + typeIndex);
    const snack = pick(state.snacks, index);
    const time: MealOption['time'] = index % 3 === 0 ? 'quick' : index % 3 === 1 ? 'moderate' : 'prep';
    const name = type === 'Snack' ? `${snack} ${flavor} snack` : type === 'Breakfast' ? `${state.breakfastStyle || protein} ${template}` : `${flavor} ${protein} ${carb} ${template}`;
    return { id: `${slug(type)}-${slug(template)}-${index}`, type, name, time, flavor };
  }));
}

function portfolioMealFromOption(option: MealOption, targets: ReturnType<typeof calculateNutritionTargets>, index: number): MealPortfolioMeal {
  const ratios = option.type === 'Breakfast' ? [0.24, 0.22, 0.25, 0.22] : option.type === 'Lunch' ? [0.31, 0.30, 0.33, 0.30] : option.type === 'Dinner' ? [0.32, 0.34, 0.30, 0.34] : [0.13, 0.14, 0.12, 0.14];
  const calories = Math.round(targets.calorieGoal * ratios[0] * ([0.92, 1, 1.08, 0.96][index % 4] ?? 1));
  const protein = Math.round(targets.proteinGoal * ratios[1]);
  const carbs = Math.round(targets.carbGoal * ratios[2]);
  const fat = Math.round(targets.fatGoal * ratios[3]);
  return {
    id: option.id,
    type: option.type,
    name: option.name,
    calories,
    protein,
    carbs,
    fat,
    serving: option.type === 'Snack' ? '1 measured snack serving' : `${Math.max(4, Math.round(protein / 8))} oz cooked protein, ${Math.max(120, carbs * 4)}g cooked carb, vegetables, measured sauce`,
    ingredients: ['Measured protein', 'Measured carb', 'Vegetables or fruit', `${option.flavor} seasoning/sauce`],
    instructions: ['Cook protein to safe doneness.', 'Weigh cooked carb serving.', 'Add produce and measured sauce.', 'Portion and log the listed macros.'],
  };
}

function portfolioMeal(state: IntakeState, targets: ReturnType<typeof calculateNutritionTargets>, type: MealPortfolioMeal['type'], index: number): MealPortfolioMeal {
  const ratios = type === 'Breakfast' ? [0.24, 0.22, 0.25, 0.22] : type === 'Lunch' ? [0.31, 0.30, 0.33, 0.30] : type === 'Dinner' ? [0.32, 0.34, 0.30, 0.34] : [0.13, 0.14, 0.12, 0.14];
  const calories = Math.round(targets.calorieGoal * ratios[0] * ([0.95, 1, 1.05, 0.9, 1.08][index] ?? 1));
  const protein = Math.round(targets.proteinGoal * ratios[1]);
  const carbs = Math.round(targets.carbGoal * ratios[2]);
  const fat = Math.round(targets.fatGoal * ratios[3]);
  const proteinFood = pick(state.proteins, index);
  const carbFood = pick(state.carbs, index);
  const flavor = pick(state.flavors, index);
  const snack = pick(state.snacks, index);
  const name = type === 'Snack' ? `${snack} + fruit` : type === 'Breakfast' ? `${state.breakfastStyle} ${flavor}` : `${flavor} ${proteinFood} ${carbFood} bowl`;
  return {
    id: `${slug(type)}-${index}`,
    type,
    name,
    calories,
    protein,
    carbs,
    fat,
    serving: type === 'Snack' ? '1 grab-and-go serving' : `${Math.max(4, Math.round(protein / 8))} oz cooked protein + ${Math.max(120, carbs * 4)}g cooked carb + vegetables/sauce measured`,
    ingredients: type === 'Snack' ? [snack, '1 piece fruit or measured side carb', 'water or zero-cal drink'] : [`${proteinFood}`, `${carbFood}`, '200g vegetables', '10-15g sauce or oil measured', `${flavor} seasoning`],
    instructions: type === 'Snack'
      ? ['Portion the snack into one serving.', 'Pair with fruit when carbs are needed before training.', 'Log label calories if using packaged food.']
      : ['Season protein and cook to a safe internal temperature.', 'Cook carb in a measured batch and weigh the serving cooked.', 'Add vegetables and measured sauce, then portion into one container.', 'Reheat until steaming hot if meal prepped.'],
  };
}

function buildCardioPlan(state: IntakeState) {
  const gymShare = state.cardioLocationPreference / 100;
  const outdoorShare = 1 - gymShare;
  const weeklyTargetCalories = Math.round(450 + toNum(state.liftDaysPerWeek, 4) * 80);
  const age = toNum(state.age, 25);
  const maxHr = 220 - age;
  const minHr = Math.round(maxHr * 0.62);
  const maxZoneHr = Math.round(maxHr * 0.72);
  const walkDays = state.walkMode === 'weekly' ? state.preferredWalkDays : ['Flexible walk 1', 'Flexible walk 2', 'Flexible walk 3'];
  const activeWalkDays = walkDays.length ? walkDays : [];
  const liftDays = Math.max(1, toNum(state.liftDaysPerWeek, state.preferredLiftDays.length || 4));
  const outdoorWeeklyMinutes = Math.round(outdoorShare * 150);
  const walkMinutes = activeWalkDays.length ? Math.max(20, Math.min(35, Math.round(outdoorWeeklyMinutes / activeWalkDays.length))) : 0;
  const gymWeeklyMinutes = Math.max(0, Math.round(gymShare * 120));
  const treadmillMinutes = Math.max(8, Math.round(gymWeeklyMinutes / liftDays));
  const outdoorPercent = Math.round(outdoorShare * 100);
  const gymPercent = Math.round(gymShare * 100);
  return {
    weeklyTargetCalories,
    inclineTreadmill: `${gymPercent}% of cardio is assigned to the gym. After each of your ${liftDays} lifting days, walk about ${treadmillMinutes} minutes on the treadmill at 15% incline when possible. Use the highest incline you can sustain, do not hold the handles, and adjust speed to stay in the heart-rate zone.`,
    outdoorWalking: activeWalkDays.length
      ? `${outdoorPercent}% of cardio is assigned outdoors. Walk ${activeWalkDays.join(', ')} for about ${walkMinutes} minutes each, ideally staying in the heart-rate zone the entire walk.`
      : `No outdoor walking days selected. Calos will place cardio after lifting at the gym instead.`,
    heartRateZone: `Target heart-rate zone: ${minHr}-${maxZoneHr} bpm. Stay inside this zone for the entire required cardio time; if you drift below it, increase pace/incline, and if you exceed it, back off slightly.`,
    recoveryRule: 'Sports and hard cardio can replace planned cardio. Avoid stacking hard cardio before heavy leg sessions.',
  };
}

function validatePlan(state: IntakeState, workouts: IntakeWorkoutDay[], targets: ReturnType<typeof calculateNutritionTargets>) {
  const muscles = new Set(workouts.flatMap(day => day.exercises.map(exercise => exercise.muscle)));
  return [
    `Calories/macros generated from ${state.sex}, age ${state.age}, ${heightIn(state)} in, ${state.weight} lb, and goals.`,
    muscles.has('chest') && muscles.has('back') && muscles.has('legs') ? 'Major movement patterns and muscle groups are covered.' : 'Program includes a focused fallback but should be reviewed for missing muscle groups.',
    workouts.every(day => day.exercises.every(exercise => exercise.backupOptions?.length && (exercise.selectedBackup || exercise.backup))) ? 'Every exercise has required backup options selected.' : 'Some backup exercises need review before locking in.',
    `${workouts.length} workouts fit the stated ${state.liftDaysPerWeek} days/week availability.`,
    `Macro targets: ${targets.calorieGoal} cal, ${targets.proteinGoal}g protein, ${targets.carbGoal}g carbs, ${targets.fatGoal}g fat.`,
  ];
}

function optimizePlan(state: IntakeState) {
  return [
    state.parsedWorkoutTemplate ? 'Imported workout preserved as the base, with balance and recovery adjustments.' : 'Split chosen from schedule, goals, and recovery needs.',
    state.liftingMode === 'irregular' ? 'Irregular lifting mode uses a rotating next-workout system.' : 'Weekly lifting days are saved for predictable scheduling.',
    `Cardio distribution follows: ${cardioLocationLabel(state.cardioLocationPreference)}.`,
    'Meal menu is built from selected curated meals rather than a preference survey.',
  ];
}

function buildSchedule(state: IntakeState, workouts: IntakeWorkoutDay[], presets: IntakeActivityPreset[]) {
  const days = state.liftingMode === 'weekly' ? state.preferredLiftDays : [];
  const schedule = workouts.map((workout, index) => `${days[index] ?? `Lift ${index + 1}`}: ${workout.name}${workout.cardioMin ? ` + ${workout.cardioMin} min cardio` : ''}`);
  if (state.walkMode === 'weekly' && state.preferredWalkDays.length) schedule.push(`Walk/cardio: ${state.preferredWalkDays.join(', ')}`);
  return schedule;
}

function primaryGoal(state: IntakeState): 'cut' | 'bulk' | 'maintain' {
  if (state.goalDirection === 'gain') return 'bulk';
  if (state.goalDirection === 'cut') return 'cut';
  return 'maintain';
}

function heightIn(state: IntakeState) {
  return toNum(state.heightFt, 5) * 12 + toNum(state.heightInPart, 9);
}

function scheduleAdvice(state: IntakeState) {
  const days = toNum(state.liftDaysPerWeek, 4);
  if (days >= 6) return 'Six days can work, but Calos will keep individual sessions more focused to protect recovery.';
  if (state.liftingMode === 'irregular') return 'Irregular mode will ignore weekdays and serve the next best session dynamically.';
  return 'This lifting setup looks repeatable.';
}

function diagnosisSummary(state: IntakeState) {
  const goals = state.goals.slice(0, 4).join(', ');
  const lifting = state.liftingMode === 'weekly' ? `${state.liftDaysPerWeek} days on ${state.preferredLiftDays.join(', ')}` : `${state.liftDaysPerWeek} flexible days`;
  return `You’re ${state.age || 'age not set'}, ${state.heightFt || '-'}'${state.heightInPart || '-'}", ${state.weight || '-'} lb, ${state.goalDirection === 'cut' ? 'cutting' : state.goalDirection === 'gain' ? 'gaining' : 'recomping'} toward ${goals || 'your selected goals'}. You can lift ${lifting}, usually ${state.liftTime || 'time not set'}, with cardio: ${cardioLocationLabel(state.cardioLocationPreference)}.`;
}

function mealSelectionSummary(meals: CuratedMeal[]) {
  const counts = {
    breakfast: meals.filter(meal => meal.category === 'breakfast').length,
    lunch: meals.filter(meal => meal.category === 'lunch').length,
    dinner: meals.filter(meal => meal.category === 'dinner').length,
    snack: meals.filter(meal => meal.category === 'snack').length,
  };
  const missing = Object.entries(counts).filter(([, count]) => count < 2).map(([category]) => category);
  if (!meals.length) return 'No meals selected yet. You’ll get better suggestions if you add at least 2 of each category.';
  if (missing.length) return `${meals.length} selected. Better suggestions if you add more: ${missing.join(', ')}.`;
  return `${meals.length} selected. Great spread across breakfast, lunch, dinner, and snacks.`;
}

function goalSummary(goals: Goal[], customGoals = '') {
  if (!goals.length && !customGoals.trim()) return 'No goals selected yet. Pick what matters most.';
  const hasFat = goals.includes('lose fat') || goals.includes('look more defined') || goals.includes('better jawline/face definition');
  const hasWaist = goals.includes('tighter waist');
  const hasAbs = goals.includes('visible abs');
  const hasMuscle = goals.includes('build muscle');
  const hasShoulders = goals.includes('bigger shoulders');
  const hasArms = goals.includes('bigger arms');
  const hasLegs = goals.includes('bigger legs/glutes');
  const hasStrength = goals.includes('improve strength');
  const hasCardio = goals.includes('improve cardio');
  const hasAthletic = goals.includes('athletic build') || goals.includes('sport performance');
  const hasHealth = goals.includes('general health');

  if (hasFat && hasWaist && hasAbs) return 'Focus: fat loss, waist definition, and visible abs.';
  if (hasMuscle && hasShoulders && (hasArms || hasLegs)) return `Focus: muscle growth with extra ${hasArms ? 'shoulder and arm' : 'shoulder and lower-body'} emphasis.`;
  if (hasMuscle && hasShoulders) return 'Focus: muscle growth with extra shoulder emphasis.';
  if (hasStrength && hasCardio) return 'Focus: performance, strength, and conditioning.';
  if (hasAthletic && (hasStrength || hasCardio)) return 'Focus: athletic performance with balanced strength and conditioning.';
  if (hasFat) return `Focus: fat loss${hasWaist ? ', waist definition' : ''}${hasAbs ? ', and visible abs' : ''}.`;
  if (hasMuscle) return 'Focus: lean muscle growth and physique development.';
  if (hasHealth) return 'Focus: sustainable training, nutrition, and general health.';
  return `Focus: ${goals.slice(0, 3).join(', ')}${goals.length > 3 ? ', and more' : ''}.`;
}

function recommendedGoalDirection(state: IntakeState): IntakeState['goalDirection'] {
  const fatGoals = state.goals.filter(goal => ['lose fat', 'tighter waist', 'visible abs', 'look more defined', 'better jawline/face definition'].includes(goal)).length;
  const muscleGoals = state.goals.filter(goal => ['build muscle', 'bigger shoulders', 'bigger arms', 'bigger legs/glutes'].includes(goal)).length;
  if (fatGoals && muscleGoals) return 'recomp';
  if (fatGoals) return 'cut';
  if (muscleGoals) return 'gain';
  return 'recomp';
}

function defaultStrategyForDirection(direction: IntakeState['goalDirection']): CalorieStrategy {
  if (direction === 'gain') return 'bulk_lean';
  if (direction === 'recomp') return 'recomp';
  return 'cut_moderate';
}

function calorieStrategySummary(state: IntakeState) {
  const plan = caloriePlanFromState(state);
  const direction = plan.estimatedWeeklyWeightChange < 0 ? 'loss' : plan.estimatedWeeklyWeightChange > 0 ? 'gain' : 'change';
  return `Estimated maintenance ${plan.maintenanceCalories.toLocaleString()} cal. Target ${plan.targetCalories.toLocaleString()} cal for ~${Math.abs(plan.estimatedWeeklyWeightChange)} lb/week ${direction}.`;
}

function goalConsistencyNote(state: IntakeState) {
  const current = toNum(state.weight, 0);
  const goal = toNum(state.goalWeight, 0);
  if (!current || !goal) return 'Goal weight is optional. If left blank, Calos will use the selected cut/gain/recomp direction and pace.';
  if (state.goalDirection === 'cut' && goal >= current) return 'Goal weight is above current weight while cutting. Calos will prioritize the cut direction unless you switch to gain/recomp.';
  if (state.goalDirection === 'gain' && goal <= current) return 'Goal weight is below current weight while gaining. Calos will prioritize the gain direction unless you switch to cut/recomp.';
  return 'Goal direction, goal weight, and weekly pace line up.';
}

function cardioLocationLabel(value: number) {
  const gym = Math.round(value);
  return `${100 - gym}% outdoor / ${gym}% gym`;
}

function cardioForDay(state: IntakeState, index: number) {
  const gymShare = state.cardioLocationPreference / 100;
  if (gymShare < 0.25) return index % 2 === 0 ? 5 : 0;
  if (gymShare > 0.75) return index % 2 === 0 ? 20 : 15;
  return index % 2 === 0 ? 15 : 0;
}

function coreExercise(index: number) {
  const options = [
    ex('core-cable', 'Cable Crunch', 'core', 3, 10, 15, 40),
    ex('core-ab-wheel', 'Ab Wheel', 'core', 3, 6, 10, 0),
    ex('core-pallof', 'Pallof Press', 'core', 2, 10, 12, 20),
    ex('core-knee-raise', 'Hanging Knee Raise', 'core', 3, 8, 12, 0),
  ];
  return options[index % options.length];
}

function ex(id: string, name: string, muscle: string, sets: number, minReps: number, maxReps: number, weight: number) {
  const rounded = Math.max(0, Math.round(weight / 5) * 5);
  const backupOptions = backupOptionsFor(name, muscle);
  return { id, name, muscle, sets, minReps, maxReps, restSeconds: muscle === 'core' ? 60 : sets >= 4 ? 150 : 120, weight: rounded, lastReps: Array.from({ length: sets }).map(() => 0), lastWeights: Array.from({ length: sets }).map(() => rounded), backup: backupOptions[0], backupOptions, selectedBackup: backupOptions[0] };
}

function backupOptionsFor(name: string, muscle: string) {
  const lower = name.toLowerCase();
  if (/bench|chest|press/.test(lower) && muscle === 'chest') return ['Machine Chest Press', 'Dumbbell Bench Press', 'Push-up', 'Cable Chest Press'];
  if (/incline/.test(lower)) return ['Incline Machine Press', 'Low-Incline Dumbbell Press', 'Feet-Elevated Push-up', 'Landmine Press'];
  if (/row/.test(lower)) return ['Seated Cable Row', 'Chest-Supported Machine Row', '1-Arm Dumbbell Row', 'Smith Machine Row'];
  if (/pulldown|pull-up|lat/.test(lower)) return ['Neutral-Grip Lat Pulldown', 'Assisted Pull-up', 'Machine Pullover', '1-Arm Cable Pulldown'];
  if (/shoulder|overhead/.test(lower)) return ['Machine Shoulder Press', 'Seated Dumbbell Press', 'Landmine Press', 'Pike Push-up'];
  if (/lateral/.test(lower)) return ['Cable Lateral Raise', 'Machine Lateral Raise', 'Dumbbell Lateral Raise', 'Lean-Away Lateral Raise'];
  if (/leg press|squat/.test(lower)) return ['Hack Squat', 'Goblet Squat', 'Smith Machine Squat', 'Belt Squat'];
  if (/rdl|deadlift|hinge/.test(lower)) return ['Dumbbell Romanian Deadlift', 'Smith Machine Romanian Deadlift', 'Cable Pull-through', 'Hip Hinge Back Extension'];
  if (/curl/.test(lower) && muscle === 'legs') return ['Lying Leg Curl', 'Seated Leg Curl', 'Stability Ball Leg Curl', 'Slider Hamstring Curl'];
  if (/curl/.test(lower)) return ['Cable Curl', 'Incline Dumbbell Curl', 'Machine Curl', 'Hammer Curl'];
  if (/tricep|pressdown|pushdown/.test(lower)) return ['Rope Pressdown', 'Cable Overhead Extension', 'Machine Dip', 'Close-Grip Push-up'];
  if (/calf/.test(lower)) return ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise', 'Single-Leg Calf Raise'];
  if (/crunch|ab|plank|pallof|knee/.test(lower) || muscle === 'core') return ['Cable Crunch', 'Ab Wheel', 'Pallof Press', 'Hanging Knee Raise'];
  if (muscle === 'glutes') return ['Hip Thrust', 'Dumbbell Romanian Deadlift', 'Cable Pull-through', 'Back Extension'];
  if (muscle === 'legs') return ['Leg Press', 'Hack Squat', 'Goblet Squat', 'Walking Lunge'];
  if (muscle === 'back') return ['Chest-Supported Row', 'Lat Pulldown', '1-Arm Dumbbell Row', 'Cable Row'];
  return ['Machine equivalent', 'Dumbbell equivalent', 'Cable equivalent', 'Bodyweight equivalent'];
}

function estimateWeight(state: IntakeState, muscle: string) {
  const bodyweight = toNum(state.weight, 170);
  const factor = muscle === 'legs' ? 1.1 : muscle === 'glutes' ? 0.8 : muscle === 'back' ? 0.6 : muscle === 'chest' ? 0.55 : muscle === 'shoulders' ? 0.28 : muscle === 'arms' ? 0.18 : 0.35;
  return bodyweight * factor;
}

function inferMuscle(name: string) {
  const lower = name.toLowerCase();
  if (/bench|press|fly|push/.test(lower)) return lower.includes('shoulder') || lower.includes('overhead') ? 'shoulders' : 'chest';
  if (/row|pulldown|pull-up|chin|lat/.test(lower)) return 'back';
  if (/squat|leg press|lunge|extension/.test(lower)) return 'legs';
  if (/deadlift|rdl|hip|glute/.test(lower)) return 'glutes';
  if (/curl|tricep|bicep/.test(lower)) return 'arms';
  if (/calf/.test(lower)) return 'calves';
  if (/crunch|plank|ab|pallof|knee raise/.test(lower)) return 'core';
  return 'general';
}

function inferFocus(muscles: string[]) {
  const unique = Array.from(new Set(muscles));
  return unique.slice(0, 4).join(', ') || 'full body';
}

function toNum(value: string | number | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'item';
}

function pick(items: string[], index: number) {
  return items[index % Math.max(1, items.length)] ?? 'simple';
}

function toggleValue(items: string[], value: string) {
  return items.includes(value) ? items.filter(item => item !== value) : [...items, value];
}

function CoachCard({ prompt, summary, children }: { prompt: string; summary: string; children: React.ReactNode }) {
  return (
    <View>
      <CoachBubble text={prompt} />
      <View style={s.answerCard}>{children}</View>
      <View style={s.learnedBox}>
        <MaterialIcons name="auto-awesome" size={16} color="#34d399" />
        <Text style={s.learnedText}>{summary}</Text>
      </View>
    </View>
  );
}

function CoachBubble({ text }: { text: string }) {
  return <View style={s.coachRow}><View style={s.coachAvatar}><Text style={s.coachAvatarText}>C</Text></View><View style={s.coachBubble}><Text style={s.coachText}>{text}</Text></View></View>;
}

function CoachPrompt({ text }: { text: string }) {
  return <Text style={s.coachPrompt}>{text}</Text>;
}

function ResponseChips({ value, options, onSelect }: { value: string; options: string[][]; onSelect: (value: string) => void }) {
  return <View style={s.chips}>{options.map(([key, text]) => <Chip key={key} active={value === key} onPress={() => onSelect(key)}>{text}</Chip>)}</View>;
}

function MultiOptions({ selected, options, onChange }: { selected: string[]; options: string[]; onChange: (values: string[]) => void }) {
  const toggle = (value: string) => {
    if (value === 'none') return onChange([]);
    const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected.filter(item => item !== 'none'), value];
    onChange(next);
  };
  return <View style={s.chips}>{options.map(option => <Chip key={option} active={selected.includes(option)} onPress={() => toggle(option)}>{option}</Chip>)}</View>;
}

function GroupedGoalOptions({ selected, onChange }: { selected: Goal[]; onChange: (values: Goal[]) => void }) {
  const toggle = (value: Goal) => {
    Vibration.vibrate(12);
    const next = selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value];
    onChange(next);
  };
  return (
    <View style={s.goalGroups}>
      {goalGroups.map(group => (
        <View key={group.title} style={s.goalGroup}>
          <Text style={s.goalGroupTitle}>{group.title}</Text>
          <View style={s.goalChipRow}>
            {group.options.map(option => {
              const active = selected.includes(option);
              return (
                <Pressable key={option} onPress={() => toggle(option)} style={[s.goalChip, active && s.goalChipActive]}>
                  <Text style={[s.goalChipText, active && s.goalChipTextActive]}>{option}</Text>
                  {active && <MaterialIcons name="check" size={14} color="#052e1c" />}
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

function FoodChips({ label, selected, examples, onChange }: { label: string; selected: string[]; examples: string[]; onChange: (values: string[]) => void }) {
  return <View style={s.inputWrap}><Text style={s.label}>{label}</Text><MultiOptions selected={selected} options={examples} onChange={onChange} /></View>;
}

function WeekdayPicker({ selected, onChange }: { selected: string[]; onChange: (values: string[]) => void }) {
  return <View style={s.weekdays}>{weekdays.map(day => <Chip key={day} active={selected.includes(day)} onPress={() => onChange(selected.includes(day) ? selected.filter(item => item !== day) : [...selected, day])}>{day}</Chip>)}</View>;
}

function ModeSwitch({ mode, onChange, weeklyLabel = 'Weekly schedule', irregularLabel = 'My schedule changes week to week' }: { mode: LiftingMode; onChange: (mode: LiftingMode) => void; weeklyLabel?: string; irregularLabel?: string }) {
  return <View style={s.chips}><Chip active={mode === 'weekly'} onPress={() => onChange('weekly')}>{weeklyLabel}</Chip><Chip active={mode === 'irregular'} onPress={() => onChange('irregular')}>{irregularLabel}</Chip></View>;
}

function ActivityLevelPicker({ value, onChange }: { value: ActivityLevel; onChange: (value: ActivityLevel) => void }) {
  return (
    <View style={s.activityGrid}>
      {(Object.keys(activityLevelLabels) as ActivityLevel[]).map(level => (
        <Pressable key={level} onPress={() => onChange(level)} style={[s.activityCard, value === level && s.activityCardActive]}>
          <Text style={[s.activityTitle, value === level && s.activityTitleActive]}>{activityLevelLabels[level].label}</Text>
          <Text style={[s.activityDescription, value === level && s.activityDescriptionActive]}>{activityLevelLabels[level].description}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function MaintenancePreview({ state }: { state: IntakeState }) {
  const breakdown = maintenanceBreakdownFromState(state);
  if (!breakdown) return null;
  return (
    <View style={s.maintenanceBox}>
      <Text style={s.maintenanceLabel}>Estimated maintenance range</Text>
      <Text style={s.maintenanceValue}>{breakdown.maintenanceLow.toLocaleString()} - {breakdown.maintenanceHigh.toLocaleString()} calories/day</Text>
      <Text style={s.maintenanceText}>Based on BMR {breakdown.bmr.toLocaleString()}, daily life ~{breakdown.baseTDEE.toLocaleString()}, and workouts/cardio averaging +{breakdown.exerciseCaloriesPerDay} calories/day.</Text>
      <Text style={s.maintenanceText}>Most people overestimate activity. Calos will adjust automatically after 10-14 days of weight and calorie logs.</Text>
    </View>
  );
}

function CalorieTargetPicker({ state, onSelect }: { state: IntakeState; onSelect: (strategy: CalorieStrategy) => void }) {
  const maintenance = estimatedMaintenanceFromState(state);
  if (!maintenance) {
    return <Text style={s.note}>Enter baseline info and activity first so Calos can estimate maintenance and calorie targets.</Text>;
  }
  const options = calorieOptionsForState(state, maintenance);
  return (
    <View style={s.calorieOptions}>
      <Text style={s.maintenanceLabel}>Estimated maintenance: {(maintenance - 100).toLocaleString()} - {(maintenance + 100).toLocaleString()} calories/day</Text>
      {options.map(option => {
        const active = state.calorieStrategy === option.id;
        const direction = option.estimatedWeeklyWeightChange < 0 ? 'loss' : option.estimatedWeeklyWeightChange > 0 ? 'gain' : 'change';
        return (
          <Pressable key={option.id} onPress={() => onSelect(option.id)} style={[s.calorieOption, active && s.calorieOptionActive]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.calorieOptionTitle, active && s.calorieOptionTitleActive]}>{option.label}</Text>
              <Text style={[s.calorieOptionText, active && s.calorieOptionTextActive]}>
                Average {option.targetCalories.toLocaleString()} calories/day · {option.dailyDelta > 0 ? '+' : ''}{option.dailyDelta} vs maintenance
              </Text>
              <Text style={[s.calorieOptionText, active && s.calorieOptionTextActive]}>
                Workout days {option.targetCaloriesWorkoutDay.toLocaleString()} · Rest days {option.targetCaloriesRestDay.toLocaleString()}
              </Text>
              <Text style={[s.calorieOptionText, active && s.calorieOptionTextActive]}>
                About {Math.abs(option.weeklyDelta).toLocaleString()} calories/week · ~{Math.abs(option.estimatedWeeklyWeightChange)} lb/week {direction}
              </Text>
            </View>
            {active && <MaterialIcons name="check-circle" size={22} color="#052e1c" />}
          </Pressable>
        );
      })}
    </View>
  );
}

function PaceSlider({ value, direction, onChange }: { value: string; direction: IntakeState['goalDirection']; onChange: (value: string) => void }) {
  const options = direction === 'cut'
    ? [-0.25, -0.5, -0.75, -1, -1.5, -2, -2.5]
    : direction === 'gain'
      ? [0.25, 0.5, 0.75, 1, 1.25, 1.5]
      : [-0.25, 0, 0.25];
  const pace = toNum(value, 0);
  const absPace = Math.abs(pace);
  const dailyCalories = Math.round(absPace * 500);
  const weeklyCalories = Math.round(absPace * 3500);
  const calorieDirection = direction === 'cut'
    ? 'deficit'
    : direction === 'gain'
      ? 'surplus'
      : pace < 0
        ? 'deficit'
        : pace > 0
          ? 'surplus'
          : 'maintenance';
  const paceNote = calorieDirection === 'maintenance'
    ? 'This keeps calories around maintenance while the plan focuses on training quality, protein, and consistency.'
    : `About a ${dailyCalories} calorie/day ${calorieDirection}, or roughly ${weeklyCalories} calories/week.`;
  return (
    <View style={s.sliderWrap}>
      <Text style={s.label}>Weekly pace</Text>
      <View style={s.sliderTrack}>
        {options.map(option => {
          const active = String(option) === value;
          return <Pressable key={option} onPress={() => onChange(String(option))} style={[s.sliderDot, active && s.sliderDotActive]} />;
        })}
      </View>
      <View style={s.scaleRow}><Text style={s.scaleText}>Conservative</Text><Text style={s.sliderValue}>{Math.abs(toNum(value, 0))} lb/week</Text><Text style={s.scaleText}>Aggressive</Text></View>
      <Text style={s.paceNote}>{paceNote}</Text>
    </View>
  );
}

function CardioLocationSlider({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const options = [0, 25, 50, 75, 100];
  return (
    <View style={s.sliderWrap}>
      <View style={s.sliderTrack}>
        {options.map(option => <Pressable key={option} onPress={() => onChange(option)} style={[s.sliderDot, value === option && s.sliderDotActive]} />)}
      </View>
      <View style={s.scaleRow}><Text style={s.scaleText}>More outdoor</Text><Text style={s.sliderValue}>{cardioLocationLabel(value)}</Text><Text style={s.scaleText}>More gym</Text></View>
    </View>
  );
}

function SplitCard({ option, active, onPress }: { option: SplitOption; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.splitCard, active && s.splitCardActive]}>
      <View style={s.splitTop}><Text style={s.splitName}>{option.name}{option.recommended ? ' · Recommended' : ''}</Text>{active && <MaterialIcons name="check-circle" size={18} color="#34d399" />}</View>
      <Text style={s.note}>{option.why}</Text>
      <Text style={s.muted}>{option.weeklyLayout.join(' / ')}</Text>
      <Text style={s.muted}>{option.recovery}</Text>
    </Pressable>
  );
}

function MealOptionCard({ option, selected, onPress }: { option: MealOption; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.mealOption, selected && s.mealOptionActive]}>
      <View style={{ flex: 1 }}>
        <Text style={s.mealOptionName}>{option.name}</Text>
        <Text style={s.muted}>{option.time} · {option.flavor}</Text>
      </View>
      <MaterialIcons name={selected ? 'check-circle' : 'add-circle-outline'} size={22} color={selected ? '#34d399' : '#94a3b8'} />
    </Pressable>
  );
}

function ParsedWorkoutSummary({ parsed }: { parsed: ParsedWorkoutTemplate }) {
  return (
    <View style={s.parsedBox}>
      <Text style={s.parsedTitle}>Imported workout parsed: {parsed.confidence} confidence</Text>
      <Text style={s.muted}>{parsed.frequency} days · {parsed.muscleGroups.join(', ') || 'muscles unclear'}</Text>
      {parsed.clarification ? <Text style={s.warning}>{parsed.clarification}</Text> : null}
    </View>
  );
}

function MiniCheck({ text }: { text: string }) {
  return <View style={s.miniCheck}><MaterialIcons name="check" size={15} color="#34d399" /><Text style={s.miniCheckText}>{text}</Text></View>;
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={s.row}>{React.Children.map(children, child => <View style={s.rowItem}>{child}</View>)}</View>;
}

function Input({ label, value, onChange, numeric = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; numeric?: boolean; multiline?: boolean }) {
  return <View style={s.inputWrap}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={numeric ? 'numeric' : 'default'} multiline={multiline} placeholderTextColor="#64748b" style={[s.input, multiline && s.textArea]} /></View>;
}

function FreeText({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <View style={s.inputWrap}><Text style={s.freeTextLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#64748b" multiline style={[s.input, s.textArea]} /></View>;
}

function Chip({ active, onPress, children }: { active: boolean; onPress: () => void; children: React.ReactNode }) {
  return <Pressable onPress={onPress} style={[s.chip, active && s.chipActive]}><Text style={[s.chipText, active && s.chipTextActive]}>{children}</Text></Pressable>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  scroller: { flex: 1 },
  content: { padding: 16, paddingBottom: 30 },
  top: { marginBottom: 14 },
  kicker: { color: '#34d399', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 29, fontWeight: '900', marginTop: 3 },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#1f2937', overflow: 'hidden', marginTop: 14 },
  progressFill: { height: '100%', backgroundColor: '#34d399' },
  stepText: { color: '#94a3b8', fontWeight: '800', marginTop: 8 },
  coachRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  coachAvatar: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#34d399' },
  coachAvatarText: { color: '#052e1c', fontWeight: '900' },
  coachBubble: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 16, borderTopLeftRadius: 4, padding: 13 },
  coachText: { color: '#f8fafc', fontSize: 16, fontWeight: '800', lineHeight: 23 },
  answerCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1f2937', borderRadius: 16, padding: 14 },
  learnedBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#082016', borderWidth: 1, borderColor: '#14532d', borderRadius: 14, padding: 11, marginTop: 12 },
  learnedText: { flex: 1, color: '#bbf7d0', fontWeight: '800', lineHeight: 19, fontSize: 13 },
  row: { flexDirection: 'row', gap: 10 },
  rowItem: { flex: 1 },
  inputWrap: { marginTop: 12 },
  label: { color: '#cbd5e1', fontWeight: '800', marginBottom: 7 },
  freeTextLabel: { color: '#34d399', fontWeight: '900', marginBottom: 7 },
  input: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 11, color: '#fff', fontWeight: '800' },
  textArea: { minHeight: 86, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  goalGroups: { gap: 16 },
  goalGroup: { gap: 9 },
  goalGroupTitle: { color: '#94a3b8', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  goalChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalChip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: 'rgba(15,23,42,0.58)', borderWidth: 1, borderColor: '#243244' },
  goalChipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  goalChipText: { color: '#cbd5e1', fontWeight: '800', fontSize: 12 },
  goalChipTextActive: { color: '#052e1c' },
  goalSummary: { color: '#bbf7d0', fontSize: 13, fontWeight: '900', lineHeight: 19, marginTop: 14, backgroundColor: '#082016', borderWidth: 1, borderColor: '#14532d', borderRadius: 12, padding: 10 },
  activityGrid: { gap: 8, marginTop: 6 },
  activityCard: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 13, padding: 11 },
  activityCardActive: { backgroundColor: '#082016', borderColor: '#34d399' },
  activityTitle: { color: '#f8fafc', fontWeight: '900', fontSize: 14 },
  activityTitleActive: { color: '#bbf7d0' },
  activityDescription: { color: '#94a3b8', fontWeight: '700', fontSize: 12, marginTop: 3 },
  activityDescriptionActive: { color: '#d1fae5' },
  maintenanceBox: { backgroundColor: '#082016', borderWidth: 1, borderColor: '#14532d', borderRadius: 14, padding: 12, marginTop: 14 },
  maintenanceLabel: { color: '#34d399', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  maintenanceValue: { color: '#fff', fontSize: 26, fontWeight: '900', marginTop: 2 },
  maintenanceText: { color: '#bbf7d0', fontSize: 12, fontWeight: '700', lineHeight: 18, marginTop: 5 },
  calorieOptions: { gap: 9, marginTop: 14 },
  calorieOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 12 },
  calorieOptionActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  calorieOptionTitle: { color: '#f8fafc', fontWeight: '900', fontSize: 14 },
  calorieOptionTitleActive: { color: '#052e1c' },
  calorieOptionText: { color: '#94a3b8', fontWeight: '700', fontSize: 12, marginTop: 3, lineHeight: 17 },
  calorieOptionTextActive: { color: '#064e3b' },
  weekdays: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244' },
  chipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  chipText: { color: '#cbd5e1', fontWeight: '800', fontSize: 13 },
  chipTextActive: { color: '#052e1c' },
  note: { color: '#cbd5e1', lineHeight: 19, fontWeight: '700', marginTop: 10 },
  muted: { color: '#94a3b8', lineHeight: 18, fontWeight: '700', marginTop: 6, fontSize: 12 },
  warning: { color: '#fde68a', marginTop: 8, fontWeight: '800' },
  sliderWrap: { marginTop: 14 },
  sliderTrack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 999, padding: 10 },
  sliderDot: { flex: 1, height: 14, marginHorizontal: 3, borderRadius: 999, backgroundColor: '#1f2937' },
  sliderDotActive: { backgroundColor: '#34d399' },
  sliderValue: { color: '#e2e8f0', fontSize: 11, fontWeight: '900', textAlign: 'center', flex: 1 },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleText: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  paceNote: { color: '#bbf7d0', fontSize: 12, fontWeight: '800', lineHeight: 18, marginTop: 8 },
  splitCard: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 12, marginTop: 10 },
  splitCardActive: { borderColor: '#34d399', backgroundColor: '#082016' },
  splitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  splitName: { color: '#fff', fontWeight: '900', fontSize: 15, flex: 1 },
  parsedBox: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 11, marginTop: 12 },
  parsedTitle: { color: '#f8fafc', fontWeight: '900' },
  finalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mealGroup: { marginTop: 14 },
  mealGroupTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  mealOption: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 11, marginBottom: 8 },
  mealOptionActive: { borderColor: '#34d399', backgroundColor: '#082016' },
  mealOptionName: { color: '#f8fafc', fontWeight: '900', fontSize: 13 },
  miniCheck: { width: '48%', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0b1220', borderRadius: 12, padding: 10 },
  miniCheckText: { color: '#cbd5e1', fontWeight: '800', fontSize: 12, flex: 1 },
  fullButton: { marginTop: 16, backgroundColor: '#34d399', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  fullButtonText: { color: '#052e1c', fontWeight: '900', fontSize: 15 },
  coachPrompt: { color: '#94a3b8', fontWeight: '800', marginTop: 4, marginBottom: 2, lineHeight: 18 },
  nav: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, backgroundColor: '#0b0f14', borderTopWidth: 1, borderTopColor: '#111827' },
  primary: { flex: 1, backgroundColor: '#34d399', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  primaryText: { color: '#052e1c', fontWeight: '900', fontSize: 15 },
  secondary: { flex: 1, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  secondaryText: { color: '#cbd5e1', fontWeight: '900', fontSize: 15 },
});
