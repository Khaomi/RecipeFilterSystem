import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';
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
      <View className="flex-1 justify-end bg-black/40">
        <View className="bg-white rounded-t-3xl p-5 max-h-[75%]">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-2">
              {mode !== 'menu' && (
                <TouchableOpacity onPress={() => setMode('menu')} className="p-1">
                  <Ionicons name="arrow-back" size={20} color="#111827" />
                </TouchableOpacity>
              )}
              <Text className="text-lg font-bold text-gray-900">
                {mode === 'menu'
                  ? 'History'
                  : mode === 'search'
                  ? 'Search History'
                  : 'Visited Recipe'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          {mode === 'menu' && (
            <View className="gap-3 pb-4">
              <TouchableOpacity
                onPress={() => setMode('search')}
                className="flex-row items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="search-outline" size={22} color="#111827" />
                  <View>
                    <Text className="text-sm font-bold text-gray-900">Search history</Text>
                    <Text className="text-xs text-gray-500">{searchHistory.length} recent searches</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#6B7280" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMode('visited')}
                className="flex-row items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50"
              >
                <View className="flex-row items-center gap-3">
                  <Ionicons name="eye-outline" size={22} color="#111827" />
                  <View>
                    <Text className="text-sm font-bold text-gray-900">Visited recipe</Text>
                    <Text className="text-xs text-gray-500">{visitedRecipes.length} recipes opened</Text>
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
              ListEmptyComponent={
                <Text className="text-center text-gray-400 py-8">No search history yet.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelectSearchQuery(item.query);
                    handleClose();
                  }}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <Text className="text-sm font-medium text-gray-800">{item.query}</Text>
                  <Text className="text-xs text-gray-400">{item.timestamp}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {mode === 'visited' && (
            <FlatList
              data={visitedRecipes}
              keyExtractor={(item, idx) => `${item.id}-${idx}`}
              ListEmptyComponent={
                <Text className="text-center text-gray-400 py-8">No visited recipes yet.</Text>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    handleClose();
                    onSelectRecipe(item);
                  }}
                  className="flex-row items-center justify-between py-3 border-b border-gray-100"
                >
                  <Text className="text-sm font-semibold text-gray-800">{item.title}</Text>
                  <Text className="text-xs text-gray-500">{item.totalTimeMinutes} min</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};