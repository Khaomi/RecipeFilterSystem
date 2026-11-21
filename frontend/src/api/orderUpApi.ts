// Set by compose (EXPO_PUBLIC_API_URL); falls back to the local backend.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

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
  log?: boolean;
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
    author?: string;
    updated_at?: string;
    instructions?: string[];
  } | null;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) {
    // Message is the API errorCode (e.g. "20"), for callers to pick their own wording.
    // The API's `error` text is documentation only and is never shown.
    throw new Error(String(data?.errorCode ?? res.status));
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
        log: payload.log ?? false,
      }),
    }),

  getRecipeDetail: (recipeId: number) =>
    requestJson<RecipeDetailResponse>(`/recipes/${recipeId}`),
};