// Mongo seed, run by the mongo image on a fresh volume (/docker-entrypoint-initdb.d).
// recipe_id matches recipes.recipe_id in the Postgres seed.
const project = db.getSiblingDB("project");
const now = new Date();

project.recipe_details.createIndex({ recipe_id: 1 }, { unique: true });
project.bookmarks.createIndex({ recipe_id: 1 }, { unique: true });

project.recipe_details.insertMany([
  {
    recipe_id: 1,
    author: "Order up!",
    updated_at: now,
    instructions: [
      "Whisk eggs and milk in a bowl until smooth and lightly aerated.",
      "Warm olive oil and minced garlic in a skillet over medium-low heat for 30 seconds.",
      "Pour in eggs and fold gently with a spatula until soft curds form. Serve warm.",
    ],
  },
  {
    recipe_id: 2,
    author: "Order up!",
    updated_at: now,
    instructions: [
      "Mash the banana in a bowl, then stir in oats, egg, and milk until combined.",
      "Heat a lightly oiled skillet over medium heat.",
      "Spoon batter into rounds and cook 2–3 minutes per side until golden.",
    ],
  },
  {
    recipe_id: 3,
    author: "Order up!",
    updated_at: now,
    instructions: [
      "Heat olive oil in a skillet over medium heat and sauté sliced garlic until fragrant.",
      "Add spinach in handfuls, tossing until just wilted.",
      "Season with salt and pepper and serve immediately.",
    ],
  },
  {
    recipe_id: 4,
    author: "Order up!",
    updated_at: now,
    instructions: [
      "Toss oats, almonds, and oil in a bowl.",
      "Spread evenly and bake at 165°C (325°F) for 20–25 minutes, stirring halfway.",
      "Cool completely so clusters turn crisp.",
    ],
  },
]);
