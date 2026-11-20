import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
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
      <View className="flex-1 flex-row bg-black/40">
        <View className="w-72 bg-white h-full p-5 justify-between">
          <View>
            <View className="flex-row items-center justify-between pb-4 border-b border-gray-100">
              <Text className="text-xl font-extrabold text-gray-900">Order up!</Text>
              <TouchableOpacity onPress={onClose} className="p-1">
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>

            <View className="mt-5 gap-2">
              {menuItems.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  onPress={() => {
                    onClose();
                    onSelectSection(item.key);
                  }}
                  className="flex-row items-center justify-between px-3.5 py-3 rounded-xl bg-gray-50 active:bg-gray-100"
                >
                  <View className="flex-row items-center gap-3">
                    <Ionicons name={item.icon} size={20} color="#111827" />
                    <Text className="text-sm font-semibold text-gray-800">{item.label}</Text>
                  </View>
                  {item.badge !== undefined && (
                    <View className="bg-gray-200 px-2 py-0.5 rounded-full">
                      <Text className="text-xs font-bold text-gray-700">{item.badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Text className="text-xs text-gray-400">Local Mode • Saved on Device</Text>
        </View>
        <Pressable className="flex-1" onPress={onClose} />
      </View>
    </Modal>
  );
};