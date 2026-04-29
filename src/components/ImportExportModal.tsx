// src/components/ImportExportModal.tsx
import React, { useState, useMemo } from 'react';
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
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { generateMealJSON, generateWorkoutJSON, parseMealJSON, parseWorkoutJSON } from '../utils/exportImport';

interface ImportExportModalProps {
  visible: boolean;
  type: 'meal' | 'workout';
  items: any[];
  onClose: () => void;
  onImport: (items: any[]) => void;
}

export function ImportExportModal({ visible, type, items, onClose, onImport }: ImportExportModalProps) {
  const [mode, setMode] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [exportSelection, setExportSelection] = useState<{ start: number; end: number } | undefined>(undefined);

  const exportJson = useMemo(() => {
    return type === 'meal' ? generateMealJSON(items) : generateWorkoutJSON(items);
  }, [type, items]);

  const importPrompt = useMemo(() => {
    return type === 'meal'
      ? `Ask AI: "Create meals for my goals and return only importable Calos JSON using this exact shape: { \"type\": \"meal_batch\", \"meals\": [{ \"name\": \"Meal name\", \"type\": \"Breakfast\", \"calories\": 500, \"protein\": 40, \"carbs\": 55, \"fat\": 14, \"notes\": \"Measured recipe, ingredients, instructions, storage, reheating.\" }] }. Use Breakfast, Lunch, Dinner, or Snack only."`
      : `Ask AI: "Transform my workout into importable Calos JSON and return only JSON using this exact shape: { \"type\": \"workout_routine\", \"workouts\": [{ \"id\": \"push\", \"name\": \"Push\", \"cardioMin\": 10, \"backup\": [\"Dumbbell floor press 4x8-12\"], \"exercises\": [{ \"id\": \"bench\", \"name\": \"Bench Press\", \"sets\": 4, \"minReps\": 6, \"maxReps\": 8, \"weight\": 135, \"lastReps\": [0,0,0,0], \"lastWeights\": [135,135,135,135], \"backup\": \"Dumbbell Bench Press\", \"backupOptions\": [\"Dumbbell Bench Press\", \"Machine Chest Press\", \"Push-up\"], \"selectedBackup\": \"Dumbbell Bench Press\" }] }] }."`;
  }, [type]);

  const handleCopy = () => {
    setExportSelection({ start: 0, end: exportJson.length });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('JSON selected', 'The export text is selected. Use the iOS copy menu to copy it.');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      Alert.alert('Empty input', 'Paste JSON data to import.');
      return;
    }

    const parsed = type === 'meal' ? parseMealJSON(importText) : parseWorkoutJSON(importText);
    if (!parsed || parsed.length === 0) {
      Alert.alert('Invalid format', `Could not parse ${type} JSON. Make sure it's properly formatted.`);
      return;
    }

    Alert.alert(
      'Confirm Import',
      `Import ${parsed.length} ${type}(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'default',
          onPress: () => {
            onImport(parsed);
            setImportText('');
            setMode('export');
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.backdrop}>
        <View style={s.container}>
          <View style={s.header}>
            <Text style={s.h2}>
              {type === 'meal' ? '🍽️' : '🏋️'} {type === 'meal' ? 'Meals' : 'Workouts'} Import/Export
            </Text>
            <Pressable onPress={onClose} style={s.closeButton}>
              <MaterialIcons name="close" size={22} color="#cbd5e1" />
            </Pressable>
          </View>
          <ScrollView style={s.scrollContainer} contentContainerStyle={s.scrollContent}>
            <View style={s.modeSelector}>
              <Pressable
                onPress={() => setMode('export')}
                style={[s.modeButton, mode === 'export' && s.modeButtonActive]}
              >
                <MaterialIcons name="file-download" size={16} color={mode === 'export' ? '#052e1c' : '#cbd5e1'} />
                <Text style={[s.modeButtonText, mode === 'export' && s.modeButtonTextActive]}>Export</Text>
              </Pressable>
              <Pressable
                onPress={() => setMode('import')}
                style={[s.modeButton, mode === 'import' && s.modeButtonActive]}
              >
                <MaterialIcons name="file-upload" size={16} color={mode === 'import' ? '#052e1c' : '#cbd5e1'} />
                <Text style={[s.modeButtonText, mode === 'import' && s.modeButtonTextActive]}>Import</Text>
              </Pressable>
            </View>

            {mode === 'export' && (
              <View style={s.content}>
                <Text style={s.description}>Copy this export or select all from the box. You can paste it into AI and import the updated JSON back into Calos.</Text>
                <TextInput
                  style={s.jsonInput}
                  value={exportJson}
                  multiline
                  editable={false}
                  selectTextOnFocus
                  selection={exportSelection}
                  onFocus={() => setExportSelection({ start: 0, end: exportJson.length })}
                />
                <Pressable
                  onPress={handleCopy}
                  style={s.copyButton}
                >
                  <MaterialIcons name="content-copy" size={16} color="#fff" />
                  <Text style={s.copyButtonText}>{copied ? 'Copied!' : 'Copy JSON'}</Text>
                </Pressable>
              </View>
            )}

            {mode === 'import' && (
              <View style={s.content}>
                <Text style={s.description}>Paste JSON from AI or an exported batch here. Calos will find valid {type} JSON even if the AI included extra text.</Text>
                <View style={s.promptBox}>
                  <Text selectable style={s.promptText}>{importPrompt}</Text>
                </View>
                <TextInput
                  style={s.importInput}
                  multiline
                  numberOfLines={8}
                  value={importText}
                  onChangeText={setImportText}
                  placeholder={`Paste ${type} JSON here...`}
                  placeholderTextColor="#64748b"
                />
                <Pressable onPress={handleImport} style={s.importButton}>
                  <MaterialIcons name="check" size={16} color="#052e1c" />
                  <Text style={s.importButtonText}>Import</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
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
  container: {
    maxHeight: '90%',
    backgroundColor: '#111827',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#243244',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    zIndex: 10,
  },
  h2: {
    fontSize: 18,
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
  scrollContainer: {
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  modeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
  },
  modeButtonActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  modeButtonText: {
    color: '#cbd5e1',
    fontWeight: '700',
  },
  modeButtonTextActive: {
    color: '#052e1c',
  },
  content: {
    gap: 12,
  },
  description: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  jsonInput: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    padding: 12,
    maxHeight: 250,
    minHeight: 150,
    color: '#cbd5e1',
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Courier New',
    textAlignVertical: 'top',
  },
  promptBox: { backgroundColor: '#0b1220', borderWidth: 1, borderColor: '#243244', borderRadius: 12, padding: 10, marginBottom: 8 },
  promptText: { color: '#cbd5e1', fontSize: 12, lineHeight: 17 },
  copyButton: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  copyButtonText: {
    color: '#052e1c',
    fontWeight: '700',
  },
  importInput: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderColor: '#243244',
    borderRadius: 12,
    padding: 11,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 180,
  },
  importButton: {
    backgroundColor: '#34d399',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  importButtonText: {
    color: '#052e1c',
    fontWeight: '700',
  },
});
