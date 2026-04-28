// src/components/OnboardingFlow.tsx
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

interface OnboardingFlowProps {
  onComplete: (profile: any) => void;
}

type Step = 'goal' | 'lossRate' | 'gender' | 'stats' | 'activity' | 'gym' | 'name' | 'complete';

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('goal');
  const [profile, setProfile] = useState({
    name: 'User',
    goal: 'cut' as 'cut' | 'bulk' | 'maintain',
    sex: 'male' as 'male' | 'female',
    age: 25,
    heightIn: 70,
    weight: 180,
    goalWeight: 170,
    activity: 1.5,
    weeklyLossRate: 1,
    gymDaysPerWeek: 4,
    aggression: 500,
    proteinGoal: 170,
    calorieGoal: 1900,
  });

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
    setStep('name');
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {step === 'goal' && (
          <>
            <Text style={styles.title}>What's Your Goal? 🎯</Text>
            <Text style={styles.subtitle}>
              We'll tailor everything to your goal
            </Text>

            <Pressable
              onPress={() => handleGoalSelect('cut')}
              style={styles.optionCard}
            >
              <MaterialIcons name="trending-down" size={32} color="#ef4444" />
              <Text style={styles.optionTitle}>Cut 💪</Text>
              <Text style={styles.optionDesc}>
                Lose fat while maintaining muscle. High protein, calorie deficit.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleGoalSelect('bulk')}
              style={styles.optionCard}
            >
              <MaterialIcons name="trending-up" size={32} color="#3b82f6" />
              <Text style={styles.optionTitle}>Bulk 📈</Text>
              <Text style={styles.optionDesc}>
                Build muscle mass. Calorie surplus with heavy training.
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleGoalSelect('maintain')}
              style={styles.optionCard}
            >
              <MaterialIcons name="balance" size={32} color="#34d399" />
              <Text style={styles.optionTitle}>Maintain ⚖️</Text>
              <Text style={styles.optionDesc}>
                Stay at current weight. Balance diet and training.
              </Text>
            </Pressable>
          </>
        )}

        {step === 'lossRate' && (
          <>
            <Text style={styles.title}>Weekly Weight Loss</Text>
            <Text style={styles.subtitle}>
              Larger deficits are faster, but strength and muscle retention get harder.
            </Text>

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

            <Pressable
              onPress={() => handleGenderSelect('male')}
              style={styles.optionCard}
            >
              <MaterialIcons name="male" size={32} color="#3b82f6" />
              <Text style={styles.optionTitle}>Male</Text>
            </Pressable>

            <Pressable
              onPress={() => handleGenderSelect('female')}
              style={styles.optionCard}
            >
              <MaterialIcons name="female" size={32} color="#ec4899" />
              <Text style={styles.optionTitle}>Female</Text>
            </Pressable>
          </>
        )}

        {step === 'stats' && (
          <>
            <Text style={styles.title}>Your Stats 📏</Text>
            <Text style={styles.subtitle}>
              We'll use this to calculate your targets
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                value={String(profile.age)}
                onChangeText={(v) => {
                  if (v === '') {
                    setProfile((p) => ({ ...p, age: 0 }));
                  } else {
                    const num = parseInt(v, 10);
                    if (!isNaN(num)) {
                      setProfile((p) => ({ ...p, age: num }));
                    }
                  }
                }}
                keyboardType="numeric"
                placeholder="25"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (inches)</Text>
              <TextInput
                style={styles.input}
                value={String(profile.heightIn)}
                onChangeText={(v) => {
                  if (v === '') {
                    setProfile((p) => ({ ...p, heightIn: 0 }));
                  } else {
                    const num = parseInt(v, 10);
                    if (!isNaN(num)) {
                      setProfile((p) => ({ ...p, heightIn: num }));
                    }
                  }
                }}
                keyboardType="numeric"
                placeholder="70"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={String(profile.weight)}
                onChangeText={(v) => {
                  if (v === '') {
                    setProfile((p) => ({ ...p, weight: 0 }));
                  } else {
                    const num = parseInt(v, 10);
                    if (!isNaN(num)) {
                      setProfile((p) => ({ ...p, weight: num }));
                    }
                  }
                }}
                keyboardType="numeric"
                placeholder="180"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Weight (lbs)</Text>
              <TextInput
                style={styles.input}
                value={String(profile.goalWeight)}
                onChangeText={(v) => {
                  if (v === '') {
                    setProfile((p) => ({ ...p, goalWeight: 0 }));
                  } else {
                    const num = parseInt(v, 10);
                    if (!isNaN(num)) {
                      setProfile((p) => ({ ...p, goalWeight: num }));
                    }
                  }
                }}
                keyboardType="numeric"
                placeholder="170"
              />
            </View>

            <Pressable
              onPress={() => setStep('activity')}
              style={styles.continueButton}
            >
              <Text style={styles.continueText}>Continue</Text>
              <MaterialIcons name="arrow-forward" size={18} color="#052e1c" />
            </Pressable>
          </>
        )}

        {step === 'activity' && (
          <>
            <Text style={styles.title}>Activity Level? 🏃</Text>
            <Text style={styles.subtitle}>
              How active are you daily? (Affects calorie targets)
            </Text>

            <Pressable
              onPress={() => handleActivitySelect(1.2)}
              style={styles.optionCard}
            >
              <MaterialIcons name="event-seat" size={32} color="#64748b" />
              <Text style={styles.optionTitle}>Sedentary 😴</Text>
              <Text style={styles.optionDesc}>Mostly sitting, little exercise</Text>
            </Pressable>

            <Pressable
              onPress={() => handleActivitySelect(1.375)}
              style={styles.optionCard}
            >
              <MaterialIcons name="directions-walk" size={32} color="#fbbf24" />
              <Text style={styles.optionTitle}>Light Activity 🚶</Text>
              <Text style={styles.optionDesc}>
                Light exercise 1-3 days/week
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleActivitySelect(1.55)}
              style={styles.optionCard}
            >
              <MaterialIcons name="fitness-center" size={32} color="#3b82f6" />
              <Text style={styles.optionTitle}>Moderate Activity 🏋️</Text>
              <Text style={styles.optionDesc}>
                Exercise 3-5 days/week
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleActivitySelect(1.725)}
              style={styles.optionCard}
            >
              <MaterialIcons name="sports" size={32} color="#ef4444" />
              <Text style={styles.optionTitle}>Very Active 🔥</Text>
              <Text style={styles.optionDesc}>Heavy exercise 5-7 days/week</Text>
            </Pressable>

            <Pressable
              onPress={() => handleActivitySelect(1.9)}
              style={styles.optionCard}
            >
              <MaterialIcons name="trending-up" size={32} color="#10b981" />
              <Text style={styles.optionTitle}>Athlete 💪</Text>
              <Text style={styles.optionDesc}>
                Intense training twice daily
              </Text>
            </Pressable>
          </>
        )}

        {step === 'gym' && (
          <>
            <Text style={styles.title}>Gym Schedule</Text>
            <Text style={styles.subtitle}>
              How many days per week do you realistically plan to lift?
            </Text>

            <View style={styles.daysGrid}>
              {[2, 3, 4, 5, 6].map((days) => (
                <Pressable
                  key={days}
                  onPress={() => handleGymDaysSelect(days)}
                  style={styles.dayButton}
                >
                  <Text style={styles.dayNumber}>{days}</Text>
                  <Text style={styles.dayLabel}>days/week</Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 'name' && (
          <>
            <Text style={styles.title}>What's Your Name? 👋</Text>
            <Text style={styles.subtitle}>Personalization matters</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={profile.name}
                onChangeText={(v) =>
                  setProfile((p) => ({ ...p, name: v }))
                }
                placeholder="Your name"
              />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Profile</Text>
              <SummaryRow label="Goal" value={profile.goal.toUpperCase()} />
              {profile.goal === 'cut' && (
                <SummaryRow label="Loss Rate" value={`${profile.weeklyLossRate} lb/week`} />
              )}
              <SummaryRow label="Gender" value={profile.sex} />
              <SummaryRow label="Age" value={`${profile.age} yrs`} />
              <SummaryRow label="Height" value={`${profile.heightIn}"`} />
              <SummaryRow label="Weight" value={`${profile.weight} lbs`} />
              <SummaryRow label="Gym" value={`${profile.gymDaysPerWeek} days/week`} />
              <SummaryRow
                label="Calorie Target"
                value={`${profile.calorieGoal} cal`}
              />
              <SummaryRow
                label="Protein Target"
                value={`${profile.proteinGoal}g`}
              />
            </View>

            <Pressable
              onPress={handleComplete}
              style={styles.completeButton}
            >
              <MaterialIcons
                name="check-circle"
                size={20}
                color="#052e1c"
              />
              <Text style={styles.completeText}>Start Using Calos!</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: '#111827',
    borderWidth: 2,
    borderColor: '#1f2937',
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
    marginBottom: 6,
  },
  optionDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: '#34d399',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  continueText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#052e1c',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayButton: {
    width: '30%',
    minHeight: 104,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  dayNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#34d399',
  },
  dayLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#34d399',
    borderRadius: 12,
    padding: 16,
    marginVertical: 20,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '700',
  },
  completeButton: {
    backgroundColor: '#34d399',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  completeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#052e1c',
  },
});
