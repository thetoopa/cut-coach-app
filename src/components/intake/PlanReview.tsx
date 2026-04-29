import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';

export type IntakeExercise = {
  id: string;
  name: string;
  sets: number;
  minReps: number;
  maxReps: number;
  restSeconds: number;
  weight: number;
  lastReps: number[];
  lastWeights: number[];
  backup: string;
  backupOptions?: string[];
  selectedBackup?: string;
  muscle: string;
};

export type IntakeWorkoutDay = {
  id: string;
  name: string;
  focus: string;
  cardioMin: number;
  backup: string[];
  exercises: IntakeExercise[];
};

export type IntakeNutritionPlan = {
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  bmr?: number;
  baseTDEE?: number;
  exerciseCaloriesPerDay?: number;
  maintenanceLow?: number;
  maintenanceCalories?: number;
  maintenanceHigh?: number;
  targetCalories?: number;
  targetCaloriesWorkoutDay?: number;
  targetCaloriesRestDay?: number;
  calorieStrategy?: string;
  estimatedWeeklyChange?: number;
  strategy: string;
  mealTiming: string;
  alcoholStrategy: string;
  eatingOutStrategy: string;
};

export type IntakeCardioPlan = {
  weeklyTargetCalories: number;
  inclineTreadmill: string;
  outdoorWalking: string;
  heartRateZone: string;
  recoveryRule: string;
};

export type IntakeActivityPreset = {
  id: string;
  type: string;
  mode: string;
  frequency: string;
  duration: string;
  estimatedCalories: number;
  notes: string;
};

export type IntakeGeneratedPlan = {
  splitType: string;
  validationSummary: string[];
  optimizationSummary: string[];
  weeklySchedule: string[];
  workouts: IntakeWorkoutDay[];
  nutrition: IntakeNutritionPlan;
  cardio: IntakeCardioPlan;
  activityPresets: IntakeActivityPreset[];
  progressionRules: string[];
  deloadLogic: string;
  absIncluded: boolean;
  goals?: string[];
  goalNarrative?: string;
  liftingMode?: 'weekly' | 'irregular';
  preferredLiftDays?: string[];
  walkMode?: 'weekly' | 'irregular';
  preferredWalkDays?: string[];
  cardioLocationPreference?: number;
  importedWorkoutRaw?: string;
  parsedWorkoutTemplate?: unknown;
  splitOptions?: {
    id: string;
    name: string;
    why: string;
    weeklyLayout: string[];
    emphasis: string;
    recovery: string;
    recommended?: boolean;
  }[];
  selectedSplit?: {
    id: string;
    name: string;
    why: string;
    weeklyLayout: string[];
    emphasis: string;
    recovery: string;
    recommended?: boolean;
  };
  mealPortfolio?: {
    id: string;
    name: string;
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    meals: {
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
    }[];
  }[];
};

type FlatMeal = NonNullable<IntakeGeneratedPlan['mealPortfolio']>[number]['meals'][number];

type PlanReviewProps = {
  plan: IntakeGeneratedPlan;
  onBack: () => void;
  onLockIn: (plan: IntakeGeneratedPlan) => void;
};

const swaps: Record<string, string[]> = {
  chest: ['Dumbbell Bench Press', 'Machine Chest Press', 'Incline Push-up'],
  back: ['Chest-Supported Row', 'Lat Pulldown', '1-Arm Dumbbell Row'],
  shoulders: ['Machine Shoulder Press', 'Dumbbell Shoulder Press', 'Landmine Press'],
  arms: ['Cable Curl', 'Incline Dumbbell Curl', 'Rope Pressdown'],
  legs: ['Leg Press', 'Goblet Squat', 'Hack Squat'],
  glutes: ['Hip Thrust', 'Romanian Deadlift', 'Cable Pull-through'],
  calves: ['Standing Calf Raise', 'Seated Calf Raise', 'Leg Press Calf Raise'],
  core: ['Cable Crunch', 'Ab Wheel', 'Pallof Press', 'Hanging Knee Raise'],
};

export function PlanReview({ plan, onBack, onLockIn }: PlanReviewProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<IntakeGeneratedPlan>(plan);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const totalExercises = useMemo(
    () => draft.workouts.reduce((sum, day) => sum + day.exercises.length, 0),
    [draft.workouts]
  );

  const updateNutrition = (patch: Partial<IntakeNutritionPlan>) => {
    setDraft(current => ({ ...current, nutrition: { ...current.nutrition, ...patch } }));
  };

  const swapExercise = (dayId: string, exerciseId: string) => {
    setDraft(current => ({
      ...current,
      workouts: current.workouts.map(day => {
        if (day.id !== dayId) return day;
        return {
          ...day,
          exercises: day.exercises.map(exercise => {
            if (exercise.id !== exerciseId) return exercise;
            const options = swaps[exercise.muscle] ?? swaps.back;
            const usedNames = new Set(current.workouts.flatMap(workout => workout.exercises.map(item => item.id === exerciseId ? '' : item.name.toLowerCase())));
            const currentIndex = Math.max(0, options.indexOf(exercise.name));
            const nextName = options.slice(currentIndex + 1).concat(options.slice(0, currentIndex + 1)).find(option => !usedNames.has(option.toLowerCase())) ?? options[(currentIndex + 1) % options.length];
            return {
              ...exercise,
              name: nextName,
              backup: options.find(option => option !== nextName) ?? exercise.backup,
            };
          }),
        };
      }),
    }));
  };

  const updateWorkoutDay = (dayId: string, patch: Partial<IntakeWorkoutDay>) => {
    setDraft(current => ({ ...current, workouts: current.workouts.map(day => day.id === dayId ? { ...day, ...patch } : day) }));
  };

  const updateExercise = (dayId: string, exerciseId: string, patch: Partial<IntakeExercise>) => {
    setDraft(current => ({
      ...current,
      workouts: current.workouts.map(day => day.id === dayId ? {
        ...day,
        exercises: day.exercises.map(exercise => exercise.id === exerciseId ? { ...exercise, ...patch } : exercise),
      } : day),
    }));
  };

  const addExercise = (dayId: string) => {
    setDraft(current => ({
      ...current,
      workouts: current.workouts.map(day => day.id === dayId ? {
        ...day,
        exercises: [...day.exercises, {
          id: `custom-${Date.now()}`,
          name: 'New Exercise',
          sets: 3,
          minReps: 8,
          maxReps: 12,
          restSeconds: 120,
          weight: 0,
          lastReps: [0, 0, 0],
          lastWeights: [0, 0, 0],
          backup: 'Choose a similar pain-free movement.',
          backupOptions: ['Machine equivalent', 'Dumbbell equivalent', 'Cable equivalent', 'Bodyweight equivalent'],
          selectedBackup: 'Machine equivalent',
          muscle: 'general',
        }],
      } : day),
    }));
  };

  const removeExercise = (dayId: string, exerciseId: string) => {
    setDraft(current => ({
      ...current,
      workouts: current.workouts.map(day => day.id === dayId ? { ...day, exercises: day.exercises.filter(exercise => exercise.id !== exerciseId) } : day),
    }));
  };

  const addWorkoutDay = () => {
    setDraft(current => ({
      ...current,
      workouts: [...current.workouts, {
        id: `custom-day-${Date.now()}`,
        name: 'Custom Day',
        focus: 'custom',
        cardioMin: 0,
        backup: ['Edit this day to match your split.'],
        exercises: [],
      }],
    }));
  };

  const selectedMeals = useMemo(() => {
    const map = new Map<string, FlatMeal>();
    draft.mealPortfolio?.forEach(group => group.meals.forEach(meal => map.set(meal.id, meal)));
    return Array.from(map.values());
  }, [draft.mealPortfolio]);

  const adjustCardio = (delta: number) => {
    setDraft(current => ({
      ...current,
      cardio: {
        ...current.cardio,
        weeklyTargetCalories: Math.max(0, current.cardio.weeklyTargetCalories + delta),
      },
    }));
  };

  const toggleAbs = () => {
    setDraft(current => {
      const absIncluded = !current.absIncluded;
      return {
        ...current,
        absIncluded,
        validationSummary: [
          ...current.validationSummary.filter(item => !item.toLowerCase().includes('core')),
          absIncluded ? 'Core is included 2-3x/week after lifting.' : 'Core is not prioritized in this template.',
        ],
      };
    });
  };

  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
    <ScrollView style={s.screen} contentContainerStyle={[s.content, { paddingTop: Math.max(18, insets.top + 8) }]}>
      <View style={s.header}>
        <Pressable onPress={onBack} style={s.iconButton}>
          <MaterialIcons name="chevron-left" size={24} color="#cbd5e1" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.kicker}>Review your system</Text>
          <Text style={s.title}>Calos Plan</Text>
        </View>
      </View>

      <View style={s.hero}>
        <Text style={s.heroTitle}>{draft.splitType}</Text>
        <Text style={s.heroSub}>{draft.workouts.length} lifting days · {totalExercises} exercises · {draft.cardio.weeklyTargetCalories} cardio cal/week</Text>
      </View>

      {draft.selectedSplit && (
        <Card title="Why This Split">
          <Text style={s.note}>{draft.selectedSplit.why}</Text>
          <Text style={s.note}>Emphasis: {draft.selectedSplit.emphasis}</Text>
          <Text style={s.note}>Recovery: {draft.selectedSplit.recovery}</Text>
        </Card>
      )}

      <Card title="Workout Plan">
        {draft.workouts.map(day => {
          const expanded = expandedDay === day.id;
          return (
            <View key={day.id} style={s.dayBox}>
              <Pressable style={s.dayTop} onPress={() => setExpandedDay(expanded ? null : day.id)}>
                <View>
                  <Text style={s.dayName}>{day.name}</Text>
                  <Text style={s.muted}>{day.focus} · {day.cardioMin} min cardio</Text>
                </View>
                <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color="#94a3b8" />
              </Pressable>
              {expanded && <>
                <TextInput value={day.name} onChangeText={name => updateWorkoutDay(day.id, { name })} style={s.inlineInput} />
                <View style={s.compactGrid}>
                  <MiniNumber label="Cardio" value={day.cardioMin} onChange={cardioMin => updateWorkoutDay(day.id, { cardioMin })} />
                </View>
                {day.exercises.map(exercise => (
                  <View key={exercise.id} style={s.exerciseEdit}>
                    <TextInput value={exercise.name} onChangeText={name => updateExercise(day.id, exercise.id, { name })} style={s.inlineInput} />
                    <View style={s.compactGrid}>
                      <MiniNumber label="Sets" value={exercise.sets} onChange={sets => updateExercise(day.id, exercise.id, { sets, lastReps: Array.from({ length: sets }).map(() => 0), lastWeights: Array.from({ length: sets }).map(() => exercise.weight) })} />
                      <MiniNumber label="Min" value={exercise.minReps} onChange={minReps => updateExercise(day.id, exercise.id, { minReps })} />
                      <MiniNumber label="Max" value={exercise.maxReps} onChange={maxReps => updateExercise(day.id, exercise.id, { maxReps })} />
                      <MiniNumber label="Weight" value={exercise.weight} onChange={weight => updateExercise(day.id, exercise.id, { weight, lastWeights: Array.from({ length: exercise.sets }).map(() => weight) })} />
                    </View>
                    <View style={s.exerciseActions}>
                      <Pressable onPress={() => swapExercise(day.id, exercise.id)} style={s.smallButton}>
                        <Text style={s.smallButtonText}>Swap</Text>
                      </Pressable>
                      <Pressable onPress={() => removeExercise(day.id, exercise.id)} style={s.dangerButton}>
                        <Text style={s.dangerButtonText}>Remove</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable onPress={() => addExercise(day.id)} style={s.addButton}><MaterialIcons name="add" size={16} color="#052e1c" /><Text style={s.addButtonText}>Add Exercise</Text></Pressable>
              </>}
            </View>
          );
        })}
        <Pressable onPress={addWorkoutDay} style={s.addButton}><MaterialIcons name="add" size={16} color="#052e1c" /><Text style={s.addButtonText}>Add Workout Day</Text></Pressable>
        <Pressable onPress={toggleAbs} style={s.toggleButton}>
          <MaterialIcons name={draft.absIncluded ? 'check-circle' : 'radio-button-unchecked'} size={18} color="#34d399" />
          <Text style={s.toggleText}>{draft.absIncluded ? 'Abs/core included' : 'Abs/core off'}</Text>
        </Pressable>
      </Card>

      <Card title="Backup / At-Home Plan">
        <Text style={s.warningNote}>This does not work as well as completing the planned gym days, but it keeps momentum alive and ensures you are always doing something when a gym day gets missed.</Text>
        {draft.workouts.map(day => (
          <View key={`${day.id}-backup`} style={s.backupDayBox}>
            <Text style={s.exerciseName}>{day.name} backup</Text>
            {day.backup.map(item => <Text key={`${day.id}-${item}`} style={s.scheduleItem}>• {item}</Text>)}
          </View>
        ))}
      </Card>

      <Card title="Cardio Regime">
        <Text style={s.note}>{draft.cardio.inclineTreadmill}</Text>
        <Text style={s.note}>{draft.cardio.outdoorWalking}</Text>
        <Text style={s.note}>{draft.cardio.heartRateZone}</Text>
        <Text style={s.note}>{draft.cardio.recoveryRule}</Text>
        <View style={s.adjustRow}>
          <Pressable onPress={() => adjustCardio(-100)} style={s.smallButton}><Text style={s.smallButtonText}>-100 cal</Text></Pressable>
          <Text style={s.adjustValue}>{draft.cardio.weeklyTargetCalories} weekly cal</Text>
          <Pressable onPress={() => adjustCardio(100)} style={s.smallButton}><Text style={s.smallButtonText}>+100 cal</Text></Pressable>
        </View>
      </Card>

      {!!draft.mealPortfolio?.length && (
        <Card title="Meal Portfolio">
          <View style={s.macroGrid}>
            <Macro label="Calories" value={draft.nutrition.calorieGoal} onChange={value => updateNutrition({ calorieGoal: value })} />
            <Macro label="Protein" value={draft.nutrition.proteinGoal} suffix="g" onChange={value => updateNutrition({ proteinGoal: value })} />
            <Macro label="Carbs" value={draft.nutrition.carbGoal} suffix="g" onChange={value => updateNutrition({ carbGoal: value })} />
            <Macro label="Fat" value={draft.nutrition.fatGoal} suffix="g" onChange={value => updateNutrition({ fatGoal: value })} />
          </View>
          <Text style={s.note}>{draft.nutrition.strategy}</Text>
          <Text style={s.note}>{draft.nutrition.mealTiming}</Text>
          {!!draft.nutrition.maintenanceCalories && (
            <View style={s.calorieExplainBox}>
              <Text style={s.exerciseName}>Estimated calorie logic</Text>
              <Text style={s.muted}>BMR: {draft.nutrition.bmr} · Daily life: ~{draft.nutrition.baseTDEE} · Workouts/cardio: +{draft.nutrition.exerciseCaloriesPerDay}/day</Text>
              <Text style={s.muted}>Maintenance range: {draft.nutrition.maintenanceLow}-{draft.nutrition.maintenanceHigh} calories</Text>
              <Text style={s.muted}>Workout days: {draft.nutrition.targetCaloriesWorkoutDay} · Rest days: {draft.nutrition.targetCaloriesRestDay}</Text>
              <Text style={s.muted}>Calos will refine this after 10-14 days of logs.</Text>
            </View>
          )}
          <Text style={s.sectionSubhead}>Selected Meals</Text>
          {selectedMeals.map(meal => (
            <View key={meal.id} style={s.mealRowStandalone}>
              <Text style={s.mealName}>{meal.type}: {meal.name}</Text>
              <Text style={s.muted}>{meal.calories} cal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g · {meal.serving}</Text>
            </View>
          ))}
        </Card>
      )}

      <Card title="Validation">
        {draft.validationSummary.map(item => <Text key={item} style={s.check}>✓ {item}</Text>)}
        {draft.optimizationSummary.map(item => <Text key={item} style={s.check}>✓ {item}</Text>)}
      </Card>

      <Pressable style={s.lockButton} onPress={() => onLockIn(draft)}>
        <Text style={s.lockButtonText}>Lock In My Plan</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Macro({ label, value, suffix = '', onChange }: { label: string; value: number; suffix?: string; onChange: (value: number) => void }) {
  return (
    <View style={s.macroBox}>
      <Text style={s.macroLabel}>{label}</Text>
      <TextInput
        value={String(value)}
        onChangeText={text => onChange(Number(text) || 0)}
        keyboardType="numeric"
        style={s.macroInput}
      />
      <Text style={s.macroSuffix}>{suffix}</Text>
    </View>
  );
}

function MiniNumber({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <View style={s.miniNumber}>
      <Text style={s.miniLabel}>{label}</Text>
      <TextInput value={String(value)} onChangeText={text => onChange(Number(text) || 0)} keyboardType="numeric" style={s.miniInput} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  content: { padding: 16, paddingBottom: 28 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconButton: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244' },
  kicker: { color: '#34d399', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 30, fontWeight: '900' },
  hero: { backgroundColor: '#082016', borderColor: '#14532d', borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 14 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  heroSub: { color: '#bbf7d0', marginTop: 5, fontWeight: '700' },
  card: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#1f2937', borderRadius: 16, padding: 14, marginBottom: 14 },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  dayBox: { backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: '#243244', padding: 10, marginBottom: 8 },
  dayTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayName: { color: '#fff', fontSize: 15, fontWeight: '900' },
  muted: { color: '#94a3b8', fontSize: 12, marginTop: 3 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#1f2937' },
  exerciseEdit: { gap: 8, paddingTop: 10, marginTop: 10, borderTopWidth: 1, borderTopColor: '#1f2937' },
  inlineInput: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: '#fff', fontWeight: '900', marginTop: 8 },
  compactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  miniNumber: { width: '23%', minWidth: 70, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 10, padding: 8 },
  miniLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '900' },
  miniInput: { color: '#fff', fontWeight: '900', paddingVertical: 2 },
  exerciseActions: { flexDirection: 'row', gap: 8 },
  backupLabel: { color: '#34d399', fontWeight: '900', fontSize: 12, marginTop: 2 },
  backupGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  backupChip: { borderRadius: 999, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', paddingHorizontal: 10, paddingVertical: 7 },
  backupChipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  backupChipText: { color: '#cbd5e1', fontSize: 12, fontWeight: '800' },
  backupChipTextActive: { color: '#052e1c' },
  exerciseName: { color: '#fff', fontWeight: '900' },
  sectionSubhead: { color: '#f8fafc', fontSize: 15, fontWeight: '900', marginTop: 14, marginBottom: 2 },
  smallButton: { borderRadius: 10, borderWidth: 1, borderColor: '#34d399', paddingHorizontal: 10, paddingVertical: 7 },
  smallButtonText: { color: '#34d399', fontSize: 12, fontWeight: '900' },
  dangerButton: { borderRadius: 10, borderWidth: 1, borderColor: '#ef4444', paddingHorizontal: 10, paddingVertical: 7 },
  dangerButtonText: { color: '#fecaca', fontSize: 12, fontWeight: '900' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#34d399', borderRadius: 12, paddingVertical: 10, marginTop: 10 },
  addButtonText: { color: '#052e1c', fontWeight: '900' },
  toggleButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, padding: 10, borderRadius: 12, backgroundColor: '#0b1220' },
  toggleText: { color: '#cbd5e1', fontWeight: '900' },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  macroBox: { width: '48%', backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: '#243244', padding: 10 },
  macroLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800' },
  macroInput: { color: '#fff', fontSize: 22, fontWeight: '900', paddingVertical: 4 },
  macroSuffix: { color: '#64748b', fontSize: 11, fontWeight: '800' },
  note: { color: '#cbd5e1', lineHeight: 19, marginTop: 8, fontSize: 13 },
  warningNote: { color: '#fde68a', lineHeight: 19, marginTop: 4, marginBottom: 10, fontSize: 13, fontWeight: '800' },
  scheduleItem: { color: '#e2e8f0', fontWeight: '800', marginBottom: 7 },
  adjustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  adjustValue: { color: '#fff', fontWeight: '900' },
  activityBox: { marginTop: 10, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 10 },
  backupDayBox: { marginTop: 10, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 10 },
  mealSet: { backgroundColor: '#0b1220', borderRadius: 12, borderWidth: 1, borderColor: '#243244', padding: 10, marginBottom: 10 },
  calorieExplainBox: { backgroundColor: '#082016', borderWidth: 1, borderColor: '#14532d', borderRadius: 12, padding: 10, marginTop: 10 },
  mealRow: { paddingTop: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: '#1f2937' },
  mealRowStandalone: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 10, marginTop: 10 },
  mealName: { color: '#e2e8f0', fontWeight: '900', fontSize: 13 },
  check: { color: '#bbf7d0', fontWeight: '800', marginBottom: 6 },
  lockButton: { backgroundColor: '#34d399', borderRadius: 14, paddingVertical: 15, alignItems: 'center', marginBottom: 18 },
  lockButtonText: { color: '#052e1c', fontSize: 16, fontWeight: '900' },
});
