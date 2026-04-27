// src/utils/soundAndHaptics.ts
// Utilities for sounds, vibrations, and feedback effects

import { Vibration } from 'react-native';

export const SoundManager = {
  // Simple beep sounds using console (native solution would need expo-av)
  playCheckmark: () => {
    // Visual/haptic feedback for checkmarks
    Vibration.vibrate([0, 50, 100, 50]);
  },
  
  playSuccess: () => {
    // Longer vibration pattern for success
    Vibration.vibrate([0, 100, 50, 100, 50, 100]);
  },
  
  playError: () => {
    // Short, quick vibration for errors
    Vibration.vibrate([0, 30, 50, 30]);
  },
  
  playWarning: () => {
    // Medium vibration for warnings
    Vibration.vibrate([0, 50, 100, 50]);
  },
  
  playNotification: () => {
    // Gentle notification vibration
    Vibration.vibrate([0, 100]);
  },
};

export const ConfettiEffect = {
  getRandomColor: () => {
    const colors = ['#10b981', '#fbbf24', '#ef4444', '#3b82f6', '#a855f7'];
    return colors[Math.floor(Math.random() * colors.length)];
  },
  
  generateConfetti: (count = 50) => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      duration: 2000 + Math.random() * 1000,
      delay: Math.random() * 200,
      color: ConfettiEffect.getRandomColor(),
      size: 6 + Math.random() * 6,
      rotation: Math.random() * 360,
    }));
  },
};
