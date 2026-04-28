import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type WorkoutPreferences = {
  useDefaults?: boolean;
  gymType?: string;
  workoutStyle?: string;
  timePerWorkout?: string;
  equipmentAccess?: string;
  likedExercises?: string;
  trainingLimits?: string;
};

interface WorkoutPreferencesConversationProps {
  onComplete: (prefs: WorkoutPreferences) => void;
  onSkip: () => void;
}

type ConversationStep = 'gym_type' | 'workout_style' | 'time_available' | 'goals' | 'limitations' | 'summary';

interface Message {
  type: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export const WorkoutPreferencesConversation: React.FC<WorkoutPreferencesConversationProps> = ({ onComplete, onSkip }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: "Hey! I'm Coach AI, and I'll create the perfect workout plan for you.\n\nFirst, tell me about your gym setup. What equipment do you have access to?",
      timestamp: Date.now(),
    },
  ]);

  const [step, setStep] = useState<ConversationStep>('gym_type');
  const [preferences, setPreferences] = useState<WorkoutPreferences>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const gymOptions = [
    'Full gym with all equipment',
    'Small gym with dumbbells & machines',
    'Home gym with dumbbells only',
    'No equipment (bodyweight)',
    'Mix of locations',
  ];

  const styleOptions = [
    'Strength focused (heavy lifting)',
    'Hypertrophy (muscle building)',
    'Fat loss & conditioning',
    'Athletic performance',
    'Balanced approach',
  ];

  const timeOptions = [
    '30-45 minutes',
    '45-60 minutes',
    '60-90 minutes',
    '90+ minutes',
  ];

  const goalOptions = [
    'Build muscle',
    'Lose fat',
    'Increase strength',
    'Improve endurance',
    'General fitness',
    'Athletic performance',
  ];

  const limitationOptions = [
    'No injuries',
    'Lower back issues',
    'Shoulder problems',
    'Knee issues',
    'Multiple joint concerns',
  ];

  const handleOption = (option: string) => {
    addUserMessage(option);
    processResponse(option);
  };

  const toggleGoal = (option: string) => {
    setPreferences((current) => {
      const goals = (current.likedExercises || '')
        .split(',')
        .map((goal) => goal.trim())
        .filter(Boolean);
      const next = goals.includes(option)
        ? goals.filter((goal) => goal !== option)
        : [...goals, option];
      return { ...current, likedExercises: next.join(', ') };
    });
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, { type: 'user', text, timestamp: Date.now() }]);
  };

  const addAIMessage = (text: string) => {
    setMessages(prev => [...prev, { type: 'ai', text, timestamp: Date.now() }]);
  };

  const processResponse = (option: string) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    if (step === 'gym_type') {
      setPreferences(p => ({ ...p, useDefaults: false, gymType: option, equipmentAccess: option }));
      addAIMessage("Got it! Based on your setup, here are some training styles that would work great for you. What's your primary focus?");
      setStep('workout_style');
    } else if (step === 'workout_style') {
      setPreferences(p => ({ ...p, workoutStyle: option }));
      addAIMessage("Perfect! How much time can you dedicate to each workout?");
      setStep('time_available');
    } else if (step === 'time_available') {
      setPreferences(p => ({ ...p, timePerWorkout: option }));
      addAIMessage("Great! I can work with that. What are your main fitness goals? (Select all that apply)");
      setStep('goals');
    } else if (step === 'goals') {
      const currentGoals = (preferences.likedExercises?.split(',') || []).map(g => g.trim());
      if (!currentGoals.includes(option)) {
        currentGoals.push(option);
        setPreferences(p => ({ ...p, likedExercises: currentGoals.join(', ') }));
      }
      addAIMessage("Good! Select another goal or click 'Done' to continue.");
    } else if (step === 'limitations') {
      setPreferences(p => ({ ...p, trainingLimits: option }));
      addAIMessage("Perfect! I've got all the information I need. Let me create your personalized workout plan...");
      setStep('summary');
    }
  };

  const handleDone = () => {
    if (step === 'goals') {
      addAIMessage("Any injuries or limitations I should know about? (This helps me avoid movements that could aggravate them)");
      setStep('limitations');
    } else if (step === 'summary') {
      onComplete(preferences);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'gym_type':
        return (
          <View style={s.optionsContainer}>
            {gymOptions.map((option, idx) => (
              <Pressable key={idx} style={s.optionButton} onPress={() => handleOption(option)}>
                <Text style={s.optionText}>{option}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
              </Pressable>
            ))}
          </View>
        );
      case 'workout_style':
        return (
          <View style={s.optionsContainer}>
            {styleOptions.map((option, idx) => (
              <Pressable key={idx} style={s.optionButton} onPress={() => handleOption(option)}>
                <Text style={s.optionText}>{option}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
              </Pressable>
            ))}
          </View>
        );
      case 'time_available':
        return (
          <View style={s.optionsContainer}>
            {timeOptions.map((option, idx) => (
              <Pressable key={idx} style={s.optionButton} onPress={() => handleOption(option)}>
                <Text style={s.optionText}>{option}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
              </Pressable>
            ))}
          </View>
        );
      case 'goals':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Select every goal that matters right now</Text>
            <View style={s.choiceGrid}>
            {goalOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  preferences.likedExercises?.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleGoal(option)}
              >
                <Text style={[s.choiceText, preferences.likedExercises?.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {preferences.likedExercises?.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#92400e" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={[s.doneButton, { backgroundColor: '#f59e0b' }]} onPress={handleDone}>
              <Text style={[s.doneButtonText, { color: '#92400e' }]}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'limitations':
        return (
          <View style={s.optionsContainer}>
            {limitationOptions.map((option, idx) => (
              <Pressable key={idx} style={s.optionButton} onPress={() => handleOption(option)}>
                <Text style={s.optionText}>{option}</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
              </Pressable>
            ))}
            <Pressable style={[s.optionButton, s.noConcernButton]} onPress={() => handleOption('No limitations')}>
              <Text style={s.optionText}>No injuries or limitations</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#f59e0b" />
            </Pressable>
          </View>
        );
      case 'summary':
        return (
          <View style={s.summaryContainer}>
            <Text style={s.summaryTitle}>💪 Your Workout Profile</Text>
            <Text style={s.summaryText}>
              Gym setup: {preferences.gymType}{'\n'}
              Training style: {preferences.workoutStyle}{'\n'}
              Time per workout: {preferences.timePerWorkout}{'\n'}
              Goals: {preferences.likedExercises}{'\n'}
              Limitations: {preferences.trainingLimits}
            </Text>
            <Pressable style={[s.confirmButton, { backgroundColor: '#f59e0b' }]} onPress={handleDone}>
              <Text style={[s.confirmButtonText, { color: '#92400e' }]}>Create My Workout</Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [messages]);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
      <ScrollView ref={scrollViewRef} style={s.messagesContainer} contentContainerStyle={s.messagesContent}>
        {messages.map((msg, idx) => (
          <View key={idx} style={[s.messageBubble, msg.type === 'user' ? s.userMessage : s.aiMessage]}>
            <Text style={[s.messageText, msg.type === 'user' ? s.userMessageText : s.aiMessageText]}>
              {msg.text}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.contentArea}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.controlsContent}>
          {renderContent()}
        </ScrollView>
      </View>

      <Pressable style={s.skipButton} onPress={onSkip}>
        <Text style={s.skipButtonText}>Use Default Workouts</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  messagesContent: {
    paddingTop: 6,
    paddingBottom: 10,
  },
  messageBubble: {
    marginVertical: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    maxWidth: '85%',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#f59e0b',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  aiMessageText: {
    color: '#cbd5e1',
  },
  userMessageText: {
    color: '#92400e',
    fontWeight: '600',
  },
  contentArea: {
    maxHeight: '48%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  controlsContent: {
    paddingBottom: 4,
  },
  optionsContainer: {
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  noConcernButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  controlHint: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  choiceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  choiceChip: {
    width: '48%',
    minHeight: 44,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  choiceChipSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  optionText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  choiceText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '700',
    flex: 1,
  },
  choiceTextSelected: {
    color: '#92400e',
  },
  doneButton: {
    backgroundColor: '#34d399',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#052e1c',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryContainer: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  summaryTitle: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 14,
  },
  summaryText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  confirmButton: {
    backgroundColor: '#34d399',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  confirmButtonText: {
    color: '#052e1c',
    fontWeight: '700',
    fontSize: 14,
  },
  skipButton: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 18 : 10,
    borderTopWidth: 1,
    borderTopColor: '#243244',
  },
  skipButtonText: {
    color: '#64748b',
    fontSize: 13,
  },
});
