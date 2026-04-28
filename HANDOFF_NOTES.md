# CalorieCounter App - UX Redesign Handoff

## User's Goal
Comprehensive UX overhaul for meal and workout customization, plus navigation redesign to look like a polished real app.

---

## ✅ Completed Tasks

### 1. Bug Fixes
- [x] **JSON Import/Export Modal Close Button** - Fixed X button positioning (header moved outside scrollview)
- [x] **JSON Display Truncation** - Wrapped jsonBox in ScrollView to show full JSON content
- [x] **Loading Screen** - Changed from SafeAreaView constraint to full screen View (fills entire display)

### 2. New AI Conversation Components Created
- [x] **MealPreferencesConversation.tsx** (NEW FILE - 280 lines)
  - Chat-style conversational intake with AI messages
  - Per-meal cooking time allocation (breakfast/lunch/dinner/snacks separately)
  - Multi-select for proteins, carbs, vegetables
  - Free-text allergies/restrictions input
  - Summary view before confirmation
  - Green accent color (#34d399) for selections
  - Skip button to use defaults
  - Fully functional message system with real-time updates

- [x] **WorkoutPreferencesConversation.tsx** (NEW FILE - 330 lines)
  - Chat-style conversational intake
  - Gym type selection (full gym, small gym, home, bodyweight, mixed)
  - Workout style selection (strength, hypertrophy, fat loss, athletic, balanced)
  - Time availability selection
  - Multi-select fitness goals
  - Injury/limitation tracking
  - Summary view
  - Orange accent color (#f59e0b) for differentiation
  - Skip button to use defaults
  - Fully functional message system

### 3. EnhancedOnboardingFlow.tsx Updated
- [x] Added imports for both new conversation components
- [x] Updated mealPrefs step to render MealPreferencesConversation component
- [x] Updated workoutPrefs step to render WorkoutPreferencesConversation component
- [x] Created proper callback handlers (handleMealPrefsComplete, handleWorkoutPrefsSkip, etc.)

### 4. New Type Definition File
- [x] **src/types/mealPreferences.ts** - MealPreferences interface with all meal customization fields

---

## 🔄 In Progress / Partially Complete

### ImportExportModal.tsx Fixes
- [x] Fixed infinite render loop (used useMemo for JSON generation)
- [x] Removed problematic setCopied call during render
- [x] Header repositioned to stay visible
- [x] ScrollView added for JSON box

**Status:** These changes are implemented but need testing to confirm X button works and full JSON displays properly.

---

## ⏳ TODO - Priority Order

### Phase 1: Complete Integration & Testing (IMMEDIATE)
1. **Test meal customization flow**
   - Verify MealPreferencesConversation opens and closes properly
   - Test multi-select buttons (proteins, carbs, veggies)
   - Verify data persists to profile.mealPreferences
   - Check that skipping works

2. **Test workout customization flow**
   - Verify WorkoutPreferencesConversation opens and closes
   - Test multi-select goals
   - Verify data persists to profile.workoutPreferences
   - Check that skipping uses defaults

3. **Test JSON import/export**
   - Verify X button closes modal
   - Verify full JSON displays (scroll if needed)
   - Test copying JSON
   - Test importing JSON back

4. **Run app and verify no TypeScript errors**
   - `npx expo run:ios` (or Android)
   - Check console for warnings/errors
   - Navigate through full onboarding flow

### Phase 2: Bottom Tab Navigation Redesign (HIGH PRIORITY)
**Current state:** App uses top horizontal tabs (Today, Calendar, Meals, Workout, Cardio, Water, Grocery, Weight, Profile)

**Target state:** iOS-style bottom tab bar with polished appearance

**Implementation details needed:**
- Main tabs (5): Today, Meals, Workout, Cardio, Profile
- Secondary menu (More/Settings icon) for: Calendar, Water, Grocery, Weight, Weight Trends
- Bottom safe area spacing
- Active/inactive tab styling with icons
- Smooth transitions between tabs
- Touch feedback (color change, slight scale)

**Files to modify:**
- App.tsx: Replace top tab rendering with bottom tab bar component
- Create new file: `src/components/BottomTabBar.tsx` (component for the tab bar UI)
- Create new file: `src/components/MoreMenu.tsx` (component for secondary navigation)

**Key considerations:**
- Keep all existing tab functionality
- Preserve state when switching tabs
- Maintain dark theme (#111827 background, #cbd5e1 text)
- Use MaterialIcons for tab icons

### Phase 3: UI Polish (MEDIUM PRIORITY)
1. **Tab styling improvements**
   - Add proper spacing and padding
   - Improve typography hierarchy
   - Better visual separation between sections

2. **Component refinement**
   - Consistent border radius (10-12px)
   - Consistent colors and shadows
   - Better button sizing (current "next" buttons on meal prefs seem small)

3. **Onboarding flow visuals**
   - Make next/confirm buttons more prominent
   - Better step indicators (current flow clear enough?)
   - Improve spacing on form fields

---

## 🏗️ Architecture Notes

### File Structure
```
src/
├── components/
│   ├── EnhancedOnboardingFlow.tsx (UPDATED - now uses new conversation components)
│   ├── MealPreferencesConversation.tsx (NEW - AI meal customization)
│   ├── WorkoutPreferencesConversation.tsx (NEW - AI workout customization)
│   ├── ImportExportModal.tsx (FIXED - JSON display and close button)
│   ├── SplashScreen.tsx (created earlier - 1.5s splash with fade)
│   ├── App.tsx (main app - needs bottom tab bar when ready)
│   └── [other existing components...]
├── types/
│   ├── mealPreferences.ts (NEW - MealPreferences type)
│   └── [other types...]
└── [other directories...]
```

### Data Flow
1. **Onboarding** → EnhancedOnboardingFlow (steps: name → goal → ... → mealPrefs)
2. **Meal Prefs Step** → MealPreferencesConversation (user answers questions → returns preferences object)
3. **Workout Prefs Step** → WorkoutPreferencesConversation (user answers questions → returns preferences object)
4. **Profile** → Saved with nested mealPreferences and workoutPreferences objects
5. **AsyncStorage** → Automatically persists all profile data

### Color Scheme
- **Meal Customization:** Green (#34d399) for active buttons
- **Workout Customization:** Orange (#f59e0b) for active buttons
- **Background:** Dark slate (#111827)
- **Text:** Light gray (#cbd5e1)
- **Accents:** Various blues, reds, greens for different features

---

## 🔧 Technical Details for Next AI

### New Components Need:
- Imports from React Native and Expo
- Material Icons for UI elements
- Proper TypeScript typing
- useRef for ScrollView in conversation components
- Animated fade-out for splash screen

### Testing Checklist:
- [ ] Splash shows for 1.5s, fades out smoothly
- [ ] Onboarding flows through all steps
- [ ] Meal preferences conversation displays correctly
- [ ] Workout preferences conversation displays correctly
- [ ] Both conversations properly save data
- [ ] Skip buttons work and use defaults
- [ ] JSON import/export modal opens/closes
- [ ] Full JSON visible in export mode
- [ ] No console warnings/errors
- [ ] App persists data on restart
- [ ] Profile tab shows all preferences

### Potential Issues to Watch:
1. **Infinite re-render loops** - Check ImportExportModal for state in render
2. **Memory leaks** - Ensure useEffect cleanups are proper
3. **Navigation state** - Make sure setStep transitions are smooth
4. **Type mismatches** - Verify preferences objects match Profile type
5. **AsyncStorage sync** - Ensure preferences persist correctly

---

## 📋 Specific Tasks for Next AI

### Task 1: Validate Current State
- Run the app
- Walk through full onboarding
- Test all three main flows (name → goal → ... → meal convo → workout convo → review)
- Verify no crashes or TypeScript errors
- Check that data persists

### Task 2: Bottom Tab Bar Implementation
- Create BottomTabBar component (icon + label per tab)
- Create MoreMenu component (secondary navigation)
- Modify App.tsx to use bottom tabs instead of top tabs
- Ensure all functionality preserved
- Test tab switching and state persistence

### Task 3: Final Polish
- Make buttons look more prominent (especially next/confirm)
- Add proper spacing and visual hierarchy
- Test on different screen sizes
- Ensure dark theme applied consistently
- One final full walkthrough of the app

---

## 📱 Expected User Experience After Complete

1. **Splash Screen** → 1.5 second app logo with fade
2. **Onboarding** → Smooth flow from name → goal → stats → meal customization conversation → workout customization conversation → review
3. **Meal Customization** → Chat-like experience asking about cooking times, proteins, carbs, veggies, allergies
4. **Workout Customization** → Chat-like experience asking about gym setup, workout style, goals, limitations
5. **Navigation** → Polished bottom tab bar with main 5 tabs, secondary menu accessible
6. **All Data** → Persisted locally via AsyncStorage

---

## 🚀 Success Criteria
- ✅ App runs without errors
- ✅ Onboarding completes successfully
- ✅ Meal/workout preferences save and display
- ✅ Bottom tab bar implemented and functional
- ✅ No console warnings/errors
- ✅ App looks polished and professional
- ✅ All data persists on app restart
