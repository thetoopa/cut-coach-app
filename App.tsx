import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarView } from './src/components/CalendarView';
import { DayDetailModal } from './src/components/DayDetailModal';
import { AICoachModal } from './src/components/AICoachModal';
import { OnboardingFlow } from './src/components/OnboardingFlow';
import { calculateCardioPlan, calculateWaterPlan, WeeklyLossRate, calculateEffectiveCalorieGoal, calculateNutritionTargets, getProgressionRecommendation, suggestedRestSeconds, weeklyLossOptions } from './src/utils/calculations';
type Tab = 'Today' | 'Calendar' | 'Meals' | 'Workout' | 'Cardio' | 'Water' | 'Grocery' | 'Weight' | 'Profile';
type Meal = { id: string; name: string; type: 'Breakfast'|'Lunch'|'Dinner'|'Snack'; calories: number; protein: number; carbs: number; fat: number; notes: string; custom?: boolean };
type Exercise = { id: string; name: string; sets: number; minReps: number; maxReps: number; weight: number; lastReps: number[]; backup?: string };
type WorkoutDay = { id: string; name: string; exercises: Exercise[]; cardioMin: number; backup: string[] };
type Profile = { name: string; goal?: 'cut'|'bulk'|'maintain'; age: number; sex: 'male'|'female'; heightIn: number; weight: number; goalWeight: number; activity: number; aggression: number; proteinGoal: number; calorieGoal: number; weeklyLossRate?: WeeklyLossRate; gymDaysPerWeek?: number };
type DayLog = { date: string; weight?: number; calories: number; protein: number; outdoorWalk: number; inclineWalk: number; cardioBurnedCalories?: number; golfBurnedCalories?: number; otherBurnedCalories?: number; workoutBurnedCalories?: number; golf: boolean; golfHoles?: number; golfMode?: 'riding'|'walking'; waterOz?: number; plannedLift?: boolean; drinking: boolean; drinks: number; workoutDone: boolean; selectedMeals: string[]; notes: string };
type GroceryItem = { id: string; name: string; source: string; store: string; needed: boolean; bought: boolean };
type WeightRange = 'Week' | 'Month' | 'Quarter' | 'Year' | 'All' | 'Custom';

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

const defaultProfile: Profile = { name: 'Cooper', goal: 'cut', age: 24, sex: 'male', heightIn: 69, weight: 170, goalWeight: 155, activity: 1.5, aggression: 500, proteinGoal: 170, calorieGoal: 1900, weeklyLossRate: 1, gymDaysPerWeek: 4 };

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

function Section({title, children}:{title:string; children:React.ReactNode}){ return <View style={s.card}><Text style={s.h2}>{title}</Text>{children}</View> }
function Pill({children, onPress, active=false}:{children:React.ReactNode; onPress?:()=>void; active?:boolean}){ return <Pressable onPress={onPress} style={[s.pill, active && s.pillActive]}><Text style={[s.pillText, active && s.pillTextActive]}>{children}</Text></Pressable> }
function Input({label, value, onChange}:{label:string; value:string; onChange:(x:string)=>void}){ return <View style={{marginBottom:10}}><Text style={s.label}>{label}</Text><TextInput style={s.input} value={value} onChangeText={onChange} keyboardType="numbers-and-punctuation" /></View> }

export default function App(){
  const [tab,setTab]=useState<Tab>('Today');
  const [profile,setProfile]=useState<Profile>(defaultProfile);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
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
  const [manualMeal, setManualMeal] = useState<Meal>(blankMeal());
  const [workoutRunning, setWorkoutRunning] = useState(false);
  const [workoutSeconds, setWorkoutSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>(['Costco', 'Trader Joe’s']);
  const [weightRange, setWeightRange] = useState<WeightRange>('Month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const picked = mealsState.filter(m=>log.selectedMeals.includes(m.id));
  const mealCals = picked.reduce((a,m)=>a+m.calories,0), mealProtein=picked.reduce((a,m)=>a+m.protein,0);
  const alcoholCals = log.drinking ? log.drinks*115 : 0;
  const cardioPlan = calculateCardioPlan(log, profile);
  const waterPlan = calculateWaterPlan(log, profile);
  const effectiveCalories = calculateEffectiveCalorieGoal(profile, log);
  const calorieGoal = effectiveCalories.goal;
  const caloriesLeft = calorieGoal - mealCals - alcoholCals;
  const proteinLeft = profile.proteinGoal - mealProtein;
  const liftMessage = log.plannedLift === false
    ? `No lift planned today. Base target is active at ${effectiveCalories.baseGoal} calories.`
    : log.workoutDone
      ? `Lift completed. Added ${effectiveCalories.workoutCredit} workout calories to today's food target.`
      : `Lift planned but not completed yet. Base target is active. Mark done to add about ${effectiveCalories.workoutCalories} workout calories.`;

  function toggleMeal(id:string){ setLog(l=>({...l, selectedMeals: l.selectedMeals.includes(id) ? l.selectedMeals.filter(x=>x!==id) : [...l.selectedMeals,id]})); }
  function updateExercise(wi:number, ei:number, patch:Partial<Exercise>){ setWorkouts(ws=>ws.map((w,i)=> i!==wi?w:{...w, exercises:w.exercises.map((e,j)=>j!==ei?e:{...e,...patch})})); }
  function progressionText(e:Exercise){ return getProgressionRecommendation(e).text; }
  function startRestTimer(seconds:number){ setRestSeconds(seconds); Vibration.vibrate(30); }
  function applyProgression(wi:number, ei:number){ const rec=getProgressionRecommendation(workouts[wi].exercises[ei]); if(rec.action==='increase') updateExercise(wi,ei,{weight:rec.nextWeight,lastReps:Array.from({length:workouts[wi].exercises[ei].sets}).map(()=>0)}); }

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
        setLog(v.log?.date === todayKey() ? v.log : { ...log, date: todayKey() });
        setWorkouts(v.workouts ?? baseWorkouts);
        setDayLogs(v.dayLogs ?? {});
        setMealsState(v.meals ?? meals);
        setGroceryItems(v.groceryItems ?? []);
        setSelectedStores(v.selectedStores ?? ['Costco', 'Trader Joe’s']);
        // Check if profile has required fields from onboarding
        setHasSeenOnboarding(!!(loadedProfile.name && loadedProfile.weight && loadedProfile.calorieGoal));
      } else {
        // First time - no saved data
        setHasSeenOnboarding(false);
      }
      setIsLoadingProfile(false);
    })();
  }, []);

  // Auto-save whenever profile changes
  useEffect(() => {
    setLog(current => current.calories === mealCals && current.protein === mealProtein
      ? current
      : {...current, calories: mealCals, protein: mealProtein}
    );
  }, [mealCals, mealProtein]);

  useEffect(() => {
    if (!isLoadingProfile) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile, log, workouts, dayLogs, meals: mealsState, groceryItems, selectedStores }));
    }
  }, [profile, log, workouts, dayLogs, mealsState, groceryItems, selectedStores, isLoadingProfile]);

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
    setProfile(completedProfile);
    setHasSeenOnboarding(true);
    // Save completed profile
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ profile: completedProfile, log, workouts, dayLogs, meals: mealsState, groceryItems, selectedStores }));
  };

  const resetLocalData = async () => {
    await AsyncStorage.multiRemove([STORAGE_KEY, LEGACY_STORAGE_KEY]);
    setProfile(defaultProfile);
    setLog({date:todayKey(), calories:0, protein:0, outdoorWalk:0, inclineWalk:0, cardioBurnedCalories:undefined, golfBurnedCalories:undefined, otherBurnedCalories:0, workoutBurnedCalories:undefined, golf:false, golfHoles:18, golfMode:'riding', waterOz:0, plannedLift:true, drinking:false, drinks:0, workoutDone:false, selectedMeals:[], notes:''});
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

  const handleSaveAIWorkout = (generatedWorkouts: WorkoutDay[]) => {
    setWorkouts(generatedWorkouts);
    setSelectedWorkout(0);
    setWorkoutRunning(false);
    setWorkoutSeconds(0);
    setRestSeconds(0);
    setLog(current => ({...current, plannedLift: true}));
  };

  const handleSaveManualMeal = () => {
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
    setManualMeal(blankMeal());
    setShowManualMeal(false);
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

  if (isLoadingProfile) {
    return <SafeAreaView style={s.app}><StatusBar style="light"/><View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><Text style={{color: '#fff'}}>Loading...</Text></View></SafeAreaView>;
  }

  // Show onboarding if user hasn't completed it
  if (!hasSeenOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return <SafeAreaView style={s.app}><StatusBar style="light"/><View style={s.header}><Text style={s.title}>CalorieCounter</Text><Text style={s.sub}>Track, analyze, thrive</Text></View>
    <View style={s.tabs}>{(['Today','Calendar','Meals','Workout','Cardio','Water','Grocery','Weight','Profile'] as Tab[]).map(t=><Pill key={t} active={tab===t} onPress={()=>setTab(t)}>{t}</Pill>)}</View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}>
      {tab==='Today' && <>
        <Section title="Today Snapshot">
          <View style={s.grid}><Metric label="Calories left" value={caloriesLeft}/><Metric label="Protein left" value={Math.max(0,proteinLeft)}/><Metric label="Cardio burned" value={cardioPlan.burnedCalories}/><Metric label="Cardio burn left" value={cardioPlan.remainingCalories}/><Metric label="Lift food credit" value={effectiveCalories.workoutCredit}/><Metric label="Water oz left" value={waterPlan.remainingOunces}/></View>
          <Text style={s.note}>Target: {calorieGoal} calories / {profile.proteinGoal}g protein. {liftMessage}</Text>
        </Section>
        <Section title="Day Modes">
          <View style={s.row}><Pill active={log.plannedLift !== false} onPress={()=>setLog(l=>({...l,plannedLift:!(l.plannedLift !== false)}))}>Lift planned</Pill><Pill active={log.golf} onPress={()=>setLog(l=>({...l,golf:!l.golf}))}>Golf day</Pill><Pill active={log.drinking} onPress={()=>setLog(l=>({...l,drinking:!l.drinking}))}>Drinking day</Pill><Pill active={log.workoutDone} onPress={()=>setLog(l=>({...l,workoutDone:!l.workoutDone}))}>Workout done</Pill></View>
          {log.drinking && <Input label="Planned drinks" value={String(log.drinks)} onChange={v=>setLog(l=>({...l,drinks:num(v)}))}/>} 
        </Section>
        <Section title="Morning Weight">
          <Input label="Morning weight" value={String(log.weight??'')} onChange={v=>setLog(l=>({...l,weight:num(v)}))}/>
          <Text style={s.helpText}>Weigh before food, water, or training. Use the bathroom first, weigh at the same time daily, and ideally weigh undressed.</Text>
        </Section>
        <Section title="Cardio">
          <Input label="Outdoor walk minutes" value={String(log.outdoorWalk)} onChange={v=>setLog(l=>({...l,outdoorWalk:num(v),cardioBurnedCalories:undefined}))}/>
          <Input label="Incline treadmill minutes" value={String(log.inclineWalk)} onChange={v=>setLog(l=>({...l,inclineWalk:num(v),cardioBurnedCalories:undefined}))}/>
          <Text style={s.helpText}>Estimated cardio burn: {cardioPlan.estimatedCardioCalories} calories. Wearables can overestimate walking and lifting calories, so the app estimate may be safer when numbers look inflated.</Text>
          <Input label="Cardio calories burned" value={String(log.cardioBurnedCalories ?? cardioPlan.estimatedCardioCalories)} onChange={v=>setLog(l=>({...l,cardioBurnedCalories:v === '' ? undefined : num(v)}))}/>
          <Input label="Other burned calories" value={String(log.otherBurnedCalories ?? 0)} onChange={v=>setLog(l=>({...l,otherBurnedCalories:num(v)}))}/>
          <Text style={s.helpText}>Use other burned calories for sports, classes, or health-device activity that is not already counted above.</Text>
          {log.golf && <>
            <View style={s.row}><Pill active={(log.golfMode ?? 'riding')==='riding'} onPress={()=>setLog(l=>({...l,golfMode:'riding'}))}>Riding</Pill><Pill active={log.golfMode==='walking'} onPress={()=>setLog(l=>({...l,golfMode:'walking'}))}>Walking</Pill></View>
            <Input label="Golf holes" value={String(log.golfHoles ?? 18)} onChange={v=>setLog(l=>({...l,golfHoles:num(v)}))}/>
            <Text style={s.note}>Golf estimate: about {cardioPlan.estimatedGolfCalories} calories. Override it below if your watch or cart app gives a better number.</Text>
            <Input label="Golf calories burned" value={String(log.golfBurnedCalories ?? cardioPlan.estimatedGolfCalories)} onChange={v=>setLog(l=>({...l,golfBurnedCalories:v === '' ? undefined : num(v)}))}/>
          </>}
        </Section>
        <Section title="Workout Calories">
          <Text style={s.note}>Workout calorie estimate: {effectiveCalories.estimatedWorkoutCalories}. Mark workout done to add the workout credit to your food target.</Text>
          <Input label="Workout calories burned" value={String(log.workoutBurnedCalories ?? effectiveCalories.estimatedWorkoutCalories)} onChange={v=>setLog(l=>({...l,workoutBurnedCalories:v === '' ? undefined : num(v)}))}/>
          <Text style={s.helpText}>Fitness watches are often least accurate for lifting because heart rate does not map cleanly to strength work. Use the app estimate when the wearable number seems too generous.</Text>
        </Section>
        <Section title="Water">
          <Input label="Water ounces" value={String(log.waterOz ?? 0)} onChange={v=>setLog(l=>({...l,waterOz:num(v)}))}/>
          <View style={s.row}><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+8}))}>+8 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+16}))}>+16 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+32}))}>+32 oz</Pill><Pill onPress={()=>setLog(l=>({...l,waterOz:(l.waterOz ?? 0)+64}))}>+64 oz</Pill></View>
          <Text style={s.helpText}>{waterPlan.loggedOunces}/{waterPlan.targetOunces} oz complete. Water gets a calendar droplet when complete, but it does not block green day status.</Text>
        </Section>
      </>}

      {tab==='Calendar' && <Section title="Calendar & Logging"><CalendarView dayLogs={dayLogs} profile={profile} currentLog={log} allMeals={mealsState} onDayPress={handleDayPress} /></Section>}

      {tab==='Meals' && <>
        <Section title="🍽️ Your Meal Menu">
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
            <Pressable style={{flex: 1}} onPress={() => setShowAICoach(true)}><View style={s.aiButton}><MaterialIcons name="smart-toy" size={16} color="#fff" /><Text style={s.aiButtonText}>Ask AI Coach</Text></View></Pressable>
            <Pressable style={{flex: 1}} onPress={() => setShowManualMeal(true)}><View style={s.manualButton}><MaterialIcons name="add-circle-outline" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>Add Meal</Text></View></Pressable>
          </View>
          <Text style={s.note}>Tap meals to add/remove. These are your available meal options for the day. AI meals you save here will appear in this menu too.</Text>
        </Section>
        {(['Breakfast','Lunch','Dinner','Snack'] as const).map(type=><Section key={type} title={type}>{mealsState.filter(m=>m.type===type).map(m=><Pressable key={m.id} onPress={()=>toggleMeal(m.id)} style={[s.meal, log.selectedMeals.includes(m.id)&&s.mealActive]}><Text style={s.mealTitle}>{m.name}{m.custom ? ' ✨' : ''}</Text><Text style={s.mealSub}>{m.calories} cal · {m.protein}g protein · {m.carbs}C/{m.fat}F</Text><Text style={s.note}>{m.notes}</Text></Pressable>)}</Section>)}
      </>}

      {tab==='Workout' && <>
        <Section title="Workout Guide">
          <Text style={s.note}>Start the workout timer when lifting begins. Log weight and reps for each set. Hit the suggested rest timer after hard sets. When every set reaches the top of the rep range, use Apply next to raise weight next session.</Text>
          <Pressable onPress={() => setShowAIWorkout(true)}><View style={s.manualButton}><MaterialIcons name="fitness-center" size={16} color="#cbd5e1" /><Text style={s.manualButtonText}>AI Workout Review</Text></View></Pressable>
        </Section>
        <Section title="Pick Workout"><View style={s.row}>{workouts.map((w,i)=><Pill key={w.id} active={i===selectedWorkout} onPress={()=>setSelectedWorkout(i)}>{w.name.split(' ')[0]}</Pill>)}</View></Section>
        <Section title={workouts[selectedWorkout].name}>
          <View style={s.timerPanel}>
            <Text style={s.cardioValue}>{formatSeconds(workoutSeconds)}</Text>
            <Text style={s.cardioLabel}>{workoutRunning ? 'workout running' : 'workout paused'}</Text>
            <View style={s.row}><Pill active={workoutRunning} onPress={()=>setWorkoutRunning(r=>!r)}>{workoutRunning ? 'Pause' : 'Start'}</Pill><Pill onPress={()=>{setWorkoutRunning(false);setWorkoutSeconds(0);setRestSeconds(0);}}>Reset</Pill><Pill active={log.workoutDone} onPress={()=>setLog(l=>({...l,workoutDone:!l.workoutDone,plannedLift:true}))}>Mark done</Pill></View>
            <Text style={s.note}>Rest countdown: {formatSeconds(restSeconds)}. Tap the rest button under each exercise after a hard set.</Text>
            <Text style={s.note}>Workout calorie estimate: {effectiveCalories.estimatedWorkoutCalories}. Food target credit when marked done: {effectiveCalories.workoutCredit}.</Text>
            <Input label="Workout calories burned" value={String(log.workoutBurnedCalories ?? effectiveCalories.estimatedWorkoutCalories)} onChange={v=>setLog(l=>({...l,workoutBurnedCalories:v === '' ? undefined : num(v)}))}/>
          </View>
          {workouts[selectedWorkout].exercises.map((e,ei)=>{ const restTime = suggestedRestSeconds(e); return <View key={e.id} style={s.exercise}><Text style={s.mealTitle}>{e.name}</Text><Text style={s.mealSub}>{e.sets} sets · {e.minReps}-{e.maxReps} reps · current {e.weight} lb</Text><Text style={s.restHint}>Rest between sets: {formatSeconds(restTime)}</Text><Input label="Weight used" value={String(e.weight)} onChange={v=>updateExercise(selectedWorkout,ei,{weight:num(v)})}/>
            <View style={s.setRow}>{Array.from({length:e.sets}).map((_,si)=><TextInput key={si} style={s.repBox} placeholder={`S${si+1}`} placeholderTextColor="#64748b" keyboardType="numeric" value={e.lastReps[si]?String(e.lastReps[si]):''} onChangeText={v=>{ const reps=[...e.lastReps]; reps[si]=num(v); updateExercise(selectedWorkout,ei,{lastReps:reps}); }}/>)}</View>
            <View style={s.row}><Pill active={restSeconds > 0} onPress={()=>startRestTimer(restTime)}>Start {formatSeconds(restTime)} rest</Pill><Pill onPress={()=>applyProgression(selectedWorkout,ei)}>Apply next</Pill></View>
            <Text style={s.note}>{progressionText(e)} Backup: {e.backup}</Text></View>})}
        </Section>
        <Section title="If You Miss Gym"><Text style={s.note}>{workouts[selectedWorkout].backup.map(x=>'• '+x).join('\n')}</Text></Section>
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
        <Section title="Cardio Log"><Input label="Outdoor walk minutes" value={String(log.outdoorWalk)} onChange={v=>setLog(l=>({...l,outdoorWalk:num(v),cardioBurnedCalories:undefined}))}/><Input label="Incline treadmill minutes" value={String(log.inclineWalk)} onChange={v=>setLog(l=>({...l,inclineWalk:num(v),cardioBurnedCalories:undefined}))}/><Text style={s.helpText}>Estimated cardio burn from walking: {cardioPlan.estimatedCardioCalories} calories. Wearables can overestimate activity calories; use device numbers only when they seem reasonable.</Text><Input label="Cardio calories burned" value={String(log.cardioBurnedCalories ?? cardioPlan.estimatedCardioCalories)} onChange={v=>setLog(l=>({...l,cardioBurnedCalories:v === '' ? undefined : num(v)}))}/><Input label="Other burned calories" value={String(log.otherBurnedCalories ?? 0)} onChange={v=>setLog(l=>({...l,otherBurnedCalories:num(v)}))}/><Text style={s.helpText}>Add manual calories only for activity not already logged as walking, incline, or golf.</Text><View style={s.row}><Pill active={log.golf} onPress={()=>setLog(l=>({...l,golf:!l.golf}))}>Golf</Pill>{log.golf && <><Pill active={(log.golfMode ?? 'riding')==='riding'} onPress={()=>setLog(l=>({...l,golfMode:'riding',golfBurnedCalories:undefined}))}>Riding</Pill><Pill active={log.golfMode==='walking'} onPress={()=>setLog(l=>({...l,golfMode:'walking',golfBurnedCalories:undefined}))}>Walking</Pill></>}</View>{log.golf && <><Input label="Golf holes" value={String(log.golfHoles ?? 18)} onChange={v=>setLog(l=>({...l,golfHoles:num(v),golfBurnedCalories:undefined}))}/><Text style={s.helpText}>Estimated golf burn: {cardioPlan.estimatedGolfCalories} calories.</Text><Input label="Golf calories burned" value={String(log.golfBurnedCalories ?? cardioPlan.estimatedGolfCalories)} onChange={v=>setLog(l=>({...l,golfBurnedCalories:v === '' ? undefined : num(v)}))}/></>}</Section>
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
          <Text style={s.helpText}>Withings support would require a real Withings OAuth connection and API sync. This local view uses weights logged in CalorieCounter for now.</Text>
        </Section>
      </>}

      {tab==='Profile' && <>
        <Section title="Your Settings">
          <Input label="Age" value={String(profile.age)} onChange={v=>setProfile(p=>({...p,age:num(v)}))}/><Input label="Height inches" value={String(profile.heightIn)} onChange={v=>setProfile(p=>({...p,heightIn:num(v)}))}/><Input label="Current weight" value={String(profile.weight)} onChange={v=>setProfile(p=>({...p,weight:num(v)}))}/><Input label="Goal weight" value={String(profile.goalWeight)} onChange={v=>setProfile(p=>({...p,goalWeight:num(v)}))}/><Input label="Gym days/week" value={String(profile.gymDaysPerWeek ?? 4)} onChange={v=>setProfile(p=>({...p,gymDaysPerWeek:num(v)}))}/><Input label="Daily calorie goal" value={String(profile.calorieGoal)} onChange={v=>setProfile(p=>({...p,calorieGoal:num(v)}))}/><Input label="Protein goal" value={String(profile.proteinGoal)} onChange={v=>setProfile(p=>({...p,proteinGoal:num(v)}))}/>
          <Text style={s.label}>Weight loss rate</Text>
          <View style={s.row}>{Object.values(weeklyLossOptions).map(option=><Pill key={option.rate} active={(profile.weeklyLossRate ?? 1)===option.rate} onPress={()=>{const targets=calculateNutritionTargets({...profile,weeklyLossRate:option.rate,goal:'cut'});setProfile(p=>({...p,goal:'cut',weeklyLossRate:option.rate,aggression:targets.deficit,calorieGoal:targets.calorieGoal,proteinGoal:targets.proteinGoal}))}}>{option.label}</Pill>)}</View>
          <Text style={s.note}>Maintenance estimate: {calculateNutritionTargets(profile).maintenance}. Current target before missed-lift adjustment: {profile.calorieGoal}. You can override it above.</Text><Pill onPress={()=>Alert.alert('Saved locally','This app stores data on this phone using AsyncStorage.')}>Storage info</Pill>
          <View style={{marginTop:10}}><Pill onPress={()=>Alert.alert('Reset app data','This clears local CalorieCounter data and shows onboarding again.',[{text:'Cancel',style:'cancel'},{text:'Reset',style:'destructive',onPress:resetLocalData}])}>Reset intake / local data</Pill></View>
        </Section>
      </>}
      <View style={s.brandFooter}>
        <Text style={s.brandFooterText}>Created and owned by Toopa Group LLC</Text>
      </View>
    </ScrollView>
    <DayDetailModal
      visible={showDayModal}
      dateKey={selectedDateForModal}
      dayLog={currentModalLog || {date: '', calories: 0, protein: 0, outdoorWalk: 0, inclineWalk: 0, cardioBurnedCalories: undefined, golfBurnedCalories: undefined, otherBurnedCalories: 0, workoutBurnedCalories: undefined, golf: false, golfHoles: 18, golfMode: 'riding', waterOz: 0, plannedLift: true, drinking: false, drinks: 0, workoutDone: false, selectedMeals: [], notes: ''}}
      profile={profile}
      onClose={() => setShowDayModal(false)}
      onSave={handleSaveDayLog}
      allMeals={mealsState}
    />
    <AICoachModal
      visible={showAICoach}
      profile={profile}
      dayContext={{ caloriesLeft, proteinLeft: Math.max(0, proteinLeft), calorieGoal, caloriesLogged: mealCals + alcoholCals, proteinLogged: mealProtein, cardioBurned: cardioPlan.burnedCalories, cardioRemaining: cardioPlan.remainingCalories }}
      currentMeals={mealsState}
      onClose={() => setShowAICoach(false)}
      onSaveMeals={handleSaveAIMeals}
    />
    <AICoachModal
      visible={showAIWorkout}
      profile={profile}
      mode="workout"
      workouts={workouts}
      dayContext={{ caloriesLeft, proteinLeft: Math.max(0, proteinLeft), calorieGoal, caloriesLogged: mealCals + alcoholCals, proteinLogged: mealProtein, cardioBurned: cardioPlan.burnedCalories, cardioRemaining: cardioPlan.remainingCalories }}
      onClose={() => setShowAIWorkout(false)}
      onSaveMeals={() => {}}
      onSaveWorkout={handleSaveAIWorkout}
    />
    <ManualMealModal
      visible={showManualMeal}
      meal={manualMeal}
      onChange={setManualMeal}
      onClose={() => setShowManualMeal(false)}
      onSave={handleSaveManualMeal}
    />
  </SafeAreaView>
}

function Metric({label,value}:{label:string;value:number}){ return <View style={s.metric}><Text style={s.metricValue}>{Math.round(value)}</Text><Text style={s.metricLabel}>{label}</Text></View> }
function formatSeconds(seconds:number){ const mins=Math.floor(seconds/60); const secs=seconds%60; return `${mins}:${String(secs).padStart(2,'0')}`; }

function ingredientsFromMeal(meal: Meal) {
  const text = `${meal.name} ${meal.notes}`.toLowerCase();
  const known = [
    'chicken', 'turkey', 'beef', 'steak', 'salmon', 'tuna', 'eggs', 'egg whites',
    'protein powder', 'banana', 'almond milk', 'potatoes', 'sweet potato', 'rice',
    'pasta', 'olive oil', 'sauce', 'cucumber', 'seaweed', 'bun', 'mustard',
    'peanut butter', 'rice cakes', 'chips', 'chicken sausage',
  ];
  const found = known.filter(item => text.includes(item));
  return found.length > 0 ? found.map(item => item.replace(/\b\w/g, char => char.toUpperCase())) : [meal.name];
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

function ManualMealModal({visible, meal, onChange, onClose, onSave}:{visible:boolean; meal:Meal; onChange:(meal:Meal)=>void; onClose:()=>void; onSave:()=>void}) {
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
          <Pressable onPress={onSave} style={s.saveWide}><MaterialIcons name="check" size={18} color="#052e1c" /><Text style={s.saveWideText}>Save Meal</Text></Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s=StyleSheet.create({app:{flex:1,backgroundColor:'#0b0f14'},header:{padding:16,paddingBottom:8},title:{fontSize:34,fontWeight:'800',color:'#fff'},sub:{color:'#94a3b8',marginTop:2},tabs:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:16,paddingBottom:8},pill:{borderRadius:999,paddingVertical:9,paddingHorizontal:13,backgroundColor:'#111827',borderWidth:1,borderColor:'#1f2937'},pillActive:{backgroundColor:'#34d399'},pillText:{color:'#cbd5e1',fontWeight:'700'},pillTextActive:{color:'#052e1c'},card:{backgroundColor:'#111827',borderColor:'#1f2937',borderWidth:1,borderRadius:16,padding:14,marginBottom:14},h2:{fontSize:20,fontWeight:'800',color:'#f8fafc',marginBottom:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',backgroundColor:'#0b1220',borderRadius:14,padding:14},metricValue:{fontSize:26,fontWeight:'900',color:'#fff'},metricLabel:{color:'#94a3b8',marginTop:4},note:{color:'#94a3b8',lineHeight:20,marginTop:6},helpText:{color:'#64748b',fontSize:12,lineHeight:18,marginTop:-4,marginBottom:10},restHint:{color:'#34d399',fontSize:12,fontWeight:'800',marginTop:6,marginBottom:4},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},label:{color:'#cbd5e1',fontWeight:'700',marginBottom:5},input:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:12,padding:11,color:'#fff'},meal:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:10},mealActive:{borderColor:'#34d399',backgroundColor:'#082016'},mealTitle:{fontSize:16,fontWeight:'800',color:'#fff'},mealSub:{color:'#cbd5e1',marginTop:4},crossed:{textDecorationLine:'line-through',color:'#64748b'},exercise:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:12},setRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},repBox:{width:58,backgroundColor:'#111827',borderWidth:1,borderColor:'#334155',borderRadius:12,padding:10,color:'#fff',textAlign:'center'},timerPanel:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:14,marginBottom:12},aiButton:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,paddingHorizontal:14,backgroundColor:'#34d399',borderRadius:12,justifyContent:'center'},aiButtonText:{color:'#052e1c',fontWeight:'700',fontSize:14},manualButton:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,paddingHorizontal:14,backgroundColor:'#0b1220',borderRadius:12,borderWidth:1,borderColor:'#243244',justifyContent:'center'},manualButtonText:{color:'#cbd5e1',fontWeight:'700',fontSize:14},cardioHero:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:14,marginBottom:10},cardioValue:{fontSize:34,fontWeight:'900',color:'#fff'},cardioLabel:{color:'#cbd5e1',fontWeight:'800'},progressTrack:{height:10,backgroundColor:'#1f2937',borderRadius:999,overflow:'hidden',marginTop:12},progressFill:{height:'100%',backgroundColor:'#34d399',borderRadius:999},groceryItem:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:12,marginBottom:10,flexDirection:'row',gap:10,alignItems:'center'},groceryActions:{gap:6,alignItems:'flex-end'},storeChip:{flexDirection:'row',alignItems:'center',gap:6,alignSelf:'flex-start',marginTop:8,paddingVertical:6,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:'#334155',backgroundColor:'#111827'},storeChipText:{color:'#cbd5e1',fontSize:12,fontWeight:'700'},chart:{height:150,backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:14,padding:10,marginTop:12,flexDirection:'row',alignItems:'flex-end',gap:5},chartBarWrap:{flex:1,alignItems:'center',justifyContent:'flex-end'},chartBar:{width:'70%',backgroundColor:'#34d399',borderRadius:5},chartLabel:{color:'#64748b',fontSize:8,marginTop:5,transform:[{rotate:'-45deg'}]},brandFooter:{paddingHorizontal:16,paddingTop:8,paddingBottom:20,alignItems:'center'},brandFooterText:{color:'#64748b',fontSize:11,letterSpacing:0},modalBackdrop:{flex:1,justifyContent:'flex-end',backgroundColor:'rgba(0,0,0,0.55)'},modalCard:{backgroundColor:'#111827',borderTopLeftRadius:18,borderTopRightRadius:18,borderWidth:1,borderColor:'#243244',padding:16,paddingBottom:24},modalHeader:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},iconButton:{width:40,height:40,alignItems:'center',justifyContent:'center',borderRadius:10,backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244'},formGrid:{flexDirection:'row',flexWrap:'wrap',gap:10},formHalf:{width:'48%'},saveWide:{marginTop:4,backgroundColor:'#34d399',borderRadius:12,paddingVertical:13,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},saveWideText:{color:'#052e1c',fontWeight:'900',fontSize:15}});
