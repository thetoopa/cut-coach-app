import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CommunityMeal, UserProfile } from '../../types/social';
import { searchCommunityMeals } from '../../services/communityMealService';
import { ProfileAvatar } from './ProfileAvatar';

export function PublicProfileScreen({ profile, onClose }: { profile: UserProfile | null; onClose: () => void }) {
  const [meals, setMeals] = useState<CommunityMeal[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    searchCommunityMeals(profile.username).then(setMeals).finally(() => setLoading(false));
  }, [profile]);
  if (!profile) return null;
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.iconButton}><MaterialIcons name="chevron-left" size={24} color="#cbd5e1" /></Pressable>
          <Text style={s.title}>Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.hero}>
            <ProfileAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} size={88} />
            <Text style={s.name}>{profile.displayName}</Text>
            <Text style={s.username}>@{profile.username}</Text>
            {!!profile.bio && <Text style={s.bio}>{profile.bio}</Text>}
          </View>
          <Text style={s.section}>Public meals</Text>
          {loading ? <ActivityIndicator color="#34d399" /> : meals.map(meal => <View key={meal.id} style={s.meal}><Text style={s.mealName}>{meal.name}</Text><Text style={s.meta}>{meal.calories} cal · P {meal.protein}g</Text></View>)}
          <Text style={s.placeholder}>Public streaks and PRs are coming later and will be opt-in.</Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 52 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244' },
  title: { color: '#fff', fontWeight: '900', fontSize: 20 },
  content: { padding: 16, paddingBottom: 34 },
  hero: { alignItems: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 18, padding: 16 },
  name: { color: '#fff', fontSize: 22, fontWeight: '900', marginTop: 10 },
  username: { color: '#34d399', fontWeight: '900', marginTop: 3 },
  bio: { color: '#cbd5e1', textAlign: 'center', lineHeight: 20, marginTop: 10 },
  section: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginTop: 18, marginBottom: 10 },
  meal: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 10, marginBottom: 8 },
  mealName: { color: '#fff', fontWeight: '900' },
  meta: { color: '#94a3b8', marginTop: 4 },
  placeholder: { color: '#64748b', fontWeight: '800', marginTop: 12, lineHeight: 18 },
});
