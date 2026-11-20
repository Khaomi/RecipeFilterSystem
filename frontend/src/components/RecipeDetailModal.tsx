import React, { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Recipe } from '../type/recipe';

interface Props {
  recipe: Recipe | null;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onClose: () => void;
}

export const RecipeDetailModal: React.FC<Props> = ({
  recipe,
  isBookmarked,
  onToggleBookmark,
  onClose,
}) => {
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  if (!recipe) return null;

  const matchingIngredientsForTag = (tag: string) =>
    recipe.ingredients.filter(
      (ing) => ing.tag.toLowerCase() === tag.toLowerCase()
    );

  return (
    <Modal visible={!!recipe} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-white">
        {/* Top Bar */}
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-1.5 rounded-full bg-gray-100">
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onToggleBookmark(recipe.id)}
            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200"
          >
            <Ionicons
              name={isBookmarked ? 'heart' : 'heart-outline'}
              size={18}
              color={isBookmarked ? '#EF4444' : '#374151'}
            />
            <Text className="text-xs font-semibold text-gray-700">
              {isBookmarked ? 'Bookmarked' : 'Bookmark'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 36 }}>
          {/* Picture */}
          <Image source={{ uri: recipe.image }} className="w-full h-56 bg-gray-200" />

          <View className="p-4">
            {/* Title & Total Time */}
            <Text className="text-2xl font-extrabold text-gray-900">{recipe.title}</Text>
            <View className="flex-row items-center gap-1.5 mt-2">
              <Ionicons name="time-outline" size={16} color="#4B5563" />
              <Text className="text-sm font-semibold text-gray-600">
                Total time: {recipe.totalTimeMinutes} mins
              </Text>
            </View>

            {/* Expandable Tags -> List with Amount */}
            <Text className="text-sm font-bold text-gray-900 mt-5 mb-2">
              Tags (Tap to expand amounts)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {recipe.tags.map((tag) => {
                const isOpen = expandedTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setExpandedTag(isOpen ? null : tag)}
                    className={`px-3 py-1.5 rounded-full border ${
                      isOpen ? 'bg-gray-900 border-gray-900' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold capitalize ${
                        isOpen ? 'text-white' : 'text-gray-700'
                      }`}
                    >
                      #{tag} {isOpen ? '▾' : '▸'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {expandedTag && (
              <View className="mt-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-200">
                <Text className="text-xs font-bold uppercase text-gray-500 mb-2">
                  Ingredients under #{expandedTag}
                </Text>
                {(matchingIngredientsForTag(expandedTag).length > 0
                  ? matchingIngredientsForTag(expandedTag)
                  : recipe.ingredients
                ).map((ing, i) => (
                  <View
                    key={`${ing.name}-${i}`}
                    className="flex-row justify-between py-1.5 border-b border-gray-100 last:border-b-0"
                  >
                    <Text className="text-sm font-medium text-gray-800">{ing.name}</Text>
                    <Text className="text-sm font-bold text-gray-900">{ing.amount}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Instruction Detail */}
            <Text className="text-base font-bold text-gray-900 mt-6 mb-3">Instructions</Text>
            <View className="gap-3">
              {recipe.instructions.map((step, idx) => (
                <View key={idx} className="flex-row gap-3 items-start">
                  <View className="w-6 h-6 rounded-full bg-gray-900 items-center justify-center mt-0.5">
                    <Text className="text-xs font-bold text-white">{idx + 1}</Text>
                  </View>
                  <Text className="flex-1 text-sm leading-6 text-gray-700">{step}</Text>
                </View>
              ))}
            </View>

            {recipe.tip && (
              <View className="mt-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                <Text className="text-xs font-bold text-amber-900 mb-1">Chef Tip</Text>
                <Text className="text-xs leading-5 text-amber-800">{recipe.tip}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};