import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCurrentSession, signOut } from '../../services/authService';
import { createProfileAfterSignup, validateUsername } from '../../services/profileService';
import { UserProfile } from '../../types/social';

export function ProfileCompletionScreen({ onComplete }: { onComplete: (profile: UserProfile) => void }) {
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCurrentSession().then(session => {
      const metadata = session?.user.user_metadata ?? {};
      setDisplayName(current => current || metadata.display_name || '');
      setUsername(current => current || metadata.username || '');
    }).catch(() => {});
  }, []);

  const submit = async () => {
    try {
      setLoading(true);
      const session = await getCurrentSession();
      if (!session?.user) throw new Error('No active Supabase session.');
      const profile = await createProfileAfterSignup({
        id: session.user.id,
        email: session.user.email ?? undefined,
        displayName,
        username: validateUsername(username),
      });
      onComplete(profile);
    } catch (error: any) {
      Alert.alert('Profile setup failed', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
        <Text style={s.title}>Finish your Calos profile</Text>
        <Text style={s.sub}>This is your public identity for usernames, profile search, and community meals.</Text>
        <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Cooper Heisler" />
        <Field label="Username" value={username} onChange={value => setUsername(value.toLowerCase())} placeholder="thetoopa" prefix="@" />
        <Pressable disabled={loading} onPress={submit} style={s.primary}>{loading ? <ActivityIndicator color="#052e1c" /> : <Text style={s.primaryText}>Create Profile</Text>}</Pressable>
        <Pressable onPress={() => signOut().catch(() => {})} style={s.secondary}><Text style={s.secondaryText}>Log out</Text></Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, prefix }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; prefix?: string }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><View style={s.inputRow}>{prefix && <Text style={s.prefix}>{prefix}</Text>}<TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#64748b" style={s.input} autoCapitalize="none" /></View></View>;
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, justifyContent: 'center', padding: 18 },
  title: { color: '#fff', fontSize: 32, fontWeight: '900' },
  sub: { color: '#94a3b8', fontWeight: '700', lineHeight: 20, marginTop: 8, marginBottom: 12 },
  field: { marginTop: 12 },
  label: { color: '#cbd5e1', fontWeight: '900', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  prefix: { color: '#34d399', fontWeight: '900' },
  input: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 12 },
  primary: { backgroundColor: '#34d399', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 16 },
  primaryText: { color: '#052e1c', fontWeight: '900' },
  secondary: { alignItems: 'center', marginTop: 14 },
  secondaryText: { color: '#94a3b8', fontWeight: '800' },
});
