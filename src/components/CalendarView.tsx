// src/components/CalendarView.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Modal,
  SafeAreaView,
} from 'react-native';
import { getMonthDays, getMonthName, todayKey, keyFromDate, dateFromKey } from '../utils/dateHelpers';
import { getDayStatus, ColorMap, ColorMapBg } from '../utils/colorScheme';
import { MaterialIcons } from '@expo/vector-icons';

interface CalendarViewProps {
  dayLogs: Record<string, any>;
  profile: any;
  onDayPress: (dateKey: string) => void;
  currentDate?: Date;
}

export function CalendarView({
  dayLogs,
  profile,
  onDayPress,
  currentDate = new Date(),
}: CalendarViewProps) {
  const [selectedMonth, setSelectedMonth] = useState(currentDate);
  const year = selectedMonth.getFullYear();
  const month = selectedMonth.getMonth();

  const monthDays = getMonthDays(year, month);
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handlePrevMonth = () => {
    setSelectedMonth(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth(new Date(year, month + 1));
  };

  return (
    <View style={styles.container}>
      {/* Month Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={handlePrevMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={24} color="#94a3b8" />
        </Pressable>

        <Text style={styles.monthTitle}>
          {getMonthName(month)} {year}
        </Text>

        <Pressable onPress={handleNextMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Day of week headers */}
      <View style={styles.weekHeader}>
        {daysOfWeek.map((day) => (
          <Text key={day} style={styles.weekDayLabel}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.daysGrid}>
        {monthDays.map((day, index) => {
          if (day === null) {
            return <View key={`empty-${index}`} style={styles.emptyCellContainer} />;
          }

          const date = new Date(year, month, day);
          const dateKey = keyFromDate(date);
          const log = dayLogs[dateKey];
          const status = getDayStatus(log, profile);

          return (
            <Pressable
              key={dateKey}
              onPress={() => onDayPress(dateKey)}
              style={[
                styles.dayCell,
                {
                  backgroundColor: ColorMapBg[status.status],
                  borderColor: ColorMap[status.status],
                },
              ]}
            >
              <Text style={styles.dayNumber}>{day}</Text>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: ColorMap[status.status] },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: ColorMap.green },
            ]}
          />
          <Text style={styles.legendText}>On track</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: ColorMap.yellow },
            ]}
          />
          <Text style={styles.legendText}>Partial</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: ColorMap.red },
            ]}
          />
          <Text style={styles.legendText}>Off track</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#0b0f14',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekDayLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    paddingVertical: 8,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  emptyCellContainer: {
    width: `${(Dimensions.get('window').width - 64) / 7}%`,
    aspectRatio: 1,
  },
  dayCell: {
    width: `${(Dimensions.get('window').width - 64) / 7}%`,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
