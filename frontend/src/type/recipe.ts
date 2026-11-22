// src/types/recipe.ts
export type TriState = 'neutral' | 'include' | 'exclude'; // 0: cancel/neutral, 1: green, 2: red
export type PrefState = 'off' | 'green' | 'red'; // 1 click -> green, 2 click -> red

export type DietaryPreference =
  | 'Lactose intolerance'
  | 'Gluten intolerance'
  | 'Vegetarianism'
  | 'Veganism'
  | 'Kosher'
  | 'Keto'
  | 'Diabetes'
  | 'Dairy-free'
  | 'Low carb';

export interface IngredientItem {
  id: string;
  name: string;
  category: string; // Big scope e.g. "Dairy", "Produce", "Pantry"
  amount?: string;
}

export interface RecipeIngredient {
  name: string;
  category: string;
  amount: string;
  tag: string;
  optional?: boolean;
  owned?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  totalTimeMinutes: number;
  serving?: number | null;
  tags: string[];
  ingredients: RecipeIngredient[];
  equipment: string[];
  preferencesSupported: DietaryPreference[];
  allergens: string[];
  instructions: string[];
  tip?: string;
  // From Mongo recipe_details
  author?: string;
  updatedAt?: string;
  // From search results only: how the recipe fits the user's inventory.
  missingCount?: number;
  allergenOptional?: boolean;
}

export interface HistoryEntry {
  id: string;
  query: string;
  timestamp: string;
}