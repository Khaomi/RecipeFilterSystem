import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
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
    recipe.ingredients.filter((ing) => ing.tag.toLowerCase() === tag.toLowerCase());

  // Falls back to all ingredients when no ingredient matches the tag
  const expandedIngredients = expandedTag
    ? matchingIngredientsForTag(expandedTag).length > 0
      ? matchingIngredientsForTag(expandedTag)
      : recipe.ingredients
    : [];

  return (
    <Modal visible={!!recipe} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onToggleBookmark(recipe.id)} style={styles.bookmarkButton}>
            <Ionicons
              name={isBookmarked ? 'heart' : 'heart-outline'}
              size={18}
              color={isBookmarked ? '#EF4444' : '#374151'}
            />
            <Text style={styles.bookmarkText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 36 }}>
          {/* Picture */}
          <Image source={{ uri: recipe.image }} style={styles.heroImage} />

          <View style={styles.content}>
            {/* Title & Total Time */}
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <View style={styles.timeRow}>
              <Ionicons name="time-outline" size={16} color="#4B5563" />
              <Text style={styles.timeText}>Total time: {recipe.totalTimeMinutes} mins</Text>
            </View>

            {/* Expandable Tags -> List with Amount */}
            <Text style={styles.tagsHeading}>Tags (Tap to expand amounts)</Text>
            <View style={styles.tagWrap}>
              {recipe.tags.map((tag) => {
                const isOpen = expandedTag === tag;
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setExpandedTag(isOpen ? null : tag)}
                    style={[styles.tagChip, isOpen ? styles.tagChipOpen : styles.tagChipClosed]}
                  >
                    <Text style={[styles.tagText, isOpen && styles.textWhite]}>
                      #{tag} {isOpen ? '▾' : '▸'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {expandedTag && (
              <View style={styles.amountsBox}>
                <Text style={styles.amountsHeading}>Ingredients under #{expandedTag}</Text>
                {expandedIngredients.map((ing, i) => (
                  <View
                    key={`${ing.name}-${i}`}
                    style={[
                      styles.amountRow,
                      // replaces Tailwind's last:border-b-0
                      i === expandedIngredients.length - 1 && styles.amountRowLast,
                    ]}
                  >
                    <Text style={styles.ingName}>{ing.name}</Text>
                    <Text style={styles.ingAmount}>{ing.amount}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Instruction Detail */}
            <Text style={styles.instructionsHeading}>Instructions</Text>
            <View style={styles.instructionsList}>
              {recipe.instructions.map((step, idx) => (
                <View key={idx} style={styles.stepRow}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepBadgeText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>

            {recipe.tip && (
              <View style={styles.tipBox}>
                <Text style={styles.tipTitle}>Chef Tip</Text>
                <Text style={styles.tipText}>{recipe.tip}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: { padding: 6, borderRadius: 999, backgroundColor: '#F3F4F6' },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookmarkText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  scroll: { flex: 1 },
  heroImage: { width: '100%', height: 224, backgroundColor: '#E5E7EB' },
  content: { padding: 16 },

  // Title
  recipeTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  timeText: { fontSize: 14, fontWeight: '600', color: '#4B5563' },

  // Tags
  tagsHeading: { fontSize: 14, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 8 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagChipOpen: { backgroundColor: '#111827', borderColor: '#111827' },
  tagChipClosed: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  textWhite: { color: '#FFFFFF' },

  // Expanded amounts
  amountsBox: {
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountsHeading: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: '#6B7280',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  amountRowLast: { borderBottomWidth: 0 },
  ingName: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  ingAmount: { fontSize: 14, fontWeight: '700', color: '#111827' },

  // Instructions
  instructionsHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  instructionsList: { gap: 12 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 24, color: '#374151' },

  // Chef tip
  tipBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipTitle: { fontSize: 12, fontWeight: '700', color: '#78350F', marginBottom: 4 },
  tipText: { fontSize: 12, lineHeight: 20, color: '#92400E' },
});
