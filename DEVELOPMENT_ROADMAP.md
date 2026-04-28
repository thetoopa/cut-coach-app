# CalorieCounter App - Development Roadmap

**Repository:** https://github.com/thetoopa/calorie-counter.git  
**Tech Stack:** React Native (Expo), TypeScript, AsyncStorage  
**Target:** iOS/Android fitness tracking with social features

---

## Vision
A gamified, social fitness tracking app that helps users monitor nutrition, workouts, and progress with real-time feedback, smart recommendations, and friend competition/sharing.

---

## Architecture Overview

### Data Model
```
User Profile (local + shared)
├── Personal metrics (age, weight, goals, weekly loss rate, gym frequency)
├── Nutrition targets (calories, macros)
└── Workout preferences

DayLog (date-based tracking)
├── Nutrition (meals, macros, calories)
├── Workouts (completed, exercises, performance)
├── Cardio (calorie burn targets, walks, incline walks, golf, heart-rate zones)
├── Hydration (smart water target and ounces logged)
├── Metrics (weight, mood, notes)
└── Status indicators (color-coded: green/yellow/red)

Meal System
├── Default meal bank (pre-configured)
├── User custom meals
├── Favorites/bookmarks
└── Shareable templates

Workout System
├── Base workout splits (Push/Pull/Legs/etc)
├── Exercise tracking (sets, reps, weight progression)
├── Smart exercise alternatives
└── Rest day detection

Social Features
├── Friend profiles (share with permission)
├── Shared meal library
├── Progress comparison
└── Group challenges (future)
```

### Component Structure
```
src/
├── components/
│   ├── Calendar/
│   │   ├── CalendarView.tsx
│   │   ├── DayCell.tsx (color-coded status)
│   │   └── DayDetailModal.tsx
│   ├── Meals/
│   │   ├── MealList.tsx
│   │   ├── MealForm.tsx
│   │   ├── MealBank.tsx
│   │   └── MealRecommendations.tsx
│   ├── Workout/
│   │   ├── WorkoutTracker.tsx
│   │   ├── SetTimer.tsx
│   │   ├── ExerciseSelector.tsx
│   │   └── WorkoutHistory.tsx
│   ├── Metrics/
│   │   ├── LiveMetricsDisplay.tsx
│   │   ├── ProgressGraph.tsx
│   │   └── StreakDisplay.tsx
│   └── Shared/
│       ├── ColorCodedStatus.tsx
│       ├── ConfettiEffect.tsx
│       └── SoundManager.ts
├── hooks/
│   ├── useAsyncStorage.ts
│   ├── useWorkoutLogic.ts
│   ├── useMealRecommendations.ts
│   └── useHealthKit.ts (future)
├── utils/
│   ├── calculations.ts (macro calculations, goals)
│   ├── colorScheme.ts (green/yellow/red logic)
│   ├── dateHelpers.ts
│   └── sharedDataManagement.ts
├── types/
│   ├── models.ts (core data types)
│   └── enums.ts
└── App.tsx (main navigation)
```

---

## Feature Implementation Priority

### Phase 1 (COMPLETE): Calendar & Logging UI ✓
- [x] Calendar view with day cells
- [x] Color-coded status (green = logged + hit goals, yellow = partial, red = over/under)
- [x] Day detail modal showing full log
- [x] Live streaks display
- [x] Quick-log buttons (✓ check, confetti, sound)
- [x] Separate Today snapshot and Calendar views

### Phase 2 (IN PROGRESS): Enhanced Meals System
- [x] **AI Coach intake form** (NEW - conversational meal planning)
- [x] Meal recommendations from AI
- [x] Custom meal creation form
- [x] AI meals use user goals, calorie target, protein target, and cut intensity
- [x] AI meals use weekly loss target and planned lifting frequency
- [ ] Meal favorites/bookmarks (manual UI)
- [ ] Meal sharing/templates with friends
- [ ] Meal bank with filtering

### Phase 3: Smart Cardio, Hydration & Workout Intelligence
- [x] Cardio calorie-burn target instead of fixed minutes
- [x] Activity-specific cardio estimates for flat walking, incline walking, and golf
- [x] Weight-loss intake modes: 0.5, 1, 1.5, 2 lb/week with muscle-loss warnings
- [x] Cardio burn target derived from selected weekly weight-loss goal
- [x] Smart water target from weight, height, protein, cardio, golf, alcohol, and cut intensity
- [x] Planned gym days per week during intake
- [x] Missed-lift calorie adjustment on non-lifting days
- [x] In-app workout timer and smart rest timer with vibration/alert
- [x] Strength progression recommendations and apply-next-weight action
- [ ] Current workout detection (remember last day)
- [ ] Exercise alternatives based on missing muscle groups
- [ ] Smart rep/weight predictions
- [ ] Background local notifications for rest timers
- [ ] Health app integration (heart rate and cardio minutes)

### Phase 4: Social & Data Sharing
- [ ] User profiles with shareable links
- [ ] Friend list management
- [ ] Shared meal library
- [ ] Progress visibility (with privacy controls)
- [ ] Friend comparison dashboard

### Phase 5: Advanced Metrics & Gamification
- [ ] Real-time progress graphs
- [ ] Goal progress visualization
- [ ] Notifications for set timers
- [ ] Badge/achievement system
- [ ] Weight trending

### Phase 6: Cloud Sync & Multi-device
- [ ] Backend service (Firebase/Supabase)
- [ ] Cloud backup
- [ ] Multi-device sync
- [ ] Version management

---

## Data Persistence Strategy

### Current (Local-Only, Phase 1-3)
```typescript
// Keys in AsyncStorage:
- "userProfile" → Profile object
- "mealBank" → Meal[]
- "workouts" → WorkoutDay[]
- "dayLogs" → { [date]: DayLog }
- "favorites" → string[] (meal IDs)
```

### Future (Phase 4+)
- Backend DB with user authentication
- Friend permission system
- Change logs for version compatibility
- Automatic sync on app open

---

## Color-Coding Logic (Phase 1)

### Green (Logged & On Track)
- Logged calories within ±100 of goal
- Logged protein within ±10g of goal
- Workout completed OR cardio completed
- Cardio minutes and activities logged

### Yellow (Partial)
- Logged but not all metrics entered
- One main goal missed (e.g., calories ok but no workout)
- Missing weight data

### Red (Warning)
- Exceeded calorie goal by >200
- Under protein goal by >20g
- Missed multiple goals
- Skipped logging entirely (future integration)

---

## How to Request Changes

### Format for AI-Assisted Updates
When requesting changes, use this format:

```
Change Request:
- Feature/Component: [Calendar/Meals/Workout/etc]
- Description: [Plain English description]
- Priority: [High/Medium/Low]
- Affected Components: [List files]
- Acceptance Criteria: [What success looks like]

Example:
Change Request:
- Feature/Component: Calendar
- Description: Make day cells larger and add swipe to navigate months
- Priority: Medium
- Affected Components: CalendarView.tsx, DayCell.tsx
- Acceptance Criteria: Calendar cells are 80px, swiping changes month
```

### Development Workflow
1. Code is committed with descriptive messages
2. Changes are tracked in git for easy rollback
3. Each feature branch focuses on one Phase
4. Data migrations are handled with version checks

---

## Current App State
- ✓ Core data types defined
- ✓ AsyncStorage integration
- ✓ Basic meal bank (15+ meals)
- ✓ Manual meal creation
- ✓ AI meal creator uses current goals and cut settings
- ✓ Base workouts (Push/Pull/Legs/etc)
- ✓ Tab navigation structure
- ✓ Daily, weekly, monthly calendar views
- ✓ Smart cardio burn target with golf credit
- ✓ Smart water tracking
- ✓ Weight-loss modes and gym-day intake
- ✓ Workout/rest timer and progression recommendations
- ⏳ UI components need modularization

---

## Next Immediate Steps
1. Modularize the large `App.tsx` into focused screens/components
2. Add meal favorites and filtering
3. Add weekly trend charts for weight, calories, cardio burn, and water
4. Improve color status logic to include cardio burn and water target completion
5. Add workout history and automatic current workout detection
6. Add background notifications for water, cardio, and rest timers
