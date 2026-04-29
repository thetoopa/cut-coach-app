import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { searchPublicProfiles } from '../../services/profileService';
import { UserProfile } from '../../types/social';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { PublicProfileScreen } from '../profile/PublicProfileScreen';

export function UserSearchScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    try {
      setLoading(true);
      setResults(await searchPublicProfiles(query));
    } catch (error: any) {
      Alert.alert('Search failed', error?.message ?? 'Could not search users.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
          <Text style={s.title}>Search Users</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.searchRow}>
            <TextInput value={query} onChangeText={setQuery} onSubmitEditing={search} placeholder="Search @username or display name" placeholderTextColor="#64748b" style={s.input} autoCapitalize="none" />
            <Pressable onPress={search}><MaterialIcons name="search" size={22} color="#34d399" /></Pressable>
          </View>
          {loading ? <ActivityIndicator color="#34d399" style={{ marginTop: 20 }} /> : results.map(profile => (
            <Pressable key={profile.id} onPress={() => setSelected(profile)} style={s.userRow}>
              <ProfileAvatar avatarUrl={profile.avatarUrl} displayName={profile.displayName} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{profile.displayName}</Text>
                <Text style={s.username}>@{profile.username}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="#64748b" />
            </Pressable>
          ))}
        </ScrollView>
        <PublicProfileScreen profile={selected} onClose={() => setSelected(null)} />
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 34 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  input: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 12 },
  userRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 14, padding: 12, marginTop: 10 },
  name: { color: '#f8fafc', fontWeight: '900' },
  username: { color: '#94a3b8', fontWeight: '800', marginTop: 2 },
});
