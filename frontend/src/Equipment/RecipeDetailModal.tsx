import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  // Directions and ingredients side by side on wide screens, stacked on narrow ones.
  const twoColumns = width >= 900;

  if (!recipe) return null;

  // Optional ingredients never count as missing (same as the card's "Missing N").
  const isMissing = (ing: Recipe['ingredients'][number]) => !ing.optional && ing.owned === false;
  const missingCount = recipe.ingredients.filter(isMissing).length;

  return (
    <Modal visible={!!recipe} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.page}>
            {/* Top Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <Ionicons name="arrow-back" size={22} color="#111827" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onToggleBookmark(recipe.id)}
                style={styles.bookmarkButton}
              >
                <Ionicons
                  name={isBookmarked ? 'heart' : 'heart-outline'}
                  size={20}
                  color={isBookmarked ? '#EF4444' : '#374151'}
                />
                <Text style={styles.bookmarkText}>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.recipeTitle}>{recipe.title}</Text>

            {/* Picture */}
            <Image source={{ uri: recipe.image }} style={styles.heroImage} />

            {/* Quick info */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={20} color="#4B5563" />
                <Text style={styles.infoText}>
                  Ready in: <Text style={styles.infoValue}>{recipe.totalTimeMinutes} mins</Text>
                </Text>
              </View>
              {recipe.serving ? (
                <View style={styles.infoItem}>
                  <Ionicons name="people-outline" size={20} color="#4B5563" />
                  <Text style={styles.infoText}>
                    Serves: <Text style={styles.infoValue}>{recipe.serving}</Text>
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoItem}>
                <Ionicons name="nutrition-outline" size={20} color="#4B5563" />
                <Text style={styles.infoText}>
                  Ingredients: <Text style={styles.infoValue}>{recipe.ingredients.length}</Text>
                </Text>
              </View>
            </View>

            {/* Directions | Ingredients */}
            <View style={[styles.columns, twoColumns && styles.columnsRow]}>
              <View style={[styles.column, twoColumns && styles.directionsColumn]}>
                <Text style={styles.sectionHeading}>DIRECTIONS</Text>
                {recipe.instructions.length === 0 && (
                  <Text style={styles.emptyText}>No directions yet.</Text>
                )}
                {recipe.instructions.map((step, idx) => (
                  <View key={idx} style={styles.stepRow}>
                    <Text style={styles.stepNumber}>{idx + 1}.</Text>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>

              <View style={[styles.column, twoColumns && styles.ingredientsColumn]}>
                <Text style={styles.sectionHeading}>INGREDIENTS</Text>
                {recipe.ingredients.length > 0 && (
                  <Text style={[styles.fitText, missingCount === 0 ? styles.fitGood : styles.missing]}>
                    {missingCount === 0 ? '✓ You have everything' : `You're missing ${missingCount}`}
                  </Text>
                )}
                {recipe.ingredients.map((ing, i) => {
                  const missing = isMissing(ing);
                  return (
                    <View key={`${ing.name}-${i}`} style={styles.ingRow}>
                      <Text style={[styles.ingAmount, missing && styles.missing]}>{ing.amount}</Text>
                      <Text style={[styles.ingName, missing && styles.missing]}>
                        {ing.name}
                        {ing.optional && <Text style={styles.ingOptional}> (optional)</Text>}
                      </Text>
                      {missing && (
                        <View style={styles.missingBadge}>
                          <Text style={styles.missingBadgeText}>missing</Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },
  // Centered, readable width on wide screens
  page: { width: '100%', maxWidth: 1000, alignSelf: 'center', paddingHorizontal: 24 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: { padding: 8, borderRadius: 999, backgroundColor: '#F3F4F6' },
  bookmarkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bookmarkText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  recipeTitle: { fontSize: 32, fontWeight: '800', color: '#111827', marginBottom: 16 },

  // Narrower picture, like a recipe site
  heroImage: {
    width: '100%',
    maxWidth: 800,
    aspectRatio: 16 / 9,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },

  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 28,
    paddingVertical: 18,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 16, color: '#4B5563' },
  infoValue: { fontWeight: '700', color: '#111827' },

  // Directions | Ingredients
  columns: { gap: 32, marginTop: 16 },
  columnsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { gap: 14 },
  directionsColumn: { flex: 3 },
  ingredientsColumn: { flex: 2 },
  sectionHeading: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1.5,
    color: '#1F2937',
    marginBottom: 6,
  },

  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { fontSize: 17, fontWeight: '700', color: '#111827', minWidth: 24 },
  stepText: { flex: 1, fontSize: 17, lineHeight: 28, color: '#374151' },

  ingRow: { flexDirection: 'row', gap: 16, alignItems: 'flex-start' },
  ingAmount: { fontSize: 17, fontWeight: '700', color: '#111827', minWidth: 90 },
  ingName: { flex: 1, fontSize: 17, lineHeight: 24, color: '#1F2937' },
  ingOptional: { color: '#9CA3AF', fontWeight: '400' },

  // Missing ingredients use the same amber as the card's "Missing N"
  fitText: { fontSize: 16, fontWeight: '600' },
  fitGood: { color: '#047857' },
  missing: { color: '#B45309' },
  missingBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  missingBadgeText: { fontSize: 13, fontWeight: '700', color: '#B45309' },

  emptyText: { fontSize: 16, color: '#9CA3AF' },
});
