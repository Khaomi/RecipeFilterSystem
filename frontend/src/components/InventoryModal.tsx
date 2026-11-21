import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
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
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
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
          <View style={styles.addRow}>
            <TextInput
              value={inputVal}
              onChangeText={setInputVal}
              placeholder={placeholder}
              style={styles.input}
            />
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>
                {editingIndex !== null ? 'Update' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            ListEmptyComponent={<Text style={styles.emptyText}>No items added yet.</Text>}
            renderItem={({ item, index }) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>{item}</Text>
                <View style={styles.itemActions}>
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

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },

  addRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  saveButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 24 },
});
