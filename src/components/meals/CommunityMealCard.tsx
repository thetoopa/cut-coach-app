import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommunityMeal } from '../../types/social';
import { ProfileAvatar } from '../profile/ProfileAvatar';

export function CommunityMealCard({ meal, onPress, onAdd }: { meal: CommunityMeal; onPress: () => void; onAdd: () => void }) {
  return (
    <Pressable onPress={onPress} style={s.card}>
      <View style={s.creator}>
        <ProfileAvatar avatarUrl={meal.creatorAvatarUrl} displayName={meal.creatorDisplayName} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={s.creatorName}>{meal.creatorDisplayName}</Text>
          <Text style={s.username}>@{meal.creatorUsername}</Text>
        </View>
        <Pressable onPress={onAdd} style={s.addButton}><MaterialIcons name="add" size={18} color="#052e1c" /></Pressable>
      </View>
      <Text style={s.name}>{meal.name}</Text>
      <Text style={s.meta}>{meal.category} · {meal.calories} cal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</Text>
      <Text style={s.meta}>{meal.savesCount} saves · {meal.likesCount} likes</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 12, marginBottom: 10 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  creatorName: { color: '#f8fafc', fontWeight: '900', fontSize: 13 },
  username: { color: '#94a3b8', fontWeight: '800', fontSize: 12, marginTop: 1 },
  addButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#34d399' },
  name: { color: '#fff', fontWeight: '900', fontSize: 16 },
  meta: { color: '#94a3b8', fontWeight: '700', fontSize: 12, marginTop: 5 },
});
