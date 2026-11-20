// src/data/mockRecipes.ts
import { Recipe, DietaryPreference } from '../type/recipe';

export const PREFERENCES_LIST: DietaryPreference[] = [
  'Lactose intolerance',
  'Gluten intolerance',
  'Vegetarianism',
  'Veganism',
  'Kosher',
  'Keto',
  'Diabetes',
  'Dairy-free',
  'Low carb',
];

export const INITIAL_INGREDIENTS: string[] = ['Milk', 'Eggs', 'Garlic', 'Olive Oil', 'Oats'];
export const INITIAL_EQUIPMENT: string[] = ['Skillet', 'Bowl', 'Whisk'];
export const INITIAL_ALLERGIES: string[] = ['Peanuts', 'Shellfish'];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'r1',
    title: 'Creamy Garlic Herb Scramble',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800',
    totalTimeMinutes: 12,
    tags: ['breakfast', 'eggs', 'dairy', 'quick', 'savory'],
    ingredients: [
      { name: 'Large Eggs', category: 'Eggs', amount: '3 pcs', tag: 'eggs' },
      { name: 'Whole Milk', category: 'Milk', amount: '2 tbsp', tag: 'dairy' },
      { name: 'Garlic Cloves', category: 'Produce', amount: '2 cloves', tag: 'savory' },
      { name: 'Olive Oil', category: 'Pantry', amount: '1 tsp', tag: 'quick' },
    ],
    equipment: ['Skillet', 'Bowl', 'Whisk'],
    preferencesSupported: ['Vegetarianism', 'Gluten intolerance', 'Keto', 'Low carb'],
    allergens: ['Eggs', 'Dairy'],
    instructions: [
      'Whisk eggs and milk in a bowl until smooth and lightly aerated.',
      'Warm olive oil and minced garlic in a skillet over medium-low heat for 30 seconds.',
      'Pour in eggs and fold gently with a spatula until soft curds form. Serve warm.',
    ],
    tip: 'Pull the skillet off the heat slightly before the eggs look completely done—residual heat finishes them.',
  },
  {
    id: 'r2',
    title: 'Crispy Oat & Banana Pancakes',
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800',
    totalTimeMinutes: 20,
    tags: ['breakfast', 'oats', 'sweet', 'vegetarian'],
    ingredients: [
      { name: 'Rolled Oats', category: 'Grains', amount: '1 cup', tag: 'oats' },
      { name: 'Ripe Banana', category: 'Produce', amount: '1 medium', tag: 'sweet' },
      { name: 'Eggs', category: 'Eggs', amount: '1 pc', tag: 'vegetarian' },
      { name: 'Milk', category: 'Milk', amount: '1/4 cup', tag: 'oats' },
    ],
    equipment: ['Skillet', 'Bowl'],
    preferencesSupported: ['Vegetarianism', 'Diabetes'],
    allergens: ['Eggs', 'Dairy'],
    instructions: [
      'Mash the banana in a bowl, then stir in oats, egg, and milk until combined.',
      'Heat a lightly oiled skillet over medium heat.',
      'Spoon batter into rounds and cook 2–3 minutes per side until golden.',
    ],
    tip: 'Let the batter rest for 3 minutes so the oats soften for a tender center.',
  },
  {
    id: 'r3',
    title: 'Mediterranean Garlic Greens',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    totalTimeMinutes: 15,
    tags: ['vegan', 'quick', 'savory', 'greens'],
    ingredients: [
      { name: 'Baby Spinach', category: 'Produce', amount: '4 cups', tag: 'greens' },
      { name: 'Garlic', category: 'Produce', amount: '3 cloves', tag: 'savory' },
      { name: 'Olive Oil', category: 'Pantry', amount: '1.5 tbsp', tag: 'quick' },
    ],
    equipment: ['Skillet'],
    preferencesSupported: [
      'Veganism',
      'Vegetarianism',
      'Lactose intolerance',
      'Gluten intolerance',
      'Dairy-free',
      'Keto',
      'Low carb',
      'Kosher',
      'Diabetes',
    ],
    allergens: [],
    instructions: [
      'Heat olive oil in a skillet over medium heat and sauté sliced garlic until fragrant.',
      'Add spinach in handfuls, tossing until just wilted.',
      'Season with salt and pepper and serve immediately.',
    ],
  },
  {
    id: 'r4',
    title: 'Baked Honey Almond Granola',
    image: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=800',
    totalTimeMinutes: 35,
    tags: ['oats', 'sweet', 'meal-prep', 'vegan'],
    ingredients: [
      { name: 'Rolled Oats', category: 'Grains', amount: '2 cups', tag: 'oats' },
      { name: 'Sliced Almonds', category: 'Nuts', amount: '1/2 cup', tag: 'sweet' },
      { name: 'Olive Oil', category: 'Pantry', amount: '2 tbsp', tag: 'meal-prep' },
    ],
    equipment: ['Oven', 'Bowl'],
    preferencesSupported: ['Veganism', 'Vegetarianism', 'Dairy-free', 'Lactose intolerance', 'Kosher'],
    allergens: ['Tree Nuts'],
    instructions: [
      'Toss oats, almonds, and oil in a bowl.',
      'Spread evenly and bake at 165°C (325°F) for 20–25 minutes, stirring halfway.',
      'Cool completely so clusters turn crisp.',
    ],
  },
];