import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HistoryEntry, Recipe } from '../type/recipe';
import { AuditLogEntry } from '../api/orderUpApi';

export interface VisitedItem {
  id: string; // Mongo entry id
  recipe: Recipe;
  timestamp: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  searchHistory: HistoryEntry[];
  visitedRecipes: VisitedItem[];
  auditLogs: AuditLogEntry[];
  onSelectSearchQuery: (query: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onDeleteEntry: (kind: 'searches' | 'visited', id: string) => void;
  onClear: (kind: 'searches' | 'visited') => void;
}

// Audit actions are codes from the backend (e.g. "edit_equipment"); the wording lives here.
const VERBS: Record<string, string> = { add: 'Added', edit: 'Changed', delete: 'Removed' };

function describeAudit(log: AuditLogEntry): string {
  const [verb, noun] = log.action.split('_');
  const detail = log.fields.name ?? `${log.fields.old_val} → ${log.fields.new_val}`;
  return `${VERBS[verb] ?? verb} ${noun}: ${detail}`;
}

export const HistoryModal: React.FC<Props> = ({
  visible,
  onClose,
  searchHistory,
  visitedRecipes,
  auditLogs,
  onSelectSearchQuery,
  onSelectRecipe,
  onDeleteEntry,
  onClear,
}) => {
  // 'menu' shows the options first; user can switch or pick one
  const [mode, setMode] = useState<'menu' | 'search' | 'visited' | 'activity'>('menu');

  const handleClose = () => {
    setMode('menu');
    onClose();
  };

  const titles = {
    menu: 'History',
    search: 'Search History',
    visited: 'Visited Recipe',
    activity: 'Activity Log',
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        {/* Clicking the dimmed area above the sheet closes it */}
        <Pressable style={styles.backdrop} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              {mode !== 'menu' && (
                <TouchableOpacity onPress={() => setMode('menu')} style={styles.iconButton}>
                  <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
              )}
              <Text style={styles.title}>{titles[mode]}</Text>
            </View>
            <View style={styles.headerLeft}>
              {(mode === 'search' || mode === 'visited') && (
                <TouchableOpacity
                  onPress={() => onClear(mode === 'search' ? 'searches' : 'visited')}
                  style={styles.iconButton}
                >
                  <Text style={styles.clearText}>Clear all</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
                <Ionicons name="close" size={22} color="#374151" />
              </TouchableOpacity>
            </View>
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

              <TouchableOpacity onPress={() => setMode('activity')} style={styles.menuCard}>
                <View style={styles.menuCardLeft}>
                  <Ionicons name="list-outline" size={22} color="#111827" />
                  <View>
                    <Text style={styles.menuCardTitle}>Activity log</Text>
                    <Text style={styles.menuCardSub}>{auditLogs.length} inventory changes</Text>
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
                <View style={styles.listRow}>
                  <TouchableOpacity
                    onPress={() => {
                      onSelectSearchQuery(item.query);
                      handleClose();
                    }}
                    style={styles.rowMain}
                  >
                    <Text style={styles.queryText}>{item.query || '(filters only)'}</Text>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteEntry('searches', item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {mode === 'visited' && (
            <FlatList
              data={visitedRecipes}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={<Text style={styles.emptyText}>No visited recipes yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.listRow}>
                  <TouchableOpacity
                    onPress={() => {
                      handleClose();
                      onSelectRecipe(item.recipe);
                    }}
                    style={styles.rowMain}
                  >
                    <Text style={styles.recipeTitle}>{item.recipe.title}</Text>
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDeleteEntry('visited', item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              )}
            />
          )}

          {mode === 'activity' && (
            <FlatList
              data={auditLogs}
              keyExtractor={(item) => item._id}
              ListEmptyComponent={<Text style={styles.emptyText}>No activity yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.listRow}>
                  <View style={styles.rowMain}>
                    <Text style={styles.queryText}>{describeAudit(item)}</Text>
                    <Text style={styles.timestampText}>
                      {new Date(item.logged_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
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
  backdrop: { flex: 1 },
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
  clearText: { fontSize: 12, fontWeight: '700', color: '#DC2626' },

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
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rowMain: { flex: 1, gap: 2 },
  queryText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  timestampText: { fontSize: 12, color: '#9CA3AF' },
  recipeTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  emptyText: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 32 },
});
