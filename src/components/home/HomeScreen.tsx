import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  DimensionValue,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  Vibration,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { FriendsActivity } from './FriendsActivity';

type HomeScreenProps = {
  profile: any;
  log: any;
  dayLogs: Record<string, any>;
  workouts: any[];
  selectedWorkout: number;
  caloriesLogged: number;
  calorieGoal: number;
  proteinLogged: number;
  proteinGoal: number;
  onLogWeight: (weight: number) => void;
  onStartWorkout: () => void;
  onLogFood: () => void;
};

const keyFromDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function weightEntries(dayLogs: Record<string, any>, log: any) {
  const byDate: Record<string, number> = {};
  Object.values(dayLogs).forEach((entry: any) => {
    if (Number.isFinite(Number(entry.weight))) byDate[entry.date] = Number(entry.weight);
  });
  if (Number.isFinite(Number(log?.weight))) byDate[log.date] = Number(log.weight);
  return Object.entries(byDate)
    .map(([date, weight]) => ({ date, weight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function currentStreak(dayLogs: Record<string, any>, log: any) {
  const logged = new Set(weightEntries(dayLogs, log).map((entry) => entry.date));
  const cursor = new Date();
  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const key = keyFromDate(cursor);
    if (!logged.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function formatSigned(value: number) {
  if (!Number.isFinite(value) || value === 0) return '0.0 lb';
  return `${value > 0 ? '+' : ''}${value.toFixed(1)} lb`;
}

export function HomeScreen({
  profile,
  log,
  dayLogs,
  workouts,
  selectedWorkout,
  caloriesLogged,
  calorieGoal,
  proteinLogged,
  proteinGoal,
  onLogWeight,
  onStartWorkout,
  onLogFood,
}: HomeScreenProps) {
  const [weightDraft, setWeightDraft] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [success, setSuccess] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  const entries = useMemo(() => weightEntries(dayLogs, log), [dayLogs, log]);
  const latestWeight = Number.isFinite(Number(log?.weight))
    ? Number(log.weight)
    : entries[entries.length - 1]?.weight;
  const startWeight = entries[0]?.weight ?? profile.weight;
  const goalWeight = profile.goalWeight ?? startWeight;
  const goal = profile.goal ?? 'cut';
  const streak = currentStreak(dayLogs, log);
  const currentWorkout = workouts[selectedWorkout];

  const monthChange = useMemo(() => {
    if (!entries.length || !Number.isFinite(Number(latestWeight))) return 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffKey = keyFromDate(cutoff);
    const baseline = entries.find((entry) => entry.date >= cutoffKey) ?? entries[0];
    return Number(latestWeight) - baseline.weight;
  }, [entries, latestWeight]);

  const progress = useMemo(() => {
    if (!Number.isFinite(Number(latestWeight)) || startWeight === goalWeight) return 0;
    const total = Math.abs(startWeight - goalWeight);
    const moved = goal === 'bulk'
      ? Number(latestWeight) - startWeight
      : startWeight - Number(latestWeight);
    return clamp(moved / total);
  }, [goal, goalWeight, latestWeight, startWeight]);

  const coachInsight = useMemo(() => {
    if (proteinLogged < proteinGoal * 0.55) return 'Protein is behind. Make the next meal high-protein.';
    if (caloriesLogged <= calorieGoal && proteinLogged >= proteinGoal * 0.8) return 'You’re on track today. Keep the next choice simple.';
    if (streak >= 3) return 'Great consistency lately. Protect the streak today.';
    return 'Log weight first, then hit the next planned action.';
  }, [calorieGoal, caloriesLogged, proteinGoal, proteinLogged, streak]);

  useEffect(() => {
    if (!success) return;
    pulse.setValue(0);
    Animated.timing(pulse, {
      toValue: 1,
      duration: 550,
      useNativeDriver: true,
    }).start();
  }, [pulse, success]);

  const saveWeight = () => {
    const value = Number(weightDraft);
    if (!Number.isFinite(value) || value <= 0) return;
    onLogWeight(value);
    Vibration.vibrate(45);
    setSuccess(true);
    setShowWeightModal(false);
    setTimeout(() => setSuccess(false), 1800);
  };

  const progressWidth = `${Math.round(progress * 100)}%` as DimensionValue;
  const caloriesProgress = `${Math.round(clamp(caloriesLogged / Math.max(1, calorieGoal)) * 100)}%` as DimensionValue;
  const proteinProgress = `${Math.round(clamp(proteinLogged / Math.max(1, proteinGoal)) * 100)}%` as DimensionValue;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const successScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View>
      <View style={s.hero}>
        <View style={s.heroTop}>
          <View>
            <Text style={s.date}>{today}</Text>
            <Text style={s.heroTitle}>Daily Check-In</Text>
          </View>
          <View style={s.streakPill}>
            <MaterialIcons name="local-fire-department" size={16} color="#052e1c" />
            <Text style={s.streakText}>{streak} day</Text>
          </View>
        </View>

        <View style={s.weightRow}>
          <View>
            <Text style={s.weightLabel}>Current weight</Text>
            <Text style={s.weightValue}>{Number.isFinite(Number(latestWeight)) ? `${Number(latestWeight).toFixed(1)} lb` : 'Not logged'}</Text>
          </View>
          <Pressable
            style={s.primaryButton}
            onPress={() => {
              setWeightDraft(Number.isFinite(Number(latestWeight)) ? String(Number(latestWeight)) : '');
              setShowWeightModal(true);
            }}
          >
            <MaterialIcons name="monitor-weight" size={18} color="#052e1c" />
            <Text style={s.primaryButtonText}>Log Weight</Text>
          </Pressable>
        </View>

        <View style={s.statsRow}>
          <View style={s.statMini}>
            <Text style={s.statValue}>{formatSigned(monthChange)}</Text>
            <Text style={s.statLabel}>30 day change</Text>
          </View>
          <View style={s.statMini}>
            <Text style={s.statValue}>{Math.round(progress * 100)}%</Text>
            <Text style={s.statLabel}>goal complete</Text>
          </View>
        </View>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: progressWidth }]} />
        </View>

        {success && (
          <Animated.View style={[s.success, { transform: [{ scale: successScale }] }]}>
            <MaterialIcons name="check-circle" size={16} color="#34d399" />
            <Text style={s.successText}>Weight logged. Streak updated.</Text>
          </Animated.View>
        )}
      </View>

      <View style={s.card}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Progress</Text>
          <Text style={s.goalBadge}>{String(goal).toUpperCase()}</Text>
        </View>
        <View style={s.progressGrid}>
          <Mini label="Start" value={`${Number(startWeight || 0).toFixed(1)} lb`} />
          <Mini label="Now" value={Number.isFinite(Number(latestWeight)) ? `${Number(latestWeight).toFixed(1)} lb` : '--'} />
          <Mini label="Goal" value={`${Number(goalWeight || 0).toFixed(1)} lb`} />
        </View>
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: progressWidth }]} />
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.sectionTitle}>Today’s Plan</Text>
        <View style={s.planRow}>
          <View style={s.planIcon}>
            <MaterialIcons name="fitness-center" size={18} color="#34d399" />
          </View>
          <View style={s.planText}>
            <Text style={s.planTitle}>{log.workoutDone ? 'Workout complete' : currentWorkout?.name ?? 'Workout'}</Text>
            <Text style={s.planSub}>{log.plannedLift === false ? 'No lift planned' : `${currentWorkout?.exercises?.length ?? 0} exercises ready`}</Text>
          </View>
          <Pressable style={s.secondaryButton} onPress={onStartWorkout}>
            <Text style={s.secondaryButtonText}>Start</Text>
          </Pressable>
        </View>

        <MacroLine label="Calories" value={caloriesLogged} goal={calorieGoal} width={caloriesProgress} />
        <MacroLine label="Protein" value={proteinLogged} goal={proteinGoal} suffix="g" width={proteinProgress} />

        <Pressable style={s.foodButton} onPress={onLogFood}>
          <MaterialIcons name="restaurant" size={16} color="#cbd5e1" />
          <Text style={s.foodButtonText}>Log Food</Text>
        </Pressable>
      </View>

      <FriendsActivity />

      <View style={s.insight}>
        <MaterialIcons name="psychology" size={18} color="#34d399" />
        <Text style={s.insightText}>{coachInsight}</Text>
      </View>

      <Modal visible={showWeightModal} transparent animationType="fade" onRequestClose={() => setShowWeightModal(false)}>
        <Pressable style={s.modalBackdrop} onPress={() => setShowWeightModal(false)}>
          <Pressable style={s.modalCard}>
            <Text style={s.modalTitle}>Morning weight</Text>
            <TextInput
              value={weightDraft}
              onChangeText={setWeightDraft}
              keyboardType="decimal-pad"
              placeholder="e.g. 178.4"
              placeholderTextColor="#64748b"
              style={s.weightInput}
              autoFocus
            />
            <Pressable style={s.saveButton} onPress={saveWeight}>
              <Text style={s.saveButtonText}>Save Weight</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.miniBox}>
      <Text style={s.miniValue}>{value}</Text>
      <Text style={s.miniLabel}>{label}</Text>
    </View>
  );
}

function MacroLine({ label, value, goal, width, suffix = '' }: { label: string; value: number; goal: number; width: DimensionValue; suffix?: string }) {
  return (
    <View style={s.macroLine}>
      <View style={s.macroTop}>
        <Text style={s.macroLabel}>{label}</Text>
        <Text style={s.macroValue}>{Math.round(value)}{suffix} / {Math.round(goal)}{suffix}</Text>
      </View>
      <View style={s.slimTrack}>
        <View style={[s.slimFill, { width }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  date: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 2,
  },
  streakPill: {
    height: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#34d399',
    paddingHorizontal: 10,
  },
  streakText: {
    color: '#052e1c',
    fontWeight: '900',
    fontSize: 12,
  },
  weightRow: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  weightLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
  },
  weightValue: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 2,
  },
  primaryButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#34d399',
    borderRadius: 13,
    paddingHorizontal: 13,
  },
  primaryButtonText: {
    color: '#052e1c',
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  statMini: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 12,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '700',
  },
  progressTrack: {
    height: 9,
    backgroundColor: '#1f2937',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 14,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34d399',
    borderRadius: 999,
  },
  success: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
    backgroundColor: '#082016',
    borderWidth: 1,
    borderColor: '#14532d',
    borderRadius: 12,
    padding: 10,
  },
  successText: {
    color: '#bbf7d0',
    fontWeight: '800',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  goalBadge: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '900',
  },
  progressGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  miniBox: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 12,
    padding: 10,
  },
  miniValue: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 15,
  },
  miniLabel: {
    color: '#64748b',
    marginTop: 2,
    fontSize: 11,
    fontWeight: '700',
  },
  planRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  planIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#082016',
    borderWidth: 1,
    borderColor: '#14532d',
  },
  planText: {
    flex: 1,
  },
  planTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
  planSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#34d399',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#34d399',
    fontWeight: '900',
  },
  macroLine: {
    marginTop: 10,
  },
  macroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  macroLabel: {
    color: '#cbd5e1',
    fontWeight: '800',
  },
  macroValue: {
    color: '#94a3b8',
    fontWeight: '800',
  },
  slimTrack: {
    height: 7,
    borderRadius: 999,
    backgroundColor: '#1f2937',
    overflow: 'hidden',
  },
  slimFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#34d399',
  },
  foodButton: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    paddingVertical: 11,
  },
  foodButtonText: {
    color: '#cbd5e1',
    fontWeight: '900',
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  insightText: {
    flex: 1,
    color: '#e2e8f0',
    fontWeight: '800',
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  modalCard: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 16,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 12,
  },
  weightInput: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 13,
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    padding: 13,
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#34d399',
    borderRadius: 13,
    paddingVertical: 13,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#052e1c',
    fontWeight: '900',
    fontSize: 15,
  },
});
