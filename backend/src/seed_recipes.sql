INSERT INTO recipes (recipe_name, description, cook_time_min, serving, image_path) VALUES
  ('Thai Omelette',                 'Fluffy, crispy-edged omelette deep-fried in hot oil.',              10, 1, 'images/savory.png'),
  ('Pad Kra Pao Moo Saap',          'Spicy stir-fried minced pork with holy basil over rice.',           15, 1, 'images/savory.png'),
  ('Tom Yum Goong',                 'Hot and sour shrimp soup with lemongrass and lime.',                25, 2, 'images/savory.png'),
  ('Green Curry Chicken',           'Creamy green curry with chicken, Thai eggplant and basil.',         30, 3, 'images/savory.png'),
  ('Pad Thai with Shrimp',          'Stir-fried rice noodles with shrimp, tofu, egg and peanuts.',       25, 2, 'images/savory.png'),
  ('Pork Fried Rice',               'Simple fried rice with pork, egg and onion.',                       15, 2, 'images/savory.png'),
  ('Som Tum',                       'Green papaya salad pounded with chili, lime and peanuts.',          15, 2, 'images/savory.png'),
  ('Larb Gai',                      'Minced chicken salad with herbs, lime and toasted rice.',           20, 2, 'images/savory.png'),
  ('Stir-fried Morning Glory',      'Quick garlicky stir-fried morning glory with soybean paste.',       10, 2, 'images/vegan-salad.png'),
  ('Massaman Beef Curry',           'Mild, rich curry with slow-cooked beef, potato and peanuts.',       90, 4, 'images/savory.png'),
  ('Oven-baked Chicken Satay',      'Turmeric-marinated chicken skewers baked in the oven.',             40, 3, 'images/savory.png'),
  ('Baked Lemon Butter Salmon',     'Salmon fillets baked with lemon, garlic and butter.',               20, 2, 'images/savory.png'),
  ('Roast Chicken with Vegetables', 'Chicken thighs roasted with potato, carrot and rosemary.',          60, 4, 'images/savory.png'),
  ('Spaghetti Carbonara',           'Pasta with bacon, egg and parmesan, no cream.',                     20, 2, 'images/savory.png'),
  ('Baked Mac and Cheese',          'Macaroni in cheddar sauce, baked until golden.',                    45, 4, 'images/savory.png'),
  ('Vegetable Lasagna',             'Layers of pasta, tomato sauce, spinach, zucchini and mozzarella.',  75, 6, 'images/savory.png'),
  ('Garlic Butter Shrimp',          'Shrimp sauteed in garlic butter with a squeeze of lemon.',          15, 2, 'images/savory.png'),
  ('Pan-seared Steak',              'Beef steak seared in a hot pan and basted with garlic butter.',     20, 1, 'images/savory.png'),
  ('Microwave Steamed Egg',         'Silky steamed egg made in the microwave in minutes.',                5, 1, 'images/savory.png'),
  ('Tofu and Vegetable Stir-fry',   'Firm tofu stir-fried with broccoli, carrot and bell pepper.',       20, 2, 'images/vegan-salad.png'),
  ('Chickpea Curry',                'Spiced chickpea and tomato curry.',                                 30, 3, 'images/vegan-salad.png'),
  ('Microwave Cheesy Baked Potato', 'Potato cooked in the microwave and topped with cheddar.',           10, 1, 'images/savory.png');

INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_text, is_optional)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT ingredient_id FROM ingredients WHERE ingredient_name = v.ingredient),
       v.qty, v.opt
FROM (VALUES

  ('Thai Omelette', 'Egg',         '3 eggs',   FALSE),
  ('Thai Omelette', 'Fish sauce',  '1 tsp',    FALSE),
  ('Thai Omelette', 'Cooking oil', '1/2 cup',  FALSE),
  ('Thai Omelette', 'Green onion', '1 stalk',  TRUE),

  ('Pad Kra Pao Moo Saap', 'Minced pork',         '150 g',     FALSE),
  ('Pad Kra Pao Moo Saap', 'Holy basil',          '1 cup',     FALSE),
  ('Pad Kra Pao Moo Saap', 'Chili',               '3-5',       FALSE),
  ('Pad Kra Pao Moo Saap', 'Garlic',              '4 cloves',  FALSE),
  ('Pad Kra Pao Moo Saap', 'Oyster sauce',        '1 tbsp',    FALSE),
  ('Pad Kra Pao Moo Saap', 'Soy sauce',           '1 tsp',     FALSE),
  ('Pad Kra Pao Moo Saap', 'Fish sauce',          '1 tsp',     FALSE),
  ('Pad Kra Pao Moo Saap', 'Sugar',               '1 tsp',     FALSE),
  ('Pad Kra Pao Moo Saap', 'Cooking oil',         '1 tbsp',    FALSE),
  ('Pad Kra Pao Moo Saap', 'Cooked jasmine rice', '1 plate',   FALSE),
  ('Pad Kra Pao Moo Saap', 'Egg',                 '1 egg',     TRUE),

  ('Tom Yum Goong', 'Shrimp',             '300 g',     FALSE),
  ('Tom Yum Goong', 'Lemongrass',         '2 stalks',  FALSE),
  ('Tom Yum Goong', 'Galangal',           '5 slices',  FALSE),
  ('Tom Yum Goong', 'Kaffir lime leaves', '5 leaves',  FALSE),
  ('Tom Yum Goong', 'Mushroom',           '150 g',     FALSE),
  ('Tom Yum Goong', 'Chili',              '5',         FALSE),
  ('Tom Yum Goong', 'Lime',               '2',         FALSE),
  ('Tom Yum Goong', 'Fish sauce',         '3 tbsp',    FALSE),
  ('Tom Yum Goong', 'Thai chili paste',   '1 tbsp',    TRUE),
  ('Tom Yum Goong', 'Cilantro',           '1 sprig',   TRUE),

  ('Green Curry Chicken', 'Chicken thigh',       '300 g',     FALSE),
  ('Green Curry Chicken', 'Green curry paste',   '3 tbsp',    FALSE),
  ('Green Curry Chicken', 'Coconut milk',        '400 ml',    FALSE),
  ('Green Curry Chicken', 'Thai eggplant',       '4',         FALSE),
  ('Green Curry Chicken', 'Thai basil',          '1 cup',     FALSE),
  ('Green Curry Chicken', 'Kaffir lime leaves',  '4 leaves',  FALSE),
  ('Green Curry Chicken', 'Fish sauce',          '2 tbsp',    FALSE),
  ('Green Curry Chicken', 'Sugar',               '1 tbsp',    FALSE),
  ('Green Curry Chicken', 'Chili',               '2',         TRUE),
  ('Green Curry Chicken', 'Cooked jasmine rice', '2 plates',  TRUE),

  ('Pad Thai with Shrimp', 'Rice noodles',   '200 g',    FALSE),
  ('Pad Thai with Shrimp', 'Shrimp',         '200 g',    FALSE),
  ('Pad Thai with Shrimp', 'Egg',            '2 eggs',   FALSE),
  ('Pad Thai with Shrimp', 'Firm tofu',      '100 g',    FALSE),
  ('Pad Thai with Shrimp', 'Bean sprouts',   '1 cup',    FALSE),
  ('Pad Thai with Shrimp', 'Garlic chives',  '1 cup',    FALSE),
  ('Pad Thai with Shrimp', 'Peanuts',        '3 tbsp',   FALSE),
  ('Pad Thai with Shrimp', 'Shallot',        '2',        FALSE),
  ('Pad Thai with Shrimp', 'Tamarind paste', '3 tbsp',   FALSE),
  ('Pad Thai with Shrimp', 'Fish sauce',     '2 tbsp',   FALSE),
  ('Pad Thai with Shrimp', 'Sugar',          '2 tbsp',   FALSE),
  ('Pad Thai with Shrimp', 'Cooking oil',    '3 tbsp',   FALSE),
  ('Pad Thai with Shrimp', 'Lime',           '1',        TRUE),

  ('Pork Fried Rice', 'Cooked jasmine rice', '2 cups',    FALSE),
  ('Pork Fried Rice', 'Sliced pork',         '150 g',     FALSE),
  ('Pork Fried Rice', 'Egg',                 '2 eggs',    FALSE),
  ('Pork Fried Rice', 'Onion',               '1/2',       FALSE),
  ('Pork Fried Rice', 'Garlic',              '3 cloves',  FALSE),
  ('Pork Fried Rice', 'Green onion',         '2 stalks',  FALSE),
  ('Pork Fried Rice', 'Soy sauce',           '1 tbsp',    FALSE),
  ('Pork Fried Rice', 'Fish sauce',          '1 tsp',     FALSE),
  ('Pork Fried Rice', 'Sugar',               '1 tsp',     FALSE),
  ('Pork Fried Rice', 'Cooking oil',         '2 tbsp',    FALSE),
  ('Pork Fried Rice', 'Tomato',              '1',         TRUE),
  ('Pork Fried Rice', 'Cucumber',            '1/2',       TRUE),

  ('Som Tum', 'Green papaya', '2 cups, shredded', FALSE),
  ('Som Tum', 'Garlic',       '2 cloves',         FALSE),
  ('Som Tum', 'Chili',        '2-4',              FALSE),
  ('Som Tum', 'Tomato',       '1',                FALSE),
  ('Som Tum', 'Long bean',    '3 pieces',         FALSE),
  ('Som Tum', 'Lime',         '1',                FALSE),
  ('Som Tum', 'Peanuts',      '2 tbsp',           FALSE),
  ('Som Tum', 'Fish sauce',   '1 1/2 tbsp',       FALSE),
  ('Som Tum', 'Sugar',        '1 tbsp',           FALSE),
  ('Som Tum', 'Dried shrimp', '1 tbsp',           TRUE),

  ('Larb Gai', 'Minced chicken',      '300 g',     FALSE),
  ('Larb Gai', 'Shallot',             '3',         FALSE),
  ('Larb Gai', 'Green onion',         '2 stalks',  FALSE),
  ('Larb Gai', 'Mint',                '1/2 cup',   FALSE),
  ('Larb Gai', 'Cilantro',            '2 sprigs',  FALSE),
  ('Larb Gai', 'Lime',                '2',         FALSE),
  ('Larb Gai', 'Chili flakes',        '1 tsp',     FALSE),
  ('Larb Gai', 'Toasted rice powder', '2 tbsp',    FALSE),
  ('Larb Gai', 'Fish sauce',          '2 tbsp',    FALSE),

  ('Stir-fried Morning Glory', 'Morning glory', '1 bunch',   FALSE),
  ('Stir-fried Morning Glory', 'Garlic',        '4 cloves',  FALSE),
  ('Stir-fried Morning Glory', 'Chili',         '3',         FALSE),
  ('Stir-fried Morning Glory', 'Soybean paste', '1 tbsp',    FALSE),
  ('Stir-fried Morning Glory', 'Soy sauce',     '1 tbsp',    FALSE),
  ('Stir-fried Morning Glory', 'Sugar',         '1 tsp',     FALSE),
  ('Stir-fried Morning Glory', 'Cooking oil',   '2 tbsp',    FALSE),

  ('Massaman Beef Curry', 'Stewing beef',         '400 g',    FALSE),
  ('Massaman Beef Curry', 'Potato',               '2',        FALSE),
  ('Massaman Beef Curry', 'Onion',                '1',        FALSE),
  ('Massaman Beef Curry', 'Peanuts',              '1/4 cup',  FALSE),
  ('Massaman Beef Curry', 'Massaman curry paste', '3 tbsp',   FALSE),
  ('Massaman Beef Curry', 'Coconut milk',         '400 ml',   FALSE),
  ('Massaman Beef Curry', 'Tamarind paste',       '2 tbsp',   FALSE),
  ('Massaman Beef Curry', 'Fish sauce',           '2 tbsp',   FALSE),
  ('Massaman Beef Curry', 'Sugar',                '2 tbsp',   FALSE),

  ('Oven-baked Chicken Satay', 'Chicken breast', '400 g',     FALSE),
  ('Oven-baked Chicken Satay', 'Coconut milk',   '200 ml',    FALSE),
  ('Oven-baked Chicken Satay', 'Curry powder',   '1 tbsp',    FALSE),
  ('Oven-baked Chicken Satay', 'Turmeric',       '1 tsp',     FALSE),
  ('Oven-baked Chicken Satay', 'Garlic',         '2 cloves',  FALSE),
  ('Oven-baked Chicken Satay', 'Peanuts',        '1/2 cup',   FALSE),
  ('Oven-baked Chicken Satay', 'Fish sauce',     '1 tbsp',    FALSE),
  ('Oven-baked Chicken Satay', 'Sugar',          '1 tbsp',    FALSE),
  ('Oven-baked Chicken Satay', 'Cucumber',       '1',         TRUE),

  ('Baked Lemon Butter Salmon', 'Salmon fillet', '2 fillets', FALSE),
  ('Baked Lemon Butter Salmon', 'Butter',        '2 tbsp',    FALSE),
  ('Baked Lemon Butter Salmon', 'Lemon',         '1',         FALSE),
  ('Baked Lemon Butter Salmon', 'Garlic',        '3 cloves',  FALSE),
  ('Baked Lemon Butter Salmon', 'Salt',          '1/2 tsp',   FALSE),
  ('Baked Lemon Butter Salmon', 'Black pepper',  '1/4 tsp',   FALSE),
  ('Baked Lemon Butter Salmon', 'Dill',          '1 tbsp',    TRUE),

  ('Roast Chicken with Vegetables', 'Chicken thigh', '4 pieces',  FALSE),
  ('Roast Chicken with Vegetables', 'Potato',        '3',         FALSE),
  ('Roast Chicken with Vegetables', 'Carrot',        '2',         FALSE),
  ('Roast Chicken with Vegetables', 'Onion',         '1',         FALSE),
  ('Roast Chicken with Vegetables', 'Garlic',        '6 cloves',  FALSE),
  ('Roast Chicken with Vegetables', 'Rosemary',      '2 sprigs',  FALSE),
  ('Roast Chicken with Vegetables', 'Olive oil',     '3 tbsp',    FALSE),
  ('Roast Chicken with Vegetables', 'Salt',          '1 tsp',     FALSE),
  ('Roast Chicken with Vegetables', 'Black pepper',  '1/2 tsp',   FALSE),

  ('Spaghetti Carbonara', 'Spaghetti',       '200 g',   FALSE),
  ('Spaghetti Carbonara', 'Bacon',           '100 g',   FALSE),
  ('Spaghetti Carbonara', 'Egg',             '2 eggs',  FALSE),
  ('Spaghetti Carbonara', 'Parmesan cheese', '50 g',    FALSE),
  ('Spaghetti Carbonara', 'Black pepper',    '1 tsp',   FALSE),
  ('Spaghetti Carbonara', 'Salt',            '1 tsp',   FALSE),

  ('Baked Mac and Cheese', 'Macaroni',          '250 g',   FALSE),
  ('Baked Mac and Cheese', 'Cheddar cheese',    '200 g',   FALSE),
  ('Baked Mac and Cheese', 'Milk',              '2 cups',  FALSE),
  ('Baked Mac and Cheese', 'Butter',            '3 tbsp',  FALSE),
  ('Baked Mac and Cheese', 'All-purpose flour', '3 tbsp',  FALSE),
  ('Baked Mac and Cheese', 'Salt',              '1 tsp',   FALSE),
  ('Baked Mac and Cheese', 'Black pepper',      '1/2 tsp', FALSE),

  ('Vegetable Lasagna', 'Lasagna sheets',    '9 sheets',  FALSE),
  ('Vegetable Lasagna', 'Tomato sauce',      '700 g',     FALSE),
  ('Vegetable Lasagna', 'Mozzarella cheese', '250 g',     FALSE),
  ('Vegetable Lasagna', 'Spinach',           '2 cups',    FALSE),
  ('Vegetable Lasagna', 'Zucchini',          '1',         FALSE),
  ('Vegetable Lasagna', 'Onion',             '1',         FALSE),
  ('Vegetable Lasagna', 'Garlic',            '3 cloves',  FALSE),
  ('Vegetable Lasagna', 'Olive oil',         '2 tbsp',    FALSE),
  ('Vegetable Lasagna', 'Parmesan cheese',   '30 g',      TRUE),

  ('Garlic Butter Shrimp', 'Shrimp',       '300 g',     FALSE),
  ('Garlic Butter Shrimp', 'Butter',       '3 tbsp',    FALSE),
  ('Garlic Butter Shrimp', 'Garlic',       '6 cloves',  FALSE),
  ('Garlic Butter Shrimp', 'Lemon',        '1/2',       FALSE),
  ('Garlic Butter Shrimp', 'Salt',         '1/2 tsp',   FALSE),
  ('Garlic Butter Shrimp', 'Parsley',      '1 tbsp',    TRUE),
  ('Garlic Butter Shrimp', 'Chili flakes', '1/2 tsp',   TRUE),

  ('Pan-seared Steak', 'Beef steak',   '1 steak (250 g)', FALSE),
  ('Pan-seared Steak', 'Butter',       '2 tbsp',          FALSE),
  ('Pan-seared Steak', 'Garlic',       '3 cloves',        FALSE),
  ('Pan-seared Steak', 'Cooking oil',  '1 tbsp',          FALSE),
  ('Pan-seared Steak', 'Salt',         '1 tsp',           FALSE),
  ('Pan-seared Steak', 'Black pepper', '1/2 tsp',         FALSE),
  ('Pan-seared Steak', 'Rosemary',     '1 sprig',         TRUE),

  ('Microwave Steamed Egg', 'Egg',         '2 eggs',   FALSE),
  ('Microwave Steamed Egg', 'Fish sauce',  '1/2 tsp',  FALSE),
  ('Microwave Steamed Egg', 'Green onion', '1 stalk',  TRUE),

  ('Tofu and Vegetable Stir-fry', 'Firm tofu',   '300 g',     FALSE),
  ('Tofu and Vegetable Stir-fry', 'Broccoli',    '1 cup',     FALSE),
  ('Tofu and Vegetable Stir-fry', 'Carrot',      '1',         FALSE),
  ('Tofu and Vegetable Stir-fry', 'Bell pepper', '1',         FALSE),
  ('Tofu and Vegetable Stir-fry', 'Garlic',      '3 cloves',  FALSE),
  ('Tofu and Vegetable Stir-fry', 'Soy sauce',   '2 tbsp',    FALSE),
  ('Tofu and Vegetable Stir-fry', 'Sesame oil',  '1 tsp',     FALSE),
  ('Tofu and Vegetable Stir-fry', 'Cooking oil', '2 tbsp',    FALSE),

  ('Chickpea Curry', 'Chickpeas',    '1 can (400 g)', FALSE),
  ('Chickpea Curry', 'Onion',        '1',             FALSE),
  ('Chickpea Curry', 'Tomato',       '2',             FALSE),
  ('Chickpea Curry', 'Garlic',       '3 cloves',      FALSE),
  ('Chickpea Curry', 'Ginger',       '1 thumb',       FALSE),
  ('Chickpea Curry', 'Curry powder', '2 tbsp',        FALSE),
  ('Chickpea Curry', 'Cumin',        '1 tsp',         FALSE),
  ('Chickpea Curry', 'Cooking oil',  '2 tbsp',        FALSE),
  ('Chickpea Curry', 'Salt',         '1 tsp',         FALSE),
  ('Chickpea Curry', 'Coconut milk', '200 ml',        TRUE),
  ('Chickpea Curry', 'Cilantro',     '2 sprigs',      TRUE),

  ('Microwave Cheesy Baked Potato', 'Potato',         '1 large',  FALSE),
  ('Microwave Cheesy Baked Potato', 'Cheddar cheese', '1/4 cup',  FALSE),
  ('Microwave Cheesy Baked Potato', 'Butter',         '1 tbsp',   FALSE),
  ('Microwave Cheesy Baked Potato', 'Salt',           '1/4 tsp',  FALSE),
  ('Microwave Cheesy Baked Potato', 'Sour cream',     '2 tbsp',   TRUE),
  ('Microwave Cheesy Baked Potato', 'Green onion',    '1 stalk',  TRUE)
) AS v(recipe, ingredient, qty, opt);

--equipment for recipe
INSERT INTO recipe_equipment (recipe_id, equipment_id)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT equipment_id FROM equipment WHERE equipment_name = v.equipment)
FROM (VALUES
  ('Thai Omelette','Stove'), 
  ('Thai Omelette', 'Wok'),

  ('Pad Kra Pao Moo Saap', 'Stove'), 
  ('Pad Kra Pao Moo Saap', 'Wok'),

  ('Tom Yum Goong', 'Stove'), 
  ('Tom Yum Goong', 'Pot'),

  ('Green Curry Chicken', 'Stove'), 
  ('Green Curry Chicken','Pot'),
  
  ('Pad Thai with Shrimp', 'Stove'), 
  ('Pad Thai with Shrimp', 'Wok'),

  ('Pork Fried Rice', 'Stove'), 
  ('Pork Fried Rice',  'Wok'),

  ('Som Tum', 'Mortar and pestle'),

  ('Larb Gai', 'Stove'), 
  ('Larb Gai', 'Frying pan'),

  ('Stir-fried Morning Glory', 'Stove'), 
  ('Stir-fried Morning Glory', 'Wok'),

  ('Massaman Beef Curry', 'Stove'), 
  ('Massaman Beef Curry', 'Pot'),
  ('Oven-baked Chicken Satay', 'Oven'),

  ('Baked Lemon Butter Salmon', 'Oven'),

  ('Roast Chicken with Vegetables', 'Oven'),

  ('Spaghetti Carbonara', 'Stove'), 
  ('Spaghetti Carbonara', 'Pot'),
  ('Spaghetti Carbonara', 'Frying pan'),

  ('Baked Mac and Cheese', 'Stove'), 
  ('Baked Mac and Cheese', 'Pot'),
  ('Baked Mac and Cheese', 'Oven'),

  ('Vegetable Lasagna', 'Stove'), 
  ('Vegetable Lasagna', 'Frying pan'),
  ('Vegetable Lasagna', 'Oven'),

  ('Garlic Butter Shrimp', 'Stove'), 
  ('Garlic Butter Shrimp', 'Frying pan'),

  ('Pan-seared Steak', 'Stove'), 
  ('Pan-seared Steak', 'Frying pan'),

  ('Microwave Steamed Egg', 'Microwave'),

  ('Tofu and Vegetable Stir-fry', 'Stove'), 
  ('Tofu and Vegetable Stir-fry', 'Wok'),

  ('Chickpea Curry', 'Stove'), 
  ('Chickpea Curry', 'Pot'),

  ('Microwave Cheesy Baked Potato', 'Microwave')
) AS v(recipe, equipment);

-- preference
INSERT INTO recipe_preferences (recipe_id, preference_id)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT preference_id FROM preferences WHERE preference_name = v.preference)
FROM (VALUES
  ('Thai Omelette', 'Keto'), 
  ('Thai Omelette', 'Low carb'), 
  ('Thai Omelette', 'Diabetes'),
  ('Thai Omelette', 'Dairy-free'), 
  ('Thai Omelette', 'Lactose intolerance'),
  ('Thai Omelette', 'Gluten intolerance'),

  ('Pad Kra Pao Moo Saap', 'Dairy-free'), 
  ('Pad Kra Pao Moo Saap', 'Lactose intolerance'),

  ('Tom Yum Goong', 'Low carb'), 
  ('Tom Yum Goong', 'Dairy-free'),
  ('Tom Yum Goong', 'Lactose intolerance'), 
  ('Tom Yum Goong', 'Gluten intolerance'),

  ('Green Curry Chicken', 'Dairy-free'), 
  ('Green Curry Chicken', 'Lactose intolerance'),
  ('Green Curry Chicken', 'Gluten intolerance'),

  ('Pad Thai with Shrimp', 'Dairy-free'), 
  ('Pad Thai with Shrimp', 'Lactose intolerance'),
  ('Pad Thai with Shrimp', 'Gluten intolerance'),

  ('Pork Fried Rice', 'Dairy-free'), 
  ('Pork Fried Rice', 'Lactose intolerance'),

  ('Som Tum', 'Low carb'), 
  ('Som Tum', 'Dairy-free'),
  ('Som Tum', 'Lactose intolerance'), 
  ('Som Tum', 'Gluten intolerance'),

  ('Larb Gai', 'Low carb'), 
  ('Larb Gai', 'Diabetes'), 
  ('Larb Gai', 'Dairy-free'),
  ('Larb Gai', 'Lactose intolerance'), 
  ('Larb Gai', 'Gluten intolerance'),

  ('Stir-fried Morning Glory', 'Vegan'), 
  ('Stir-fried Morning Glory', 'Vegetarian'),
  ('Stir-fried Morning Glory', 'Low carb'), 
  ('Stir-fried Morning Glory', 'Dairy-free'),
  ('Stir-fried Morning Glory', 'Lactose intolerance'), 
  ('Stir-fried Morning Glory', 'Kosher'),

  ('Massaman Beef Curry', 'Dairy-free'), 
  ('Massaman Beef Curry', 'Lactose intolerance'),
  ('Massaman Beef Curry', 'Gluten intolerance'),

  ('Oven-baked Chicken Satay', 'Dairy-free'), 
  ('Oven-baked Chicken Satay', 'Lactose intolerance'),
  ('Oven-baked Chicken Satay', 'Gluten intolerance'),

  ('Baked Lemon Butter Salmon', 'Keto'), 
  ('Baked Lemon Butter Salmon', 'Low carb'),
  ('Baked Lemon Butter Salmon', 'Diabetes'), 
  ('Baked Lemon Butter Salmon', 'Gluten intolerance'),
  ('Baked Lemon Butter Salmon', 'Kosher'),

  ('Roast Chicken with Vegetables', 'Dairy-free'), 
  ('Roast Chicken with Vegetables', 'Lactose intolerance'),
  ('Roast Chicken with Vegetables', 'Gluten intolerance'), 
  ('Roast Chicken with Vegetables', 'Kosher'),

  ('Baked Mac and Cheese', 'Vegetarian'), 
  ('Baked Mac and Cheese', 'Kosher'),

  ('Vegetable Lasagna', 'Vegetarian'), 
  ('Vegetable Lasagna', 'Kosher'),

  ('Garlic Butter Shrimp', 'Keto'), 
  ('Garlic Butter Shrimp', 'Low carb'),
  ('Garlic Butter Shrimp', 'Diabetes'), 
  ('Garlic Butter Shrimp', 'Gluten intolerance'),

  ('Pan-seared Steak', 'Keto'), 
  ('Pan-seared Steak', 'Low carb'),
  ('Pan-seared Steak', 'Diabetes'), 
  ('Pan-seared Steak', 'Gluten intolerance'),

  ('Microwave Steamed Egg', 'Keto'), 
  ('Microwave Steamed Egg', 'Low carb'),
  ('Microwave Steamed Egg', 'Diabetes'), 
  ('Microwave Steamed Egg', 'Dairy-free'),
  ('Microwave Steamed Egg', 'Lactose intolerance'), 
  ('Microwave Steamed Egg', 'Gluten intolerance'),

  ('Tofu and Vegetable Stir-fry', 'Vegan'), 
  ('Tofu and Vegetable Stir-fry', 'Vegetarian'),
  ('Tofu and Vegetable Stir-fry', 'Low carb'), 
  ('Tofu and Vegetable Stir-fry', 'Dairy-free'),
  ('Tofu and Vegetable Stir-fry', 'Lactose intolerance'), 
  ('Tofu and Vegetable Stir-fry', 'Kosher'),

  ('Chickpea Curry', 'Vegan'), 
  ('Chickpea Curry', 'Vegetarian'),
  ('Chickpea Curry', 'Dairy-free'), 
  ('Chickpea Curry', 'Lactose intolerance'),
  ('Chickpea Curry', 'Gluten intolerance'), 
  ('Chickpea Curry', 'Kosher'),

  ('Microwave Cheesy Baked Potato', 'Vegetarian'), 
  ('Microwave Cheesy Baked Potato', 'Gluten intolerance'),
  ('Microwave Cheesy Baked Potato', 'Kosher')
) AS v(recipe, preference);

-- dessert 
INSERT INTO recipes (recipe_name, description, cook_time_min, serving, image_path) VALUES

  ('Mango Sticky Rice',             'Sweet coconut sticky rice served with ripe mango.',                40,  2, 'images/vegan-salad.png'),
  ('Bananas in Coconut Milk',       'Warm bananas simmered in sweet and salty coconut milk.',           15,  2, 'images/vegan-salad.png'),
  ('Coconut Jelly',                 'Firm coconut jelly set with agar, served chilled.',                20,  4, 'images/vegan-salad.png'),
  ('Chocolate Chip Cookies',        'Chewy cookies packed with chocolate chips.',                       30, 12, 'images/dessert.png'),
  ('Banana Bread',                  'Moist loaf made with very ripe bananas.',                          70,  8, 'images/dessert.png'),
  ('Fudgy Brownies',                'Rich chocolate brownies with a crackly top.',                      40,  9, 'images/dessert.png'),
  ('Microwave Chocolate Mug Cake',  'Single-serving chocolate cake made in a mug.',                      5,  1, 'images/dessert.png'),
  ('Fluffy Pancakes',               'Thick, soft pancakes cooked in a pan.',                            20,  2, 'images/dessert.png'),
  ('French Toast',                  'Bread soaked in egg and milk, pan-fried in butter.',               15,  2, 'images/dessert.png'),
  ('Fruit Salad with Yogurt',       'Fresh fruit topped with yogurt and honey.',                        10,  2, 'images/vegan-salad.png'),
  ('Mango Smoothie',                'Creamy blended mango, yogurt and milk.',                            5,  2, 'images/dessert.png'),
  ('No-bake Lemon Cheesecake',      'Creamy lemon cheesecake on a biscuit base, set in the fridge.',    30,  8, 'images/dessert.png'),
  ('Rice Pudding',                  'Rice slowly cooked in milk with cinnamon.',                        35,  3, 'images/dessert.png'),

  ('Fried Bananas',                 'Crispy battered bananas with sesame seeds.',                       20,  3, 'images/vegan-salad.png'),
  ('Fresh Spring Rolls',            'Rice paper rolls with shrimp, noodles and fresh herbs.',           25,  3, 'images/snack.png'),
  ('Thai Fish Cakes',               'Spicy fried fish cakes with long beans and lime leaves.',          30,  3, 'images/snack.png'),
  ('Moo Ping',                      'Sweet garlic pork skewers baked in the oven.',                     40,  3, 'images/snack.png'),
  ('Guacamole with Tortilla Chips', 'Mashed avocado with lime, onion and chili.',                       10,  3, 'images/vegan-salad.png'),
  ('Garlic Bread',                  'Baguette with garlic butter, baked until crisp.',                  15,  4, 'images/snack.png'),
  ('Homemade French Fries',         'Crispy deep-fried potato sticks.',                                 30,  2, 'images/vegan-salad.png'),
  ('Microwave Popcorn',             'Popcorn popped in the microwave.',                                  5,  2, 'images/snack.png'),
  ('Cheese Quesadilla',             'Toasted tortilla filled with melted cheese.',                      10,  1, 'images/snack.png'),
  ('Deviled Eggs',                  'Hard-boiled eggs filled with creamy seasoned yolk.',               20,  4, 'images/snack.png');


INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity_text, is_optional)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT ingredient_id FROM ingredients WHERE ingredient_name = v.ingredient),
       v.qty, v.opt
FROM (VALUES

  ('Mango Sticky Rice', 'Glutinous rice', '1 cup',   FALSE),
  ('Mango Sticky Rice', 'Ripe mango',     '1',       FALSE),
  ('Mango Sticky Rice', 'Coconut milk',   '200 ml',  FALSE),
  ('Mango Sticky Rice', 'Sugar',          '3 tbsp',  FALSE),
  ('Mango Sticky Rice', 'Salt',           '1/2 tsp', FALSE),
  ('Mango Sticky Rice', 'Sesame seeds',   '1 tsp',   TRUE),

  ('Bananas in Coconut Milk', 'Banana',       '4',       FALSE),
  ('Bananas in Coconut Milk', 'Coconut milk', '400 ml',  FALSE),
  ('Bananas in Coconut Milk', 'Sugar',        '3 tbsp',  FALSE),
  ('Bananas in Coconut Milk', 'Salt',         '1/4 tsp', FALSE),

  ('Coconut Jelly', 'Agar powder',  '2 tsp',   FALSE),
  ('Coconut Jelly', 'Coconut milk', '400 ml',  FALSE),
  ('Coconut Jelly', 'Sugar',        '1/3 cup', FALSE),
  ('Coconut Jelly', 'Salt',         '1/4 tsp', FALSE),

  ('Chocolate Chip Cookies', 'All-purpose flour', '2 cups',  FALSE),
  ('Chocolate Chip Cookies', 'Butter',            '1/2 cup', FALSE),
  ('Chocolate Chip Cookies', 'Sugar',             '1/2 cup', FALSE),
  ('Chocolate Chip Cookies', 'Brown sugar',       '1/2 cup', FALSE),
  ('Chocolate Chip Cookies', 'Egg',               '1 egg',   FALSE),
  ('Chocolate Chip Cookies', 'Chocolate chips',   '1 cup',   FALSE),
  ('Chocolate Chip Cookies', 'Baking soda',       '1/2 tsp', FALSE),
  ('Chocolate Chip Cookies', 'Salt',              '1/2 tsp', FALSE),
  ('Chocolate Chip Cookies', 'Vanilla extract',   '1 tsp',   TRUE),

  ('Banana Bread', 'Banana',            '3, very ripe', FALSE),
  ('Banana Bread', 'All-purpose flour', '1 1/2 cups',   FALSE),
  ('Banana Bread', 'Butter',            '1/3 cup',      FALSE),
  ('Banana Bread', 'Sugar',             '1/2 cup',      FALSE),
  ('Banana Bread', 'Egg',               '1 egg',        FALSE),
  ('Banana Bread', 'Baking soda',       '1 tsp',        FALSE),
  ('Banana Bread', 'Salt',              '1/4 tsp',      FALSE),
  ('Banana Bread', 'Cinnamon',          '1 tsp',        TRUE),
  ('Banana Bread', 'Walnuts',           '1/2 cup',      TRUE),

  ('Fudgy Brownies', 'Dark chocolate',    '150 g',   FALSE),
  ('Fudgy Brownies', 'Butter',            '1/2 cup', FALSE),
  ('Fudgy Brownies', 'Sugar',             '1 cup',   FALSE),
  ('Fudgy Brownies', 'Egg',               '2 eggs',  FALSE),
  ('Fudgy Brownies', 'All-purpose flour', '1/2 cup', FALSE),
  ('Fudgy Brownies', 'Cocoa powder',      '1/4 cup', FALSE),
  ('Fudgy Brownies', 'Salt',              '1/4 tsp', FALSE),

  ('Microwave Chocolate Mug Cake', 'All-purpose flour', '4 tbsp',  FALSE),
  ('Microwave Chocolate Mug Cake', 'Cocoa powder',      '2 tbsp',  FALSE),
  ('Microwave Chocolate Mug Cake', 'Sugar',             '3 tbsp',  FALSE),
  ('Microwave Chocolate Mug Cake', 'Milk',              '3 tbsp',  FALSE),
  ('Microwave Chocolate Mug Cake', 'Cooking oil',       '2 tbsp',  FALSE),
  ('Microwave Chocolate Mug Cake', 'Baking powder',     '1/4 tsp', FALSE),
  ('Microwave Chocolate Mug Cake', 'Chocolate chips',   '1 tbsp',  TRUE),

  ('Fluffy Pancakes', 'All-purpose flour', '1 cup',   FALSE),
  ('Fluffy Pancakes', 'Milk',              '3/4 cup', FALSE),
  ('Fluffy Pancakes', 'Egg',               '1 egg',   FALSE),
  ('Fluffy Pancakes', 'Sugar',             '2 tbsp',  FALSE),
  ('Fluffy Pancakes', 'Baking powder',     '2 tsp',   FALSE),
  ('Fluffy Pancakes', 'Butter',            '2 tbsp',  FALSE),
  ('Fluffy Pancakes', 'Salt',              '1/4 tsp', FALSE),
  ('Fluffy Pancakes', 'Honey',             '2 tbsp',  TRUE),

  ('French Toast', 'White bread', '4 slices', FALSE),
  ('French Toast', 'Egg',         '2 eggs',   FALSE),
  ('French Toast', 'Milk',        '1/2 cup',  FALSE),
  ('French Toast', 'Butter',      '1 tbsp',   FALSE),
  ('French Toast', 'Sugar',       '1 tbsp',   FALSE),
  ('French Toast', 'Cinnamon',    '1/2 tsp',  TRUE),
  ('French Toast', 'Honey',       '2 tbsp',   TRUE),

  ('Fruit Salad with Yogurt', 'Yogurt',     '1 cup',  FALSE),
  ('Fruit Salad with Yogurt', 'Banana',     '1',      FALSE),
  ('Fruit Salad with Yogurt', 'Strawberry', '1 cup',  FALSE),
  ('Fruit Salad with Yogurt', 'Ripe mango', '1',      FALSE),
  ('Fruit Salad with Yogurt', 'Honey',      '1 tbsp', TRUE),

  ('Mango Smoothie', 'Ripe mango', '1',       FALSE),
  ('Mango Smoothie', 'Yogurt',     '1/2 cup', FALSE),
  ('Mango Smoothie', 'Milk',       '1/2 cup', FALSE),
  ('Mango Smoothie', 'Honey',      '1 tbsp',  TRUE),

  ('No-bake Lemon Cheesecake', 'Cream cheese',       '250 g',   FALSE),
  ('No-bake Lemon Cheesecake', 'Whipping cream',     '200 ml',  FALSE),
  ('No-bake Lemon Cheesecake', 'Digestive biscuits', '200 g',   FALSE),
  ('No-bake Lemon Cheesecake', 'Butter',             '80 g',    FALSE),
  ('No-bake Lemon Cheesecake', 'Sugar',              '1/2 cup', FALSE),
  ('No-bake Lemon Cheesecake', 'Lemon',              '1',       FALSE),

  ('Rice Pudding', 'Cooked jasmine rice', '1 cup',   FALSE),
  ('Rice Pudding', 'Milk',                '2 cups',  FALSE),
  ('Rice Pudding', 'Sugar',               '1/4 cup', FALSE),
  ('Rice Pudding', 'Cinnamon',            '1/2 tsp', FALSE),
  ('Rice Pudding', 'Salt',                '1 pinch', FALSE),
  ('Rice Pudding', 'Raisins',             '1/4 cup', TRUE),

  ('Fried Bananas', 'Banana',            '4',       FALSE),
  ('Fried Bananas', 'Rice flour',        '1/2 cup', FALSE),
  ('Fried Bananas', 'All-purpose flour', '1/4 cup', FALSE),
  ('Fried Bananas', 'Sugar',             '2 tbsp',  FALSE),
  ('Fried Bananas', 'Salt',              '1/4 tsp', FALSE),
  ('Fried Bananas', 'Sesame seeds',      '1 tbsp',  FALSE),
  ('Fried Bananas', 'Cooking oil',       '2 cups',  FALSE),

  ('Fresh Spring Rolls', 'Rice paper',   '8 sheets', FALSE),
  ('Fresh Spring Rolls', 'Rice noodles', '100 g',    FALSE),
  ('Fresh Spring Rolls', 'Shrimp',       '200 g',    FALSE),
  ('Fresh Spring Rolls', 'Lettuce',      '8 leaves', FALSE),
  ('Fresh Spring Rolls', 'Mint',         '1/2 cup',  FALSE),
  ('Fresh Spring Rolls', 'Cucumber',     '1',        FALSE),
  ('Fresh Spring Rolls', 'Carrot',       '1',        FALSE),
  ('Fresh Spring Rolls', 'Peanuts',      '2 tbsp',   TRUE),

  ('Thai Fish Cakes', 'White fish fillet',  '300 g',    FALSE),
  ('Thai Fish Cakes', 'Red curry paste',    '2 tbsp',   FALSE),
  ('Thai Fish Cakes', 'Egg',                '1 egg',    FALSE),
  ('Thai Fish Cakes', 'Long bean',          '4 pieces', FALSE),
  ('Thai Fish Cakes', 'Kaffir lime leaves', '4 leaves', FALSE),
  ('Thai Fish Cakes', 'Fish sauce',         '1 tbsp',   FALSE),
  ('Thai Fish Cakes', 'Sugar',              '1 tsp',    FALSE),
  ('Thai Fish Cakes', 'Cooking oil',        '2 cups',   FALSE),
  ('Thai Fish Cakes', 'Cucumber',           '1',        TRUE),

  ('Moo Ping', 'Sliced pork',  '400 g',    FALSE),
  ('Moo Ping', 'Garlic',       '4 cloves', FALSE),
  ('Moo Ping', 'Cilantro',     '2 sprigs', FALSE),
  ('Moo Ping', 'Oyster sauce', '1 tbsp',   FALSE),
  ('Moo Ping', 'Soy sauce',    '1 tbsp',   FALSE),
  ('Moo Ping', 'Sugar',        '2 tbsp',   FALSE),
  ('Moo Ping', 'Coconut milk', '1/4 cup',  FALSE),
  ('Moo Ping', 'Black pepper', '1/2 tsp',  FALSE),

  ('Guacamole with Tortilla Chips', 'Avocado',        '2',        FALSE),
  ('Guacamole with Tortilla Chips', 'Lime',           '1',        FALSE),
  ('Guacamole with Tortilla Chips', 'Onion',          '1/4',      FALSE),
  ('Guacamole with Tortilla Chips', 'Tomato',         '1',        FALSE),
  ('Guacamole with Tortilla Chips', 'Cilantro',       '2 sprigs', FALSE),
  ('Guacamole with Tortilla Chips', 'Salt',           '1/2 tsp',  FALSE),
  ('Guacamole with Tortilla Chips', 'Tortilla chips', '1 bag',    FALSE),
  ('Guacamole with Tortilla Chips', 'Chili',          '1',        TRUE),

  ('Garlic Bread', 'Baguette',        '1',        FALSE),
  ('Garlic Bread', 'Butter',          '1/4 cup',  FALSE),
  ('Garlic Bread', 'Garlic',          '4 cloves', FALSE),
  ('Garlic Bread', 'Parsley',         '1 tbsp',   TRUE),
  ('Garlic Bread', 'Parmesan cheese', '2 tbsp',   TRUE),

  ('Homemade French Fries', 'Potato',      '3',      FALSE),
  ('Homemade French Fries', 'Cooking oil', '3 cups', FALSE),
  ('Homemade French Fries', 'Salt',        '1 tsp',  FALSE),

  ('Microwave Popcorn', 'Popcorn kernels', '1/4 cup', FALSE),
  ('Microwave Popcorn', 'Salt',            '1/4 tsp', FALSE),
  ('Microwave Popcorn', 'Butter',          '1 tbsp',  TRUE),

  ('Cheese Quesadilla', 'Flour tortilla',    '2',       FALSE),
  ('Cheese Quesadilla', 'Cheddar cheese',    '1/2 cup', FALSE),
  ('Cheese Quesadilla', 'Mozzarella cheese', '1/2 cup', FALSE),
  ('Cheese Quesadilla', 'Bell pepper',       '1/2',     TRUE),
  ('Cheese Quesadilla', 'Onion',             '1/4',     TRUE),

  ('Deviled Eggs', 'Egg',          '6 eggs',  FALSE),
  ('Deviled Eggs', 'Mayonnaise',   '3 tbsp',  FALSE),
  ('Deviled Eggs', 'Mustard',      '1 tsp',   FALSE),
  ('Deviled Eggs', 'Salt',         '1/4 tsp', FALSE),
  ('Deviled Eggs', 'Black pepper', '1/4 tsp', FALSE),
  ('Deviled Eggs', 'Paprika',      '1/2 tsp', TRUE)
) AS v(recipe, ingredient, qty, opt);

-- recipe equipment for dessert
INSERT INTO recipe_equipment (recipe_id, equipment_id)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT equipment_id FROM equipment WHERE equipment_name = v.equipment)
FROM (VALUES
  ('Mango Sticky Rice', 'Stove'), 
  ('Mango Sticky Rice', 'Pot'),
  ('Mango Sticky Rice', 'Steamer'),
  ('Bananas in Coconut Milk', 'Stove'),

   ('Bananas in Coconut Milk', 'Pot'),
   
  ('Coconut Jelly', 'Stove'),
  ('Coconut Jelly', 'Pot'),

  ('Chocolate Chip Cookies', 'Oven'),

  ('Banana Bread', 'Oven'),

  ('Fudgy Brownies','Oven'),

  ('Microwave Chocolate Mug Cake', 'Microwave'),

  ('Fluffy Pancakes', 'Stove'),
  ('Fluffy Pancakes', 'Frying pan'),

  ('French Toast', 'Stove'), 
  ('French Toast', 'Frying pan'),

  ('Mango Smoothie', 'Blender'),

  ('Rice Pudding', 'Stove'), 
  ('Rice Pudding', 'Pot'),

  ('Fried Bananas', 'Stove'), 
  ('Fried Bananas', 'Wok'),

  ('Fresh Spring Rolls', 'Stove'), 
  ('Fresh Spring Rolls', 'Pot'),

  ('Thai Fish Cakes', 'Stove'), 
  ('Thai Fish Cakes', 'Wok'),

  ('Moo Ping', 'Oven'),

  ('Garlic Bread', 'Oven'),

  ('Homemade French Fries', 'Stove'), 
  ('Homemade French Fries','Pot'),

  ('Microwave Popcorn', 'Microwave'),

  ('Cheese Quesadilla', 'Stove'), 
  ('Cheese Quesadilla', 'Frying pan'),
  
  ('Deviled Eggs', 'Stove'), 
  ('Deviled Eggs', 'Pot')
) AS v(recipe, equipment);

--recipe preference
INSERT INTO recipe_preferences (recipe_id, preference_id)
SELECT (SELECT recipe_id FROM recipes WHERE recipe_name = v.recipe),
       (SELECT preference_id FROM preferences WHERE preference_name = v.preference)
FROM (VALUES
  ('Mango Sticky Rice', 'Vegan'), 
  ('Mango Sticky Rice', 'Vegetarian'),
  ('Mango Sticky Rice', 'Dairy-free'), 
  ('Mango Sticky Rice', 'Lactose intolerance'),
  ('Mango Sticky Rice', 'Gluten intolerance'), 
  ('Mango Sticky Rice', 'Kosher'),

  ('Bananas in Coconut Milk', 'Vegan'), 
  ('Bananas in Coconut Milk', 'Vegetarian'),
  ('Bananas in Coconut Milk', 'Dairy-free'), 
  ('Bananas in Coconut Milk', 'Lactose intolerance'),
  ('Bananas in Coconut Milk', 'Gluten intolerance'), 
  ('Bananas in Coconut Milk', 'Kosher'),

  ('Coconut Jelly', 'Vegan'), 
  ('Coconut Jelly', 'Vegetarian'),
  ('Coconut Jelly', 'Dairy-free'), 
  ('Coconut Jelly', 'Lactose intolerance'),
  ('Coconut Jelly', 'Gluten intolerance'), 
  ('Coconut Jelly', 'Kosher'),

  ('Chocolate Chip Cookies', 'Vegetarian'), 
  ('Chocolate Chip Cookies', 'Kosher'),
  ('Banana Bread', 'Vegetarian'), 
  ('Banana Bread', 'Kosher'),
  ('Fudgy Brownies', 'Vegetarian'), 
  ('Fudgy Brownies', 'Kosher'),
  ('Microwave Chocolate Mug Cake', 'Vegetarian'), 
  ('Microwave Chocolate Mug Cake', 'Kosher'),
  ('Fluffy Pancakes', 'Vegetarian'), 
  ('Fluffy Pancakes', 'Kosher'),
  ('French Toast', 'Vegetarian'), 
  ('French Toast', 'Kosher'),

  ('Fruit Salad with Yogurt', 'Vegetarian'), 
  ('Fruit Salad with Yogurt', 'Gluten intolerance'),
  ('Fruit Salad with Yogurt', 'Kosher'),

  ('Mango Smoothie', 'Vegetarian'), 
  ('Mango Smoothie', 'Gluten intolerance'),
  ('Mango Smoothie', 'Kosher'),

  ('No-bake Lemon Cheesecake', 'Vegetarian'), 
  ('No-bake Lemon Cheesecake', 'Kosher'),

  ('Rice Pudding', 'Vegetarian'), 
  ('Rice Pudding', 'Gluten intolerance'),
  ('Rice Pudding', 'Kosher'),

  ('Fried Bananas', 'Vegan'), 
  ('Fried Bananas', 'Vegetarian'),
  ('Fried Bananas', 'Dairy-free'), 
  ('Fried Bananas', 'Lactose intolerance'),
  ('Fried Bananas', 'Kosher'),

  ('Fresh Spring Rolls', 'Dairy-free'), 
  ('Fresh Spring Rolls', 'Lactose intolerance'),
  ('Fresh Spring Rolls', 'Gluten intolerance'),

  ('Thai Fish Cakes', 'Dairy-free'), 
  ('Thai Fish Cakes', 'Lactose intolerance'),
  ('Thai Fish Cakes', 'Gluten intolerance'), 
  ('Thai Fish Cakes', 'Kosher'),

  ('Moo Ping', 'Dairy-free'), 
  ('Moo Ping', 'Lactose intolerance'),

  ('Guacamole with Tortilla Chips', 'Vegan'), 
  ('Guacamole with Tortilla Chips', 'Vegetarian'),
  ('Guacamole with Tortilla Chips', 'Dairy-free'), 
  ('Guacamole with Tortilla Chips', 'Lactose intolerance'),
  ('Guacamole with Tortilla Chips', 'Gluten intolerance'), 
  ('Guacamole with Tortilla Chips', 'Kosher'),

  ('Garlic Bread', 'Vegetarian'), 
  ('Garlic Bread', 'Kosher'),

  ('Homemade French Fries', 'Vegan'), 
  ('Homemade French Fries', 'Vegetarian'),
  ('Homemade French Fries', 'Dairy-free'), 
  ('Homemade French Fries', 'Lactose intolerance'),
  ('Homemade French Fries', 'Gluten intolerance'), 
  ('Homemade French Fries', 'Kosher'),

  ('Microwave Popcorn', 'Vegetarian'), 
  ('Microwave Popcorn', 'Gluten intolerance'),
  ('Microwave Popcorn', 'Kosher'),

  ('Cheese Quesadilla', 'Vegetarian'),
  ('Cheese Quesadilla', 'Kosher'),

  ('Deviled Eggs', 'Keto'), 
  ('Deviled Eggs', 'Low carb'), 
  ('Deviled Eggs', 'Diabetes'),
  ('Deviled Eggs', 'Vegetarian'), 
  ('Deviled Eggs', 'Dairy-free'),
  ('Deviled Eggs', 'Lactose intolerance'), 
  ('Deviled Eggs', 'Gluten intolerance'),
  ('Deviled Eggs', 'Kosher')
) AS v(recipe, preference);
