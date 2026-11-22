import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  TextStyle,
  ViewStyle,
  SafeAreaView,
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Recipe,
  PrefState,
  TriState,
  HistoryEntry,
} from './type/recipe';
import { SidebarDrawer } from './components/SidebarDrawer';
import { HistoryModal, VisitedItem } from './components/HistoryModal';
import { InventoryModal } from './components/InventoryModal';
import { RecipeEditorModal } from './components/RecipeEditorModal';
import { RecipeDetailModal } from './Equipment/RecipeDetailModal';
import {
  API_BASE_URL,
  orderUpApi,
  AuditLogEntry,
  CatalogCategory,
  CatalogEquipment,
  CatalogIngredient,
  CatalogPreference,
  InventoryItem,
  InventoryKind,
  RecipeSearchItem,
  RecipeSummary,
  RecipeDetailResponse,
  RecipeSaveBody,
} from './api/orderUpApi';

const TAG_PANEL_WIDTH = 360;
const MAX_CONTENT_WIDTH = 1600;

// Web-only CSS transition (react-native-web passes these through), e.g. for hover colors.
const WEB_FADE = {
  transitionProperty: 'background-color, color',
  transitionDuration: '200ms',
  transitionTimingFunction: 'ease-in-out',
} as unknown as ViewStyle & TextStyle;

const INVENTORY_TEXT: Record<InventoryKind, { title: string; placeholder: string }> = {
  ingredients: { title: 'My Ingredients', placeholder: 'Find an ingredient (e.g. Milk)...' },
  equipment: { title: 'My Equipments', placeholder: 'Find equipment (e.g. Oven)...' },
  allergies: { title: 'My Allergies', placeholder: 'Find an allergen (e.g. Peanuts)...' },
};

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

// Search results carry the inventory fit; bookmarks/visited only the recipe summary.
function mapApiSearchItemToRecipe(
  item: RecipeSummary & Partial<Pick<RecipeSearchItem, 'missing_count' | 'allergen_optional'>>
): Recipe {
  return {
    id: String(item.recipe_id),
    title: item.recipe_name,
    image: imageUrl(item.image_path),
    totalTimeMinutes: item.cook_time_min ?? 15,
    serving: item.serving,
    tags: [],
    ingredients: [],
    equipment: [],
    preferencesSupported: [],
    allergens: [],
    instructions: [],
    tip: undefined,
    missingCount: item.missing_count,
    allergenOptional: item.allergen_optional,
  };
}

function mergeDetailIntoRecipe(base: Recipe, detail: RecipeDetailResponse): Recipe {
  const apiInstructions = Array.isArray(detail.details?.instructions)
    ? (detail.details.instructions as string[])
    : [];

  const apiIngredients = (detail.ingredients ?? []).map((ing) => ({
    name: ing.ingredient_name,
    category: ing.category_name,
    amount: ing.quantity_text || 'As needed',
    tag: ing.category_name.toLowerCase(),
    optional: ing.is_optional,
    owned: ing.owned,
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
    serving: detail.serving,
    tags: derivedTags,
    ingredients: apiIngredients,
    equipment: apiEquipment,
    instructions: apiInstructions,
    tip: undefined,
    author: detail.details?.author || undefined,
    updatedAt: detail.details?.updated_at,
  };
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<InventoryKind | null>(null);
  const [bookmarkOnlyView, setBookmarkOnlyView] = useState(false);

  const [tagsPanelOpen, setTagsPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSearchQuery, setTagSearchQuery] = useState('');

  // Inventory lives in Postgres; inventoryVersion re-runs the search after a change.
  const [inventory, setInventory] = useState<Record<InventoryKind, InventoryItem[]>>({
    ingredients: [],
    equipment: [],
    allergies: [],
  });
  const [inventoryMessage, setInventoryMessage] = useState<string | null>(null);
  const [inventoryVersion, setInventoryVersion] = useState(0);
  // "Use my kitchen": off shows every recipe regardless of equipment (allergies still apply).
  const [useInventory, setUseInventory] = useState(true);

  // Bookmarks, history and activity live in Mongo.
  const [bookmarkItems, setBookmarkItems] = useState<Recipe[]>([]);
  const [searchHistory, setSearchHistory] = useState<HistoryEntry[]>([]);
  const [visitedRecipes, setVisitedRecipes] = useState<VisitedItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  // Raw API detail of the open recipe; the editor starts from it.
  const [selectedDetail, setSelectedDetail] = useState<RecipeDetailResponse | null>(null);

  // Recipe editor; recipesVersion re-runs the search after a save/delete.
  const [editorMode, setEditorMode] = useState<'create' | 'edit' | null>(null);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);
  const [savingRecipe, setSavingRecipe] = useState(false);
  const [recipesVersion, setRecipesVersion] = useState(0);
  const bookmarks = bookmarkItems.map((r) => r.id);

  // Backend catalog & search state
  const [catalogPreferences, setCatalogPreferences] = useState<CatalogPreference[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<CatalogCategory[]>([]);
  const [catalogIngredients, setCatalogIngredients] = useState<CatalogIngredient[]>([]);
  const [catalogEquipment, setCatalogEquipment] = useState<CatalogEquipment[]>([]);
  const [prefStatesById, setPrefStatesById] = useState<Record<number, PrefState>>({});
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Include/Exclude tags: 1 click -> green | 2 click -> red | 3 click -> cancel
  const [tagStates, setTagStates] = useState<Record<string, TriState>>({});

  const loadInventory = (kind: InventoryKind) =>
    orderUpApi.getInventory(kind).then((items) => setInventory((prev) => ({ ...prev, [kind]: items })));

  const loadBookmarks = () =>
    orderUpApi.getBookmarks().then((items) => setBookmarkItems(items.map(mapApiSearchItemToRecipe)));

  const loadHistory = () =>
    Promise.all([orderUpApi.getSearchHistory(), orderUpApi.getVisited(), orderUpApi.getAuditLogs()]).then(
      ([searches, visited, logs]) => {
        setSearchHistory(
          searches.map((s) => ({
            id: s._id,
            query: s.name,
            timestamp: new Date(s.searched_at).toLocaleString(),
          }))
        );
        setVisitedRecipes(
          visited.map((v) => ({
            id: v._id,
            recipe: mapApiSearchItemToRecipe(v),
            timestamp: new Date(v.visited_at).toLocaleString(),
          }))
        );
        setAuditLogs(logs);
      }
    );

  useEffect(() => {
    Promise.all([
      loadInventory('ingredients'),
      loadInventory('equipment'),
      loadInventory('allergies'),
      loadBookmarks(),
    ]).catch(() => setApiError("Couldn't load your kitchen. Please try again."));
  }, []);

  // Load preference chips, tag chips (categories + ingredients) and equipment from /catalog
  useEffect(() => {
    Promise.all([
      orderUpApi.getPreferences(),
      orderUpApi.getCategories(),
      orderUpApi.getIngredients(),
      orderUpApi.getEquipment(),
    ])
      .then(([prefs, categories, ingredients, equipment]) => {
        setCatalogPreferences(prefs);
        setCatalogCategories(categories);
        setCatalogIngredients(ingredients);
        setCatalogEquipment(equipment);
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
      limit: 100,
      offset: 0,
      use_inventory: useInventory,
    }),
    [searchQuery, tagStates, prefStatesById, useInventory]
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
  }, [searchPayload, inventoryVersion, recipesVersion]);

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

  // Submitted searches are logged to Mongo search_history by the backend.
  const submitSearch = () => {
    orderUpApi.searchRecipes({ ...searchPayload, log: true }).catch(() => {});
  };

  const toggleBookmark = async (recipeId: string) => {
    const id = Number(recipeId);
    try {
      if (bookmarks.includes(recipeId)) await orderUpApi.deleteBookmark(id);
      else await orderUpApi.addBookmark(id);
    } catch {
      setApiError("Couldn't update your bookmarks. Please try again.");
    }
    loadBookmarks().catch(() => {});
  };

  // Opening a recipe also logs the visit (done by the backend).
  const openRecipe = async (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    setSelectedDetail(null);
    try {
      const detail = await orderUpApi.getRecipeDetail(Number(recipe.id));
      setSelectedRecipe(mergeDetailIntoRecipe(recipe, detail));
      setSelectedDetail(detail);
    } catch (err) {
      setApiError(
        err instanceof Error && err.message === '20'
          ? 'This recipe no longer exists.'
          : "Couldn't load this recipe. Please try again."
      );
    }
  };

  // Create or update in one backend transaction (Postgres + Mongo); then show the saved recipe.
  const saveRecipe = async (body: RecipeSaveBody) => {
    setSavingRecipe(true);
    try {
      const { recipe_id } =
        editorMode === 'edit' && selectedDetail
          ? await orderUpApi.updateRecipe(selectedDetail.recipe_id, body)
          : await orderUpApi.createRecipe(body);
      setEditorMode(null);
      setEditorMessage(null);
      setRecipesVersion((v) => v + 1);
      loadBookmarks().catch(() => {});
      openRecipe(
        mapApiSearchItemToRecipe({
          recipe_id,
          recipe_name: body.recipe_name,
          cook_time_min: body.cook_time_min,
          serving: body.serving,
          image_path: body.image_path,
        })
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setEditorMessage(
        code === '10'
          ? 'Some fields are invalid. Check the name, numbers and picture.'
          : code === '11'
          ? 'One of the picked items no longer exists. Reopen the editor and try again.'
          : code === '12'
          ? 'Each ingredient can only be added once.'
          : code === '20'
          ? 'This recipe no longer exists.'
          : "Couldn't save the recipe, so nothing was changed. Please try again."
      );
    } finally {
      setSavingRecipe(false);
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      await orderUpApi.deleteRecipe(Number(recipeId));
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setApiError(
        code === '20'
          ? 'This recipe was already deleted.'
          : "Couldn't delete the recipe, so nothing was changed. Please try again."
      );
    }
    setSelectedRecipe(null);
    setSelectedDetail(null);
    setRecipesVersion((v) => v + 1);
    loadBookmarks().catch(() => {});
  };

  const changeInventory = async (kind: InventoryKind, change: Promise<unknown>) => {
    try {
      await change;
      setInventoryMessage(null);
    } catch (err) {
      const code = err instanceof Error ? err.message : '';
      setInventoryMessage(
        code === '12'
          ? "That's already on your list."
          : code === '20'
          ? 'That item was already removed.'
          : "Couldn't save the change, so nothing was changed. Please try again."
      );
    }
    await loadInventory(kind).catch(() => {});
    setInventoryVersion((v) => v + 1);
  };

  const openHistory = () => {
    setHistoryOpen(true);
    loadHistory().catch(() => setApiError("Couldn't load your history. Please try again."));
  };

  const ingredientOptions = catalogIngredients.map((i) => ({
    id: i.ingredient_id,
    name: i.ingredient_name,
    category: i.category_name,
  }));
  const equipmentOptions = catalogEquipment.map((e) => ({ id: e.equipment_id, name: e.equipment_name }));

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

  // Filtering happens in the backend search; the bookmark view shows all bookmarks.
  const displayedRecipes = bookmarkOnlyView ? bookmarkItems : recipes;

  // Layout: the grid uses as many columns as fit, so cards and images stay a sensible size.
  // The tag panel slides over the grid, so opening it never resizes the cards.
  // Wide screens: no backdrop, cards stay clickable. Narrow screens: dimmed backdrop.
  const { width } = useWindowDimensions();
  const wideScreen = width >= 1000;
  const panelWidth = Math.min(TAG_PANEL_WIDTH, width);
  const gridWidth = Math.min(width, MAX_CONTENT_WIDTH);
  const columns = gridWidth >= 1400 ? 4 : gridWidth >= 1000 ? 3 : gridWidth >= 560 ? 2 : 1;

  // Ease the panel in/out; keep it mounted until the closing animation finishes.
  const panelAnim = useRef(new Animated.Value(0)).current;
  const [panelMounted, setPanelMounted] = useState(false);
  useEffect(() => {
    if (tagsPanelOpen) setPanelMounted(true);
    Animated.timing(panelAnim, {
      toValue: tagsPanelOpen ? 1 : 0,
      duration: 250,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished && !tagsPanelOpen) setPanelMounted(false);
    });
  }, [tagsPanelOpen, panelAnim]);

  const tagGroups = [
    { title: 'Categories', items: filteredTags.filter((t) => t.key.startsWith('c:')) },
    { title: 'Ingredients', items: filteredTags.filter((t) => t.key.startsWith('i:')) },
  ];

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

  // Right-side tag filter panel
  const tagPanel = (
    <View style={[styles.tagPanel, { width: panelWidth }]}>
      <View style={styles.tagPanelHeader}>
        <Text style={styles.tagPanelTitle}>Filter by ingredient</Text>
        <TouchableOpacity onPress={() => setTagsPanelOpen(false)} style={styles.menuButton}>
          <Ionicons name="close" size={24} color="#111827" />
        </TouchableOpacity>
      </View>
      <Text style={styles.tagPanelHint}>Tap once to include, twice to exclude, again to clear.</Text>

      <View style={styles.tagSearchBox}>
        <Ionicons name="search" size={18} color="#6B7280" />
        <TextInput
          value={tagSearchQuery}
          onChangeText={setTagSearchQuery}
          placeholder="Search e.g. Eggs, Dairy..."
          style={styles.tagSearchInput}
        />
        {tagSearchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setTagSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {activeTagCount > 0 && (
        <TouchableOpacity onPress={() => setTagStates({})} style={styles.clearTagsBtn}>
          <Text style={styles.clearTagsText}>Clear all filters ({activeTagCount})</Text>
        </TouchableOpacity>
      )}

      <ScrollView style={styles.tagPanelScroll}>
        {tagGroups.map(
          (group) =>
            group.items.length > 0 && (
              <View key={group.title} style={styles.tagGroup}>
                <Text style={styles.tagGroupTitle}>{group.title}</Text>
                <View style={styles.tagWrap}>
                  {group.items.map((tag) => {
                    const st = tagStates[tag.key] || 'neutral';
                    return (
                      <TouchableOpacity
                        key={tag.key}
                        onPress={() => cycleTag(tag.key)}
                        style={[styles.tagChip, getTagStyle(st)]}
                      >
                        <Text style={[styles.tagChipText, st !== 'neutral' && styles.textWhite]}>
                          {tag.label} {st === 'include' ? '+' : st === 'exclude' ? '−' : ''}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )
        )}
        {filteredTags.length === 0 && <Text style={styles.noTagsMatchText}>No matching tags</Text>}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header + Searchbar */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <TouchableOpacity onPress={() => setSidebarOpen(true)} style={styles.menuButton}>
                <Ionicons name="menu" size={28} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.appTitle}>Order up!</Text>
            </View>

            <View style={styles.headerActions}>
              {bookmarkOnlyView && (
                <TouchableOpacity
                  onPress={() => setBookmarkOnlyView(false)}
                  style={styles.bookmarkPill}
                >
                  <Text style={styles.bookmarkPillText}>Bookmarks Only ✕</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setUseInventory((prev) => !prev)}
                style={[styles.kitchenToggle, useInventory && styles.kitchenToggleOn]}
              >
                <Ionicons
                  name={useInventory ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={useInventory ? '#047857' : '#6B7280'}
                />
                <Text style={[styles.kitchenToggleText, useInventory && styles.kitchenToggleTextOn]}>
                  Use my kitchen
                </Text>
              </TouchableOpacity>

              {/* `hovered` is provided by react-native-web */}
              <Pressable onPress={() => setTagsPanelOpen((prev) => !prev)}>
                {(state) => {
                  const hovered = (state as { hovered?: boolean }).hovered;
                  const color = hovered ? '#1F2937' : '#FFFFFF';
                  return (
                    <View style={[styles.tagsToggleBtn, WEB_FADE, hovered && styles.tagsToggleBtnHover]}>
                      <Ionicons name="options-outline" size={18} color={color} />
                      <Text style={[styles.tagsToggleText, WEB_FADE, { color }]}>
                        Tags{activeTagCount > 0 ? ` (${activeTagCount})` : ''}
                      </Text>
                    </View>
                  );
                }}
              </Pressable>
            </View>
          </View>

          {/* Primary Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={submitSearch}
              placeholder="Search recipe by name..."
              style={styles.searchInput}
              returnKeyType="search"
            />
            {loadingRecipes && <ActivityIndicator size="small" color="#111827" />}
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

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
        </View>
      </View>

      <View style={styles.body}>
        {/* Homepage Recipe Grid */}
        <FlatList
          key={`grid-${columns}`}
          data={displayedRecipes}
          keyExtractor={(item) => item.id}
          numColumns={columns}
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => {
            const isSaved = bookmarks.includes(item.id);
            return (
              <View style={{ width: `${100 / columns}%`, padding: 8 }}>
                <TouchableOpacity onPress={() => openRecipe(item)} style={styles.card}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={styles.cardBody}>
                    <Text numberOfLines={2} style={styles.cardTitle}>
                      {item.title}
                    </Text>
                    {item.missingCount !== undefined && (
                      <Text
                        style={[
                          styles.cardFitText,
                          item.missingCount === 0 ? styles.cardFitGood : styles.cardFitMissing,
                        ]}
                      >
                        {item.missingCount === 0
                          ? '✓ You have everything'
                          : `Missing ${item.missingCount} ingredient${item.missingCount > 1 ? 's' : ''}`}
                      </Text>
                    )}
                    {item.allergenOptional && (
                      <Text style={styles.cardAllergenText}>⚠ Has an optional allergen, leave it out</Text>
                    )}

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
                          size={22}
                          color={isSaved ? '#EF4444' : '#4B5563'}
                        />
                      </TouchableOpacity>

                      <View style={styles.timeRow}>
                        <Ionicons name="time-outline" size={18} color="#6B7280" />
                        <Text style={styles.timeText}>{item.totalTimeMinutes} min</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loadingRecipes ? 'Loading recipes...' : 'No recipes match your filters.'}
            </Text>
          }
        />

        {/* Tag panel slides over the grid from the right */}
        {panelMounted && (
          <View style={styles.tagOverlay} pointerEvents="box-none">
            {!wideScreen && (
              <Animated.View style={[styles.tagOverlayBackdrop, { opacity: panelAnim }]}>
                <Pressable style={styles.fill} onPress={() => setTagsPanelOpen(false)} />
              </Animated.View>
            )}
            <Animated.View
              style={[
                styles.tagPanelSlide,
                {
                  transform: [
                    {
                      translateX: panelAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [panelWidth, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {tagPanel}
            </Animated.View>
          </View>
        )}
      </View>

      {/* Sidebar */}
      <SidebarDrawer
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        bookmarkCount={bookmarks.length}
        ingredientCount={inventory.ingredients.length}
        equipmentCount={inventory.equipment.length}
        allergyCount={inventory.allergies.length}
        onSelectSection={(sec) => {
          if (sec === 'ingredients') setInventoryMode('ingredients');
          if (sec === 'equipments') setInventoryMode('equipment');
          if (sec === 'allergies') setInventoryMode('allergies');
          if (sec === 'bookmark') setBookmarkOnlyView((prev) => !prev);
          if (sec === 'history') openHistory();
          if (sec === 'newRecipe') setEditorMode('create');
        }}
      />

      {/* Ingredients / Equipments / Allergies CRUD (Postgres + audit log) */}
      {inventoryMode && (
        <InventoryModal
          visible
          onClose={() => {
            setInventoryMode(null);
            setInventoryMessage(null);
          }}
          title={INVENTORY_TEXT[inventoryMode].title}
          placeholder={INVENTORY_TEXT[inventoryMode].placeholder}
          items={inventory[inventoryMode]}
          options={inventoryMode === 'equipment' ? equipmentOptions : ingredientOptions}
          message={inventoryMessage}
          onAdd={(id) => changeInventory(inventoryMode, orderUpApi.addInventory(inventoryMode, id))}
          onUpdate={(oldId, newId) =>
            changeInventory(inventoryMode, orderUpApi.updateInventory(inventoryMode, oldId, newId))
          }
          onDelete={(id) => changeInventory(inventoryMode, orderUpApi.deleteInventory(inventoryMode, id))}
        />
      )}

      {/* History Popup (Mongo) */}
      <HistoryModal
        visible={historyOpen}
        onClose={() => setHistoryOpen(false)}
        searchHistory={searchHistory}
        visitedRecipes={visitedRecipes}
        auditLogs={auditLogs}
        onSelectSearchQuery={(q) => setSearchQuery(q)}
        onSelectRecipe={(r) => openRecipe(r)}
        onDeleteEntry={(kind, id) =>
          orderUpApi.deleteHistoryEntry(kind, id).catch(() => {}).then(loadHistory)
        }
        onClear={(kind) => orderUpApi.clearHistory(kind).catch(() => {}).then(loadHistory)}
      />

      {/* Recipe Page (keyed so the delete confirmation resets per recipe) */}
      <RecipeDetailModal
        key={selectedRecipe?.id ?? 'none'}
        recipe={selectedRecipe}
        isBookmarked={selectedRecipe ? bookmarks.includes(selectedRecipe.id) : false}
        onToggleBookmark={toggleBookmark}
        onClose={() => {
          setSelectedRecipe(null);
          setSelectedDetail(null);
        }}
        onEdit={() => {
          if (selectedDetail) setEditorMode('edit');
        }}
        onDelete={deleteRecipe}
      />

      {/* Recipe editor (create / edit) */}
      {editorMode && (
        <RecipeEditorModal
          initial={editorMode === 'edit' ? selectedDetail : null}
          ingredientOptions={catalogIngredients}
          equipmentOptions={catalogEquipment}
          preferenceOptions={catalogPreferences}
          message={editorMessage}
          saving={savingRecipe}
          onClose={() => {
            setEditorMode(null);
            setEditorMessage(null);
          }}
          onSave={saveRecipe}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },

  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerInner: { width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  menuButton: { padding: 4 },
  appTitle: { fontSize: 26, fontWeight: '800', color: '#111827' },

  tagsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#4A4466',
  },
  tagsToggleBtnHover: { backgroundColor: '#9FCBAD' },

  kitchenToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  kitchenToggleOn: { borderColor: '#6EE7B7', backgroundColor: '#ECFDF5' },
  kitchenToggleText: { fontSize: 16, fontWeight: '600', color: '#6B7280' },
  kitchenToggleTextOn: { color: '#047857' },
  tagsToggleText: { fontSize: 16, fontWeight: '700' },

  bookmarkPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  bookmarkPillText: { fontSize: 15, fontWeight: '700', color: '#E11D48' },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 17, color: '#111827' },
  errorText: { fontSize: 15, color: '#E11D48', marginTop: 8 },

  prefScroll: { marginTop: 12 },
  prefChip: {
    marginRight: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  prefChipOff: { backgroundColor: '#FFFFFF', borderColor: '#D1D5DB' },
  prefChipText: { fontSize: 15, fontWeight: '600', color: '#374151' },

  chipGreen: { backgroundColor: '#059669', borderColor: '#059669' },
  chipRed: { backgroundColor: '#E11D48', borderColor: '#E11D48' },
  textWhite: { color: '#FFFFFF' },

  // Grid + tag panel side by side
  body: { flex: 1, flexDirection: 'row' },
  grid: { flex: 1 },
  gridContent: {
    width: '100%',
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    padding: 12,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardImage: { width: '100%', height: 180, backgroundColor: '#E5E7EB' },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 19, fontWeight: '700', color: '#111827' },
  cardFitText: { fontSize: 15, fontWeight: '600', marginTop: 6 },
  cardFitGood: { color: '#047857' },
  cardFitMissing: { color: '#B45309' },
  cardAllergenText: { fontSize: 14, color: '#B45309', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  heartButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { fontSize: 15, fontWeight: '600', color: '#4B5563' },

  emptyText: { textAlign: 'center', color: '#6B7280', fontSize: 17, marginTop: 48 },

  // Right-side tag panel
  tagPanel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    padding: 20,
    gap: 12,
  },
  tagPanelSlide: {
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  fill: { flex: 1 },
  tagPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tagPanelTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  tagPanelHint: { fontSize: 14, color: '#6B7280' },
  tagSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  tagSearchInput: { flex: 1, fontSize: 16, color: '#111827' },
  clearTagsBtn: { alignSelf: 'flex-start' },
  clearTagsText: { fontSize: 15, fontWeight: '700', color: '#E11D48' },
  tagPanelScroll: { flex: 1 },
  tagGroup: { marginBottom: 18 },
  tagGroupTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tagChipOff: { backgroundColor: '#F9FAFB', borderColor: '#D1D5DB' },
  tagChipText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  noTagsMatchText: { fontSize: 15, color: '#9CA3AF', paddingVertical: 8 },

  // Overlay over the grid area; the panel is pinned to the right edge
  tagOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tagOverlayBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
});