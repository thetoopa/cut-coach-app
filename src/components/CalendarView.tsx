// src/components/CalendarView.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  dateFromKey,
  getMonthDays,
  getMonthName,
  getWeekStart,
  keyFromDate,
  todayKey,
} from '../utils/dateHelpers';
import { getDayStatus, ColorMap, ColorMapBg } from '../utils/colorScheme';
import { calculateCardioPlan, calculateWaterPlan } from '../utils/calculations';

type CalendarMode = 'Day' | 'Week' | 'Month';

interface CalendarViewProps {
  dayLogs: Record<string, any>;
  profile: any;
  onDayPress: (dateKey: string) => void;
  currentLog?: any;
  allMeals?: any[];
  currentDate?: Date;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MODE_OPTIONS: CalendarMode[] = ['Day', 'Week', 'Month'];

export function CalendarView({
  dayLogs,
  profile,
  onDayPress,
  currentLog,
  allMeals = [],
  currentDate = new Date(),
}: CalendarViewProps) {
  const [mode, setMode] = useState<CalendarMode>('Week');
  const [anchorDate, setAnchorDate] = useState(currentDate);

  const title = useMemo(() => {
    if (mode === 'Day') {
      return anchorDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }

    if (mode === 'Week') {
      const start = getWeekStart(anchorDate);
      const end = addDays(start, 6);
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    }

    return `${getMonthName(anchorDate.getMonth())} ${anchorDate.getFullYear()}`;
  }, [anchorDate, mode]);

  const move = (direction: -1 | 1) => {
    const next = new Date(anchorDate);
    if (mode === 'Day') next.setDate(next.getDate() + direction);
    if (mode === 'Week') next.setDate(next.getDate() + direction * 7);
    if (mode === 'Month') next.setMonth(next.getMonth() + direction);
    setAnchorDate(next);
  };

  const getLogForDate = (dateKey: string) => {
    const rawLog = dateKey === todayKey() && currentLog ? currentLog : dayLogs[dateKey];
    if (!rawLog) return rawLog;

    const selectedMeals = allMeals.filter((meal) => rawLog.selectedMeals?.includes(meal.id));
    const mealCalories = selectedMeals.reduce((total, meal) => total + (meal.calories ?? 0), 0);
    const mealProtein = selectedMeals.reduce((total, meal) => total + (meal.protein ?? 0), 0);
    const alcoholCalories = rawLog.drinking ? rawLog.alcoholCalories ?? (rawLog.drinks ?? 0) * 115 : 0;
    const calories = (selectedMeals.length > 0 ? mealCalories : rawLog.calories ?? 0) + alcoholCalories;
    const protein = selectedMeals.length > 0 ? mealProtein : rawLog.protein ?? 0;
    return { ...rawLog, calories, protein };
  };

  const renderDayCard = (date: Date, variant: 'large' | 'week' | 'month') => {
    const dateKey = keyFromDate(date);
    const log = getLogForDate(dateKey);
    const status = getDayStatus(log, profile);
    const cardioPlan = calculateCardioPlan(log ?? {}, profile);
    const waterPlan = calculateWaterPlan(log ?? {}, profile);
    const hitWaterTarget = waterPlan.loggedOunces >= waterPlan.targetOunces;
    const hitWorkoutTarget = !!log?.workoutDone;
    const selectedMeals = log?.selectedMeals?.length ?? 0;
    const isCurrentDay = dateKey === todayKey();

    return (
      <Pressable
        key={dateKey}
        onPress={() => onDayPress(dateKey)}
        style={[
          variant === 'month' ? styles.monthCell : styles.dayCard,
          variant === 'week' && styles.weekCard,
          {
            backgroundColor: status.status === 'gray' ? '#0b1220' : ColorMapBg[status.status],
            borderColor: isCurrentDay ? '#f8fafc' : ColorMap[status.status],
          },
        ]}
      >
        <View style={styles.dayTopRow}>
          <Text style={variant === 'month' ? styles.monthDayLabel : styles.dayName}>
            {variant === 'month' ? date.getDate() : DAYS[date.getDay()]}
          </Text>
          <View style={styles.dayIndicators}>
            {hitWaterTarget && <Text style={styles.waterDrop}>💧</Text>}
            {hitWorkoutTarget && <Text style={styles.workoutBadge}>🏋️</Text>}
            <View style={[styles.statusDot, { backgroundColor: ColorMap[status.status] }]} />
          </View>
        </View>

        {variant !== 'month' && (
          <>
            <Text style={styles.dayNumber}>{date.getDate()}</Text>
            <View style={styles.miniStats}>
              <MiniStat icon="restaurant" value={`${selectedMeals}`} label="meals" />
              <MiniStat icon="local-fire-department" value={`${cardioPlan.burnedCalories}`} label="cal" />
            </View>
            <Text style={styles.statusText} numberOfLines={2}>
              {status.reason}
            </Text>
          </>
        )}
      </Pressable>
    );
  };

  const renderDayView = () => renderDayCard(anchorDate, 'large');

  const renderWeekView = () => {
    const start = getWeekStart(anchorDate);
    return (
      <View style={styles.weekGrid}>
        {Array.from({ length: 7 }).map((_, index) => renderDayCard(addDays(start, index), 'week'))}
      </View>
    );
  };

  const renderMonthView = () => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const monthDays = getMonthDays(year, month);

    return (
      <View>
        <View style={styles.weekHeader}>
          {DAYS.map((day) => (
            <Text key={day} style={styles.weekDayLabel}>
              {day.slice(0, 1)}
            </Text>
          ))}
        </View>
        <View style={styles.monthGrid}>
          {monthDays.map((day, index) => {
            if (day === null) return <View key={`empty-${index}`} style={styles.monthCellShell} />;
            return (
              <View key={`${year}-${month}-${day}`} style={styles.monthCellShell}>
                {renderDayCard(new Date(year, month, day), 'month')}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.segmented}>
        {MODE_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setMode(option)}
            style={[styles.segment, mode === option && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, mode === option && styles.segmentTextActive]}>
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.headerRow}>
        <Pressable onPress={() => move(-1)} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={24} color="#cbd5e1" />
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={() => move(1)} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={24} color="#cbd5e1" />
        </Pressable>
      </View>

      {mode === 'Day' && renderDayView()}
      {mode === 'Week' && renderWeekView()}
      {mode === 'Month' && renderMonthView()}

      <View style={styles.legend}>
        <LegendItem status="green" label="On track" />
        <LegendItem status="yellow" label="Partial" />
        <LegendItem status="red" label="Off" />
        <LegendItem status="gray" label="Open" />
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>💧</Text>
          <Text style={styles.legendText}>Water done</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>🏋️</Text>
          <Text style={styles.legendText}>Workout done</Text>
        </View>
      </View>
    </View>
  );
}

function MiniStat({ icon, value, label }: { icon: keyof typeof MaterialIcons.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.miniStat}>
      <MaterialIcons name={icon} size={13} color="#94a3b8" />
      <Text style={styles.miniStatText}>{value} {label}</Text>
    </View>
  );
}

function LegendItem({ status, label }: { status: keyof typeof ColorMap; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendColor, { backgroundColor: ColorMap[status] }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: '#0b1220',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 4,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 9,
  },
  segmentActive: {
    backgroundColor: '#34d399',
  },
  segmentText: {
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 12,
  },
  segmentTextActive: {
    color: '#052e1c',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    flex: 1,
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  dayCard: {
    minHeight: 174,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  weekCard: {
    width: '31.2%',
    minHeight: 138,
  },
  dayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  waterDrop: {
    fontSize: 12,
  },
  workoutBadge: {
    fontSize: 12,
  },
  dayName: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dayNumber: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 8,
  },
  miniStats: {
    gap: 6,
    marginTop: 10,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  miniStatText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '700',
  },
  statusText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 10,
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayLabel: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: '#94a3b8',
    fontWeight: '800',
    fontSize: 12,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCellShell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  monthCell: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    padding: 7,
  },
  monthDayLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 2,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendEmoji: {
    fontSize: 12,
    lineHeight: 14,
  },
  legendText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
});
