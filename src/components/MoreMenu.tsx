import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export type MoreTab = 'Calendar' | 'Grocery' | 'Weight' | 'Profile';

type MoreMenuProps<Tab extends string> = {
  visible: boolean;
  activeTab: Tab;
  onSelect: (tab: MoreTab) => void;
  onClose: () => void;
};

const items: Array<{ key: MoreTab; label: string; icon: string; sub: string }> = [
  { key: 'Calendar', label: 'Calendar', icon: 'calendar-month', sub: 'Day history and status' },
  { key: 'Grocery', label: 'Grocery', icon: 'shopping-cart', sub: 'Shopping list builder' },
  { key: 'Weight', label: 'Weight', icon: 'monitor-weight', sub: 'Trend and check-ins' },
  { key: 'Profile', label: 'Profile', icon: 'person', sub: 'Targets and preferences' },
];

export function MoreMenu<Tab extends string>({ visible, activeTab, onSelect, onClose }: MoreMenuProps<Tab>) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose}>
        <Pressable style={s.sheet}>
          <View style={s.header}>
            <Text style={s.title}>More</Text>
            <Pressable onPress={onClose} style={s.closeButton}>
              <MaterialIcons name="close" size={22} color="#cbd5e1" />
            </Pressable>
          </View>
          {items.map((item) => {
            const active = activeTab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  onSelect(item.key);
                  onClose();
                }}
                style={[s.row, active && s.rowActive]}
              >
                <View style={[s.iconWrap, active && s.iconWrapActive]}>
                  <MaterialIcons name={item.icon as any} size={21} color={active ? '#052e1c' : '#cbd5e1'} />
                </View>
                <View style={s.textBlock}>
                  <Text style={[s.label, active && s.labelActive]}>{item.label}</Text>
                  <Text style={s.sub}>{item.sub}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={22} color="#64748b" />
              </Pressable>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderColor: '#243244',
    padding: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '900',
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
  row: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#243244',
    backgroundColor: '#0b1220',
    marginBottom: 10,
  },
  rowActive: {
    borderColor: '#34d399',
    backgroundColor: '#082016',
  },
  iconWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
  },
  iconWrapActive: {
    backgroundColor: '#34d399',
    borderColor: '#34d399',
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '900',
  },
  labelActive: {
    color: '#34d399',
  },
  sub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
  },
});
