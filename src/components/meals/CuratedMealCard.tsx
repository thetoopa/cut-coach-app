import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CuratedMeal } from '../../data/curatedMeals';

type Props = {
  meal: CuratedMeal;
  selected?: boolean;
  onPress: () => void;
  onToggle?: () => void;
};

export function CuratedMealCard({ meal, selected = false, onPress, onToggle }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.cardSelected]}>
      <View style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text style={styles.category}>{meal.category}</Text>
          <Text style={styles.name}>{meal.name}</Text>
        </View>
        {onToggle && (
          <Pressable onPress={onToggle} style={[styles.addButton, selected && styles.addButtonSelected]}>
            <MaterialIcons name={selected ? 'check' : 'add'} size={18} color={selected ? '#052e1c' : '#cbd5e1'} />
          </Pressable>
        )}
      </View>
      <View style={styles.stats}>
        <Stat label="Cal" value={meal.calories} />
        <Stat label="P" value={`${meal.protein}g`} />
        <Stat label="Min" value={meal.timeToMakeMinutes} />
      </View>
      <View style={styles.tags}>
        {meal.tags.slice(0, 4).map(tag => <Text key={tag} style={styles.tag}>{tag}</Text>)}
      </View>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 12, marginBottom: 10 },
  cardSelected: { borderColor: '#34d399', backgroundColor: '#082016' },
  top: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  category: { color: '#34d399', fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  name: { color: '#f8fafc', fontSize: 15, fontWeight: '900', marginTop: 3 },
  addButton: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#334155' },
  addButtonSelected: { backgroundColor: '#34d399', borderColor: '#34d399' },
  stats: { flexDirection: 'row', gap: 8, marginTop: 10 },
  stat: { flex: 1, backgroundColor: '#111827', borderRadius: 10, paddingVertical: 7, alignItems: 'center' },
  statValue: { color: '#fff', fontWeight: '900' },
  statLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '800', marginTop: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { color: '#cbd5e1', fontSize: 11, fontWeight: '800', backgroundColor: '#111827', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
});
