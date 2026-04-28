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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { sendChatMessage, parseMealPlanFromResponse, parseWorkoutRoutineFromResponse, ChatMessage, MealPlanResponse, WorkoutRoutineResponse, ProfileContext, DayContext, MealCatalogItem } from '../services/openaiService';

interface AICoachModalProps {
  visible: boolean;
  profile: any;
  mode?: 'nutrition' | 'workout';
  workouts?: any[];
  dayContext?: DayContext;
  currentMeals?: MealCatalogItem[];
  onClose: () => void;
  onSaveMeals: (meals: any[]) => void;
  onSaveWorkout?: (workouts: any[]) => void;
}

export function AICoachModal({ visible, profile, mode = 'nutrition', workouts = [], dayContext, currentMeals = [], onClose, onSaveMeals, onSaveWorkout }: AICoachModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlanResult, setMealPlanResult] = useState<MealPlanResponse | null>(null);
  const [workoutRoutineResult, setWorkoutRoutineResult] = useState<WorkoutRoutineResponse | null>(null);
  const [mealCount, setMealCount] = useState('8');
  const [physiqueFocus, setPhysiqueFocus] = useState('lean, athletic physique with broader shoulders, upper chest, back width, arms, and a tight waist');
  const [equipmentAccess, setEquipmentAccess] = useState('full gym with barbells, dumbbells, cables, machines, and cardio equipment');
  const [likedTraining, setLikedTraining] = useState('bench, dumbbells, cables, machines, incline walking');
  const [trainingLimits, setTrainingLimits] = useState('no major injuries; avoid anything that causes joint pain');
  const [timePerWorkout, setTimePerWorkout] = useState('45-60 minutes');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      const greeting: ChatMessage = {
        role: 'assistant',
        content: mode === 'workout'
          ? `Hi ${profile.name}. I already have your goal, calorie target, protein target, body stats, and planned gym days.\n\nI can build a full routine you can save into the Workout tab, review your current plan, swap exercises you dislike, or add realistic cardio if you went over calories.\n\nBefore saving a full plan, I may ask about workout length, equipment, injuries, exercises you refuse, and exercises you like. After I draft a plan, you can tell me what to replace before tapping Save as My Routine.`
          : `Hi ${profile.name}. I already have your goal, calorie target, protein target, body stats, weekly loss rate, and gym schedule.\n\nToday you have about ${Math.round(dayContext?.caloriesLeft ?? 0)} calories left and ${Math.round(dayContext?.proteinLeft ?? 0)}g protein left. I can suggest quick snacks for those numbers, or generate a batch of new meal options that get added to your Meals tab. I also avoid repeating meals already in your current menu. When meals appear below, you can add one meal or add all of them.`,
      };
      setMessages([greeting]);
      setUserInput('');
      setMealPlanResult(null);
      setWorkoutRoutineResult(null);
      setMealCount('8');
    }
  }, [visible, mode, profile.name, profile.gymDaysPerWeek, dayContext?.caloriesLeft, dayContext?.proteinLeft, dayContext?.cardioRemaining]);

  const buildProfileContext = (): ProfileContext => {
    const inferredGoal =
      profile.goalWeight && profile.goalWeight < profile.weight ? 'cut' :
      profile.goalWeight && profile.goalWeight > profile.weight ? 'bulk' :
      'maintain';

    return {
      name: profile.name || 'User',
      goal: profile.goal || inferredGoal,
      calorieGoal: profile.calorieGoal || 1900,
      proteinGoal: profile.proteinGoal || 150,
      age: profile.age || 25,
      weight: profile.weight || 180,
      goalWeight: profile.goalWeight,
      heightIn: profile.heightIn,
      weeklyLossRate: profile.weeklyLossRate ?? 1,
      gymDaysPerWeek: profile.gymDaysPerWeek ?? 4,
      activity: profile.activity,
      sex: profile.sex || 'male',
    };
  };

  const sendMessageToAI = async (userMessage: string, mealBatchCount?: number) => {
    if (!userMessage.trim() || loading) return;

    Vibration.vibrate(50);
    setUserInput('');

    // Add user message to chat
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: userMessage },
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const profileContext = buildProfileContext();

      // Send to OpenAI with profile context
      const response = await sendChatMessage(
        messages,
        userMessage,
        profileContext,
        mode,
        workouts,
        dayContext,
        mealBatchCount,
        mealBatchCount ? currentMeals : []
      );

      const mealPlan = parseMealPlanFromResponse(response);
      if (mealPlan) setMealPlanResult(mealPlan);

      const workoutRoutine = parseWorkoutRoutineFromResponse(response);
      if (workoutRoutine) setWorkoutRoutineResult(workoutRoutine);

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

  const handleSendMessage = async () => {
    await sendMessageToAI(userInput.trim());
  };

  const handleBuildRoutine = async () => {
    const request = `Build me a complete savable workout routine.

Use my full profile:
- Name: ${profile.name || 'User'}
- Goal: ${profile.goal || 'cut'}
- Current weight: ${profile.weight} lb
- Goal weight: ${profile.goalWeight ?? 'not specified'} lb
- Height: ${profile.heightIn ?? 'not specified'} in
- Age: ${profile.age ?? 'not specified'}
- Sex: ${profile.sex ?? 'not specified'}
- Daily calories: ${profile.calorieGoal ?? 'not specified'}
- Daily protein: ${profile.proteinGoal ?? 'not specified'}g
- Weekly weight loss target: ${profile.weeklyLossRate ?? 1} lb/week
- Planned gym days: ${profile.gymDaysPerWeek ?? 4} days/week
- Calories left today: ${Math.round(dayContext?.caloriesLeft ?? 0)}
- Protein left today: ${Math.round(dayContext?.proteinLeft ?? 0)}g
- Cardio remaining today: ${Math.round(dayContext?.cardioRemaining ?? 0)} calories
- Time available per workout: ${timePerWorkout}

My ideal physique: ${physiqueFocus}
Equipment available: ${equipmentAccess}
Exercises/training I like: ${likedTraining}
Limitations, injuries, dislikes, or substitutions needed: ${trainingLimits}

If you need more detail before creating a high-confidence plan, ask me targeted questions first. Otherwise build a ${profile.gymDaysPerWeek ?? 4}-day weekly routine that preserves muscle during fat loss, develops the ideal physique above, covers every major muscle group, avoids lazy workouts, includes backups, and returns the strict savable JSON format.`;

    await sendMessageToAI(request);
  };

  const handleBuildMealBatch = async () => {
    const count = Math.max(3, Math.min(20, Number(mealCount) || 8));
    const request = `Generate ${count} new meal options for my meal menu. Do not repeat meals already in my current menu. Make them ready to save into the app as selectable meal options.`;
    await sendMessageToAI(request, count);
  };

  const handleSaveMealPlan = () => {
    if (!mealPlanResult) return;

    onSaveMeals(mealPlanResult.meals.map((meal, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      name: meal.name,
      type: meal.type as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: `${meal.description}\n\n${meal.notes}`,
    })));

    Vibration.vibrate([0, 100, 50, 100]);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleSaveSingleMeal = (meal: MealPlanResponse['meals'][number], idx: number) => {
    onSaveMeals([{
      id: `ai-${Date.now()}-${idx}`,
      name: meal.name,
      type: meal.type as 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack',
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
      notes: `${meal.description}\n\n${meal.notes}`,
    }]);
    Vibration.vibrate(50);
  };

  const handleSaveWorkoutRoutine = () => {
    if (!workoutRoutineResult || !onSaveWorkout) return;

    onSaveWorkout(workoutRoutineResult.workouts);
    Vibration.vibrate([0, 100, 50, 100]);
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
          style={styles.keyboardAvoid}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </Pressable>
            <Text style={styles.title}>{mode === 'workout' ? 'Workout AI' : 'CalorieCounter AI'}</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Chat Area */}
          <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {mode === 'workout' && (
            <View style={styles.builderPanel}>
              <Text style={styles.builderTitle}>Build My Routine</Text>
              <Text style={styles.builderHelp}>Customize what you want and what your gym has. Ask for questions first if you want the AI to interview you before drafting. When a routine appears below, you can replace your current workout regime or ask for substitutions first.</Text>
              <Text style={styles.fieldLabel}>Time per workout</Text>
              <TextInput style={styles.builderInput} value={timePerWorkout} onChangeText={setTimePerWorkout} multiline placeholderTextColor="#64748b" />
              <Text style={styles.fieldLabel}>Ideal physique</Text>
              <TextInput style={styles.builderInput} value={physiqueFocus} onChangeText={setPhysiqueFocus} multiline placeholderTextColor="#64748b" />
              <Text style={styles.fieldLabel}>Gym equipment</Text>
              <TextInput style={styles.builderInput} value={equipmentAccess} onChangeText={setEquipmentAccess} multiline placeholderTextColor="#64748b" />
              <Text style={styles.fieldLabel}>Exercises you like</Text>
              <TextInput style={styles.builderInput} value={likedTraining} onChangeText={setLikedTraining} multiline placeholderTextColor="#64748b" />
              <Text style={styles.fieldLabel}>Limits or dislikes</Text>
              <TextInput style={styles.builderInput} value={trainingLimits} onChangeText={setTrainingLimits} multiline placeholderTextColor="#64748b" />
              <Pressable onPress={handleBuildRoutine} disabled={loading} style={[styles.saveMealPlanButton, loading && styles.sendButtonDisabled]}>
                <MaterialIcons name="auto-awesome" size={18} color="#052e1c" />
                <Text style={styles.saveMealPlanText}>Build Routine</Text>
              </Pressable>
            </View>
          )}

          {mode === 'nutrition' && (
            <View style={styles.builderPanel}>
              <Text style={styles.builderTitle}>Build Meal Options</Text>
              <Text style={styles.builderHelp}>Choose how many new meal options you want. The AI will use your profile, today's remaining calories/protein, and the meals already in your menu so it does not repeat them.</Text>
              <Text style={styles.fieldLabel}>How many meal options?</Text>
              <TextInput
                style={styles.builderInput}
                value={mealCount}
                onChangeText={setMealCount}
                keyboardType="numeric"
                placeholderTextColor="#64748b"
              />
              <Text style={styles.builderHint}>Current meal menu: {currentMeals.length} saved options</Text>
              <Pressable onPress={handleBuildMealBatch} disabled={loading} style={[styles.saveMealPlanButton, loading && styles.sendButtonDisabled]}>
                <MaterialIcons name="restaurant-menu" size={18} color="#052e1c" />
                <Text style={styles.saveMealPlanText}>Generate Meal Options</Text>
              </Pressable>
            </View>
          )}

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
          {mode === 'nutrition' && mealPlanResult && (
            <View style={styles.mealPlanContainer}>
              <Text style={styles.mealPlanTitle}>Importable Meal Options</Text>
              <Text style={styles.mealPlanSummary}>{mealPlanResult.summary} Add one meal or add all meals to make them selectable in your Meals tab.</Text>

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
                  {meal.notes && <Text style={styles.mealNotes}>{meal.notes}</Text>}
                  <Pressable onPress={() => handleSaveSingleMeal(meal, idx)} style={styles.saveSingleButton}>
                    <MaterialIcons name="add-circle-outline" size={16} color="#34d399" />
                    <Text style={styles.saveSingleText}>Add this meal</Text>
                  </Pressable>
                </View>
              ))}

              {mealPlanResult.recommendations.length > 0 && (
                <View style={styles.recommendationsBox}>
                  <Text style={styles.recTitle}>Recommendations</Text>
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
                <Text style={styles.saveMealPlanText}>Add All Meals</Text>
              </Pressable>
            </View>
          )}

          {mode === 'nutrition' && messages.length > 1 && !mealPlanResult && (
            <View style={styles.importHintBox}>
              <Text style={styles.importHintTitle}>Want to save meals?</Text>
              <Text style={styles.importHintText}>Ask: “Return these as app-importable meal JSON.” Then each meal will show an Add this meal button.</Text>
            </View>
          )}

          {mode === 'workout' && workoutRoutineResult && (
            <View style={styles.mealPlanContainer}>
              <Text style={styles.mealPlanTitle}>Generated Routine</Text>
              <Text style={styles.mealPlanSummary}>{workoutRoutineResult.summary}</Text>
              <View style={styles.recommendationsBox}>
                <Text style={styles.recTitle}>Physique Focus</Text>
                <Text style={styles.recItem}>{workoutRoutineResult.physiqueFocus}</Text>
              </View>
              {workoutRoutineResult.weeklySchedule.length > 0 && (
                <View style={styles.recommendationsBox}>
                  <Text style={styles.recTitle}>Weekly Schedule</Text>
                  {workoutRoutineResult.weeklySchedule.map((item, idx) => <Text key={idx} style={styles.recItem}>• {item}</Text>)}
                </View>
              )}
              {workoutRoutineResult.workouts.map((workout) => (
                <View key={workout.id} style={styles.mealCard}>
                  <Text style={styles.mealName}>{workout.name}</Text>
                  <Text style={styles.mealDesc}>{workout.exercises.length} exercises · {workout.cardioMin} min cardio</Text>
                  {workout.exercises.slice(0, 6).map((exercise) => (
                    <Text key={exercise.id} style={styles.recItem}>• {exercise.name}: {exercise.sets}x{exercise.minReps}-{exercise.maxReps}</Text>
                  ))}
                </View>
              ))}
              {workoutRoutineResult.progressionRules.length > 0 && (
                <View style={styles.recommendationsBox}>
                  <Text style={styles.recTitle}>Progression</Text>
                  {workoutRoutineResult.progressionRules.map((rule, idx) => <Text key={idx} style={styles.recItem}>• {rule}</Text>)}
                </View>
              )}
              <Pressable onPress={handleSaveWorkoutRoutine} style={styles.saveMealPlanButton}>
                <MaterialIcons name="save" size={18} color="#052e1c" />
                <Text style={styles.saveMealPlanText}>Use as Current Workout Regime</Text>
              </Pressable>
            </View>
          )}

          {mode === 'workout' && messages.length > 1 && !workoutRoutineResult && (
            <View style={styles.importHintBox}>
              <Text style={styles.importHintTitle}>Want to save a routine?</Text>
              <Text style={styles.importHintText}>Ask: “Return this as app-importable workout JSON.” When the plan appears, you can replace your current workout regime with it and still ask for substitutions first.</Text>
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
            placeholder={mode === 'workout' ? 'Ask for routine help or calorie makeup...' : 'Ask for snacks that fit your calories/protein...'}
            placeholderTextColor="#64748b"
            value={userInput}
            onChangeText={setUserInput}
            multiline
            blurOnSubmit={false}
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
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f14',
  },
  keyboardAvoid: {
    flex: 1,
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
  },
  chatContent: {
    paddingVertical: 12,
    paddingBottom: 24,
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
  saveSingleButton: {
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34d399',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  saveSingleText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '800',
  },
  recommendationsBox: {
    backgroundColor: '#0b1220',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbbf24',
    padding: 10,
    marginVertical: 12,
  },
  importHintBox: {
    backgroundColor: '#0b1220',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 12,
    marginVertical: 8,
  },
  importHintTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  importHintText: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
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
  builderPanel: {
    backgroundColor: '#111827',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 14,
    marginBottom: 12,
  },
  builderTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  builderHelp: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 10,
  },
  fieldLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 5,
  },
  builderInput: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#fff',
    minHeight: 42,
    marginBottom: 10,
  },
  builderHint: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: -4,
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
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    backgroundColor: '#0b0f14',
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
