import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const friendActivity = [
  { name: 'Ryan', detail: '45 day gym streak', icon: 'local-fire-department' },
  { name: 'Mikey', detail: 'down 5 lbs this month', icon: 'trending-down' },
  { name: 'Deej', detail: 'PR bench 225 x 5', icon: 'fitness-center' },
  { name: 'Sam', detail: 'hit protein 6 days straight', icon: 'restaurant' },
];

export function FriendsActivity() {
  return (
    <View style={s.card}>
      <View style={s.header}>
        <Text style={s.title}>Friends</Text>
        <Text style={s.sub}>quiet pressure</Text>
      </View>
      {friendActivity.map((item) => (
        <View key={`${item.name}-${item.detail}`} style={s.row}>
          <View style={s.iconWrap}>
            <MaterialIcons name={item.icon as any} size={16} color="#34d399" />
          </View>
          <Text style={s.text}>
            <Text style={s.name}>{item.name}</Text>
            {' — '}
            {item.detail}
          </Text>
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderColor: '#1f2937',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
  },
  sub: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  row: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#082016',
    borderWidth: 1,
    borderColor: '#14532d',
  },
  text: {
    flex: 1,
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
  },
  name: {
    color: '#fff',
    fontWeight: '900',
  },
});
