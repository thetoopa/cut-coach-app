import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type MainTab = 'Today' | 'Meals' | 'Workout' | 'Cardio' | 'Water';

type BottomTabBarProps<Tab extends string> = {
  activeTab: Tab;
  onSelect: (tab: MainTab) => void;
  onMore: () => void;
  moreActive?: boolean;
};

const tabs: Array<{ key: MainTab; label: string; icon: string }> = [
  { key: 'Today', label: 'Today', icon: 'today' },
  { key: 'Meals', label: 'Meals', icon: 'restaurant' },
  { key: 'Workout', label: 'Workout', icon: 'fitness-center' },
  { key: 'Cardio', label: 'Cardio', icon: 'directions-run' },
  { key: 'Water', label: 'Water', icon: 'water-drop' },
];

export function BottomTabBar<Tab extends string>({ activeTab, onSelect, onMore, moreActive = false }: BottomTabBarProps<Tab>) {
  return (
    <View style={s.wrapper}>
      <View style={s.bar}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable key={tab.key} onPress={() => onSelect(tab.key)} style={[s.item, active && s.itemActive]}>
              <MaterialIcons name={tab.icon as any} size={22} color={active ? '#052e1c' : '#94a3b8'} />
              <Text style={[s.label, active && s.labelActive]} numberOfLines={1}>{tab.label}</Text>
            </Pressable>
          );
        })}
        <Pressable onPress={onMore} style={[s.item, moreActive && s.itemActive]}>
          <MaterialIcons name="more-horiz" size={22} color={moreActive ? '#052e1c' : '#94a3b8'} />
          <Text style={[s.label, moreActive && s.labelActive]} numberOfLines={1}>More</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#0b0f14',
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  item: {
    flex: 1,
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    gap: 3,
  },
  itemActive: {
    backgroundColor: '#34d399',
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
  },
  labelActive: {
    color: '#052e1c',
  },
});
