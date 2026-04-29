import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { getCurrentProfile, updateProfile, uploadProfilePicture } from '../../services/profileService';
import { UserProfile } from '../../types/social';
import { ProfileAvatar } from './ProfileAvatar';

export function EditProfileScreen({ visible, onClose, onSaved }: { visible: boolean; onClose: () => void; onSaved?: (profile: UserProfile) => void }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    getCurrentProfile().then(current => {
      setProfile(current);
      setDisplayName(current?.displayName ?? '');
      setUsername(current?.username ?? '');
      setBio(current?.bio ?? '');
      setIsPrivate(!!current?.isPrivate);
    }).catch(error => Alert.alert('Profile unavailable', error?.message ?? 'Could not load profile.'));
  }, [visible]);

  const save = async () => {
    try {
      setLoading(true);
      const saved = await updateProfile({ displayName, username, bio, isPrivate });
      setProfile(saved);
      onSaved?.(saved);
      onClose();
    } catch (error: any) {
      Alert.alert('Could not save profile', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const changeAvatar = async () => {
    try {
      setLoading(true);
      const saved = await uploadProfilePicture();
      setProfile(saved);
      onSaved?.(saved);
    } catch (error: any) {
      Alert.alert('Avatar upload failed', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={s.screen}>
        <View style={s.header}>
          <Pressable onPress={onClose} style={s.iconButton}><MaterialIcons name="close" size={22} color="#cbd5e1" /></Pressable>
          <Text style={s.title}>Edit Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={s.content}>
          <View style={s.avatarRow}>
            <ProfileAvatar avatarUrl={profile?.avatarUrl} displayName={displayName} size={82} />
            <Pressable onPress={changeAvatar} style={s.secondary}><Text style={s.secondaryText}>Change photo</Text></Pressable>
          </View>
          <Field label="Display name" value={displayName} onChange={setDisplayName} />
          <Field label="Username" value={username} onChange={value => setUsername(value.toLowerCase())} prefix="@" />
          <Text style={s.label}>Bio</Text>
          <TextInput value={bio} onChangeText={setBio} multiline placeholder="Training goals, favorite meals, or what you are building." placeholderTextColor="#64748b" style={[s.input, s.bio]} />
          <Pressable onPress={() => setIsPrivate(value => !value)} style={[s.privacy, isPrivate && s.privacyActive]}>
            <MaterialIcons name={isPrivate ? 'lock' : 'public'} size={18} color={isPrivate ? '#052e1c' : '#cbd5e1'} />
            <Text style={[s.privacyText, isPrivate && s.privacyTextActive]}>{isPrivate ? 'Private profile' : 'Public profile'}</Text>
          </Pressable>
          <Text style={s.note}>Public profiles can appear in user search. Private profiles hide detailed social info.</Text>
          <Pressable disabled={loading} onPress={save} style={s.primary}>{loading ? <ActivityIndicator color="#052e1c" /> : <Text style={s.primaryText}>Save Profile</Text>}</Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Field({ label, value, onChange, prefix }: { label: string; value: string; onChange: (value: string) => void; prefix?: string }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.inputRow}>{prefix && <Text style={s.prefix}>{prefix}</Text>}<TextInput value={value} onChangeText={onChange} style={s.input} autoCapitalize="none" /></View></View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244' },
  title: { color: '#fff', fontSize: 20, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 34 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  secondary: { borderWidth: 1, borderColor: '#34d399', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 },
  secondaryText: { color: '#34d399', fontWeight: '900' },
  field: { marginTop: 12 },
  label: { color: '#cbd5e1', fontWeight: '900', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  prefix: { color: '#34d399', fontWeight: '900' },
  input: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 12 },
  bio: { minHeight: 90, textAlignVertical: 'top', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 12 },
  privacy: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#243244', backgroundColor: '#0b1220' },
  privacyActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  privacyText: { color: '#cbd5e1', fontWeight: '900' },
  privacyTextActive: { color: '#052e1c' },
  note: { color: '#94a3b8', fontSize: 12, lineHeight: 18, marginTop: 8 },
  primary: { marginTop: 16, backgroundColor: '#34d399', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  primaryText: { color: '#052e1c', fontWeight: '900' },
});
