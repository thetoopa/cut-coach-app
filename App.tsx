import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { MaterialIcons } from '@expo/vector-icons';
import { CalendarView } from './src/components/CalendarView';
import { DayDetailModal } from './src/components/DayDetailModal';
import { AICoachModal } from './src/components/AICoachModal';
; custom?: boolean
type Tab = 'Today' | 'Meals' | 'Workout' | 'Cardio' | 'Profile';
type Meal = { id: string; name: string; type: 'Breakfast'|'Lunch'|'Dinner'|'Snack'; calories: number; protein: number; carbs: number; fat: number; notes: string };
type Exercise = { id: string; name: string; sets: number; minReps: number; maxReps: number; weight: number; lastReps: number[]; backup?: string };
type WorkoutDay = { id: string; name: string; exercises: Exercise[]; cardioMin: number; backup: string[] };
type Profile = { name: string; age: number; sex: 'male'|'female'; heightIn: number; weight: number; goalWeight: number; activity: number; aggression: number; proteinGoal: number; calorieGoal: number };
type DayLog = { date: string; weight?: number; calories: number; protein: number; steps: number; outdoorWalk: number; inclineWalk: number; golf: boolean; drinking: boolean; drinks: number; workoutDone: boolean; selectedMeals: string[]; notes: string };

const todayKey = () => new Date().toISOString().slice(0,10);
const num = (v: string, fallback=0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

const defaultProfile: Profile = { name: 'Cooper', age: 24, sex: 'male', heightIn: 69, weight: 170, goalWeight: 155, activity: 1.5, aggression: 750, proteinGoal: 170, calorieGoal: 1900 };

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
  const [mealsState, setMealsState] = useState<Meal[]>(meals);
  const [log,setLog]=useState<DayLog>({date:todayKey(), calories:0, protein:0, steps:0, outdoorWalk:0, inclineWalk:0, golf:false, drinking:false, drinks:0, workoutDone:false, selectedMeals:[], notes:''});
  const [workouts,setWorkouts]=useState<WorkoutDay[]>(baseWorkouts);
  const [selectedWorkout,setSelectedWorkout]=useState(0);
  const [rest,setRest]=useState(0);
  const [dayLogs, setDayLogs] = useState<Record<string, DayLog>>({});
  const [selectedDateForModal, setSelectedDateForModal] = useState<string>('');
  const [showDayModal, setShowDayModal] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);setMealsState(v.meals??meals); } })()},[]);
  useEffect(()=>{ AsyncStorage.setItem('cutCoach', JSON.stringify({profile,log,workouts,dayLogs,meals:mealsState})); },[profile,log,workouts,dayLogs,mealsState
  useEffect(()=>{(async()=>{ const raw=await AsyncStorage.getItem('cutCoach'); if(raw){ const v=JSON.parse(raw); setProfile(v.profile??defaultProfile); setLog(v.log?.date===todayKey()?v.log:{...log,date:todayKey()}); setWorkouts(v.workouts??baseWorkouts); setDayLogs(v.dayLogs??{}); } })()},[]);
  useEffect(()=>{ AsyncStorage.setItem('cutCoach', JSON.stringify({profile,log,workouts,dayLogs})); },[profile,log,workouts,dayLogs]);
  useEffect(()=>{ if(rStateest<=0) return; const t=setInterval(()=>setRest(r=>Math.max(0,r-1)),1000); return ()=>clearInterval(t)},[rest]);

  const picked = meals.filter(m=>log.selectedMeals.includes(m.id));
  const mealCals = picked.reduce((a,m)=>a+m.calories,0), mealProtein=picked.reduce((a,m)=>a+m.protein,0);
  const alcoholCals = log.drinking ? log.drinks*115 : 0;
  const cardioTarget = log.golf ? 20 : 40;
  const calorieGoal = profile.calorieGoal || calcCalories(profile);
  const caloriesLeft = calorieGoal - mealCals - alcoholCals;
  const proteinLeft = profile.proteinGoal - mealProtein;

  function toggleMeal(id:string){ setLog(l=>({...l, selectedMeals: l.selectedMeals.includes(id) ? l.selectedMeals.filter(x=>x!==id) : [...l.selectedMeals,id]})); }
  function updateExercise(wi:number, ei:number, patch:Partial<Exercise>){ setWorkouts(ws=>ws.map((w,i)=> i!==wi?w:{...w, exercises:w.exercises.map((e,j)=>j!==ei?e:{...e,...patch})})); }
  function progressionText(e:Exercise){ const complete=e.lastReps.length===e.sets && e.lastReps.every(r=>r>=e.maxReps); if(complete) return `Next time: increase ${e.name} by ${e.name.toLowerCase().includes('squat')||e.name.toLowerCase().includes('deadlift')||e.name.toLowerCase().includes('leg') ? '10 lb' : '5 lb'}.`; return `Stay at this weight until all ${e.sets} sets hit ${e.maxReps}.`; }

  // Update today's log macros whenever meals change
  useEffect(() => {
    setLog(l => ({...l, calories: mealCals, protein: mealProtein}));
  }, [mealCals, mealProtein]);

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
    steps: 0,
    outdoorWalk: 0,
    inclineWalk: 0,
    golf: false,
    drinking: false,
    drinks: 0,
    workoutDone: false,
    selected

  // Handle saving meals from AI Coach
  const handleSaveAIMeals = (customMeals: Meal[]) => {
    const allMeals = [...mealsState, ...customMeals];
    setMealsState(allMeals);
  };Meals: [],
    notes: ''
  }) : null;

  return <SafeAreaView style={s.app}><StatusBar style="light"/><View style={s.header}><Text style={s.title}>Cut Coach</Text><Text style={s.sub}>Lean, athletic cut tracker</Text></View>
    <View style={s.tabs}>{(['Today','Meals','Workout','Cardio','Profile'] as Tab[]).map(t=><Pill key={t} active={tab===t} onPress={()=>setTab(t)}>{t}</Pill>)}</View>
    <ScrollView contentContainerStyle={{padding:16,paddingBottom:40}}>
      {tab==='Today' && <>
        <Section title="📅 Calendar & Logging">
          <CalendarView dayLogs={dayLogs} profile={profile} onDayPress={handleDayPress} />
        </Section>
        <Section title="Today Snapshot">
          <View style={s.grid}><Metric label="Calories left" value={caloriesLeft}/><Metric label="Protein left" value={Math.max(0,proteinLeft)}/><Metric label="Cardio min left" value={Math.max(0,cardioTarget-log.outdoorWalk-log.inclineWalk)}/><Metric label="Alcohol cals" value={alcoholCals}/></View>
          <Text style={s.note}>Target: {calorieGoal} calories / {profile.proteinGoal}g protein. Drinking mode reserves about 115 calories per drink.</Text>
        </Section>
        <Section title="Modes">
          <View style={s.row}><Pill active={log.golf} onPress={()=>setLog(l=>({...l,golf:!l.golf}))}>Golf day</Pill><Pill active={log.drinking} onPress={()=>setLog(l=>({...l,drinking:!l.drinking}))}>Drinking day</Pill><Pill active={log.workoutDone} onPress={()=>setLog(l=>({...l,workoutDone:!l.workoutDone}))}>Workout done</Pill></View>
          {log.drinking && <Input label="Planned drinks" value={String(log.drinks)} onChange={v=>setLog(l=>({...l,drinks:num(v)}))}/>} 
          {log.golf && <Text style={s.note}>Golf day: 18 holes riding counts as light activity. Keep food normal, hydrate, and only do easy cardio if you still feel good.</Text>}
        </Section>
        <Section title="Quick Log">
          <Input label="Morning weight" value={String(log.weight??'')} onChange={v=>setLog(l=>({...l,weight:num(v)}))}/>
          <Input label="Steps" value={String(log.steps)} onChange={v=>setLog(l=>({...l,steps:num(v)}))}/>
          <Input label="Outdoor walk minutes" value={String(log.outdoorWalk)} onChange={v=>setLog(l=>({...l,outdoorWalk:num(v)}))}/>
          <Input label="Incline treadmill minutes" value={String(log.inclineWalk)} onChange={v=>setLog(l=>({...l,inclineWalk:num(v)}))}/>
        </Section>
      </>}

      {tab==='Meals' && <>
        <Section title="🍽️ Your Meal Menu">
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 12}}>
            <Pressable style={{flex: 1}} onPress={() => setShowAICoach(true)}><View style={s.aiButton}><MaterialIcons name="smart-toy" size={16} color="#fff" /><Text style={s.aiButtonText}>Ask AI Coach</Text></View></Pressable>
          </View>
          <Text style={s.note}>Tap meals to add/remove. Use this as your menu.</Text>
        </Section>
        {(['Breakfast','Lunch','Dinner','Snack'] as const).map(type=><Section key={type} title={type}>{mealsState.filter(m=>m.type===type).map(m=><Pressable key={m.id} onPress={()=>toggleMeal(m.id)} style={[s.meal, log.selectedMeals.includes(m.id)&&s.mealActive]}><Text style={s.mealTitle}>{m.name}{m.custom ? ' ✨' : ''}</Text><Text style={s.mealSub}>{m.calories} cal · {m.protein}g protein · {m.carbs}C/{m.fat}F</Text><Text style={s.note}>{m.notes}</Text></Pressable>)}</Section>)}
      </>}

      {tab==='Workout' && <>
        <Section title="Pick Workout"><View style={s.row}>{workouts.map((w,i)=><Pill key={w.id} active={i===selectedWorkout} onPress={()=>setSelectedWorkout(i)}>{w.name.split(' ')[0]}</Pill>)}</View></Section>
        <Section title={workouts[selectedWorkout].name}>
          <Text style={s.note}>Rest timer: {rest}s</Text><View style={s.row}><Pill onPress={()=>setRest(90)}>90s</Pill><Pill onPress={()=>setRest(120)}>120s</Pill><Pill onPress={()=>setRest(180)}>180s</Pill></View>
          {workouts[selectedWorkout].exercises.map((e,ei)=><View key={e.id} style={s.exercise}><Text style={s.mealTitle}>{e.name}</Text><Text style={s.mealSub}>{e.sets} sets · {e.minReps}-{e.maxReps} reps · current {e.weight} lb</Text><Input label="Weight used" value={String(e.weight)} onChange={v=>updateExercise(selectedWorkout,ei,{weight:num(v)})}/>
            <View style={s.setRow}>{Array.from({length:e.sets}).map((_,si)=><TextInput key={si} style={s.repBox} placeholder={`S${si+1}`} placeholderTextColor="#64748b" keyboardType="numeric" value={e.lastReps[si]?String(e.lastReps[si]):''} onChangeText={v=>{ const reps=[...e.lastReps]; reps[si]=num(v); updateExercise(selectedWorkout,ei,{lastReps:reps}); }}/>)}</View>
            <Text style={s.note}>{progressionText(e)} Backup: {e.backup}</Text></View>)}
        </Section>
        <Section title="If You Miss Gym"><Text style={s.note}>{workouts[selectedWorkout].backup.map(x=>'• '+x).join('\n')}</Text></Section>
      </>}

      {tab==='Cardio' && <>
        <Section title="Required Cardio">
          <Text style={s.note}>Normal day: 20–25 min outdoor walk + 12–15 min incline treadmill after lifting. If no outdoor walk: do 20–25 min incline. Incline: 12–15%, 3.0–3.4 mph, talkable but working.</Text>
          <Text style={s.note}>Outdoor-only day: 30–45 min brisk walk. Heart-rate target: roughly 120–145 bpm.</Text>
        </Section>
        <Section title="Cardio Log"><Input label="Outdoor walk minutes" value={String(log.outdoorWalk)} onChange={v=>setLog(l=>({...l,outdoorWalk:num(v)}))}/><Input label="Incline treadmill minutes" value={String(log.inclineWalk)} onChange={v=>setLog(l=>({...l,inclineWalk:num(v)}))}/><Input label="Steps" value={String(log.steps)} onChange={v=>setLog(l=>({...l,steps:num(v)}))}/></Section>
      </>}

      {tab==='Profile' && <>
        <Section title="Your Settings">
          <Input label="Age" value={String(profile.age)} onChange={v=>setProfile(p=>({...p,age:num(v)}))}/><Input label="Height inches" value={String(profile.heightIn)} onChange={v=>setProfile(p=>({...p,heightIn:num(v)}))}/><Input label="Current weight" value={String(profile.weight)} onChange={v=>setProfile(p=>({...p,weight:num(v)}))}/><Input label="Goal weight" value={String(profile.goalWeight)} onChange={v=>setProfile(p=>({...p,goalWeight:num(v)}))}/><Input label="Daily calorie goal" value={String(profile.calorieGoal)} onChange={v=>setProfile(p=>({...p,calorieGoal:num(v)}))}/><Input label="Protein goal" value={String(profile.proteinGoal)} onChange={v=>setProfile(p=>({...p,proteinGoal:num(v)}))}/>
          <Text style={s.note}>Estimated aggressive calorie target from profile: {calcCalories(profile)}. You can override it above.</Text><Pill onPress={()=>Alert.alert('Saved locally','This app stores data on this phone using AsyncStorage.')}>Storage info</Pill>
        </Section>
      </>}
    </ScrollView>
    <DayDetailModal
      visible={showDayModal}
      dateKey={selectedDateForModal}
      dayLog={currentModalLog || {date: '', calories: 0, protein: 0, steps: 0, outdoorWalk: 0, inclineWalk: 0, golf: false, drinking: false, drinks: 0, workoutDone: false, selectedMeals: [], notes: ''}}
      profile={profile}
      onClose={() => setShowDayModal(false)}
      onSave={handleSaveDayLog}
      allMeals={mealsState}
    />
    <AICoachModal
      visible={showAICoach}
      profile={profile}
      onClose={() => setShowAICoach(false)}
      onSaveMeals={handleSaveAIMeals}
    />
  </SafeAreaView>
}

function Metric({label,value}:{label:string;value:number}){ return <View style={s.metric}><Text style={s.metricValue}>{Math.round(value)}</Text><Text style={s.metricLabel}>{label}</Text></View> }
const s=StyleSheet.create({app:{flex:1,backgroundColor:'#0b0f14'},header:{padding:16,paddingBottom:8},title:{fontSize:34,fontWeight:'800',color:'#fff'},sub:{color:'#94a3b8',marginTop:2},tabs:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:16,paddingBottom:8},pill:{borderRadius:999,paddingVertical:9,paddingHorizontal:13,backgroundColor:'#111827',borderWidth:1,borderColor:'#1f2937'},pillActive:{backgroundColor:'#34d399'},pillText:{color:'#cbd5e1',fontWeight:'700'},pillTextActive:{color:'#052e1c'},card:{backgroundColor:'#111827',borderColor:'#1f2937',borderWidth:1,borderRadius:20,padding:14,marginBottom:14},h2:{fontSize:20,fontWeight:'800',color:'#f8fafc',marginBottom:10},grid:{flexDirection:'row',flexWrap:'wrap',gap:10},metric:{width:'47%',backgroundColor:'#0b1220',borderRadius:16,padding:14},metricValue:{fontSize:26,fontWeight:'900',color:'#fff'},metricLabel:{color:'#94a3b8',marginTop:4},note:{color:'#94a3b8',lineHeight:20,marginTop:6},row:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:8},label:{color:'#cbd5e1',fontWeight:'700',marginBottom:5},input:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:12,padding:11,color:'#fff'},meal:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:16,padding:12,marginBottom:10},mealActive:{borderColor:'#34d399',backgroundColor:'#082016'},mealTitle:{fontSize:16,fontWeight:'800',color:'#fff'},mealSub:{color:'#cbd5e1',marginTop:4},exercise:{backgroundColor:'#0b1220',borderWidth:1,borderColor:'#243244',borderRadius:16,padding:12,marginBottom:12},setRow:{flexDirection:'row',gap:8,flexWrap:'wrap'},repBox:{width:58,backgroundColor:'#111827',borderWidth:1,borderColor:'#334155',borderRadius:12,padding:10,color:'#fff',textAlign:'center'}});
