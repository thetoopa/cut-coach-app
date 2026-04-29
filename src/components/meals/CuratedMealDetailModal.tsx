import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { CuratedMeal } from '../../data/curatedMeals';

type Props = {
  meal: CuratedMeal | null;
  selected?: boolean;
  onClose: () => void;
  onAdd: (meal: CuratedMeal) => void;
};

export function CuratedMealDetailModal({ meal, selected = false, onClose, onAdd }: Props) {
  return (
    <Modal visible={!!meal} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {meal && (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.category}>{meal.category}</Text>
                <Text style={styles.title}>{meal.name}</Text>
              </View>
              <Pressable onPress={onClose} style={styles.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
            </View>

            <Text style={styles.description}>{meal.description}</Text>
            <View style={styles.macroGrid}>
              <Macro label="Calories" value={meal.calories} />
              <Macro label="Protein" value={`${meal.protein}g`} />
              <Macro label="Carbs" value={`${meal.carbs}g`} />
              <Macro label="Fat" value={`${meal.fat}g`} />
            </View>

            <Section title="Serving"><Text style={styles.body}>{meal.servingSize} · {meal.timeToMakeMinutes} minutes</Text></Section>
            <Section title="Ingredients">{meal.ingredients.map(item => <Text key={item} style={styles.listItem}>• {item}</Text>)}</Section>
            <Section title="Instructions">{meal.instructions.map((item, index) => <Text key={item} style={styles.listItem}>{index + 1}. {item}</Text>)}</Section>
            <Section title="Storage"><Text style={styles.body}>{meal.storageNotes}</Text>{meal.reheatingNotes ? <Text style={styles.body}>Reheat: {meal.reheatingNotes}</Text> : null}</Section>
            {!!meal.groceryNotes?.length && <Section title="Grocery Notes">{meal.groceryNotes.map(item => <Text key={item} style={styles.listItem}>• {item}</Text>)}</Section>}

            <Pressable onPress={() => onAdd(meal)} style={[styles.addButton, selected && styles.addButtonSelected]}>
              <Text style={styles.addButtonText}>{selected ? 'Added to My Meals' : 'Add to My Meals'}</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

function Macro({ label, value }: { label: string; value: string | number }) {
  return <View style={styles.macro}><Text style={styles.macroValue}>{value}</Text><Text style={styles.macroLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  content: { padding: 16, paddingBottom: 34 },
  header: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', alignItems: 'center', justifyContent: 'center' },
  category: { color: '#34d399', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 4 },
  description: { color: '#cbd5e1', fontWeight: '700', lineHeight: 20, marginTop: 12 },
  macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  macro: { width: '48%', backgroundColor: '#111827', borderRadius: 12, borderWidth: 1, borderColor: '#243244', padding: 12 },
  macroValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  macroLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '800', marginTop: 2 },
  section: { backgroundColor: '#111827', borderRadius: 14, borderWidth: 1, borderColor: '#1f2937', padding: 12, marginTop: 12 },
  sectionTitle: { color: '#f8fafc', fontSize: 16, fontWeight: '900', marginBottom: 8 },
  body: { color: '#cbd5e1', lineHeight: 20, fontWeight: '700' },
  listItem: { color: '#cbd5e1', lineHeight: 20, fontWeight: '700', marginBottom: 4 },
  addButton: { backgroundColor: '#34d399', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  addButtonSelected: { opacity: 0.8 },
  addButtonText: { color: '#052e1c', fontWeight: '900', fontSize: 15 },
});
