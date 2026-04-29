import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

export function ProfileAvatar({ avatarUrl, displayName, size = 52 }: { avatarUrl?: string; displayName?: string; size?: number }) {
  const initials = (displayName || 'C')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('') || 'C';
  if (avatarUrl) {
    return <Image source={{ uri: avatarUrl }} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#0b1220' }} />;
  }
  return (
    <View style={[s.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.initials, { fontSize: Math.max(13, size * 0.34) }]}>{initials}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#34d399', borderWidth: 1, borderColor: '#14532d' },
  initials: { color: '#052e1c', fontWeight: '900' },
});
