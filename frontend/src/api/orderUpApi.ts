import { Platform } from 'react-native';

// Replace LAN_IP with your computer's local IPv4 address when testing on a physical phone
const LAN_IP = '192.168.1.50';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : `http://${LAN_IP}:8000`);

export interface CatalogIngredient {
  ingredient_id: number;
  ingredient_name: string;
  category_id: number;
  category_name: string;
  is_staple: boolean;
}

export interface CatalogCategory {
  category_id: number;
  category_name: string;
}

export interface CatalogEquipment {
  equipment_id: number;
  equipment_name: string;
}

export interface CatalogPreference {
  preference_id: number;
  preference_name: string;
}

export interface SearchRecipesPayload {
  name?: string;
  include_ingredients?: number[];
  exclude_ingredients?: number[];
  include_categories?: number[];
  exclude_categories?: number[];
  include_preferences?: number[];
  exclude_preferences?: number[];
  limit?: number;
  offset?: number;
}

export interface RecipeSearchItem {
  recipe_id: number;
  recipe_name: string;
  cook_time_min: number | null;
  serving: number | null;
  image_path: string | null;
  required_count: number;
  matched_count: number;
}

export interface RecipeDetailResponse {
  recipe_id: number;
  recipe_name: string;
  description: string | null;
  cook_time_min: number | null;
  serving: number | null;
  image_path: string | null;
  ingredients: {
    ingredient_id: number;
    ingredient_name: string;
    category_id: number;
    category_name: string;
    is_staple: boolean;
    quantity_text: string | null;
    is_optional: boolean;
  }[];
  equipment: {
    equipment_id: number;
    equipment_name: string;
  }[];
  preferences: {
    preference_id: number;
    preference_name: string;
  }[];
  details: {
    instructions?: string[];
    tip?: string;
    instructor?: string;
    [key: string]: unknown;
  } | null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export const orderUpApi = {
  getIngredients: (q = '', categoryId?: number) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (categoryId !== undefined) params.set('category_id', String(categoryId));
    const qs = params.toString();
    return requestJson<CatalogIngredient[]>(`/catalog/ingredients${qs ? `?${qs}` : ''}`);
  },

  getCategories: () => requestJson<CatalogCategory[]>('/catalog/categories'),

  getEquipment: (q = '') => {
    const qs = q ? `?q=${encodeURIComponent(q)}` : '';
    return requestJson<CatalogEquipment[]>(`/catalog/equipment${qs}`);
  },

  getPreferences: () => requestJson<CatalogPreference[]>('/catalog/preferences'),

  searchRecipes: (payload: SearchRecipesPayload) =>
    requestJson<RecipeSearchItem[]>('/recipes/search', {
      method: 'POST',
      body: JSON.stringify({
        name: payload.name ?? '',
        include_ingredients: payload.include_ingredients ?? [],
        exclude_ingredients: payload.exclude_ingredients ?? [],
        include_categories: payload.include_categories ?? [],
        exclude_categories: payload.exclude_categories ?? [],
        include_preferences: payload.include_preferences ?? [],
        exclude_preferences: payload.exclude_preferences ?? [],
        limit: payload.limit ?? 20,
        offset: payload.offset ?? 0,
      }),
    }),

  getRecipeDetail: (recipeId: number) =>
    requestJson<RecipeDetailResponse>(`/recipes/${recipeId}`),
};