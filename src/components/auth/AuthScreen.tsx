import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { signIn, signUpWithProfile } from '../../services/authService';
import { checkUsernameAvailable, validateUsername } from '../../services/profileService';

export function AuthScreen({ onAuthenticated, onSkipCloud }: { onAuthenticated: () => void; onSkipCloud?: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!isSupabaseConfigured) {
      Alert.alert('Cloud not configured', 'Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env to enable Calos accounts.');
      return;
    }
    try {
      setLoading(true);
      if (mode === 'signup') {
        const cleanUsername = validateUsername(username);
        const available = await checkUsernameAvailable(cleanUsername);
        if (!available) throw new Error('That username is already taken.');
        const data = await signUpWithProfile({ email, password, displayName, username: cleanUsername });
        if (!data.session) {
          Alert.alert('Account created', 'Check your email to confirm your account, then log in. Calos will finish your profile after you sign in.');
          setMode('login');
          return;
        }
      } else {
        await signIn(email, password);
      }
      onAuthenticated();
    } catch (error: any) {
      Alert.alert(mode === 'signup' ? 'Signup failed' : 'Login failed', error?.message ?? 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.wrap}>
        <View style={s.brand}>
          <Text style={s.logo}>Calos</Text>
          <Text style={s.subtitle}>Your fitness system, now with cloud identity and community meals.</Text>
        </View>
        {!isSupabaseConfigured && (
          <View style={s.warning}>
            <MaterialIcons name="cloud-off" size={18} color="#fde68a" />
            <Text style={s.warningText}>Supabase env vars are missing. Cloud accounts are disabled until you add them.</Text>
          </View>
        )}
        <View style={s.card}>
          <View style={s.tabs}>
            <Pressable onPress={() => setMode('login')} style={[s.tab, mode === 'login' && s.tabActive]}><Text style={[s.tabText, mode === 'login' && s.tabTextActive]}>Log in</Text></Pressable>
            <Pressable onPress={() => setMode('signup')} style={[s.tab, mode === 'signup' && s.tabActive]}><Text style={[s.tabText, mode === 'signup' && s.tabTextActive]}>Sign up</Text></Pressable>
          </View>
          {mode === 'signup' && (
            <>
              <Field label="Display name" value={displayName} onChange={setDisplayName} placeholder="Cooper Heisler" />
              <Field label="Username" value={username} onChange={value => setUsername(value.toLowerCase())} placeholder="thetoopa" prefix="@" />
            </>
          )}
          <Field label="Email" value={email} onChange={setEmail} placeholder="you@email.com" keyboardType="email-address" />
          <Field label="Password" value={password} onChange={setPassword} placeholder="••••••••" secure />
          <Pressable disabled={loading} onPress={submit} style={[s.primary, loading && s.disabled]}>
            {loading ? <ActivityIndicator color="#052e1c" /> : <Text style={s.primaryText}>{mode === 'signup' ? 'Create Account' : 'Log In'}</Text>}
          </Pressable>
          {onSkipCloud && <Pressable onPress={onSkipCloud} style={s.skip}><Text style={s.skipText}>Continue local only</Text></Pressable>}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, placeholder, prefix, secure, keyboardType }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; prefix?: string; secure?: boolean; keyboardType?: any }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>{prefix && <Text style={s.prefix}>{prefix}</Text>}<TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="#64748b" secureTextEntry={secure} keyboardType={keyboardType} autoCapitalize="none" style={s.input} /></View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b0f14' },
  wrap: { flex: 1, padding: 18, justifyContent: 'center' },
  brand: { marginBottom: 18 },
  logo: { color: '#fff', fontSize: 42, fontWeight: '900' },
  subtitle: { color: '#94a3b8', fontWeight: '700', lineHeight: 20, marginTop: 6 },
  warning: { flexDirection: 'row', gap: 8, backgroundColor: '#1f1a0b', borderWidth: 1, borderColor: '#854d0e', borderRadius: 12, padding: 11, marginBottom: 12 },
  warningText: { color: '#fde68a', flex: 1, fontWeight: '800', fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: '#111827', borderWidth: 1, borderColor: '#243244', borderRadius: 18, padding: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  tab: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244' },
  tabActive: { backgroundColor: '#34d399', borderColor: '#34d399' },
  tabText: { color: '#cbd5e1', fontWeight: '900' },
  tabTextActive: { color: '#052e1c' },
  field: { marginTop: 10 },
  label: { color: '#cbd5e1', fontWeight: '900', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, paddingHorizontal: 11 },
  prefix: { color: '#34d399', fontWeight: '900' },
  input: { flex: 1, color: '#fff', fontWeight: '800', paddingVertical: 12 },
  primary: { backgroundColor: '#34d399', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  primaryText: { color: '#052e1c', fontWeight: '900', fontSize: 15 },
  disabled: { opacity: 0.55 },
  skip: { alignItems: 'center', marginTop: 12 },
  skipText: { color: '#94a3b8', fontWeight: '800' },
});
