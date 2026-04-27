# Cut Coach App - Development Roadmap

**Repository:** https://github.com/thetoopa/cut-coach-app.git  
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
├── Personal metrics (age, weight, goals, preferences)
├── Nutrition targets (calories, macros)
└── Workout preferences

DayLog (date-based tracking)
├── Nutrition (meals, macros, calories)
├── Workouts (completed, exercises, performance)
├── Cardio (steps, walks, incline walks)
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

### Phase 1 (CURRENT): Calendar & Logging UI ✓ Priority
- [x] Calendar view with day cells
- [ ] Color-coded status (green = logged + hit goals, yellow = partial, red = over/under)
- [ ] Day detail modal showing full log
- [ ] Live streaks display
- [ ] Quick-log buttons (✓ check, confetti, sound)

### Phase 2: Enhanced Meals System
- [ ] Meal favorites/bookmarks
- [ ] Custom meal creation with full metadata
- [ ] Meal recommendations based on macros needed
- [ ] Meal sharing/templates with friends
- [ ] Meal bank with filtering

### Phase 3: Smart Workout Intelligence
- [ ] Current workout detection (remember last day)
- [ ] Set timer with rest notifications
- [ ] Exercise alternatives based on missing muscle groups
- [ ] Smart rep/weight predictions
- [ ] Health app integration (heart rate, steps)

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
- Steps/activities logged

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
- ✓ Base workouts (Push/Pull/Legs/etc)
- ✓ Tab navigation structure
- ⏳ UI components need modularization
- ⏳ Calendar view incomplete
- ⏳ Color-coding logic missing

---

## Next Immediate Steps
1. Modularize components (create folder structure)
2. Build Calendar component with color-coding
3. Implement DayDetailModal
4. Add confetti & sound effects
5. Create metrics display component
6. Add streak calculation logic
