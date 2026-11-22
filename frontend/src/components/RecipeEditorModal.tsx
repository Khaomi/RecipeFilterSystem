import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  API_BASE_URL,
  CatalogEquipment,
  CatalogIngredient,
  CatalogPreference,
  RecipeDetailResponse,
  RecipeSaveBody,
} from '../api/orderUpApi';

// The local category pictures a recipe can use.
const PICTURES = [
  { path: 'images/savory.png', label: 'Savory' },
  { path: 'images/dessert.png', label: 'Dessert' },
  { path: 'images/snack.png', label: 'Snack' },
  { path: 'images/vegan-salad.png', label: 'Vegan / salad' },
];

interface IngredientRow {
  ingredient_id: number;
  name: string;
  quantity_text: string;
  is_optional: boolean;
}

interface Props {
  initial: RecipeDetailResponse | null; // null = new recipe
  ingredientOptions: CatalogIngredient[];
  equipmentOptions: CatalogEquipment[];
  preferenceOptions: CatalogPreference[];
  message: string | null;
  saving: boolean;
  onClose: () => void;
  onSave: (body: RecipeSaveBody) => void;
}

// Empty -> null; otherwise a whole number above 0, or NaN when invalid.
const parseCount = (text: string) => {
  const t = text.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isInteger(n) && n > 0 ? n : NaN;
};

export const RecipeEditorModal: React.FC<Props> = ({
  initial,
  ingredientOptions,
  equipmentOptions,
  preferenceOptions,
  message,
  saving,
  onClose,
  onSave,
}) => {
  // Mounted fresh each time it opens, so these start from `initial`.
  const [name, setName] = useState(initial?.recipe_name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [cookTime, setCookTime] = useState(initial?.cook_time_min ? String(initial.cook_time_min) : '');
  const [serving, setServing] = useState(initial?.serving ? String(initial.serving) : '');
  const [picture, setPicture] = useState<string | null>(initial?.image_path ?? PICTURES[0].path);
  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    (initial?.ingredients ?? []).map((i) => ({
      ingredient_id: i.ingredient_id,
      name: i.ingredient_name,
      quantity_text: i.quantity_text ?? '',
      is_optional: i.is_optional,
    }))
  );
  const [equipmentIds, setEquipmentIds] = useState<number[]>(
    (initial?.equipment ?? []).map((e) => e.equipment_id)
  );
  const [preferenceIds, setPreferenceIds] = useState<number[]>(
    (initial?.preferences ?? []).map((p) => p.preference_id)
  );
  const [author, setAuthor] = useState(initial?.details?.author ?? '');
  const [directions, setDirections] = useState((initial?.details?.instructions ?? []).join('\n'));
  const [ingredientQuery, setIngredientQuery] = useState('');
  const [ingredientCategory, setIngredientCategory] = useState<string | null>(null); // null = All
  const [formError, setFormError] = useState<string | null>(null);

  // Browse by category or search; already-added ingredients are hidden.
  const categories = Array.from(new Set(ingredientOptions.map((o) => o.category_name))).sort();
  const q = ingredientQuery.trim().toLowerCase();
  const ingredientMatches = ingredientOptions.filter(
    (o) =>
      (ingredientCategory === null || o.category_name === ingredientCategory) &&
      o.ingredient_name.toLowerCase().includes(q) &&
      !ingredients.some((i) => i.ingredient_id === o.ingredient_id)
  );

  const toggle = (list: number[], id: number) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const updateRow = (id: number, change: Partial<IngredientRow>) =>
    setIngredients((rows) => rows.map((r) => (r.ingredient_id === id ? { ...r, ...change } : r)));

  const save = () => {
    const cook = parseCount(cookTime);
    const serves = parseCount(serving);
    if (!name.trim()) return setFormError('Give the recipe a name.');
    if (Number.isNaN(cook) || Number.isNaN(serves))
      return setFormError('Cook time and servings must be whole numbers above 0.');
    setFormError(null);
    onSave({
      recipe_name: name.trim(),
      description: description.trim(),
      cook_time_min: cook,
      serving: serves,
      image_path: picture,
      ingredients: ingredients.map((i) => ({
        ingredient_id: i.ingredient_id,
        quantity_text: i.quantity_text.trim(),
        is_optional: i.is_optional,
      })),
      equipment_ids: equipmentIds,
      preference_ids: preferenceIds,
      author: author.trim(),
      instructions: directions.split('\n'),
    });
  };

  const shownError = formError ?? message;

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.page}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.title}>{initial ? 'Edit recipe' : 'New recipe'}</Text>
              <View style={styles.iconButtonSpacer} />
            </View>

            {/* Basics */}
            <Text style={styles.label}>Name *</Text>
            <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="e.g. Egg Fried Rice" />

            <Text style={styles.label}>Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              style={[styles.input, styles.multiline]}
              multiline
              placeholder="One or two sentences"
            />

            <View style={styles.row}>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Cook time (min)</Text>
                <TextInput value={cookTime} onChangeText={setCookTime} style={styles.input} keyboardType="numeric" />
              </View>
              <View style={styles.rowItem}>
                <Text style={styles.label}>Servings</Text>
                <TextInput value={serving} onChangeText={setServing} style={styles.input} keyboardType="numeric" />
              </View>
            </View>

            {/* Picture */}
            <Text style={styles.label}>Picture</Text>
            <View style={styles.pictureRow}>
              {PICTURES.map((p) => (
                <TouchableOpacity
                  key={p.path}
                  onPress={() => setPicture(p.path)}
                  style={[styles.pictureTile, picture === p.path && styles.pictureTileOn]}
                >
                  <Image source={{ uri: `${API_BASE_URL}/${p.path}` }} style={styles.pictureImage} />
                  <Text style={styles.pictureLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ingredients */}
            <Text style={styles.label}>Ingredients</Text>
            {ingredients.map((row) => (
              <View key={row.ingredient_id} style={styles.ingRow}>
                <Text style={styles.ingName}>{row.name}</Text>
                <TextInput
                  value={row.quantity_text}
                  onChangeText={(t) => updateRow(row.ingredient_id, { quantity_text: t })}
                  placeholder="Amount"
                  style={[styles.input, styles.ingAmount]}
                />
                <TouchableOpacity
                  onPress={() => updateRow(row.ingredient_id, { is_optional: !row.is_optional })}
                  style={styles.optionalToggle}
                >
                  <Ionicons
                    name={row.is_optional ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={row.is_optional ? '#4A4466' : '#6B7280'}
                  />
                  <Text style={styles.optionalText}>Optional</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() =>
                    setIngredients((rows) => rows.filter((r) => r.ingredient_id !== row.ingredient_id))
                  }
                >
                  <Ionicons name="trash-outline" size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))}
            <TextInput
              value={ingredientQuery}
              onChangeText={setIngredientQuery}
              placeholder="Search or pick a category to add an ingredient..."
              style={styles.input}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {[null, ...categories].map((cat) => {
                const on = ingredientCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat ?? 'all'}
                    onPress={() => setIngredientCategory(cat)}
                    style={[styles.categoryChip, on && styles.chipOn]}
                  >
                    <Text style={[styles.categoryChipText, on && styles.chipTextOn]}>{cat ?? 'All'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <ScrollView style={styles.pickerBox} contentContainerStyle={styles.pickerWrap}>
              {ingredientMatches.length === 0 && <Text style={styles.emptyText}>Nothing left to add here.</Text>}
              {ingredientMatches.map((o) => (
                <TouchableOpacity
                  key={o.ingredient_id}
                  onPress={() => {
                    setIngredients((rows) => [
                      ...rows,
                      { ingredient_id: o.ingredient_id, name: o.ingredient_name, quantity_text: '', is_optional: false },
                    ]);
                    setIngredientQuery('');
                  }}
                  style={styles.chip}
                >
                  <Ionicons name="add" size={14} color="#111827" />
                  <Text style={styles.chipText}>{o.ingredient_name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Equipment */}
            <Text style={styles.label}>Equipment</Text>
            <View style={styles.chipWrap}>
              {equipmentOptions.map((e) => {
                const on = equipmentIds.includes(e.equipment_id);
                return (
                  <TouchableOpacity
                    key={e.equipment_id}
                    onPress={() => setEquipmentIds((ids) => toggle(ids, e.equipment_id))}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{e.equipment_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Preferences */}
            <Text style={styles.label}>Suitable for</Text>
            <View style={styles.chipWrap}>
              {preferenceOptions.map((p) => {
                const on = preferenceIds.includes(p.preference_id);
                return (
                  <TouchableOpacity
                    key={p.preference_id}
                    onPress={() => setPreferenceIds((ids) => toggle(ids, p.preference_id))}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{p.preference_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mongo recipe_details */}
            <Text style={styles.label}>Author</Text>
            <TextInput value={author} onChangeText={setAuthor} style={styles.input} placeholder="Your name" />

            <Text style={styles.label}>Directions (one step per line)</Text>
            <TextInput
              value={directions}
              onChangeText={setDirections}
              style={[styles.input, styles.directions]}
              multiline
              placeholder={'Beat the eggs.\nHeat the wok...'}
            />

            {shownError && <Text style={styles.errorText}>{shownError}</Text>}

            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={save}
                disabled={saving}
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              >
                <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save recipe'}</Text>
              </TouchableOpacity>
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
  page: { width: '100%', maxWidth: 800, alignSelf: 'center', paddingHorizontal: 24 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 8,
  },
  iconButton: { padding: 8, borderRadius: 999, backgroundColor: '#F3F4F6' },
  iconButtonSpacer: { width: 38 },
  title: { fontSize: 26, fontWeight: '800', color: '#111827' },

  label: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 18, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  directions: { minHeight: 160, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 16 },
  rowItem: { flex: 1 },

  pictureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pictureTile: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  pictureTileOn: { borderColor: '#4A4466', backgroundColor: '#F5F3FF' },
  pictureImage: { width: 72, height: 72 },
  pictureLabel: { fontSize: 13, color: '#374151', marginTop: 4 },

  ingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  ingName: { flex: 1, fontSize: 16, color: '#1F2937' },
  ingAmount: { width: 140 },
  optionalToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  optionalText: { fontSize: 14, color: '#4B5563' },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },

  // Ingredient picker: category chips + scrollable list
  categoryScroll: { marginTop: 10, flexGrow: 0 },
  categoryChip: {
    marginRight: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  categoryChipText: { fontSize: 14, fontWeight: '700', color: '#374151' },
  pickerBox: {
    maxHeight: 200,
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  pickerWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  chipOn: { backgroundColor: '#4A4466', borderColor: '#4A4466' },
  chipText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  chipTextOn: { color: '#FFFFFF' },

  errorText: { color: '#B91C1C', fontSize: 15, marginTop: 16 },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelButton: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 999, backgroundColor: '#F3F4F6' },
  cancelText: { fontSize: 16, fontWeight: '700', color: '#374151' },
  saveButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 999, backgroundColor: '#4A4466' },
  saveButtonDisabled: { opacity: 0.6 },
  saveText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
