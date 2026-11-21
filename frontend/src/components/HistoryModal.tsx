import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HistoryEntry, Recipe } from '../type/recipe';

interface Props {
  visible: boolean;
  onClose: () => void;
  searchHistory: HistoryEntry[];
  visitedRecipes: Recipe[];
  onSelectSearchQuery: (query: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const HistoryModal: React.FC<Props> = ({
  visible,
  onClose,
  searchHistory,
  visitedRecipes,
  onSelectSearchQuery,
  onSelectRecipe,
}) => {
  // 'menu' shows the 2 options pop up first; user can switch or pick one
  const [mode, setMode] = useState<'menu' | 'search' | 'visited'>('menu');

  const handleClose = () => {
    setMode('menu');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {mode !== 'menu' && (
                <TouchableOpacity onPress={() => setMode('menu')} style={styles.iconButton}>
                  <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>
                {mode === 'menu'
                  ? 'History'
                  : mode === 'search'
                  ? 'Search History'
                  : 'Visited Recipe'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {mode === 'menu' && (
            <View style={styles.menu}>
              <TouchableOpacity onPress={() => setMode('search')} style={styles.menuCard}>
                <View style={styles.menuCardLeft}>
                  <Ionicons name="search-outline" size={22} color="#111827" />
                  <View>
                    <Text style={styles.menuCardTitle}>Search history</Text>
                    <Text style={styles.menuCardSub}>{searchHistory.length} recent searches</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setMode('visited')} style={styles.menuCard}>
                <View style={styles.menuCardLeft}>
                  <Ionicons name="eye-outline" size={22} color="#111827" />
                  <View>
                    <Text style={styles.menuCardTitle}>Visited recipe</Text>
                    <Text style={styles.menuCardSub}>{visitedRecipes.length} recipes opened</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

          {mode === 'search' && (
            <FlatList
              data={searchHistory}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No search history yet.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelectSearchQuery(item.query);
                    handleClose();
                  }}
                  style={styles.listRow}
                >
                  <Text style={styles.queryText}>{item.query}</Text>
                  <Text style={styles.timestampText}>{item.timestamp}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {mode === 'visited' && (
            <FlatList
              data={visitedRecipes}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              ListEmptyComponent={<Text style={styles.emptyText}>No visited recipes yet.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    handleClose();
                    onSelectRecipe(item);
                  }}
                  style={styles.listRow}
                >
                  <Text style={styles.recipeTitle}>{item.title}</Text>
                  <Text style={styles.recipeTime}>{item.totalTimeMinutes} min</Text>
                </TouchableOpacity>
              )}
            />
          )}
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
    maxHeight: '75%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 4 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },

  // Menu
  menu: { gap: 12, paddingBottom: 16 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  menuCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuCardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  menuCardSub: { fontSize: 12, color: '#6B7280' },

  // Lists
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  queryText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  timestampText: { fontSize: 12, color: '#9CA3AF' },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  recipeTime: { fontSize: 12, color: '#6B7280' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 32 },
});
