import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  INITIAL_RECIPES,
  PREFERENCES_LIST,
  INITIAL_INGREDIENTS,
  INITIAL_EQUIPMENT,
  INITIAL_ALLERGIES,
} from '../data/mockRecipes';
import {
  Recipe,
  DietaryPreference,
  PrefState,
  TriState,
  HistoryEntry,
} from '../type/recipe';
import { rankRecipes } from '../utils/ranking';
import { SidebarDrawer } from '../components/SidebarDrawer';
import { HistoryModal } from '../components/HistoryModal';
import { InventoryModal } from '../components/InventoryModal';
import { RecipeDetailModal } from '../Equipment/RecipeDetailModal';

const ALL_TAGS = [
  'breakfast',
  'oats',
  'vegan',
  'quick',
  'savory',
  'sweet',
  'vegetarian',
  'greens',
  'meal-prep',
  'high-protein',
  'comfort',
  'low-calorie',
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<'ingredients' | 'equipments' | null>(null);
  const [bookmarkOnlyView, setBookmarkOnlyView] = useState(false);

  // Shows tag panel when tapping/focusing the search bar
  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const [userIngredients, setUserIngredients] = useState<string[]>(INITIAL_INGREDIENTS);
  const [userEquipment, setUserEquipment] = useState<string[]>(INITIAL_EQUIPMENT);
  const [userAllergies] = useState<string[]>(INITIAL_ALLERGIES);

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const [visitedRecipes, setVisitedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Preference: 1 click -> green | 2 click -> red (3rd click resets to off)
  const [prefStates, setPrefStates] = useState<Record<DietaryPreference, PrefState>>({
    'Lactose intolerance': 'off',
    'Gluten intolerance': 'off',
    Vegetarianism: 'off',
    Veganism: 'off',
    Kosher: 'off',
    Keto: 'off',
    Diabetes: 'off',
    'Dairy-free': 'off',
    'Low carb': 'off',
  });

  // Include/Exclude tags: 1 click -> green | 2 click -> red | 3 click -> cancel
  const [tagStates, setTagStates] = useState<Record<string, TriState>>({});

  useEffect(() => {
    (async () => {
      const [b, sh, vr, ing, eq] = await Promise.all([
        AsyncStorage.getItem('@orderup_bookmarks'),
        AsyncStorage.getItem('@orderup_search_history'),
        AsyncStorage.getItem('@orderup_visited'),
        AsyncStorage.getItem('@orderup_ingredients'),
        AsyncStorage.getItem('@orderup_equipment'),
      ]);
      if (b) setBookmarks(JSON.parse(b));
      if (sh) setSearchHistory(JSON.parse(sh));
      if (vr) setVisitedRecipes(JSON.parse(vr));
      if (ing) setUserIngredients(JSON.parse(ing));
      if (eq) setUserEquipment(JSON.parse(eq));
    })();
  }, []);

  const cyclePref = (pref: DietaryPreference) => {
    setPrefStates((prev) => {
      const current = prev[pref];
      const next: PrefState = current === 'off' ? 'green' : current === 'green' ? 'red' : 'off';
      return { ...prev, [pref]: next };
    });
  };

  const cycleTag = (tag: string) => {
    setTagStates((prev) => {
      const current = prev[tag] || 'neutral';
      const next: TriState =
        current === 'neutral' ? 'include' : current === 'include' ? 'exclude' : 'neutral';
      return { ...prev, [tag]: next };
    });
  };

  const commitSearchHistory = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      query: trimmed,
      timestamp: 'Just now',
    };
    const updated = [entry, ...searchHistory.filter((x) => x.query !== trimmed)].slice(0, 20);
    setSearchHistory(updated);
    await AsyncStorage.setItem('@orderup_search_history', JSON.stringify(updated));
  };

  const toggleBookmark = async (recipeId: string) => {
    const updated = bookmarks.includes(recipeId)
      ? bookmarks.filter((id) => id !== recipeId)
      : [...bookmarks, recipeId];
    setBookmarks(updated);
    await AsyncStorage.setItem('@orderup_bookmarks', JSON.stringify(updated));
  };

  const openRecipe = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    const updated = [recipe, ...visitedRecipes.filter((r) => r.id !== recipe.id)].slice(0, 20);
    setVisitedRecipes(updated);
    await AsyncStorage.setItem('@orderup_visited', JSON.stringify(updated));
  };

  const updateIngredientsList = async (next: string[]) => {
    setUserIngredients(next);
    await AsyncStorage.setItem('@orderup_ingredients', JSON.stringify(next));
  };

  const updateEquipmentList = async (next: string[]) => {
    setUserEquipment(next);
    await AsyncStorage.setItem('@orderup_equipment', JSON.stringify(next));
  };

  const filteredTags = useMemo(() => {
    const q = tagSearchQuery.trim().toLowerCase();
    if (!q) return ALL_TAGS;
    return ALL_TAGS.filter((t) => t.toLowerCase().includes(q));
  }, [tagSearchQuery]);

  const activeTagCount = useMemo(
    () => Object.values(tagStates).filter((st) => st !== 'neutral').length,
    [tagStates]
  );

  const displayedRecipes = useMemo(() => {
    const ranked = rankRecipes(INITIAL_RECIPES, {
      searchQuery,
      userIngredients,
      userEquipment,
      userAllergies,
      prefStates,
      tagStates,
    });
    return bookmarkOnlyView ? ranked.filter((r) => bookmarks.includes(r.id)) : ranked;
  }, [
    searchQuery,
    userIngredients,
    userEquipment,
    userAllergies,
    prefStates,
    tagStates,
    bookmarkOnlyView,
    bookmarks,
  ]);

  const getPrefStyle = (state: PrefState) => {
    if (state === 'green') return styles.chipGreen;
    if (state === 'red') return styles.chipRed;
    return styles.prefChipOff;
  };

  const getTagStyle = (state: TriState) => {
    if (state === 'include') return styles.chipGreen;
    if (state === 'exclude') return styles.chipRed;
    return styles.tagChipOff;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Searchbar */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
              <Ionicons name="menu" size={24} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.appTitle}>Order up!</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setTagsPanelOpen((prev) => !prev)}
              style={styles.tagsToggleBtn}
            >
              <Ionicons name="pricetags-outline" size={14} color="#111827" />
              <Text style={styles.tagsToggleText}>
                Tags{activeTagCount > 0 ? ` (${activeTagCount})` : ''}
              </Text>
            </TouchableOpacity>

            {bookmarkOnlyView && (
              <TouchableOpacity
                onPress={() => setBookmarkOnlyView(false)}
                style={styles.bookmarkPill}
              >
                <Text style={styles.bookmarkPillText}>Bookmarks Only ✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Primary Search Box: tapping/focusing opens the tags section */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setTagsPanelOpen(true)}
          style={styles.searchBox}
        >
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onFocus={() => setTagsPanelOpen(true)}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => commitSearchHistory(searchQuery)}
            placeholder="Search recipe by name..."
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Preferences: 1 click -> green | 2 click -> red */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.prefScroll}
        >
          {PREFERENCES_LIST.map((pref) => {
            const st = prefStates[pref];
            return (
              <TouchableOpacity
                key={pref}
                onPress={() => cyclePref(pref)}
                style={[styles.prefChip, getPrefStyle(st)]}
              >
                <Text style={[styles.prefChipText, st !== 'off' && styles.textWhite]}>
                  {pref} {st === 'green' ? '✓' : st === 'red' ? '✕' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Expandable Tags Section (shown when search bar is tapped/focused or Tags button pressed) */}
        {tagsPanelOpen && (
          <View style={styles.tagSection}>
            <View style={styles.tagSearchRow}>
              <View style={styles.tagSearchBox}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <TextInput
                  value={tagSearchQuery}
                  onChangeText={setTagSearchQuery}
                  placeholder="Search tags (e.g. vegan, quick, oats)..."
                  style={styles.tagSearchInput}
                />
                {tagSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setTagSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={() => setTagsPanelOpen(false)}
                style={styles.hideTagsBtn}
              >
                <Text style={styles.hideTagsText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tagScroll}
            >
              {filteredTags.map((tag) => {
                const st = tagStates[tag] || 'neutral';
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => cycleTag(tag)}
                    style={[styles.tagChip, getTagStyle(st)]}
                  >
                    <Text style={[styles.tagChipText, st !== 'neutral' && styles.textWhite]}>
                      #{tag} {st === 'include' ? '+' : st === 'exclude' ? '−' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {filteredTags.length === 0 && (
                <Text style={styles.noTagsMatchText}>No matching tags</Text>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Homepage Recipe Grid */}
      <FlatList
        data={displayedRecipes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ padding: 10 }}
        renderItem={({ item }) => {
          const isSaved = bookmarks.includes(item.id);
          return (
            <TouchableOpacity onPress={() => openRecipe(item)} style={styles.card}>
              <Image source={{ uri: item.image }} style={styles.cardImage} />
              <View style={styles.cardBody}>
                <Text numberOfLines={2} style={styles.cardTitle}>
                  {item.title}
                </Text>

                {/* Heart = Bookmark / Time = Total time for recipe */}
                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id);
                    }}
                    style={styles.heartButton}
                  >
                    <Ionicons
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={17}
                      color={isSaved ? '#EF4444' : '#4B5563'}
                    />
                  </TouchableOpacity>

                  <View style={styles.timeRow}>
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text style={styles.timeText}>{item.totalTimeMinutes}m</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            No matching recipes found with current filters/equipment.
          </Text>
        }
      />

      {/* Sidebar */}
      <SidebarDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        bookmarkCount={bookmarks.length}
        ingredientCount={userIngredients.length}
        equipmentCount={userEquipment.length}
        onSelectSection={(sec) => {
          if (sec === 'ingredients') setInventoryMode('ingredients');
          if (sec === 'equipments') setInventoryMode('equipments');
          if (sec === 'bookmark') setBookmarkOnlyView((prev) => !prev);
          if (sec === 'history') setHistoryOpen(true);
        }}
      />

      {/* Ingredients CRUD */}
      <InventoryModal
        visible={inventoryMode === 'ingredients'}
        onClose={() => setInventoryMode(null)}
        title="My Ingredients"
        placeholder="Add ingredient (e.g. Milk, Tomatoes)..."
        items={userIngredients}
        onAdd={(val) => updateIngredientsList([...userIngredients, val])}
        onUpdate={(idx, val) =>
          updateIngredientsList(userIngredients.map((item, i) => (i === idx ? val : item)))
        }
        onDelete={(idx) =>
          updateIngredientsList(userIngredients.filter((_, i) => i !== idx))
        }
      />

      {/* Equipments CRUD */}
      <InventoryModal
        visible={inventoryMode === 'equipments'}
        onClose={() => setInventoryMode(null)}
        title="My Equipments"
        placeholder="Add equipment (e.g. Oven, Blender)..."
        items={userEquipment}
        onAdd={(val) => updateEquipmentList([...userEquipment, val])}
        onUpdate={(idx, val) =>
          updateEquipmentList(userEquipment.map((item, i) => (i === idx ? val : item)))
        }
        onDelete={(idx) =>
          updateEquipmentList(userEquipment.filter((_, i) => i !== idx))
        }
      />

      {/* History Popup (2 options: Search history / Visited recipe) */}
      <HistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        searchHistory={searchHistory}
        visitedRecipes={visitedRecipes}
        onSelectSearchQuery={(q) => setSearchQuery(q)}
        onSelectRecipe={(r) => openRecipe(r)}
      />

      {/* Recipe Page */}
      <RecipeDetailModal
        recipe={selectedRecipe}
        isBookmarked={selectedRecipe ? bookmarks.includes(selectedRecipe.id) : false}
        onToggleBookmark={toggleBookmark}
        onClose={() => setSelectedRecipe(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuButton: { padding: 4 },
  appTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },

  tagsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tagsToggleText: { fontSize: 12, fontWeight: '700', color: '#111827' },

  bookmarkPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  bookmarkPillText: { fontSize: 12, fontWeight: '700', color: '#E11D48' },

  // Recipe Search
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: '#111827' },

  // Preference chips
  prefScroll: { marginTop: 10 },
  prefChip: {
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  prefChipOff: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  prefChipText: { fontSize: 12, fontWeight: '600', color: '#374151' },

  // Expandable Tag Section & Tag Search below Recipe Search
  tagSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  tagSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagSearchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: '#111827',
  },
  hideTagsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#111827',
  },
  hideTagsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tagScroll: { marginTop: 8, paddingBottom: 4 },
  tagChip: {
    marginRight: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagChipOff: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    textTransform: 'capitalize',
  },
  noTagsMatchText: {
    fontSize: 12,
    color: '#9CA3AF',
    paddingVertical: 4,
  },

  // Shared active states (green = include/on, red = exclude/avoid)
  chipGreen: { backgroundColor: '#059669', borderColor: '#059669' },
  chipRed: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  textWhite: { color: '#FFFFFF' },

  // Recipe cards
  card: {
    flex: 1,
    margin: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardImage: { width: '100%', height: 144, backgroundColor: '#E5E7EB' },
  cardBody: { padding: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  heartButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },

  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 48 },
});