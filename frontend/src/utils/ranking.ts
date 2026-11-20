// src/utils/ranking.ts
import { Recipe, DietaryPreference, PrefState, TriState } from '../type/recipe';

export interface FilterCriteria {
  searchQuery: string;
  userIngredients: string[];
  userEquipment: string[];
  userAllergies: string[];
  prefStates: Record<DietaryPreference, PrefState>;
  tagStates: Record<string, TriState>;
}

export function rankRecipes(recipes: Recipe[], criteria: FilterCriteria): Recipe[] {
  const q = criteria.searchQuery.trim().toLowerCase();

  const includedTags = Object.entries(criteria.tagStates)
    .filter(([, state]) => state === 'include')
    .map(([tag]) => tag.toLowerCase());

  const excludedTags = Object.entries(criteria.tagStates)
    .filter(([, state]) => state === 'exclude')
    .map(([tag]) => tag.toLowerCase());

  const greenPrefs = Object.entries(criteria.prefStates)
    .filter(([, state]) => state === 'green')
    .map(([pref]) => pref as DietaryPreference);

  const redPrefs = Object.entries(criteria.prefStates)
    .filter(([, state]) => state === 'red')
    .map(([pref]) => pref as DietaryPreference);

  const scored: { recipe: Recipe; score: number }[] = [];

  for (const recipe of recipes) {
    // 1. Primary search by recipe name (if typed)
    if (q && !recipe.title.toLowerCase().includes(q)) {
      continue;
    }

    // 2. Cut-off: Allergies
    const hasAllergy = recipe.allergens.some((a) =>
      criteria.userAllergies.some((ua) => ua.toLowerCase() === a.toLowerCase())
    );
    if (hasAllergy) continue;

    // 3. Cut-off: Missing Equipment
    const missingEquipment = recipe.equipment.some(
      (eq) => !criteria.userEquipment.some((ue) => ue.toLowerCase() === eq.toLowerCase())
    );
    if (missingEquipment) continue;

    // 4. Cut-off: Red preference (avoid)
    const hitsRedPref = redPrefs.some((p) => recipe.preferencesSupported.includes(p));
    if (hitsRedPref) continue;

    // 5. Cut-off: Excluded tag (Red)
    const recipeTagsLower = recipe.tags.map((t) => t.toLowerCase());
    const hitsExcludedTag = excludedTags.some((t) => recipeTagsLower.includes(t));
    if (hitsExcludedTag) continue;

    // 6. Proximity scoring
    let score = 0;

    // Ingredient proximity (big scope match on category or ingredient name)
    for (const reqIng of recipe.ingredients) {
      const matched = criteria.userIngredients.some((userIng) => {
        const u = userIng.toLowerCase();
        return (
          reqIng.name.toLowerCase().includes(u) ||
          reqIng.category.toLowerCase().includes(u) ||
          u.includes(reqIng.category.toLowerCase())
        );
      });
      if (matched) score += 10;
    }

    // Green tag matches
    for (const incTag of includedTags) {
      if (recipeTagsLower.includes(incTag)) score += 6;
    }

    // Green preference matches
    for (const gPref of greenPrefs) {
      if (recipe.preferencesSupported.includes(gPref)) score += 8;
    }

    scored.push({ recipe, score });
  }

  return scored.sort((a, b) => b.score - a.score).map((item) => item.recipe);
}