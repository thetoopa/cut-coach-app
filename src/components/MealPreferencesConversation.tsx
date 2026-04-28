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
import { MealPreferences } from '../types/mealPreferences';

interface MealPreferencesConversationProps {
  onComplete: (prefs: MealPreferences) => void;
  onSkip: () => void;
}

type ConversationStep = 'meal_times' | 'snacks' | 'proteins' | 'carbs' | 'veggies' | 'fruits' | 'allergies' | 'summary';

interface Message {
  type: 'ai' | 'user';
  text: string;
  timestamp: number;
}

export const MealPreferencesConversation: React.FC<MealPreferencesConversationProps> = ({ onComplete, onSkip }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'ai',
      text: "Hello! I'm Dr. Nutrition, and I'm here to customize your meal plan.\n\nFirst, choose how much time you want to dedicate to breakfast, lunch, and dinner.",
      timestamp: Date.now(),
    },
  ]);
  
  const [step, setStep] = useState<ConversationStep>('meal_times');
  const [userInput, setUserInput] = useState('');
  const [preferences, setPreferences] = useState<MealPreferences>({});
  const [expandedMealTime, setExpandedMealTime] = useState<'breakfast' | 'lunch' | 'dinner' | null>('breakfast');
  const [mealTimes, setMealTimes] = useState({
    breakfastTime: '',
    lunchTime: '',
    dinnerTime: '',
  });
  const [snackSelections, setSnackSelections] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  const mealTimeOptions = ['Quick (5-10 min)', 'Moderate (15-20 min)', 'Detailed (30+ min)', 'Skip this meal'];

  const mealTimeFields = [
    { key: 'breakfastTime', label: 'Breakfast', next: 'lunch' },
    { key: 'lunchTime', label: 'Lunch', next: 'dinner' },
    { key: 'dinnerTime', label: 'Dinner', next: null },
  ] as const;

  const snackOptions = ['Quick grab & go', 'Prepped snacks', 'High-protein snacks', 'Fruit snacks', 'No preference'];

  const proteinOptions = [
    'Chicken',
    'Turkey',
    'Beef',
    'Fish/Salmon',
    'Eggs',
    'Dairy (Yogurt/Cottage Cheese)',
    'Tofu/Plant-based',
  ];

  const carbOptions = [
    'Rice',
    'Pasta',
    'Potatoes',
    'Sweet Potatoes',
    'Oats',
    'Bread',
    'Whole Grains',
    'Fruits',
  ];

  const veggyOptions = [
    'Broccoli',
    'Spinach',
    'Carrots',
    'Bell Peppers',
    'Asparagus',
    'Kale',
    'Zucchini',
    'Tomatoes',
  ];

  const fruitOptions = [
    'Bananas',
    'Berries',
    'Apples',
    'Oranges',
    'Pineapple',
    'Grapes',
    'Melon',
    'No fruit preference',
  ];

  const handleOption = (option: string) => {
    addUserMessage(option);
    processResponse(option);
  };

  const toggleMultiSelect = (key: 'favoriteProteins' | 'favoriteCarbs' | 'favoriteVeggies' | 'favoriteFruits', option: string) => {
    setPreferences((current) => {
      const existing = current[key] || [];
      const next = existing.includes(option)
        ? existing.filter((item) => item !== option)
        : [...existing, option];
      return { ...current, [key]: next };
    });
  };

  const handleMealTimeSelect = (key: keyof typeof mealTimes, option: string, next: 'lunch' | 'dinner' | null) => {
    setMealTimes(current => ({ ...current, [key]: option }));
    setExpandedMealTime(next);
  };

  const mealTimeToCookingTime = () => {
    const selected = [mealTimes.breakfastTime, mealTimes.lunchTime, mealTimes.dinnerTime];
    if (selected.some(value => value.startsWith('Detailed'))) return 'detailed';
    if (selected.some(value => value.startsWith('Moderate'))) return 'moderate';
    return 'quick';
  };

  const handleMealTimesDone = () => {
    const completed = {
      cookingTimePerMeal: mealTimeToCookingTime(),
      breakfastTime: mealTimes.breakfastTime || 'No preference',
      lunchTime: mealTimes.lunchTime || 'No preference',
      dinnerTime: mealTimes.dinnerTime || 'No preference',
    };
    setPreferences(current => ({ ...current, ...completed }));
    addUserMessage(`Breakfast: ${completed.breakfastTime}\nLunch: ${completed.lunchTime}\nDinner: ${completed.dinnerTime}`);
    addAIMessage("Perfect. Now choose the proteins you want me to build meals around.");
    setStep('proteins');
  };

  const toggleSnackPreference = (option: string) => {
    setSnackSelections((current) => {
      if (option === 'No preference') return current.includes(option) ? [] : ['No preference'];
      const withoutNoPreference = current.filter(item => item !== 'No preference');
      return withoutNoPreference.includes(option)
        ? withoutNoPreference.filter(item => item !== option)
        : [...withoutNoPreference, option];
    });
  };

  const handleSnacksDone = () => {
    const snacks = snackSelections.length ? snackSelections : ['No preference'];
    setPreferences(p => ({ ...p, snackPreference: snacks.join(', ') }));
    addUserMessage(`Snacks: ${snacks.join(', ')}`);
    addAIMessage("Perfect! Any food allergies or items you strongly dislike? Tell me about them.");
    setStep('allergies');
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

    if (step === 'allergies') {
      setPreferences(p => ({ ...p, allergies: option }));
      addAIMessage("Excellent! I've got your complete meal profile. Let me summarize and finalize your preferences...");
      setStep('summary');
    }
  };

  const handleDone = () => {
    if (step === 'proteins') {
      addAIMessage("Perfect! What vegetables do you enjoy?");
      setStep('veggies');
    } else if (step === 'veggies') {
      addAIMessage("Great. What fruits do you want included?");
      setStep('fruits');
    } else if (step === 'fruits') {
      addAIMessage("Nice. What carbohydrate sources should I use?");
      setStep('carbs');
    } else if (step === 'carbs') {
      addAIMessage("Excellent. Last food setup question: how do you want snacks handled?");
      setStep('snacks');
    } else if (step === 'summary') {
      onComplete(preferences);
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'meal_times':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Select one option for each meal</Text>
            {mealTimeFields.map((field) => {
              const selected = mealTimes[field.key];
              const expanded = expandedMealTime === field.label.toLowerCase();
              return (
                <View key={field.key} style={s.dropdownGroup}>
                  <Pressable
                    style={[s.dropdownHeader, expanded && s.dropdownHeaderActive]}
                    onPress={() => setExpandedMealTime(expanded ? null : field.label.toLowerCase() as 'breakfast' | 'lunch' | 'dinner')}
                  >
                    <View>
                      <Text style={s.dropdownLabel}>{field.label}</Text>
                      <Text style={s.dropdownValue}>{selected || 'Choose prep time'}</Text>
                    </View>
                    <MaterialIcons name={expanded ? 'expand-less' : 'expand-more'} size={22} color="#34d399" />
                  </Pressable>
                  {expanded && (
                    <View style={s.dropdownMenu}>
                      {mealTimeOptions.map((option) => (
                        <Pressable
                          key={option}
                          style={[s.dropdownOption, selected === option && s.dropdownOptionSelected]}
                          onPress={() => handleMealTimeSelect(field.key, option, field.next)}
                        >
                          <Text style={[s.dropdownOptionText, selected === option && s.dropdownOptionTextSelected]}>{option}</Text>
                          {selected === option && <MaterialIcons name="check" size={16} color="#052e1c" />}
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
            <Pressable style={s.doneButton} onPress={handleMealTimesDone}>
              <Text style={s.doneButtonText}>Continue</Text>
            </Pressable>
          </View>
        );
      case 'snacks':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Choose all snack styles you want available</Text>
            <View style={s.choiceGrid}>
            {snackOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  snackSelections.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleSnackPreference(option)}
              >
                <Text style={[s.choiceText, snackSelections.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {snackSelections.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={s.doneButton} onPress={handleSnacksDone}>
              <Text style={s.doneButtonText}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'proteins':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Choose as many as you like</Text>
            <View style={s.choiceGrid}>
            {proteinOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  preferences.favoriteProteins?.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleMultiSelect('favoriteProteins', option)}
              >
                <Text style={[s.choiceText, preferences.favoriteProteins?.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {preferences.favoriteProteins?.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={s.doneButton} onPress={handleDone}>
              <Text style={s.doneButtonText}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'carbs':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Choose staples you actually enjoy</Text>
            <View style={s.choiceGrid}>
            {carbOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  preferences.favoriteCarbs?.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleMultiSelect('favoriteCarbs', option)}
              >
                <Text style={[s.choiceText, preferences.favoriteCarbs?.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {preferences.favoriteCarbs?.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={s.doneButton} onPress={handleDone}>
              <Text style={s.doneButtonText}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'veggies':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Pick the vegetables you will reliably eat</Text>
            <View style={s.choiceGrid}>
            {veggyOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  preferences.favoriteVeggies?.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleMultiSelect('favoriteVeggies', option)}
              >
                <Text style={[s.choiceText, preferences.favoriteVeggies?.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {preferences.favoriteVeggies?.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={s.doneButton} onPress={handleDone}>
              <Text style={s.doneButtonText}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'fruits':
        return (
          <View style={s.optionsContainer}>
            <Text style={s.controlHint}>Choose fruits you like in meals or snacks</Text>
            <View style={s.choiceGrid}>
            {fruitOptions.map((option, idx) => (
              <Pressable
                key={idx}
                style={[
                  s.choiceChip,
                  preferences.favoriteFruits?.includes(option) && s.choiceChipSelected,
                ]}
                onPress={() => toggleMultiSelect('favoriteFruits', option)}
              >
                <Text style={[s.choiceText, preferences.favoriteFruits?.includes(option) && s.choiceTextSelected]} numberOfLines={2}>
                  {option}
                </Text>
                {preferences.favoriteFruits?.includes(option) && (
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                )}
              </Pressable>
            ))}
            </View>
            <Pressable style={s.doneButton} onPress={handleDone}>
              <Text style={s.doneButtonText}>Done Selecting</Text>
            </Pressable>
          </View>
        );
      case 'allergies':
        return (
          <View style={s.inputContainer}>
            <TextInput
              style={s.textInput}
              placeholder="e.g., Peanuts, Shellfish, Lactose intolerant..."
              placeholderTextColor="#64748b"
              value={userInput}
              onChangeText={setUserInput}
              multiline
            />
            <Pressable
              style={s.submitButton}
              onPress={() => {
                handleOption(userInput || 'No allergies');
                setUserInput('');
              }}
            >
              <Text style={s.submitButtonText}>Continue</Text>
            </Pressable>
          </View>
        );
      case 'summary':
        return (
          <View style={s.summaryContainer}>
            <Text style={s.summaryTitle}>✅ Your Meal Profile</Text>
            <Text style={s.summaryText}>
              Breakfast time: {preferences.breakfastTime}{'\n'}
              Lunch time: {preferences.lunchTime}{'\n'}
              Dinner time: {preferences.dinnerTime}{'\n'}
              Favorite proteins: {preferences.favoriteProteins?.join(', ')}{'\n'}
              Favorite carbs: {preferences.favoriteCarbs?.join(', ')}{'\n'}
              Favorite veggies: {preferences.favoriteVeggies?.join(', ')}{'\n'}
              Favorite fruits: {preferences.favoriteFruits?.join(', ')}{'\n'}
              Snacks: {preferences.snackPreference || 'No preference'}{'\n'}
              Allergies: {preferences.allergies || 'None'}
            </Text>
            <Pressable style={s.confirmButton} onPress={handleDone}>
              <Text style={s.confirmButtonText}>Confirm & Continue</Text>
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
        <Text style={s.skipButtonText}>Skip Customization</Text>
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
    backgroundColor: '#34d399',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 18,
  },
  aiMessageText: {
    color: '#cbd5e1',
  },
  userMessageText: {
    color: '#052e1c',
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
  dropdownGroup: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    overflow: 'hidden',
  },
  dropdownHeader: {
    minHeight: 58,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownHeaderActive: {
    borderBottomWidth: 1,
    borderBottomColor: '#243244',
  },
  dropdownLabel: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
  },
  dropdownValue: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '700',
  },
  dropdownMenu: {
    padding: 8,
    gap: 6,
  },
  dropdownOption: {
    minHeight: 40,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#111827',
  },
  dropdownOptionSelected: {
    backgroundColor: '#34d399',
  },
  dropdownOptionText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '800',
  },
  dropdownOptionTextSelected: {
    color: '#052e1c',
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
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  optionButtonSelected: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
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
    color: '#052e1c',
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
  inputContainer: {
    gap: 10,
  },
  textInput: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#cbd5e1',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#34d399',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  submitButtonText: {
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
    color: '#34d399',
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
