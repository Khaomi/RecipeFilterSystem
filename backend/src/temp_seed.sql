-- TEMPORARY demo data converted from the frontend mock recipes (mockRecipes.ts).
-- Delete this file (and its line in compose.yml) when the real seed is added.
-- Runs after recipe_schema_ver_02.sql on a fresh database.

-- The single local user that every user_* row belongs to (USER_ID = 1 in backend/src/lib/db.py).
insert into users (user_id, username, email) values (1, 'local', 'local@localhost');

insert into ingredient_categories (category_id, category_name) values
  (1, 'Dairy'), (2, 'Eggs'), (3, 'Produce'), (4, 'Pantry'), (5, 'Grains'), (6, 'Nuts'), (7, 'Seafood');

insert into ingredients (ingredient_id, ingredient_name, category_id, is_staple) values
  (1, 'Milk', 1, false),
  (2, 'Eggs', 2, false),
  (3, 'Garlic', 3, false),
  (4, 'Olive Oil', 4, false),
  (5, 'Rolled Oats', 5, false),
  (6, 'Banana', 3, false),
  (7, 'Baby Spinach', 3, false),
  (8, 'Sliced Almonds', 6, false),
  (9, 'Salt', 4, true),
  (10, 'Black Pepper', 4, true),
  (11, 'Peanuts', 6, false),
  (12, 'Shellfish', 7, false);

insert into equipment (equipment_id, equipment_name) values
  (1, 'Skillet'), (2, 'Bowl'), (3, 'Whisk'), (4, 'Oven');

insert into preferences (preference_id, preference_name) values
  (1, 'Lactose intolerance'), (2, 'Gluten intolerance'), (3, 'Vegetarianism'), (4, 'Veganism'),
  (5, 'Kosher'), (6, 'Keto'), (7, 'Diabetes'), (8, 'Dairy-free'), (9, 'Low carb');

insert into recipes (recipe_id, recipe_name, cook_time_min, serving) values
  (1, 'Creamy Garlic Herb Scramble', 12, 1),
  (2, 'Crispy Oat & Banana Pancakes', 20, 2),
  (3, 'Mediterranean Garlic Greens', 15, 2),
  (4, 'Baked Honey Almond Granola', 35, 4);

insert into recipe_ingredients (recipe_id, ingredient_id, quantity_text, is_optional) values
  (1, 2, '3 pcs', false), (1, 1, '2 tbsp', false), (1, 3, '2 cloves', false), (1, 4, '1 tsp', false),
  (2, 5, '1 cup', false), (2, 6, '1 medium', false), (2, 2, '1 pc', false), (2, 1, '1/4 cup', false),
  (3, 7, '4 cups', false), (3, 3, '3 cloves', false), (3, 4, '1.5 tbsp', false),
  (3, 9, 'to taste', false), (3, 10, 'to taste', false),
  (4, 5, '2 cups', false), (4, 8, '1/2 cup', false), (4, 4, '2 tbsp', false);

insert into recipe_equipment (recipe_id, equipment_id) values
  (1, 1), (1, 2), (1, 3),
  (2, 1), (2, 2),
  (3, 1),
  (4, 4), (4, 2);

insert into recipe_preferences (recipe_id, preference_id) values
  (1, 3), (1, 2), (1, 6), (1, 9),
  (2, 3), (2, 7),
  (3, 4), (3, 3), (3, 1), (3, 2), (3, 8), (3, 6), (3, 9), (3, 5), (3, 7),
  (4, 4), (4, 3), (4, 8), (4, 1), (4, 5);

-- Starting inventory/allergies from the mock (INITIAL_INGREDIENTS, INITIAL_EQUIPMENT, INITIAL_ALLERGIES).
insert into user_ingredients (user_id, ingredient_id) values (1, 1), (1, 2), (1, 3), (1, 4), (1, 5);
insert into user_equipment (user_id, equipment_id) values (1, 1), (1, 2), (1, 3);
insert into user_allergies (user_id, ingredient_id) values (1, 11), (1, 12);

-- Explicit ids above don't advance the identity counters; move them past the seeded rows
-- so later inserts without an id don't collide.
select setval(pg_get_serial_sequence('users', 'user_id'), (select max(user_id) from users));
select setval(pg_get_serial_sequence('ingredient_categories', 'category_id'), (select max(category_id) from ingredient_categories));
select setval(pg_get_serial_sequence('ingredients', 'ingredient_id'), (select max(ingredient_id) from ingredients));
select setval(pg_get_serial_sequence('equipment', 'equipment_id'), (select max(equipment_id) from equipment));
select setval(pg_get_serial_sequence('preferences', 'preference_id'), (select max(preference_id) from preferences));
select setval(pg_get_serial_sequence('recipes', 'recipe_id'), (select max(recipe_id) from recipes));
