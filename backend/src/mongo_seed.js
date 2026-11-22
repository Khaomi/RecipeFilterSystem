// Mongo seed, run by the mongo image on a fresh volume (/docker-entrypoint-initdb.d).
// recipe_id follows the insert order of recipes in seed_recipes.sql (fresh DB, ids start at 1).
// The name in each entry is only for readability; it is not stored.
const project = db.getSiblingDB("project");
const now = new Date();

project.recipe_details.createIndex({ recipe_id: 1 }, { unique: true });
project.bookmarks.createIndex({ recipe_id: 1 }, { unique: true });

const recipes = [
  [1, "Thai Omelette", [
    "Beat the eggs with the fish sauce until frothy; stir in the green onion if using.",
    "Heat the oil in a wok over high heat until it just starts to smoke.",
    "Pour the eggs into the centre of the oil; they will puff up right away.",
    "Fry about 1 minute until the edges are golden and crispy, flip and fry 30 seconds more.",
    "Drain on paper towels and serve hot over rice.",
  ]],
  [2, "Pad Kra Pao Moo Saap", [
    "Pound the garlic and chili into a rough paste.",
    "Heat the oil in a wok and stir-fry the paste for a few seconds until fragrant.",
    "Add the minced pork and stir-fry over high heat until cooked through.",
    "Season with oyster sauce, soy sauce, fish sauce and sugar, then toss in the holy basil until just wilted.",
    "Serve over jasmine rice, topped with a fried egg if you like.",
  ]],
  [3, "Tom Yum Goong", [
    "Bring 1 litre of water to a boil with the lemongrass, galangal and torn kaffir lime leaves.",
    "Add the mushrooms and simmer for 3 minutes.",
    "Add the shrimp and cook just until they turn pink.",
    "Turn off the heat; stir in the fish sauce, lime juice, crushed chili and chili paste if using.",
    "Taste, adjust the sour and salty balance, and garnish with cilantro.",
  ]],
  [4, "Green Curry Chicken", [
    "Heat a third of the coconut milk in a pot until the oil separates, then fry the curry paste until fragrant.",
    "Add the chicken and stir until coated and no longer pink outside.",
    "Pour in the rest of the coconut milk, add the Thai eggplant and kaffir lime leaves, and simmer 10 minutes.",
    "Season with fish sauce and sugar.",
    "Stir in the Thai basil (and sliced chili) and serve with rice.",
  ]],
  [5, "Pad Thai with Shrimp", [
    "Soak the rice noodles in warm water until soft, then drain.",
    "Mix the tamarind paste, fish sauce and sugar into a sauce.",
    "Stir-fry the shallot and tofu in oil, add the shrimp and cook until pink, then push to the side and scramble the eggs.",
    "Add the noodles and sauce and toss until the noodles absorb it.",
    "Toss in the bean sprouts and garlic chives, and serve with crushed peanuts and lime.",
  ]],
  [6, "Pork Fried Rice", [
    "Stir-fry the garlic and onion in oil until fragrant, then add the pork and cook through.",
    "Push to one side and scramble the eggs.",
    "Add the cold rice and break up any clumps.",
    "Season with soy sauce, fish sauce and sugar and stir-fry until heated through.",
    "Toss in the green onion and serve with tomato and cucumber slices.",
  ]],
  [7, "Som Tum", [
    "Pound the garlic and chili in a mortar.",
    "Add the long beans and tomato and bruise them lightly.",
    "Add the lime juice, fish sauce, sugar and dried shrimp if using, and mix.",
    "Add the shredded papaya and pound gently while turning with a spoon until coated.",
    "Top with peanuts and serve right away.",
  ]],
  [8, "Larb Gai", [
    "Cook the minced chicken in a pan with a splash of water until just done.",
    "Take off the heat and season with fish sauce, lime juice and chili flakes.",
    "Stir in the sliced shallot, green onion, mint and cilantro.",
    "Sprinkle with toasted rice powder, toss and serve.",
  ]],
  [9, "Stir-fried Morning Glory", [
    "Cut the morning glory into 5 cm pieces; lightly crush the garlic and chili.",
    "Heat the oil in a wok until very hot and add the garlic and chili.",
    "Add the morning glory, soybean paste, soy sauce and sugar.",
    "Stir-fry over high heat for about 1 minute, until just wilted, and serve.",
  ]],
  [10, "Massaman Beef Curry", [
    "Fry the curry paste in a little coconut milk until fragrant.",
    "Add the beef and stir to coat, then add the rest of the coconut milk and a cup of water.",
    "Simmer covered for about 1 hour, until the beef is tender.",
    "Add the potato, onion and peanuts and simmer 20 minutes more.",
    "Season with tamarind, fish sauce and sugar to taste.",
  ]],
  [11, "Oven-baked Chicken Satay", [
    "Slice the chicken into strips and marinate with coconut milk, curry powder, turmeric, garlic, fish sauce and sugar for 30 minutes.",
    "Thread onto skewers and heat the oven to 200°C.",
    "Bake 15–20 minutes, turning halfway, until cooked and lightly charred.",
    "Serve with crushed peanuts (or peanut sauce) and cucumber.",
  ]],
  [12, "Baked Lemon Butter Salmon", [
    "Heat the oven to 200°C and place the salmon on a lined tray.",
    "Melt the butter with minced garlic and the juice of half the lemon.",
    "Season the salmon with salt and pepper and pour the butter over.",
    "Bake 12–15 minutes until it flakes easily; finish with lemon slices and dill.",
  ]],
  [13, "Roast Chicken with Vegetables", [
    "Heat the oven to 200°C.",
    "Toss the potato, carrot, onion and garlic with half the olive oil, salt and pepper in a tray.",
    "Rub the chicken with the remaining oil, salt, pepper and rosemary and place on top.",
    "Roast 45–50 minutes until the chicken skin is golden and the juices run clear.",
  ]],
  [14, "Spaghetti Carbonara", [
    "Cook the spaghetti in salted boiling water.",
    "Fry the bacon in a pan until crisp.",
    "Whisk the eggs with grated parmesan and plenty of black pepper.",
    "Toss the drained pasta with the bacon off the heat, then stir in the egg mix with a splash of pasta water until creamy.",
  ]],
  [15, "Baked Mac and Cheese", [
    "Boil the macaroni until just under done and drain. Heat the oven to 190°C.",
    "Melt the butter in a pot, stir in the flour, then whisk in the milk until thick.",
    "Stir in most of the cheddar with salt and pepper until smooth.",
    "Mix with the macaroni, top with the remaining cheese and bake 20–25 minutes until golden.",
  ]],
  [16, "Vegetable Lasagna", [
    "Sauté the onion, garlic and zucchini in olive oil, then wilt in the spinach.",
    "Heat the oven to 180°C.",
    "Layer tomato sauce, lasagna sheets, vegetables and mozzarella in a dish; repeat 3 times.",
    "Finish with sauce, mozzarella and parmesan, cover and bake 30 minutes, then uncover for 15 minutes.",
  ]],
  [17, "Garlic Butter Shrimp", [
    "Melt the butter in a pan over medium heat and add the minced garlic.",
    "Add the shrimp in one layer and season with salt (and chili flakes).",
    "Cook 1–2 minutes per side until pink.",
    "Squeeze over the lemon, sprinkle parsley and serve.",
  ]],
  [18, "Pan-seared Steak", [
    "Pat the steak dry and season well with salt and pepper.",
    "Heat the oil in a pan until smoking and sear the steak 2–3 minutes per side.",
    "Add the butter, garlic and rosemary and spoon the foaming butter over the steak.",
    "Rest 5 minutes before slicing.",
  ]],
  [19, "Microwave Steamed Egg", [
    "Whisk the eggs with the fish sauce and the same amount of water.",
    "Strain into a microwave-safe bowl and cover loosely.",
    "Microwave on medium for 2–3 minutes, checking every 30 seconds, until just set.",
    "Top with green onion and serve.",
  ]],
  [20, "Tofu and Vegetable Stir-fry", [
    "Cube the tofu and pan-fry in oil until golden, then set aside.",
    "Stir-fry the garlic, then the carrot, broccoli and bell pepper until tender-crisp.",
    "Return the tofu, add the soy sauce and toss.",
    "Drizzle with sesame oil and serve.",
  ]],
  [21, "Chickpea Curry", [
    "Sauté the onion in oil until soft, then add the garlic and ginger.",
    "Stir in the curry powder and cumin for 30 seconds.",
    "Add the chopped tomatoes and cook until saucy.",
    "Add the chickpeas (and coconut milk) and simmer 15 minutes; season with salt and top with cilantro.",
  ]],
  [22, "Microwave Cheesy Baked Potato", [
    "Scrub the potato and prick it all over with a fork.",
    "Microwave on high 5–7 minutes, turning halfway, until soft.",
    "Split it open, add the butter and salt, then top with the cheddar.",
    "Microwave 30 seconds to melt the cheese; add sour cream and green onion if you like.",
  ]],
  [23, "Mango Sticky Rice", [
    "Soak the glutinous rice for at least 4 hours, then steam for 20–25 minutes.",
    "Warm the coconut milk with the sugar and salt until dissolved.",
    "Pour most of the coconut milk over the hot rice, cover and let it absorb for 15 minutes.",
    "Serve with sliced mango, the remaining coconut milk and sesame seeds.",
  ]],
  [24, "Bananas in Coconut Milk", [
    "Peel the bananas and cut them into chunks.",
    "Heat the coconut milk with the sugar and salt until it simmers gently.",
    "Add the bananas and simmer 5–7 minutes until soft.",
    "Serve warm.",
  ]],
  [25, "Coconut Jelly", [
    "Whisk the agar powder into 1 cup of water and bring to a boil, stirring.",
    "Add the coconut milk, sugar and salt and stir until dissolved.",
    "Pour into a mould and let cool.",
    "Chill at least 1 hour until firm, then cut into pieces.",
  ]],
  [26, "Chocolate Chip Cookies", [
    "Heat the oven to 180°C. Cream the butter with both sugars, then beat in the egg and vanilla.",
    "Mix in the flour, baking soda and salt, then fold in the chocolate chips.",
    "Scoop balls onto a lined tray, leaving space between them.",
    "Bake 10–12 minutes until the edges are golden; cool on the tray.",
  ]],
  [27, "Banana Bread", [
    "Heat the oven to 175°C and grease a loaf pan.",
    "Mash the bananas and mix in the melted butter, sugar and egg.",
    "Stir in the flour, baking soda, salt and cinnamon (and walnuts) until just combined.",
    "Bake 55–60 minutes until a skewer comes out clean.",
  ]],
  [28, "Fudgy Brownies", [
    "Heat the oven to 175°C and line a square tin.",
    "Melt the chocolate and butter together, then whisk in the sugar and eggs.",
    "Fold in the flour, cocoa powder and salt.",
    "Bake 25 minutes until the top is crackly but the centre is still soft; cool before cutting.",
  ]],
  [29, "Microwave Chocolate Mug Cake", [
    "Mix the flour, cocoa, sugar and baking powder in a large mug.",
    "Stir in the milk and oil until smooth, then add the chocolate chips.",
    "Microwave on high for 60–90 seconds until risen.",
    "Let it cool for a minute before eating.",
  ]],
  [30, "Fluffy Pancakes", [
    "Whisk the flour, sugar, baking powder and salt in a bowl.",
    "Add the milk, egg and melted butter and stir until just combined; lumps are fine.",
    "Cook ladles of batter in a buttered pan until bubbles form, then flip.",
    "Serve warm with honey.",
  ]],
  [31, "French Toast", [
    "Whisk the eggs, milk, sugar and cinnamon in a shallow dish.",
    "Soak each slice of bread for a few seconds per side.",
    "Fry in butter over medium heat until golden on both sides.",
    "Serve with honey.",
  ]],
  [32, "Fruit Salad with Yogurt", [
    "Chop the banana, strawberries and mango into bite-size pieces.",
    "Combine the fruit in a bowl.",
    "Spoon the yogurt over and drizzle with honey.",
  ]],
  [33, "Mango Smoothie", [
    "Peel and chop the mango.",
    "Blend the mango with the yogurt, milk and honey until smooth.",
    "Add a few ice cubes if you want it colder, and serve right away.",
  ]],
  [34, "No-bake Lemon Cheesecake", [
    "Crush the biscuits, mix with melted butter and press into a tin; chill.",
    "Beat the cream cheese with the sugar, lemon zest and juice.",
    "Whip the cream to soft peaks and fold it into the cheese mix.",
    "Spread over the base and chill at least 4 hours until set.",
  ]],
  [35, "Rice Pudding", [
    "Put the rice, milk, sugar, cinnamon and salt in a pot.",
    "Simmer on low, stirring often, for 25–30 minutes until thick and creamy.",
    "Stir in the raisins if using.",
    "Serve warm or chilled.",
  ]],
  [36, "Fried Bananas", [
    "Mix the rice flour, flour, sugar, salt and sesame seeds with about 1/2 cup water into a batter.",
    "Slice the bananas lengthwise.",
    "Heat the oil, dip the bananas in the batter and fry until golden and crisp.",
    "Drain on paper towels and serve warm.",
  ]],
  [37, "Fresh Spring Rolls", [
    "Cook the rice noodles and the shrimp, then halve the shrimp.",
    "Cut the cucumber and carrot into thin sticks.",
    "Dip a rice paper sheet in warm water until soft and lay it flat.",
    "Layer lettuce, noodles, vegetables, mint and shrimp, then roll tightly. Serve with peanut dip.",
  ]],
  [38, "Thai Fish Cakes", [
    "Blend the fish with the curry paste, egg, fish sauce and sugar into a sticky paste.",
    "Mix in the thinly sliced long beans and kaffir lime leaves.",
    "Shape into small patties with oiled hands.",
    "Deep-fry until golden and puffed; serve with cucumber relish.",
  ]],
  [39, "Moo Ping", [
    "Pound the garlic, cilantro and pepper, then mix with the oyster sauce, soy sauce and sugar.",
    "Marinate the pork for at least 1 hour, then thread onto skewers.",
    "Bake at 200°C for 20–25 minutes, basting with coconut milk and turning halfway.",
    "Serve with sticky rice.",
  ]],
  [40, "Guacamole with Tortilla Chips", [
    "Mash the avocados with the lime juice and salt.",
    "Stir in the finely chopped onion, tomato, cilantro and chili.",
    "Taste and adjust the salt and lime.",
    "Serve right away with tortilla chips.",
  ]],
  [41, "Garlic Bread", [
    "Heat the oven to 200°C.",
    "Mix the soft butter with minced garlic and parsley.",
    "Slice the baguette, spread the butter on each slice and sprinkle with parmesan.",
    "Bake 8–10 minutes until crisp and golden.",
  ]],
  [42, "Homemade French Fries", [
    "Cut the potatoes into sticks and soak in cold water for 30 minutes, then dry well.",
    "Fry at 160°C for 5 minutes, then drain.",
    "Raise the oil to 190°C and fry again until golden and crisp.",
    "Toss with salt while hot.",
  ]],
  [43, "Microwave Popcorn", [
    "Put the kernels in a paper bag and fold the top over twice.",
    "Microwave on high for 2–3 minutes, stopping when the pops slow to 2 seconds apart.",
    "Toss with salt and melted butter.",
  ]],
  [44, "Cheese Quesadilla", [
    "Sprinkle both cheeses (and the pepper and onion) over half of each tortilla.",
    "Fold the tortillas in half.",
    "Toast in a dry pan 2 minutes per side until golden and the cheese melts.",
    "Cut into wedges and serve.",
  ]],
  [45, "Deviled Eggs", [
    "Hard-boil the eggs for 10 minutes, cool in cold water and peel.",
    "Halve the eggs and scoop out the yolks.",
    "Mash the yolks with the mayonnaise, mustard, salt and pepper.",
    "Spoon the filling back into the whites and dust with paprika.",
  ]],
];

project.recipe_details.insertMany(
  recipes.map(([recipe_id, _name, instructions]) => ({
    recipe_id,
    author: "Order up!",
    updated_at: now,
    instructions,
  }))
);
