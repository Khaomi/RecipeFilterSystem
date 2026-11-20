import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  items: string[];
  onAdd: (value: string) => void;
  onUpdate: (index: number, newValue: string) => void;
  onDelete: (index: number) => void;
}

export const InventoryModal: React.FC<Props> = ({
  visible,
  onClose,
  title,
  placeholder,
  items,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSave = () => {
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (editingIndex !== null) {
      onUpdate(editingIndex, trimmed);
      setEditingIndex(null);
    } else {
      onAdd(trimmed);
    }
    setInputVal('');
  };

  const startEdit = (index: number, current: string) => {
    setEditingIndex(index);
    setInputVal(current);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-5 max-h-[80%]">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-900">{title}</Text>
            <TouchableOpacity
              onPress={() => {
                setEditingIndex(null);
                setInputVal('');
                onClose();
              }}
            >
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {/* Add / Update Row */}
          <View className="flex-row gap-2 mb-4">
            <TextInput
              value={inputVal}
              onChangeText={setInputVal}
              placeholder={placeholder}
              className="flex-1 border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm text-gray-900"
            />
            <TouchableOpacity
              onPress={handleSave}
              className="bg-gray-900 px-4 rounded-xl justify-center items-center"
            >
              <Text className="text-white text-xs font-bold">
                {editingIndex !== null ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            ListEmptyComponent={
              <Text className="text-center text-gray-400 py-6">No items added yet.</Text>
            }
            renderItem={({ item, index }) => (
              <View className="flex-row items-center justify-between py-2.5 border-b border-gray-100">
                <Text className="text-sm font-medium text-gray-800">{item}</Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity onPress={() => startEdit(index, item)}>
                    <Ionicons name="create-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(index)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );
};