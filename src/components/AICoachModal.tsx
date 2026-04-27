// src/components/AICoachModal.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  FlatList,
  Vibration,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendChatMessage, parseMealPlanFromResponse, ChatMessage, MealPlanResponse } from '../services/openaiService';

interface AICoachModalProps {
  visible: boolean;
  profile: any;
  onClose: () => void;
  onSaveMeals: (meals: any[]) => void;
}

export function AICoachModal({ visible, profile, onClose, onSaveMeals }: AICoachModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlanResult, setMealPlanResult] = useState<MealPlanResponse | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initial greeting
  useEffect(() => {
    if (visible && messages.length === 0) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: `Hi ${profile.name}! 👋 I'm your AI Nutrition Coach. I'm here to create a personalized meal plan based on your goals and preferences.\n\nTell me:\n1. What are your current fitness goals? (cutting, bulking, maintaining?)\n2. Any foods you love or can't stand?\n3. Dietary restrictions or allergies?\n\nLet's build the perfect meal plan for you!`,
      };
      setMessages([greeting]);
    }
  }, [visible]);

  const handleSendMessage = async () => {
    if (!userInput.trim() || loading) return;

    Vibration.vibrate(50);
    const userMessage = userInput.trim();
    setUserInput('');

    // Add user message to chat
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Send to OpenAI
      const response = await sendChatMessage(
        messages,
        userMessage
      );

      // Check if response contains a meal plan
      const mealPlan = parseMealPlanFromResponse(response);
      if (mealPlan) {
        setMealPlanResult(mealPlan);
      }

      // Add assistant response
      const updatedMessages: ChatMessage[] = [
        ...newMessages,
        { role: 'assistant', content: response },
      ];
      setMessages(updatedMessages);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessages: ChatMessage[] = [
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ];
      setMessages(errorMessages);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMealPlan = () => {
    if (!mealPlanResult) return;

    const customMeals = mealPlanResult.meals.map((meal, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      name: meal.name,
      type: meal.type as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: `${meal.description}\n\n${meal.notes}`,
    }));

    onSaveMeals(customMeals);
    Vibration.vibrate([0, 100, 50, 100]);
    // Show confirmation
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.title}>AI Nutrition Coach</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.map((msg, idx) => (
            <View
              key={idx}
              style={[
                styles.messageBubble,
                msg.role === 'assistant'
                  ? styles.assistantBubble
                  : styles.userBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  msg.role === 'assistant'
                    ? styles.assistantText
                    : styles.userText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          ))}

          {/* Meal Plan Result */}
          {mealPlanResult && (
            <View style={styles.mealPlanContainer}>
              <Text style={styles.mealPlanTitle}>📋 Your Meal Plan</Text>
              <Text style={styles.mealPlanSummary}>{mealPlanResult.summary}</Text>

              <View style={styles.mealPlanStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Calories</Text>
                  <Text style={styles.statValue}>{mealPlanResult.totalCalories}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Protein</Text>
                  <Text style={styles.statValue}>{mealPlanResult.totalProtein}g</Text>
                </View>
              </View>

              <Text style={styles.mealsHeader}>Meals:</Text>
              {mealPlanResult.meals.map((meal, idx) => (
                <View key={idx} style={styles.mealCard}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealName}>{meal.name}</Text>
                    <Text style={styles.mealType}>{meal.type}</Text>
                  </View>
                  <Text style={styles.mealDesc}>{meal.description}</Text>
                  <View style={styles.mealMacros}>
                    <Text style={styles.macro}>{meal.calories} cal</Text>
                    <Text style={styles.macro}>{meal.protein}g P</Text>
                    <Text style={styles.macro}>{meal.carbs}g C</Text>
                    <Text style={styles.macro}>{meal.fat}g F</Text>
                  </View>
                  {meal.notes && <Text style={styles.mealNotes}>📌 {meal.notes}</Text>}
                </View>
              ))}

              {mealPlanResult.recommendations.length > 0 && (
                <View style={styles.recommendationsBox}>
                  <Text style={styles.recTitle}>💡 Recommendations:</Text>
                  {mealPlanResult.recommendations.map((rec, idx) => (
                    <Text key={idx} style={styles.recItem}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              )}

              <Pressable
                onPress={handleSaveMealPlan}
                style={styles.saveMealPlanButton}
              >
                <MaterialIcons name="save" size={18} color="#fff" />
                <Text style={styles.saveMealPlanText}>Save to My Meals</Text>
              </Pressable>
            </View>
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#34d399" />
              <Text style={styles.loadingText}>AI is thinking...</Text>
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tell the AI about your food preferences..."
            placeholderTextColor="#64748b"
            value={userInput}
            onChangeText={setUserInput}
            multiline
            editable={!loading}
          />
          <Pressable
            onPress={handleSendMessage}
            disabled={!userInput.trim() || loading}
            style={[
              styles.sendButton,
              (!userInput.trim() || loading) && styles.sendButtonDisabled,
            ]}
          >
            <MaterialIcons
              name={loading ? 'hourglass-empty' : 'send'}
              size={18}
              color="#fff"
            />
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubble: {
    marginVertical: 8,
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#34d399',
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#052e1c',
    fontWeight: '500',
  },
  assistantText: {
    color: '#cbd5e1',
  },
  mealPlanContainer: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34d399',
    padding: 14,
    marginVertical: 12,
  },
  mealPlanTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 8,
  },
  mealPlanSummary: {
    fontSize: 13,
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 20,
  },
  mealPlanStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0b1220',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#34d399',
    marginTop: 4,
  },
  mealsHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  mealCard: {
    backgroundColor: '#0b1220',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#34d399',
    padding: 10,
    marginBottom: 8,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    flex: 1,
  },
  mealType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealDesc: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  macro: {
    fontSize: 11,
    color: '#cbd5e1',
    backgroundColor: '#111827',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mealNotes: {
    fontSize: 11,
    color: '#fbbf24',
    marginTop: 4,
  },
  recommendationsBox: {
    backgroundColor: '#0b1220',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    padding: 10,
    marginVertical: 12,
  },
  recTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fbbf24',
    marginBottom: 8,
  },
  recItem: {
    fontSize: 12,
    color: '#cbd5e1',
    marginBottom: 4,
    lineHeight: 18,
  },
  saveMealPlanButton: {
    backgroundColor: '#34d399',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  saveMealPlanText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#052e1c',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
  },
  input: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#34d399',
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.5,
  },
});
