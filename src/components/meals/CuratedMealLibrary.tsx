import React, { useMemo, useState } from 'react';
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, UIManager, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CuratedMeal, curatedMeals } from '../../data/curatedMeals';
import { CuratedMealCard } from './CuratedMealCard';
import { CuratedMealDetailModal } from './CuratedMealDetailModal';

type Props = {
  selectedIds?: string[];
  onToggleMeal?: (meal: CuratedMeal) => void;
  onAddMeal?: (meal: CuratedMeal) => void;
  selectionMode?: boolean;
  compact?: boolean;
  onRequestScrollTop?: () => void;
};

type LibraryTab = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'selected';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const filters = [
  ['high-protein', 'High Protein'],
  ['quick', 'Quick'],
  ['meal-prep', 'Meal Prep'],
  ['low-calorie', 'Low Calorie'],
];

const tabs: { key: LibraryTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'selected', label: 'Selected' },
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'dinner', label: 'Dinner' },
  { key: 'snack', label: 'Snacks' },
];

export function CuratedMealLibrary({ selectedIds = [], onToggleMeal, onAddMeal, selectionMode = false, compact = false, onRequestScrollTop }: Props) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [detailMeal, setDetailMeal] = useState<CuratedMeal | null>(null);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedCounts = useMemo(() => {
    const selectedMeals = curatedMeals.filter(meal => selectedSet.has(meal.id));
    return {
      breakfast: selectedMeals.filter(meal => meal.category === 'breakfast').length,
      lunch: selectedMeals.filter(meal => meal.category === 'lunch').length,
      dinner: selectedMeals.filter(meal => meal.category === 'dinner').length,
      snack: selectedMeals.filter(meal => meal.category === 'snack').length,
      total: selectedMeals.length,
    };
  }, [selectedSet]);

  const visibleMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return curatedMeals.filter(meal => {
      const haystack = [meal.name, meal.category, meal.description, ...meal.tags, ...meal.ingredients].join(' ').toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesFilter = !activeFilter || meal.tags.includes(activeFilter);
      const matchesTab = activeTab === 'all' || activeTab === 'selected' ? true : meal.category === activeTab;
      const selected = selectedSet.has(meal.id);
      const matchesSelectedState = activeTab === 'selected' ? selected : selectionMode ? !selected : true;
      return matchesQuery && matchesFilter && matchesTab && matchesSelectedState;
    });
  }, [query, activeFilter, activeTab, selectedSet, selectionMode]);

  const handleAdd = (meal: CuratedMeal) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (selectionMode && onToggleMeal) onToggleMeal(meal);
    else onAddMeal?.(meal);
  };

  const switchTab = (tab: LibraryTab) => {
    setActiveTab(tab);
    setActiveFilter(null);
    requestAnimationFrame(() => onRequestScrollTop?.());
  };

  return (
    <View style={styles.wrap}>
      {selectionMode && (
        <View style={styles.guidanceBox}>
          <MaterialIcons name="menu-book" size={17} color="#34d399" />
          <Text style={styles.guidanceText}>Don't worry, full recipes, measured ingredients, portions, cooking instructions, and macros are added after intake. For now, just pick meals you would actually eat. The Calos AI Chef can curate more meals later.</Text>
        </View>
      )}
      <View style={styles.searchRow}>
        <MaterialIcons name="search" size={18} color="#94a3b8" />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search meals, ingredients, tags..." placeholderTextColor="#64748b" style={styles.searchInput} />
      </View>
      {selectionMode && <StickyMealSummary counts={selectedCounts} />}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {tabs.map(tab => (
          <Pressable key={tab.key} onPress={() => switchTab(tab.key)} style={[styles.tabChip, tab.key === 'selected' && selectedCounts.total > 0 && styles.tabChipSelectedReady, activeTab === tab.key && styles.tabChipActive]}>
            <Text style={[styles.tabText, tab.key === 'selected' && selectedCounts.total > 0 && styles.tabTextSelectedReady, activeTab === tab.key && styles.tabTextActive]}>{tab.label}{tab.key === 'selected' && selectionMode ? ` ${selectedCounts.total}` : ''}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {filters.map(([key, label]) => (
          <Pressable key={key} onPress={() => setActiveFilter(activeFilter === key ? null : key)} style={[styles.filterChip, activeFilter === key && styles.filterChipActive]}>
            <Text style={[styles.filterText, activeFilter === key && styles.filterTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.count}>{activeTab === 'selected' ? `${visibleMeals.length} selected meals` : `${visibleMeals.length} meals available`}{selectionMode ? ` · ${selectedIds.length} selected total` : ''}</Text>
      <View style={[styles.grid, compact && styles.gridCompact]}>
        {visibleMeals.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>{activeTab === 'selected' ? 'No meals selected yet' : 'Nothing in this tab'}</Text>
            <Text style={styles.emptyText}>{activeTab === 'selected' ? 'Add meals from Breakfast, Lunch, Dinner, or Snacks and they will show here.' : 'Try another category or clear the filter.'}</Text>
          </View>
        ) : visibleMeals.map(meal => (
          <CuratedMealCard
            key={meal.id}
            meal={meal}
            selected={selectedSet.has(meal.id)}
            onPress={() => setDetailMeal(meal)}
            onToggle={() => handleAdd(meal)}
          />
        ))}
      </View>
      <CuratedMealDetailModal
        meal={detailMeal}
        selected={!!detailMeal && selectedIds.includes(detailMeal.id)}
        onClose={() => setDetailMeal(null)}
        onAdd={meal => handleAdd(meal)}
      />
    </View>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>;
}

function StickyMealSummary({ counts }: { counts: { breakfast: number; lunch: number; dinner: number; snack: number; total: number } }) {
  return (
    <View style={styles.stickySummaryWrap}>
      <View style={styles.selectedSummary}>
        <SummaryItem label="Breakfast" value={counts.breakfast} />
        <SummaryItem label="Lunch" value={counts.lunch} />
        <SummaryItem label="Dinner" value={counts.dinner} />
        <SummaryItem label="Snacks" value={counts.snack} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  guidanceBox: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: '#082016', borderWidth: 1, borderColor: '#14532d', borderRadius: 14, padding: 11 },
  guidanceText: { flex: 1, color: '#bbf7d0', fontWeight: '800', lineHeight: 18, fontSize: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  searchInput: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 11 },
  stickySummaryWrap: { position: 'sticky' as any, top: 0, zIndex: 5, backgroundColor: '#0f172a', paddingVertical: 6 },
  selectedSummary: { flexDirection: 'row', gap: 8 },
  summaryItem: { flex: 1, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingVertical: 8, alignItems: 'center' },
  summaryValue: { color: '#fff', fontWeight: '900', fontSize: 16 },
  summaryLabel: { color: '#94a3b8', fontWeight: '800', fontSize: 10, marginTop: 1 },
  filters: { gap: 8, paddingVertical: 2 },
  tabChip: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9 },
  tabChipSelectedReady: { backgroundColor: '#082016', borderColor: '#34d399' },
  tabChipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  tabText: { color: '#cbd5e1', fontSize: 12, fontWeight: '900' },
  tabTextSelectedReady: { color: '#bbf7d0' },
  tabTextActive: { color: '#052e1c' },
  filterChip: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterChipActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  filterText: { color: '#cbd5e1', fontSize: 12, fontWeight: '900' },
  filterTextActive: { color: '#052e1c' },
  count: { color: '#94a3b8', fontSize: 12, fontWeight: '800' },
  grid: { gap: 0 },
  gridCompact: { paddingBottom: 8 },
  emptyBox: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 14 },
  emptyTitle: { color: '#f8fafc', fontWeight: '900' },
  emptyText: { color: '#94a3b8', fontWeight: '700', marginTop: 4, lineHeight: 18 },
});
