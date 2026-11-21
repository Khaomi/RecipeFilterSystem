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
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import {
  Recipe,
  PrefState,
  TriState,
  HistoryEntry,
} from './type/recipe';
import { SidebarDrawer } from './components/SidebarDrawer';
import { HistoryModal } from './components/HistoryModal';
import { InventoryModal } from './components/InventoryModal';
import { RecipeDetailModal } from './Equipment/RecipeDetailModal';
import {
  API_BASE_URL,
  orderUpApi,
  CatalogCategory,
  CatalogIngredient,
  CatalogPreference,
  RecipeSearchItem,
  RecipeDetailResponse,
} from './api/orderUpApi';

// Images are served locally by the backend; image_path is relative, e.g. "images/x.jpg".
const imageUrl = (path: string | null) =>
  `${API_BASE_URL}/${path || 'images/placeholder.svg'}`;

// Tag chips are ingredients and ingredient categories. Keys: "c:<category_id>" / "i:<ingredient_id>".
interface TagOption {
  key: string;
  label: string;
}

const tagIds = (states: Record<string, TriState>, kind: 'c' | 'i', state: TriState) =>
  Object.entries(states)
    .filter(([key, st]) => st === state && key.startsWith(`${kind}:`))
    .map(([key]) => Number(key.slice(2)));

function mapApiSearchItemToRecipe(item: RecipeSearchItem): Recipe {
  return {
    id: String(item.recipe_id),
    title: item.recipe_name,
    image: imageUrl(item.image_path),
    totalTimeMinutes: item.cook_time_min ?? 15,
    tags: [],
    ingredients: [],
    equipment: [],
    preferencesSupported: [],
    allergens: [],
    instructions: [],
    tip: undefined,
  };
}

function mergeDetailIntoRecipe(base: Recipe, detail: RecipeDetailResponse): Recipe {
  const apiInstructions = Array.isArray(detail.details?.instructions)
    ? (detail.details.instructions as string[])
    : [];

  const apiIngredients = (detail.ingredients ?? []).map((ing) => ({
    name: ing.ingredient_name,
    category: ing.category_name,
    amount: ing.quantity_text || (ing.is_optional ? 'Optional' : 'As needed'),
    tag: ing.category_name.toLowerCase(),
  }));

  const apiEquipment = (detail.equipment ?? []).map((eq) => eq.equipment_name);

  const derivedTags = Array.from(
    new Set(apiIngredients.map((i) => i.tag).filter(Boolean))
  );

  return {
    ...base,
    id: String(detail.recipe_id),
    title: detail.recipe_name,
    image: imageUrl(detail.image_path),
    totalTimeMinutes: detail.cook_time_min ?? base.totalTimeMinutes,
    tags: derivedTags,
    ingredients: apiIngredients,
    equipment: apiEquipment,
    instructions: apiInstructions,
    tip: undefined,
  };
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<'ingredients' | 'equipments' | null>(null);
  const [bookmarkOnlyView, setBookmarkOnlyView] = useState(false);

  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  const [userIngredients, setUserIngredients] = useState<string[]>([]);
  const [userEquipment, setUserEquipment] = useState<string[]>([]);

  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const [visitedRecipes, setVisitedRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  // Backend catalog & search state
  const [catalogPreferences, setCatalogPreferences] = useState<CatalogPreference[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [catalogIngredients, setCatalogIngredients] = useState<CatalogIngredient[]>([]);
  const [prefStatesById, setPrefStatesById] = useState<Record<number, PrefState>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

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

  // Load preference chips and tag chips (categories + ingredients) from /catalog
  useEffect(() => {
    Promise.all([
      orderUpApi.getPreferences(),
      orderUpApi.getCategories(),
      orderUpApi.getIngredients(),
    ])
      .then(([prefs, categories, ingredients]) => {
        setCatalogPreferences(prefs);
        setCatalogCategories(categories);
        setCatalogIngredients(ingredients);
        setApiError(null);
      })
      .catch(() => {
        setApiError("Couldn't load the filters. Please try again.");
      });
  }, []);

  const searchPayload = useMemo(
    () => ({
      name: searchQuery.trim(),
      include_ingredients: tagIds(tagStates, 'i', 'include'),
      exclude_ingredients: tagIds(tagStates, 'i', 'exclude'),
      include_categories: tagIds(tagStates, 'c', 'include'),
      exclude_categories: tagIds(tagStates, 'c', 'exclude'),
      include_preferences: Object.entries(prefStatesById)
        .filter(([, st]) => st === 'green')
        .map(([id]) => Number(id)),
      exclude_preferences: Object.entries(prefStatesById)
        .filter(([, st]) => st === 'red')
        .map(([id]) => Number(id)),
      limit: 20,
      offset: 0,
    }),
    [searchQuery, tagStates, prefStatesById]
  );

  // Query FastAPI POST /recipes/search (live, not logged to history)
  useEffect(() => {
    let cancelled = false;
    setLoadingRecipes(true);
    setApiError(null);

    orderUpApi
      .searchRecipes(searchPayload)
      .then((rows) => {
        if (cancelled) return;
        setRecipes(rows.map(mapApiSearchItemToRecipe));
      })
      .catch(() => {
        if (cancelled) return;
        setRecipes([]);
        setApiError("Couldn't load recipes. Please try again.");
      })
      .finally(() => {
        if (!cancelled) setLoadingRecipes(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchPayload]);

  const cyclePref = (prefId: number) => {
    setPrefStatesById((prev) => {
      const current = prev[prefId] || 'off';
      const next: PrefState = current === 'off' ? 'green' : current === 'green' ? 'red' : 'off';
      return { ...prev, [prefId]: next };
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
    // Submitted searches are logged to Mongo search_history by the backend.
    orderUpApi.searchRecipes({ ...searchPayload, log: true }).catch(() => {});

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

    const numericId = Number(recipe.id);
    let finalRecipe = recipe;
    if (!Number.isNaN(numericId)) {
      try {
        const detail = await orderUpApi.getRecipeDetail(numericId);
        finalRecipe = mergeDetailIntoRecipe(recipe, detail);
        setSelectedRecipe(finalRecipe);
      } catch (err) {
        setApiError(
          err instanceof Error && err.message === '20'
            ? 'This recipe no longer exists.'
            : "Couldn't load this recipe. Please try again."
        );
      }
    }

    const updated = [
      finalRecipe,
      ...visitedRecipes.filter((r) => r.id !== finalRecipe.id),
    ].slice(0, 20);
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
    const all: TagOption[] = [
      ...catalogCategories.map((c) => ({ key: `c:${c.category_id}`, label: `All ${c.category_name}` })),
      ...catalogIngredients.map((i) => ({ key: `i:${i.ingredient_id}`, label: i.ingredient_name })),
    ];
    const q = tagSearchQuery.trim().toLowerCase();
    if (!q) return all;
    return all.filter((t) => t.label.toLowerCase().includes(q));
  }, [tagSearchQuery, catalogCategories, catalogIngredients]);

  const activeTagCount = useMemo(
    () => Object.values(tagStates).filter((st) => st !== 'neutral').length,
    [tagStates]
  );

  // Tag filtering happens in the backend search; only the bookmark view filters here.
  const displayedRecipes = useMemo(
    () => (bookmarkOnlyView ? recipes.filter((r) => bookmarks.includes(r.id)) : recipes),
    [recipes, bookmarkOnlyView, bookmarks]
  );

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

        {/* Primary Search Box */}
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
          {loadingRecipes && <ActivityIndicator size="small" color="#111827" />}
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {apiError && <Text style={styles.errorText}>{apiError}</Text>}

        {/* Preferences from DB: 1 click -> green | 2 click -> red | 3 click -> off */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.prefScroll}
        >
          {catalogPreferences.map((pref) => {
            const st = prefStatesById[pref.preference_id] || 'off';
            return (
              <TouchableOpacity
                key={pref.preference_id}
                onPress={() => cyclePref(pref.preference_id)}
                style={[styles.prefChip, getPrefStyle(st)]}
              >
                <Text style={[styles.prefChipText, st !== 'off' && styles.textWhite]}>
                  {pref.preference_name} {st === 'green' ? '✓' : st === 'red' ? '✕' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Expandable Tags Section */}
        {tagsPanelOpen && (
          <View style={styles.tagSection}>
            <View style={styles.tagSearchRow}>
              <View style={styles.tagSearchBox}>
                <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
                <TextInput
                  value={tagSearchQuery}
                  onChangeText={setTagSearchQuery}
                  placeholder="Search ingredients or categories (e.g. Eggs, Dairy)..."
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
                const st = tagStates[tag.key] || 'neutral';
                return (
                  <TouchableOpacity
                    key={tag.key}
                    onPress={() => cycleTag(tag.key)}
                    style={[styles.tagChip, getTagStyle(st)]}
                  >
                    <Text style={[styles.tagChipText, st !== 'neutral' && styles.textWhite]}>
                      #{tag.label} {st === 'include' ? '+' : st === 'exclude' ? '−' : ''}
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
            {loadingRecipes
              ? 'Loading recipes from backend...'
              : 'No recipes returned from backend.'}
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

      {/* History Popup */}
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

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  errorText: { fontSize: 12, color: '#E11D48', marginTop: 6 },

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

  chipGreen: { backgroundColor: '#059669', borderColor: '#059669' },
  chipRed: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  textWhite: { color: '#FFFFFF' },

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