import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '../api/orderUpApi';

interface Props {
  visible: boolean;
  onClose: () => void;
  title: string;
  placeholder: string;
  items: InventoryItem[]; // what the user has
  options: InventoryItem[]; // everything they can pick from the catalog
  message: string | null;
  onAdd: (id: number) => void;
  onUpdate: (oldId: number, newId: number) => void;
  onDelete: (id: number) => void;
}

export const InventoryModal: React.FC<Props> = ({
  visible,
  onClose,
  title,
  placeholder,
  items,
  options,
  message,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  const q = query.trim().toLowerCase();
  const available = options.filter(
    (o) => !items.some((i) => i.id === o.id) && o.name.toLowerCase().includes(q)
  );

  const pick = (option: InventoryItem) => {
    if (editing) onUpdate(editing.id, option.id);
    else onAdd(option.id);
    setEditing(null);
    setQuery('');
  };

  const close = () => {
    setEditing(null);
    setQuery('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.overlay}>
        {/* Clicking the dimmed area above the sheet closes it */}
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={close}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {message && <Text style={styles.messageText}>{message}</Text>}

          {editing && (
            <View style={styles.editingRow}>
              <Text style={styles.editingText}>Pick a replacement for {editing.name}</Text>
              <TouchableOpacity onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pick from catalog */}
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={placeholder}
            style={styles.input}
          />
          <ScrollView style={styles.optionsBox} contentContainerStyle={styles.optionsWrap}>
            {available.map((o) => (
              <TouchableOpacity key={o.id} onPress={() => pick(o)} style={styles.optionChip}>
                <Ionicons name={editing ? 'swap-horizontal' : 'add'} size={14} color="#111827" />
                <Text style={styles.optionText}>{o.name}</Text>
              </TouchableOpacity>
            ))}
            {available.length === 0 && <Text style={styles.emptyText}>Nothing left to add.</Text>}
          </ScrollView>

          {/* Current items */}
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.id)}
            ListEmptyComponent={<Text style={styles.emptyText}>No items added yet.</Text>}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <Text style={styles.itemText}>{item.name}</Text>
                <View style={styles.itemActions}>
                  <TouchableOpacity onPress={() => setEditing(item)}>
                    <Ionicons name="create-outline" size={18} color="#2563EB" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDelete(item.id)}>
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
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  messageText: { color: '#B91C1C', fontSize: 12, marginBottom: 8 },

  editingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  editingText: { fontSize: 12, color: '#1E40AF', fontWeight: '600' },
  cancelText: { fontSize: 12, color: '#1E40AF', fontWeight: '700' },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    marginBottom: 8,
  },
  optionsBox: { maxHeight: 120, marginBottom: 12 },
  optionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  optionText: { fontSize: 12, color: '#111827' },

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
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 12, fontSize: 12 },
});
