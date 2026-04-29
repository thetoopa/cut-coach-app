// src/components/DayDetailModal.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getDayStatus, ColorMap } from '../utils/colorScheme';
import { getDateString, getDayOfWeekShort } from '../utils/dateHelpers';
import { SoundManager, ConfettiEffect } from '../utils/soundAndHaptics';
import { calculateCardioPlan, calculateEffectiveCalorieGoal, calculateNutritionTargets, calculateWaterPlan } from '../utils/calculations';

interface DayDetailModalProps {
  visible: boolean;
  dateKey: string;
  dayLog: any;
  profile: any;
  onClose: () => void;
  onSave: (dayLog: any) => void;
  allMeals: any[];
}

export function DayDetailModal({
  visible,
  dateKey,
  dayLog,
  profile,
  onClose,
  onSave,
  allMeals,
}: DayDetailModalProps) {
  const [editLog, setEditLog] = useState(dayLog);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    setEditLog(dayLog);
  }, [dayLog, visible]);

  const selected = allMeals.filter((m) => editLog.selectedMeals?.includes(m.id)) ?? [];
  const mealCals = selected.reduce((a: number, m: any) => a + m.calories, 0);
  const mealProtein = selected.reduce((a: number, m: any) => a + m.protein, 0);
  const mealCarbs = selected.reduce((a: number, m: any) => a + (m.carbs ?? 0), 0);
  const mealFat = selected.reduce((a: number, m: any) => a + (m.fat ?? 0), 0);
  const statusLog = {
    ...editLog,
    calories: (selected.length > 0 ? mealCals : editLog.calories) + (editLog.drinking ? editLog.alcoholCalories ?? (editLog.drinks ?? 0) * 115 : 0),
    protein: selected.length > 0 ? mealProtein : editLog.protein,
  };
  const status = getDayStatus(statusLog, profile);
  const derivedTargets = calculateNutritionTargets(profile);
  const carbGoal = profile.carbGoal ?? derivedTargets.carbGoal;
  const fatGoal = profile.fatGoal ?? derivedTargets.fatGoal;
  
  // Cardio tracking
  const cardioPlan = calculateCardioPlan(editLog, profile);
  const cardioStatus = cardioPlan.burnedCalories >= cardioPlan.targetCalories ? 'green' : cardioPlan.burnedCalories >= cardioPlan.targetCalories * 0.5 ? 'yellow' : 'red';
  const waterPlan = calculateWaterPlan(editLog, profile);
  const effectiveCalories = calculateEffectiveCalorieGoal(profile, editLog);

  const handleSave = () => {
    onSave(editLog);
    SoundManager.playSuccess();
    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      onClose();
    }, 800);
  };

  const toggleMeal = (mealId: string) => {
    setEditLog((log: any) => ({
      ...log,
      selectedMeals: log.selectedMeals.includes(mealId)
        ? log.selectedMeals.filter((id: string) => id !== mealId)
        : [...log.selectedMeals, mealId],
    }));
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <View>
            <Text style={styles.dayOfWeek}>{getDayOfWeekShort(dateKey)}</Text>
            <Text style={styles.dateText}>{getDateString(dateKey)}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: ColorMap[status.status] },
            ]}
          >
            <Text style={styles.statusText}>{status.reason}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Macro Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Macros</Text>
            <View style={styles.macroRow}>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Calories</Text>
                <Text style={styles.macroValue}>{mealCals}</Text>
                <Text style={styles.macroGoal}>/ {profile.calorieGoal}</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{mealProtein}g</Text>
                <Text style={styles.macroGoal}>/ {profile.proteinGoal}g</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroValue}>{mealCarbs}g</Text>
                <Text style={styles.macroGoal}>/ {carbGoal}g</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Fat</Text>
                <Text style={styles.macroValue}>{mealFat}g</Text>
                <Text style={styles.macroGoal}>/ {fatGoal}g</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Remaining</Text>
                <Text style={styles.macroValue}>
                  {Math.max(0, effectiveCalories.goal - mealCals)}
                </Text>
                <Text style={styles.macroGoal}>cals left</Text>
              </View>
            </View>
          </View>

          {/* Logging Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚖️ Quick Log</Text>
            <InputField
              label="Morning weight"
              value={String(editLog.weight ?? '')}
              onChange={(v) =>
                setEditLog((log: any) => ({
                  ...log,
                  weight: v === '' ? undefined : parseFloat(v),
                }))
              }
            />
            <InputField
              label="Outdoor walk (min)"
              value={String(editLog.outdoorWalk ?? 0)}
              onChange={(v) =>
                setEditLog((log: any) => ({ ...log, outdoorWalk: parseInt(v) || 0, cardioBurnedCalories: undefined }))
              }
            />
            <InputField
              label="Incline walk (min)"
              value={String(editLog.inclineWalk ?? 0)}
              onChange={(v) =>
                setEditLog((log: any) => ({
                  ...log,
                  inclineWalk: parseInt(v) || 0,
                  cardioBurnedCalories: undefined,
                }))
              }
            />
            <Text style={styles.helpText}>Estimated cardio burn: {cardioPlan.estimatedCardioCalories} calories.</Text>
            <InputField
              label="Actual cardio calories"
              value={String(editLog.cardioBurnedCalories ?? '')}
              onChange={(v) =>
                setEditLog((log: any) => ({
                  ...log,
                  cardioBurnedCalories: v === '' ? undefined : parseInt(v) || 0,
                }))
              }
            />
            <InputField
              label="Other burned calories"
              value={String(editLog.otherBurnedCalories ?? 0)}
              onChange={(v) =>
                setEditLog((log: any) => ({
                  ...log,
                  otherBurnedCalories: parseInt(v) || 0,
                }))
              }
            />
            <ToggleButton
              label="Golf day"
              active={editLog.golf ?? false}
              onPress={() =>
                setEditLog((log: any) => ({ ...log, golf: !log.golf }))
              }
            />
            {editLog.golf && (
              <>
                <View style={styles.modeRow}>
                  <SmallPill
                    label="Riding"
                    active={(editLog.golfMode ?? 'riding') === 'riding'}
                    onPress={() => setEditLog((log: any) => ({ ...log, golfMode: 'riding' }))}
                  />
                  <SmallPill
                    label="Walking"
                    active={editLog.golfMode === 'walking'}
                    onPress={() => setEditLog((log: any) => ({ ...log, golfMode: 'walking' }))}
                  />
                </View>
                <InputField
                  label="Golf holes"
                  value={String(editLog.golfHoles ?? 18)}
                  onChange={(v) =>
                    setEditLog((log: any) => ({
                      ...log,
                      golfHoles: parseInt(v) || 0,
                      golfBurnedCalories: undefined,
                    }))
                  }
                />
                <Text style={styles.helpText}>Estimated golf burn: {cardioPlan.estimatedGolfCalories} calories.</Text>
                <InputField
                  label="Actual golf calories"
                  value={String(editLog.golfBurnedCalories ?? '')}
                  onChange={(v) =>
                    setEditLog((log: any) => ({
                      ...log,
                      golfBurnedCalories: v === '' ? undefined : parseInt(v) || 0,
                    }))
                  }
                />
              </>
            )}
            <View style={[styles.cardioBox, { borderColor: ColorMap[cardioStatus] }]}>
              <View style={styles.cardioHeader}>
                <View>
                  <Text style={styles.cardioLabel}>Cardio progress</Text>
                  <Text style={styles.cardioValue}>{cardioPlan.burnedCalories}/{cardioPlan.targetCalories} cal</Text>
                </View>
                <MaterialIcons name="favorite" size={22} color={ColorMap[cardioStatus]} />
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${cardioPlan.progress * 100}%`, backgroundColor: ColorMap[cardioStatus] }]} />
              </View>
              <Text style={styles.cardioNote}>
                Heart-rate zone: {cardioPlan.heartRateZone.minHR}-{cardioPlan.heartRateZone.maxHR} bpm. Based on your {cardioPlan.lossOption.label} loss goal.
              </Text>
              <Text style={styles.cardioNote}>Remaining: {cardioPlan.remainingCalories} calories, about {cardioPlan.outdoorMinutesNeeded} flat min or {cardioPlan.inclineMinutesNeeded} incline min.</Text>
              {editLog.golf && <Text style={styles.cardioNote}>Golf credit: {cardioPlan.golfCalories} calories.</Text>}
              {(editLog.otherBurnedCalories ?? 0) > 0 && <Text style={styles.cardioNote}>Other activity credit: {cardioPlan.otherCalories} calories.</Text>}
            </View>
            <InputField
              label="Water (oz)"
              value={String(editLog.waterOz ?? 0)}
              onChange={(v) =>
                setEditLog((log: any) => ({ ...log, waterOz: parseInt(v) || 0 }))
              }
            />
            <View style={styles.waterBox}>
              <View style={styles.cardioHeader}>
                <View>
                  <Text style={styles.cardioLabel}>Water progress</Text>
                  <Text style={styles.cardioValue}>{waterPlan.loggedOunces}/{waterPlan.targetOunces} oz</Text>
                </View>
                <MaterialIcons name="opacity" size={22} color="#38bdf8" />
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${waterPlan.progress * 100}%`, backgroundColor: '#38bdf8' }]} />
              </View>
              <Text style={styles.cardioNote}>Remaining: {waterPlan.remainingOunces} oz. Target: {waterPlan.liters} L.</Text>
            </View>
          </View>

          {/* Activity Toggles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✓ Activities</Text>
            <ToggleButton
              label="Lift planned"
              active={editLog.plannedLift ?? true}
              onPress={() =>
                setEditLog((log: any) => ({
                  ...log,
                  plannedLift: !(log.plannedLift ?? true),
                }))
              }
            />
            <ToggleButton
              label="Workout completed"
              active={editLog.workoutDone ?? false}
              onPress={() =>
                setEditLog((log: any) => ({
                  ...log,
                  workoutDone: !log.workoutDone,
                }))
              }
            />
            <Text style={styles.helpText}>Estimated lifting credit: {effectiveCalories.estimatedWorkoutCalories} calories. This is added to the food target only when workout completed is selected.</Text>
            <InputField
              label="Actual workout calories"
              value={String(editLog.workoutBurnedCalories ?? '')}
              onChange={(v) =>
                setEditLog((log: any) => ({
                  ...log,
                  workoutBurnedCalories: v === '' ? undefined : parseInt(v) || 0,
                }))
              }
            />
            <ToggleButton
              label="Drinking day"
              active={editLog.drinking ?? false}
              onPress={() =>
                setEditLog((log: any) => ({
                  ...log,
                  drinking: !log.drinking,
                  alcoholCalories: !log.drinking ? (log.drinks ?? 0) * 115 : log.alcoholCalories,
                }))
              }
            />
            {editLog.drinking && (
              <>
                <InputField
                  label="Drinks"
                  value={String(editLog.drinks ?? 0)}
                  onChange={(v) =>
                    setEditLog((log: any) => ({
                      ...log,
                      drinks: parseInt(v) || 0,
                      alcoholCalories: (parseInt(v) || 0) * 115,
                    }))
                  }
                />
                <InputField
                  label="Estimated drink calories"
                  value={String(editLog.alcoholCalories ?? (editLog.drinks ?? 0) * 115)}
                  onChange={(v) =>
                    setEditLog((log: any) => ({
                      ...log,
                      alcoholCalories: v === '' ? undefined : parseInt(v) || 0,
                    }))
                  }
                />
                <Text style={styles.helpText}>Default estimate is 115 calories per drink. Change it if you know the actual drink calories.</Text>
              </>
            )}
          </View>

          {/* Workout Logged */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏋️ Workout Logged</Text>
            {editLog.workoutEntries?.length ? (
              <>
                <Text style={styles.helpText}>{editLog.workoutName || 'Workout'} set log</Text>
                {editLog.workoutEntries.map((exercise: any) => {
                  const setText = exercise.sets
                    ?.map((set: any) => `S${set.set}: ${set.weight ?? exercise.weight ?? 0} lb x ${set.reps || '-'} reps`)
                    .join(' · ');
                  return (
                    <View key={exercise.id} style={styles.workoutLogItem}>
                      <Text style={styles.workoutLogName}>{exercise.name}</Text>
                      <Text style={styles.workoutLogMeta}>{setText}</Text>
                    </View>
                  );
                })}
              </>
            ) : (
              <Text style={styles.emptyText}>No set-by-set workout log saved for this day yet.</Text>
            )}
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Notes</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Any notes for this day?"
              placeholderTextColor="#64748b"
              value={editLog.notes ?? ''}
              onChangeText={(v) =>
                setEditLog((log: any) => ({ ...log, notes: v }))
              }
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Meals Selected */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Meals Logged ({selected.length})</Text>
            {selected.length === 0 ? (
              <Text style={styles.emptyText}>No meals selected</Text>
            ) : (
              selected.map((meal: any) => (
                <Pressable
                  key={meal.id}
                  onPress={() => toggleMeal(meal.id)}
                  style={styles.mealItem}
                >
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealMacro}>
                      {meal.calories} cal • {meal.protein}g P
                    </Text>
                  </View>
                  <MaterialIcons
                    name="remove-circle-outline"
                    size={20}
                    color="#ef4444"
                  />
                </Pressable>
              ))
            )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            style={[
              styles.saveButton,
              { backgroundColor: ColorMap[status.status] },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color="#fff"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.saveButtonText}>Save Day</Text>
          </Pressable>
        </View>

        {/* Confetti overlay (placeholder for actual animation) */}
        {showConfetti && (
          <View style={styles.confettiOverlay}>
            <Text style={styles.confettiText}>🎉</Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        placeholderTextColor="#64748b"
      />
    </View>
  );
}

function ToggleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.toggleButton, active && styles.toggleButtonActive]}
    >
      <MaterialIcons
        name={active ? 'check-circle' : 'radio-button-unchecked'}
        size={20}
        color={active ? '#10b981' : '#64748b'}
        style={{ marginRight: 8 }}
      />
      <Text style={[styles.toggleLabel, active && styles.toggleLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function SmallPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.smallPill, active && styles.smallPillActive]}>
      <Text style={[styles.smallPillText, active && styles.smallPillTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  dayOfWeek: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
  },
  macroRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroBox: {
    flexGrow: 1,
    flexBasis: '30%',
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 4,
  },
  macroGoal: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  cardioBox: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginTop: 4,
  },
  waterBox: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38bdf8',
    padding: 12,
    marginTop: 4,
  },
  cardioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardioLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  cardioValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  cardioNote: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  helpText: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -4,
    marginBottom: 10,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  smallPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
  },
  smallPillActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  smallPillText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  smallPillTextActive: {
    color: '#052e1c',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
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
    fontSize: 14,
  },
  notesInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#111827',
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243244',
  },
  toggleButtonActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  toggleLabelActive: {
    color: '#10b981',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243244',
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  mealMacro: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
  },
  workoutLogItem: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#243244',
  },
  workoutLogName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
  },
  workoutLogMeta: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginTop: 4,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  confettiOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  confettiText: {
    fontSize: 60,
  },
});
