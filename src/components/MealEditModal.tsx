// src/components/MealEditModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface MealEditModalProps {
  visible: boolean;
  meal: any;
  onClose: () => void;
  onSave: (meal: any) => void;
  onDelete: (mealId: string) => void;
}

export function MealEditModal({ visible, meal, onClose, onSave, onDelete }: MealEditModalProps) {
  const [editing, setEditing] = React.useState(meal);
  const num = (v: string, fallback = 0) => Number.isFinite(Number(v)) ? Number(v) : fallback;

  React.useEffect(() => {
    setEditing(meal);
  }, [meal, visible]);

  const handleSave = () => {
    if (!editing.name.trim()) {
      Alert.alert('Meal name required', 'Add a meal name before saving.');
      return;
    }
    onSave({
      ...editing,
      name: editing.name.trim(),
      notes: editing.notes.trim(),
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete meal?',
      `Are you sure you want to delete "${editing.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(editing.id);
            onClose();
          },
        },
      ]
    );
  };

  const update = (patch: any) => setEditing({ ...editing, ...patch });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.backdrop}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.h2}>Edit Meal</Text>
            <Pressable onPress={onClose} style={s.closeButton}>
              <MaterialIcons name="close" size={22} color="#cbd5e1" />
            </Pressable>
          </View>
          
          <View style={s.content}>
            <Text style={s.label}>Meal name</Text>
            <TextInput
              style={s.input}
              value={editing.name}
              onChangeText={(v) => update({ name: v })}
              placeholder="Meal name"
              placeholderTextColor="#64748b"
            />
            
            <Text style={s.label}>Meal type</Text>
            <View style={s.row}>
              {(['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const).map((type) => (
                <Pressable
                  key={type}
                  onPress={() => update({ type })}
                  style={[s.pill, editing.type === type && s.pillActive]}
                >
                  <Text style={[s.pillText, editing.type === type && s.pillTextActive]}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={s.macroGrid}>
              <View style={s.macroHalf}>
                <Text style={s.label}>Calories</Text>
                <TextInput
                  style={s.input}
                  value={String(editing.calories || '')}
                  onChangeText={(v) => update({ calories: num(v) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={s.macroHalf}>
                <Text style={s.label}>Protein (g)</Text>
                <TextInput
                  style={s.input}
                  value={String(editing.protein || '')}
                  onChangeText={(v) => update({ protein: num(v) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={s.macroHalf}>
                <Text style={s.label}>Carbs (g)</Text>
                <TextInput
                  style={s.input}
                  value={String(editing.carbs || '')}
                  onChangeText={(v) => update({ carbs: num(v) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={s.macroHalf}>
                <Text style={s.label}>Fat (g)</Text>
                <TextInput
                  style={s.input}
                  value={String(editing.fat || '')}
                  onChangeText={(v) => update({ fat: num(v) })}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <Text style={s.label}>Notes</Text>
            <TextInput
              style={[s.input, s.notesInput]}
              value={editing.notes}
              onChangeText={(v) => update({ notes: v })}
              placeholder="Prep tips, ingredients, etc."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={s.actions}>
            <Pressable onPress={handleDelete} style={s.deleteButton}>
              <MaterialIcons name="delete-outline" size={16} color="#ef4444" />
              <Text style={s.deleteButtonText}>Delete</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={s.saveButton}>
              <MaterialIcons name="check" size={16} color="#052e1c" />
              <Text style={s.saveButtonText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  card: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#243244',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  h2: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
  },
  content: {
    marginBottom: 16,
  },
  label: {
    color: '#cbd5e1',
    fontWeight: '700',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    padding: 11,
    color: '#fff',
    marginBottom: 10,
  },
  notesInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  pill: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  pillActive: {
    backgroundColor: '#34d399',
  },
  pillText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  pillTextActive: {
    color: '#052e1c',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  macroHalf: {
    width: '48%',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  deleteButtonText: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 15,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    color: '#052e1c',
    fontWeight: '900',
    fontSize: 15,
  },
});
