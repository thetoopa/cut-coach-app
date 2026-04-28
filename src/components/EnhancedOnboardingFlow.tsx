// src/components/EnhancedOnboardingFlow.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { calculateNutritionTargets, weeklyLossOptions } from '../utils/calculations';

interface EnhancedOnboardingFlowProps {
  onComplete: (profile: any) => void;
}

type Step = 'name' | 'goal' | 'lossRate' | 'gender' | 'stats' | 'activity' | 'gym' | 'mealPrefs' | 'workoutPrefs' | 'review' | 'complete';

export function EnhancedOnboardingFlow({ onComplete }: EnhancedOnboardingFlowProps) {
  const [step, setStep] = useState<Step>('name');
  const [profile, setProfile] = useState({
    name: '',
    goal: 'cut' as 'cut' | 'bulk' | 'maintain',
    sex: 'male' as 'male' | 'female',
    age: 25,
    heightIn: 70,
    weight: 180,
    goalWeight: 170,
    activity: 1.5,
    weeklyLossRate: 1 as any,
    gymDaysPerWeek: 4,
    aggression: 500,
    proteinGoal: 170,
    calorieGoal: 1900,
  });

  const [mealPrefs, setMealPrefs] = useState({
    cookingTimePerMeal: 'moderate', // quick, moderate, detailed
    favoriteProteins: [] as string[],
    favoriteCarbs: [] as string[],
    favoriteVeggies: [] as string[],
    favoriteFruits: [] as string[],
    allergies: '',
  });

  const [workoutPrefs, setWorkoutPrefs] = useState({
    useDefaults: false,
    timePerWorkout: '45-60 minutes',
    equipmentAccess: 'full gym',
    likedExercises: '',
    trainingLimits: '',
  });

  const handleNameSubmit = () => {
    if (!profile.name.trim()) {
      alert('Profile name is required');
      return;
    }
    setProfile(p => ({ ...p, name: profile.name.trim() }));
    setStep('goal');
  };

  const handleGoalSelect = (goal: 'cut' | 'bulk' | 'maintain') => {
    setProfile((p) => ({ ...p, goal }));
    setStep(goal === 'cut' ? 'lossRate' : 'gender');
  };

  const handleLossRateSelect = (weeklyLossRate: number) => {
    setProfile((p) => ({ ...p, weeklyLossRate, aggression: weeklyLossRate * 500 }));
    setStep('gender');
  };

  const handleGenderSelect = (sex: 'male' | 'female') => {
    setProfile((p) => ({ ...p, sex }));
    setStep('stats');
  };

  const handleStatsSubmit = () => {
    setStep('activity');
  };

  const handleActivitySelect = (activity: number) => {
    const targets = calculateNutritionTargets({ ...profile, activity });
    setProfile((p) => ({
      ...p,
      activity,
      proteinGoal: targets.proteinGoal,
      calorieGoal: targets.calorieGoal,
      aggression: targets.deficit,
    }));
    setStep('gym');
  };

  const handleGymDaysSelect = (gymDaysPerWeek: number) => {
    setProfile((p) => ({ ...p, gymDaysPerWeek }));
    setStep('mealPrefs');
  };

  const toggleProtein = (protein: string) => {
    setMealPrefs(p => ({
      ...p,
      favoriteProteins: p.favoriteProteins.includes(protein)
        ? p.favoriteProteins.filter(x => x !== protein)
        : [...p.favoriteProteins, protein],
    }));
  };

  const toggleCarb = (carb: string) => {
    setMealPrefs(p => ({
      ...p,
      favoriteCarbs: p.favoriteCarbs.includes(carb)
        ? p.favoriteCarbs.filter(x => x !== carb)
        : [...p.favoriteCarbs, carb],
    }));
  };

  const toggleVeggie = (veggie: string) => {
    setMealPrefs(p => ({
      ...p,
      favoriteVeggies: p.favoriteVeggies.includes(veggie)
        ? p.favoriteVeggies.filter(x => x !== veggie)
        : [...p.favoriteVeggies, veggie],
    }));
  };

  const toggleFruit = (fruit: string) => {
    setMealPrefs(p => ({
      ...p,
      favoriteFruits: p.favoriteFruits.includes(fruit)
        ? p.favoriteFruits.filter(x => x !== fruit)
        : [...p.favoriteFruits, fruit],
    }));
  };

  const handleMealPrefsNext = () => {
    setStep('workoutPrefs');
  };

  const handleWorkoutPrefsNext = () => {
    setStep('review');
  };

  const handleComplete = () => {
    onComplete({
      ...profile,
      mealPreferences: mealPrefs,
      workoutPreferences: workoutPrefs,
    });
  };

  const num = (v: string, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;
  const Pill = ({ children, onPress, active = false }: { children: React.ReactNode; onPress?: () => void; active?: boolean }) => (
    <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{children}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'name' && (
          <>
            <Text style={styles.title}>Welcome! 👋</Text>
            <Text style={styles.subtitle}>Let's start with your profile name</Text>
            <View style={styles.card}>
              <Text style={styles.label}>Profile Name (required)</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(v) => setProfile(p => ({ ...p, name: v }))}
                placeholder="e.g., Cooper"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.note}>This is used to personalize your experience. You can update it later in settings.</Text>
              <Pressable onPress={handleNameSubmit} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>Continue</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'goal' && (
          <>
            <Text style={styles.title}>What's Your Goal? 🎯</Text>
            <Text style={styles.subtitle}>We'll tailor everything to your goal</Text>

            <Pressable onPress={() => handleGoalSelect('cut')} style={styles.optionCard}>
              <MaterialIcons name="trending-down" size={32} color="#ef4444" />
              <Text style={styles.optionTitle}>Cut 💪</Text>
              <Text style={styles.optionDesc}>Lose fat while maintaining muscle. High protein, calorie deficit.</Text>
            </Pressable>

            <Pressable onPress={() => handleGoalSelect('bulk')} style={styles.optionCard}>
              <MaterialIcons name="trending-up" size={32} color="#3b82f6" />
              <Text style={styles.optionTitle}>Bulk 📈</Text>
              <Text style={styles.optionDesc}>Build muscle mass. Calorie surplus with heavy training.</Text>
            </Pressable>

            <Pressable onPress={() => handleGoalSelect('maintain')} style={styles.optionCard}>
              <MaterialIcons name="balance" size={32} color="#34d399" />
              <Text style={styles.optionTitle}>Maintain ⚖️</Text>
              <Text style={styles.optionDesc}>Stay at current weight. Balance diet and training.</Text>
            </Pressable>
          </>
        )}

        {step === 'lossRate' && (
          <>
            <Text style={styles.title}>Weekly Weight Loss</Text>
            <Text style={styles.subtitle}>Larger deficits are faster, but strength and muscle retention get harder.</Text>

            {Object.values(weeklyLossOptions).map((option) => (
              <Pressable
                key={option.rate}
                onPress={() => handleLossRateSelect(option.rate)}
                style={styles.optionCard}
              >
                <MaterialIcons
                  name={option.risk === 'high' ? 'warning' : 'speed'}
                  size={32}
                  color={option.risk === 'high' ? '#ef4444' : option.risk === 'moderate' ? '#fbbf24' : '#34d399'}
                />
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.note}</Text>
              </Pressable>
            ))}
          </>
        )}

        {step === 'gender' && (
          <>
            <Text style={styles.title}>Your Gender? 👤</Text>
            <Text style={styles.subtitle}>Helps us calculate your stats</Text>

            <Pressable onPress={() => handleGenderSelect('male')} style={styles.optionCard}>
              <MaterialIcons name="male" size={32} color="#60a5fa" />
              <Text style={styles.optionTitle}>Male</Text>
            </Pressable>

            <Pressable onPress={() => handleGenderSelect('female')} style={styles.optionCard}>
              <MaterialIcons name="female" size={32} color="#f472b6" />
              <Text style={styles.optionTitle}>Female</Text>
            </Pressable>
          </>
        )}

        {step === 'stats' && (
          <>
            <Text style={styles.title}>Your Stats 📏</Text>
            <Text style={styles.subtitle}>We'll calculate your targets</Text>
            <View style={styles.card}>
              <View style={styles.formGrid}>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Age</Text>
                  <TextInput
                    style={styles.input}
                    value={String(profile.age)}
                    onChangeText={(v) => setProfile(p => ({ ...p, age: num(v, 25) }))}
                    keyboardType="numeric"
                    placeholder="25"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Height (inches)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(profile.heightIn)}
                    onChangeText={(v) => setProfile(p => ({ ...p, heightIn: num(v, 70) }))}
                    keyboardType="numeric"
                    placeholder="70"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Current weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(profile.weight)}
                    onChangeText={(v) => setProfile(p => ({ ...p, weight: num(v, 180) }))}
                    keyboardType="numeric"
                    placeholder="180"
                    placeholderTextColor="#64748b"
                  />
                </View>
                <View style={styles.formHalf}>
                  <Text style={styles.label}>Goal weight (lbs)</Text>
                  <TextInput
                    style={styles.input}
                    value={String(profile.goalWeight)}
                    onChangeText={(v) => setProfile(p => ({ ...p, goalWeight: num(v, 170) }))}
                    keyboardType="numeric"
                    placeholder="170"
                    placeholderTextColor="#64748b"
                  />
                </View>
              </View>
              <Pressable onPress={handleStatsSubmit} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>Next</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'activity' && (
          <>
            <Text style={styles.title}>Activity Level 🏃</Text>
            <Text style={styles.subtitle}>How active are you typically?</Text>

            <Pressable onPress={() => handleActivitySelect(1.2)} style={styles.optionCard}>
              <MaterialIcons name="directions-walk" size={32} color="#cbd5e1" />
              <Text style={styles.optionTitle}>Sedentary</Text>
              <Text style={styles.optionDesc}>Desk job, minimal exercise</Text>
            </Pressable>

            <Pressable onPress={() => handleActivitySelect(1.375)} style={styles.optionCard}>
              <MaterialIcons name="directions-bike" size={32} color="#fbbf24" />
              <Text style={styles.optionTitle}>Lightly Active</Text>
              <Text style={styles.optionDesc}>Light exercise 1-3 days/week</Text>
            </Pressable>

            <Pressable onPress={() => handleActivitySelect(1.55)} style={styles.optionCard}>
              <MaterialIcons name="fitness-center" size={32} color="#34d399" />
              <Text style={styles.optionTitle}>Moderately Active</Text>
              <Text style={styles.optionDesc}>Exercise 3-5 days/week</Text>
            </Pressable>

            <Pressable onPress={() => handleActivitySelect(1.725)} style={styles.optionCard}>
              <MaterialIcons name="run-circle" size={32} color="#3b82f6" />
              <Text style={styles.optionTitle}>Very Active</Text>
              <Text style={styles.optionDesc}>Heavy exercise 5-6 days/week</Text>
            </Pressable>
          </>
        )}

        {step === 'gym' && (
          <>
            <Text style={styles.title}>Gym Days/Week 🏋️</Text>
            <Text style={styles.subtitle}>How many days do you plan to lift?</Text>
            <View style={styles.card}>
              <View style={styles.pillRow}>
                {[3, 4, 5, 6].map((days) => (
                  <Pill
                    key={days}
                    active={profile.gymDaysPerWeek === days}
                    onPress={() => handleGymDaysSelect(days)}
                  >
                    {days}x/week
                  </Pill>
                ))}
              </View>
              <Pressable
                onPress={() => handleGymDaysSelect(profile.gymDaysPerWeek)}
                style={styles.nextButton}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'mealPrefs' && (
          <>
            <Text style={styles.title}>Meal Customization 🍽️</Text>
            <Text style={styles.subtitle}>Tell us your food preferences (skip to use defaults)</Text>

            <View style={styles.card}>
              <Text style={styles.label}>Cooking time per meal</Text>
              <View style={styles.pillRow}>
                {(['quick', 'moderate', 'detailed'] as const).map((time) => (
                  <Pill
                    key={time}
                    active={mealPrefs.cookingTimePerMeal === time}
                    onPress={() => setMealPrefs(p => ({ ...p, cookingTimePerMeal: time }))}
                  >
                    {time.charAt(0).toUpperCase() + time.slice(1)}
                  </Pill>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Favorite proteins</Text>
              <View style={styles.pillRow}>
                {['Chicken', 'Turkey', 'Beef', 'Fish', 'Eggs', 'Dairy'].map((p) => (
                  <Pill
                    key={p}
                    active={mealPrefs.favoriteProteins.includes(p)}
                    onPress={() => toggleProtein(p)}
                  >
                    {p}
                  </Pill>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Favorite carbs</Text>
              <View style={styles.pillRow}>
                {['Rice', 'Pasta', 'Potatoes', 'Oats', 'Bread', 'Fruits'].map((c) => (
                  <Pill
                    key={c}
                    active={mealPrefs.favoriteCarbs.includes(c)}
                    onPress={() => toggleCarb(c)}
                  >
                    {c}
                  </Pill>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 14 }]}>Favorite vegetables</Text>
              <View style={styles.pillRow}>
                {['Broccoli', 'Spinach', 'Carrots', 'Bell Peppers', 'Asparagus'].map((v) => (
                  <Pill
                    key={v}
                    active={mealPrefs.favoriteVeggies.includes(v)}
                    onPress={() => toggleVeggie(v)}
                  >
                    {v}
                  </Pill>
                ))}
              </View>

              <Text style={styles.label}>Allergies/Restrictions</Text>
              <TextInput
                style={styles.input}
                value={mealPrefs.allergies}
                onChangeText={(v) => setMealPrefs(p => ({ ...p, allergies: v }))}
                placeholder="e.g., Gluten-free, no dairy"
                placeholderTextColor="#64748b"
              />

              <View style={styles.buttonRow}>
                <Pressable onPress={() => setStep('workoutPrefs')} style={styles.nextButton}>
                  <Text style={styles.nextButtonText}>Next</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMealPrefs({
                      cookingTimePerMeal: 'moderate',
                      favoriteProteins: [],
                      favoriteCarbs: [],
                      favoriteVeggies: [],
                      favoriteFruits: [],
                      allergies: '',
                    });
                    setStep('workoutPrefs');
                  }}
                  style={styles.skipButton}
                >
                  <Text style={styles.skipButtonText}>Skip</Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {step === 'workoutPrefs' && (
          <>
            <Text style={styles.title}>Workout Preferences 🏋️</Text>
            <Text style={styles.subtitle}>Customize or use defaults</Text>

            <View style={styles.card}>
              <View style={styles.buttonRow}>
                <Pressable
                  onPress={() => setWorkoutPrefs(p => ({ ...p, useDefaults: false }))}
                  style={[styles.prefButton, !workoutPrefs.useDefaults && styles.prefButtonActive]}
                >
                  <Text style={[styles.prefButtonText, !workoutPrefs.useDefaults && styles.prefButtonTextActive]}>Customize</Text>
                </Pressable>
                <Pressable
                  onPress={() => setWorkoutPrefs(p => ({ ...p, useDefaults: true }))}
                  style={[styles.prefButton, workoutPrefs.useDefaults && styles.prefButtonActive]}
                >
                  <Text style={[styles.prefButtonText, workoutPrefs.useDefaults && styles.prefButtonTextActive]}>Use Defaults</Text>
                </Pressable>
              </View>

              {!workoutPrefs.useDefaults && (
                <>
                  <Text style={[styles.label, { marginTop: 14 }]}>Time per workout</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutPrefs.timePerWorkout}
                    onChangeText={(v) => setWorkoutPrefs(p => ({ ...p, timePerWorkout: v }))}
                    placeholder="e.g., 45-60 minutes"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.label}>Equipment access</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutPrefs.equipmentAccess}
                    onChangeText={(v) => setWorkoutPrefs(p => ({ ...p, equipmentAccess: v }))}
                    placeholder="e.g., Full gym, or home only"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.label}>Exercises you like</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutPrefs.likedExercises}
                    onChangeText={(v) => setWorkoutPrefs(p => ({ ...p, likedExercises: v }))}
                    placeholder="e.g., Bench press, dumbbells"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.label}>Training limitations</Text>
                  <TextInput
                    style={styles.input}
                    value={workoutPrefs.trainingLimits}
                    onChangeText={(v) => setWorkoutPrefs(p => ({ ...p, trainingLimits: v }))}
                    placeholder="e.g., No knee exercises"
                    placeholderTextColor="#64748b"
                  />
                </>
              )}

              <Pressable onPress={handleWorkoutPrefsNext} style={styles.nextButton}>
                <Text style={styles.nextButtonText}>Review & Complete</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 'review' && (
          <>
            <Text style={styles.title}>Review Your Profile ✅</Text>
            <Text style={styles.subtitle}>Make sure everything looks good</Text>

            <View style={styles.card}>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Name:</Text>
                <Text style={styles.reviewValue}>{profile.name}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Goal:</Text>
                <Text style={styles.reviewValue}>{profile.goal === 'cut' ? 'Cut' : profile.goal === 'bulk' ? 'Bulk' : 'Maintain'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Daily Calories:</Text>
                <Text style={styles.reviewValue}>{profile.calorieGoal}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Protein Goal:</Text>
                <Text style={styles.reviewValue}>{profile.proteinGoal}g</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Gym Days/Week:</Text>
                <Text style={styles.reviewValue}>{profile.gymDaysPerWeek}x</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Meal Preferences:</Text>
                <Text style={styles.reviewValue}>{mealPrefs.favoriteProteins.length > 0 ? 'Custom' : 'Default'}</Text>
              </View>
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Workout Plan:</Text>
                <Text style={styles.reviewValue}>{workoutPrefs.useDefaults ? 'Default' : 'Custom'}</Text>
              </View>

              <Pressable onPress={handleComplete} style={styles.completeButton}>
                <MaterialIcons name="check" size={18} color="#052e1c" />
                <Text style={styles.completeButtonText}>Start Using CalorieCounter</Text>
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  optionCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
    marginBottom: 8,
  },
  optionDesc: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
  },
  label: {
    color: '#cbd5e1',
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pillActive: {
    backgroundColor: '#34d399',
  },
  pillText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#052e1c',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  formHalf: {
    width: '48%',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  nextButton: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  nextButtonText: {
    color: '#052e1c',
    fontWeight: '900',
    fontSize: 15,
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  prefButton: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  prefButtonActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  prefButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  prefButtonTextActive: {
    color: '#052e1c',
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#243244',
  },
  reviewLabel: {
    color: '#cbd5e1',
    fontWeight: '600',
  },
  reviewValue: {
    color: '#34d399',
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  completeButtonText: {
    color: '#052e1c',
    fontWeight: '900',
    fontSize: 15,
  },
  note: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
});
