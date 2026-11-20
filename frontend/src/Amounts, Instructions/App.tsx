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
import { RecipeDetailModal } from '../components/RecipeDetailModal';

const ALL_TAGS = ['breakfast', 'oats', 'vegan', 'quick', 'savory', 'sweet', 'vegetarian', 'greens'];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [inventoryMode, setInventoryMode] = useState<'ingredients' | 'equipments' | null>(null);
  const [bookmarkOnlyView, setBookmarkOnlyView] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
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

  // Load persisted local state
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

  // Inventory CRUD handlers
  const updateIngredientsList = async (next: string[]) => {
    setUserIngredients(next);
    await AsyncStorage.setItem('@orderup_ingredients', JSON.stringify(next));
  };

  const updateEquipmentList = async (next: string[]) => {
    setUserEquipment(next);
    await AsyncStorage.setItem('@orderup_equipment', JSON.stringify(next));
  };

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
    if (state === 'green') return 'bg-emerald-600 border-emerald-600 text-white';
    if (state === 'red') return 'bg-rose-600 border-rose-600 text-white';
    return 'bg-white border-gray-200 text-gray-700';
  };

  const getTagStyle = (state: TriState) => {
    if (state === 'include') return 'bg-emerald-600 border-emerald-600 text-white';
    if (state === 'exclude') return 'bg-rose-600 border-rose-600 text-white';
    return 'bg-gray-100 border-gray-200 text-gray-700';
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header + Searchbar */}
      <View className="bg-white px-4 pt-3 pb-2 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2.5">
            <TouchableOpacity onPress={() => setSidebarOpen(true)} className="p-1">
              <Ionicons name="menu" size={24} color="#111827" />
            </TouchableOpacity>
            <Text className="text-xl font-extrabold text-gray-900">Order up!</Text>
          </View>

          {bookmarkOnlyView && (
            <TouchableOpacity
              onPress={() => setBookmarkOnlyView(false)}
              className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200"
            >
              <Text className="text-xs font-bold text-rose-600">Bookmarks Only ✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Primary Search Box */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-3 py-2">
          <Ionicons name="search" size={18} color="#6B7280" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => commitSearchHistory(searchQuery)}
            placeholder="Search recipe by name..."
            className="flex-1 ml-2 text-sm text-gray-900"
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Preferences: 1 click -> green | 2 click -> red */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
          {PREFERENCES_LIST.map((pref) => {
            const st = prefStates[pref];
            return (
              <TouchableOpacity
                key={pref}
                onPress={() => cyclePref(pref)}
                className={`mr-2 px-3 py-1 rounded-full border ${getPrefStyle(st)}`}
              >
                <Text className={`text-xs font-semibold ${st !== 'off' ? 'text-white' : 'text-gray-700'}`}>
                  {pref} {st === 'green' ? '✓' : st === 'red' ? '✕' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Include / Exclude Tags: 1 click -> green | 2 click -> red | 3 click -> cancel */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 pb-1">
          {ALL_TAGS.map((tag) => {
            const st = tagStates[tag] || 'neutral';
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => cycleTag(tag)}
                className={`mr-2 px-2.5 py-1 rounded-md border ${getTagStyle(st)}`}
              >
                <Text className={`text-xs font-medium capitalize ${st !== 'neutral' ? 'text-white' : 'text-gray-700'}`}>
                  #{tag} {st === 'include' ? '+' : st === 'exclude' ? '−' : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
            <TouchableOpacity
              onPress={() => openRecipe(item)}
              className="flex-1 m-1.5 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm"
            >
              <Image source={{ uri: item.image }} className="w-full h-36 bg-gray-200" />
              <View className="p-2.5">
                <Text numberOfLines={2} className="text-sm font-bold text-gray-900">
                  {item.title}
                </Text>

                {/* Heart = Bookmark / Time = Total time for recipe */}
                <View className="flex-row items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleBookmark(item.id);
                    }}
                    className="flex-row items-center gap-1"
                  >
                    <Ionicons
                      name={isSaved ? 'heart' : 'heart-outline'}
                      size={17}
                      color={isSaved ? '#EF4444' : '#4B5563'}
                    />
                  </TouchableOpacity>

                  <View className="flex-row items-center gap-1">
                    <Ionicons name="time-outline" size={14} color="#6B7280" />
                    <Text className="text-xs font-semibold text-gray-600">
                      {item.totalTimeMinutes}m
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center text-gray-400 mt-12">
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