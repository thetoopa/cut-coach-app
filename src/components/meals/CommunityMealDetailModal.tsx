import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommunityMeal } from '../../types/social';
import { ProfileAvatar } from '../profile/ProfileAvatar';

export function CommunityMealDetailModal({ meal, onClose, onAdd }: { meal: CommunityMeal | null; onClose: () => void; onAdd: (meal: CommunityMeal) => void }) {
  if (!meal) return null;
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.header}>
          <View style={s.creator}>
            <ProfileAvatar avatarUrl={meal.creatorAvatarUrl} displayName={meal.creatorDisplayName} size={42} />
            <View>
              <Text style={s.creatorName}>{meal.creatorDisplayName}</Text>
              <Text style={s.username}>@{meal.creatorUsername}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={s.close}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>{meal.name}</Text>
          <Text style={s.meta}>{meal.calories} cal · P {meal.protein}g · C {meal.carbs}g · F {meal.fat}g</Text>
          <Text style={s.section}>Ingredients</Text>
          {meal.ingredients.length ? meal.ingredients.map(item => <Text key={item} style={s.item}>• {item}</Text>) : <Text style={s.item}>No ingredients listed.</Text>}
          <Text style={s.section}>Instructions</Text>
          {meal.instructions.length ? meal.instructions.map((item, index) => <Text key={`${item}-${index}`} style={s.item}>{index + 1}. {item}</Text>) : <Text style={s.item}>No instructions listed.</Text>}
          <Pressable onPress={() => onAdd(meal)} style={s.primary}><Text style={s.primaryText}>Add to My Meals</Text></Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 22 },
  creator: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creatorName: { color: '#fff', fontWeight: '900' },
  username: { color: '#94a3b8', fontWeight: '800', marginTop: 2 },
  close: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244' },
  content: { padding: 16, paddingBottom: 34 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },
  meta: { color: '#bbf7d0', fontWeight: '900', marginTop: 8 },
  section: { color: '#34d399', fontWeight: '900', fontSize: 15, marginTop: 18, marginBottom: 8 },
  item: { color: '#cbd5e1', lineHeight: 20, marginBottom: 6 },
  primary: { backgroundColor: '#34d399', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 18 },
  primaryText: { color: '#052e1c', fontWeight: '900' },
});
