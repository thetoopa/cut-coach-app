import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommunityMeal } from '../../types/social';
import { incrementMealSaveCount, saveCommunityMealToMyMeals, searchCommunityMeals } from '../../services/communityMealService';
import { CommunityMealCard } from './CommunityMealCard';
import { CommunityMealDetailModal } from './CommunityMealDetailModal';

export function CommunityMealLibrary({ onAddMeal }: { onAddMeal: (meal: any) => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | CommunityMeal['category']>('all');
  const [meals, setMeals] = useState<CommunityMeal[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<CommunityMeal | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setMeals(await searchCommunityMeals(query, category));
    } catch (error: any) {
      Alert.alert('Community unavailable', error?.message ?? 'Could not load community meals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [category]);

  const add = async (meal: CommunityMeal) => {
    onAddMeal(saveCommunityMealToMyMeals(meal));
    incrementMealSaveCount(meal.id).catch(() => {});
    Alert.alert('Meal added', `${meal.name} was added to your meal menu.`);
  };

  return (
    <View style={s.wrap}>
      <View style={s.searchRow}>
        <MaterialIcons name="search" size={18} color="#94a3b8" />
        <TextInput value={query} onChangeText={setQuery} onSubmitEditing={load} placeholder="Search community meals..." placeholderTextColor="#64748b" style={s.searchInput} />
        <Pressable onPress={load}><MaterialIcons name="arrow-forward" size={20} color="#34d399" /></Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filters}>
        {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map(item => (
          <Pressable key={item} onPress={() => setCategory(item)} style={[s.chip, category === item && s.chipActive]}>
            <Text style={[s.chipText, category === item && s.chipTextActive]}>{item === 'all' ? 'All' : item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? <ActivityIndicator color="#34d399" /> : meals.length ? meals.map(meal => (
        <CommunityMealCard key={meal.id} meal={meal} onPress={() => setSelectedMeal(meal)} onAdd={() => add(meal)} />
      )) : <Text style={s.empty}>No community meals found yet.</Text>}
      <CommunityMealDetailModal meal={selectedMeal} onClose={() => setSelectedMeal(null)} onAdd={add} />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  searchInput: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 11 },
  filters: { gap: 8, paddingVertical: 2 },
  chip: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  chipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  chipText: { color: '#cbd5e1', fontWeight: '900', textTransform: 'capitalize' },
  chipTextActive: { color: '#052e1c' },
  empty: { color: '#94a3b8', fontWeight: '800', textAlign: 'center', marginTop: 20 },
});
