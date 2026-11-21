import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectSection: (section: 'ingredients' | 'equipments' | 'bookmark' | 'history') => void;
  bookmarkCount: number;
  ingredientCount: number;
  equipmentCount: number;
}

export const SidebarDrawer: React.FC<Props> = ({
  visible,
  onClose,
  onSelectSection,
  bookmarkCount,
  ingredientCount,
  equipmentCount,
}) => {
  const menuItems: {
    key: 'ingredients' | 'equipments' | 'bookmark' | 'history';
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    badge?: string;
  }[] = [
    { key: 'ingredients', label: 'Ingredients', icon: 'nutrition-outline', badge: `${ingredientCount}` },
    { key: 'equipments', label: 'Equipments', icon: 'flame-outline', badge: `${equipmentCount}` },
    { key: 'bookmark', label: 'Bookmark', icon: 'heart-outline', badge: `${bookmarkCount}` },
    { key: 'history', label: 'History', icon: 'time-outline' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.drawer}>
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.title}>Order up!</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View style={styles.menuList}>
              {menuItems.map((item) => (
                // Pressable's `pressed` state replaces Tailwind's active:bg-gray-100
                <Pressable
                  key={item.key}
                  onPress={() => {
                    onClose();
                    onSelectSection(item.key);
                  }}
                  style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon} size={20} color="#111827" />
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  {item.badge !== undefined && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={styles.footer}>Local Mode • Saved on Device</Text>
        </View>
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)' },
  drawer: {
    width: 288,
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    justifyContent: 'space-between',
  },
  backdrop: { flex: 1 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: { fontSize: 20, fontWeight: '800', color: '#111827' },
  closeButton: { padding: 4 },

  menuList: { marginTop: 20, gap: 8 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  menuItemPressed: { backgroundColor: '#F3F4F6' },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937' },

  badge: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#374151' },

  footer: { fontSize: 12, color: '#9CA3AF' },
});
