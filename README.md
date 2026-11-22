# Order up! — Recipe Filter System

A local web app that answers *"what can I cook with what I have?"*. You tell it which ingredients, equipment and allergies you have, and it finds recipes you can actually make. It hides recipes that need equipment you don't own or that contain your allergens, and ranks the rest by how few ingredients you're missing.

It is a hybrid-database project: **PostgreSQL** holds the structured, relational data (recipes, ingredients, your kitchen) and **MongoDB** holds flexible, document-style data (recipe directions, bookmarks, history, audit log).

> **Video presentation:** _TODO: add link_

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [How to run](#how-to-run)
- [Environment variables](#environment-variables)
- [Database design](#database-design)
- [Transactions and rollback](#transactions-and-rollback)
- [API reference](#api-reference)
- [Project structure](#project-structure)
- [Screenshots](#screenshots)

## Features

- **Recipe search**: search by name, include/exclude ingredients or whole ingredient categories, and include/exclude dietary preferences (vegan, keto, gluten intolerance…).
- **Uses your kitchen**: recipes needing equipment you don't have are hidden, and results are ranked by fewest missing ingredients (staples like salt count as owned). A **"Use my kitchen"** toggle turns this off to browse everything.
- **Allergies**: recipes that require one of your allergens are always hidden. If the allergen is optional, the recipe is kept but sorted last with a warning.
- **Recipe page**: picture, cook time, servings, directions, and an ingredient list that highlights what you're missing.
- **My kitchen**: create, read, update and delete your ingredients, equipment and allergies.
- **Recipe editor**: create, edit and delete recipes, including their ingredients, equipment, preferences, author and directions.
- **Bookmarks, search history, visited recipes**: saved in MongoDB, viewable and deletable from the app.
- **Activity log**: every kitchen and recipe change is recorded in MongoDB.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React Native (Expo) running as a web app via react-native-web, TypeScript |
| Backend | Python, FastAPI, Uvicorn |
| Relational database | PostgreSQL 18 (driver: psycopg 3) |
| Document database | MongoDB 9 (driver: PyMongo) |
| Running everything | Docker Compose |

Everything runs locally: there are no external APIs or cloud services, and recipe images are served from the backend's own folder (`backend/src/images`).

## Architecture

> _TODO: add the system architecture diagram (e.g. `docs/architecture.png`)._

```
Browser ──► Frontend (Expo web, :8081) ──HTTP/JSON──► Backend (FastAPI, :8000)
                                                        │            │
                                                        ▼            ▼
                                               PostgreSQL :5432   MongoDB :27017
```

The frontend only talks to the backend; the backend is the only thing that talks to the databases. All four run as Docker Compose services.

## How to run

Requirements: [Docker](https://www.docker.com/) with Docker Compose.

1. Copy `.env.example` to `.env`. Every value has a working default (see [Environment variables](#environment-variables)), so you can leave it as is.
2. Start the app in one of the two modes below.
3. Open **http://localhost:8081**. The first load takes a few seconds while the frontend bundles.

The API runs on http://localhost:8000, with interactive docs at **http://localhost:8000/docs**.

### Production

```bash
docker compose -f compose.yml up -d --build
```

> [!IMPORTANT]
> `-f compose.yml` is required and must come **before** `up`. Without it, Docker also merges `compose.override.yml` and runs the development setup.

Stop it with `docker compose -f compose.yml down`.

### Development

```bash
docker compose watch
```

This restarts a container whenever a file in its `src` folder changes, and rebuilds it when `backend/pyproject.toml` or `frontend/package.json` changes. Run only one watcher at a time. If a stale container-name conflict appears, clean up and start again:

```bash
docker compose down --remove-orphans
docker compose watch
```

### Resetting the database

Postgres and MongoDB only run the schema and seed files the **first time** they start with empty volumes. To reload them (for example after the schema or seed changes), delete the volumes:

```bash
docker compose down -v
```

> [!WARNING]
> `down -v` deletes all data in both databases, including your kitchen, bookmarks and history.

The seed files are:

| File | Loaded into | Contents |
|---|---|---|
| `backend/src/recipe_schema_ver_02.sql` | Postgres | Schema |
| `backend/src/seed_user_demo.sql` | Postgres | Demo user, ingredient catalog, equipment, preferences, demo kitchen |
| `backend/src/seed_recipes.sql` | Postgres | 45 recipes with their ingredients, equipment and preferences |
| `backend/src/mongo_seed.js` | MongoDB | Directions for all 45 recipes, plus indexes |

## Environment variables

Set these in `.env`. All of them are optional because `compose.yml` has defaults.

| Variable | Default | Used by |
|---|---|---|
| `POSTGRES_DB` | `project` | Postgres, backend |
| `POSTGRES_USER` | `project` | Postgres, backend |
| `POSTGRES_PASSWORD` | _(set in `compose.yml`)_ | Postgres, backend |
| `MONGO_INITDB_ROOT_USERNAME` | `project` | MongoDB, backend |
| `MONGO_INITDB_ROOT_PASSWORD` | _(set in `compose.yml`)_ | MongoDB, backend |
| `BACKEND_PORT` | `8000` | Host port for the API |
| `FRONTEND_PORT` | `8081` | Host port for the web app |
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Where the browser sends API requests |

The backend builds its database connection strings (`POSTGRESDB_URL`, `MONGODB_URL`) from these values in `compose.yml`. Inside its container the backend always listens on port 8000.

## Database design

This is a single-user local app: one user (id 1) is seeded and every "my kitchen" row belongs to them.

### PostgreSQL (relational)

> _TODO: add the ER diagram (e.g. `docs/er-diagram.png`)._

| Table | Purpose | Key columns |
|---|---|---|
| `ingredient_categories` | Big-scope groups (Dairy, Vegetable…) | `category_id` PK, `category_name` unique |
| `ingredients` | Ingredient catalog | `ingredient_id` PK, `category_id` FK, `is_staple` |
| `equipment` | Equipment catalog | `equipment_id` PK, `equipment_name` unique |
| `preferences` | Dietary preferences | `preference_id` PK, `preference_name` unique |
| `recipes` | Recipes | `recipe_id` PK, `recipe_name`, `cook_time_min`, `serving`, `image_path` |
| `recipe_ingredients` | Recipe ↔ ingredient, with amount | PK (`recipe_id`, `ingredient_id`), `quantity_text`, `is_optional` |
| `recipe_equipment` | Recipe ↔ equipment | PK (`recipe_id`, `equipment_id`) |
| `recipe_preferences` | Recipe ↔ preference it suits | PK (`recipe_id`, `preference_id`) |
| `users` | The local user | `user_id` PK |
| `user_ingredients` | Ingredients the user has | PK (`user_id`, `ingredient_id`) |
| `user_equipment` | Equipment the user has | PK (`user_id`, `equipment_id`) |
| `user_allergies` | Ingredients the user is allergic to | PK (`user_id`, `ingredient_id`) |
| `user_preferences`, `tags`, `recipe_tags` | In the schema, not used by the app yet | |

The schema is normalised to 3NF. Deleting a recipe cascades to its link rows. An ingredient, category or piece of equipment that is still in use can't be deleted (`on delete restrict`); deleting a preference removes it from recipes (`on delete cascade`).

### MongoDB (documents)

> _TODO: add the NoSQL schema diagram (e.g. `docs/nosql-schema.png`)._

Database `project`, five collections:

| Collection | Purpose | Document fields |
|---|---|---|
| `recipe_details` | Free-form recipe content | `recipe_id` (unique), `author`, `instructions[]`, `updated_at` |
| `bookmarks` | Saved recipes | `recipe_id` (unique), `bookmarked_at` |
| `search_history` | Submitted searches | `name`, `filters{}`, `use_inventory`, `available_ingredients[]`, `available_equipment[]`, `result_ids[]`, `searched_at` |
| `visited_recipes` | Recipes the user opened | `recipe_id`, `visited_at` |
| `audit_logs` | Every kitchen and recipe change | `action` (e.g. `add_ingredient`, `edit_recipe`), `fields{}`, `logged_at` |

`recipe_id` links documents to rows in Postgres. Dates are stored in UTC and returned in Thai time (UTC+7).

### CRUD coverage

| Entity | Create | Read | Update | Delete | Where in the app |
|---|:-:|:-:|:-:|:-:|---|
| Recipes + links (Postgres) | ✅ | ✅ | ✅ | ✅ | Sidebar → New recipe; recipe page → Edit / Delete |
| `recipe_details` (Mongo) | ✅ | ✅ | ✅ | ✅ | Same as recipes |
| My ingredients / equipment / allergies (Postgres) | ✅ | ✅ | ✅ | ✅ | Sidebar → Ingredients / Equipments / Allergies |
| Bookmarks (Mongo) | ✅ | ✅ | – | ✅ | Heart button; Sidebar → Bookmark |
| Search history (Mongo) | ✅ | ✅ | – | ✅ | Press Enter in search; Sidebar → History |
| Visited recipes (Mongo) | ✅ | ✅ | – | ✅ | Opening a recipe; Sidebar → History |
| Audit log (Mongo) | ✅ | ✅ | – | – | Written automatically; Sidebar → History → Activity log |
| Catalog: ingredients, categories, equipment, preferences (Postgres) | – | ✅ | – | – | Search filters and pickers |

## Transactions and rollback

Changes that touch several tables and both databases run as one unit: either everything is saved or nothing is.

**Changing your kitchen** (`/inventory/...`):

1. Change the row in `user_ingredients` / `user_equipment` / `user_allergies` inside a Postgres transaction.
2. Write an entry to Mongo `audit_logs`.
3. Commit Postgres. If the audit log can't be written, Postgres is **rolled back**; if the commit fails, the audit entry is deleted again.

**Creating, editing or deleting a recipe** (`/recipes/create|update|delete`):

1. In one Postgres transaction, write `recipes` and replace its rows in `recipe_ingredients`, `recipe_equipment` and `recipe_preferences`.
2. Write (upsert) or delete its Mongo `recipe_details`.
3. Write an `audit_logs` entry and commit Postgres.
4. If any step fails, Postgres is **rolled back** and the previous `recipe_details` document is restored.

**Try the rollback yourself:**

```bash
docker compose stop mongodb
# In the app: add an ingredient, or edit a recipe and save → you get an error
docker compose start mongodb
# Check: the ingredient/recipe is unchanged
```

The code is in `backend/src/lib/audit.py` (`commit_with_audit`) and `backend/src/views/recipes.py` (`_commit_recipe`).

## API reference

Interactive docs: **http://localhost:8000/docs**.

Conventions:

- Only `GET` and `POST` are used. Request and response bodies are JSON.
- Errors look like `{"errorCode": 20, "error": "Recipe not found"}`. The first digit is the kind of failure: **1x** bad input, **2x** not found, **3x** database failure (changes rolled back). Codes are specific to each endpoint, and `error` is for developers only (the frontend shows its own wording).
- Errors that apply to every endpoint: **10** invalid request (422) and **30** database error (500).

### Catalog

| Method & path | Input | Returns |
|---|---|---|
| `GET /catalog/ingredients` | `q`, `category_id` (query, optional) | `[{ingredient_id, ingredient_name, category_id, category_name, is_staple}]` |
| `GET /catalog/categories` | none | `[{category_id, category_name}]` |
| `GET /catalog/equipment` | `q` (optional) | `[{equipment_id, equipment_name}]` |
| `GET /catalog/preferences` | none | `[{preference_id, preference_name}]` |

### Recipes

| Method & path | Input | Returns | Errors |
|---|---|---|---|
| `POST /recipes/search` | body below | `[{recipe_id, recipe_name, cook_time_min, serving, image_path, required_count, matched_count, owned_count, missing_count, allergen_optional}]` | |
| `GET /recipes/{id}` | path `id` | recipe fields + `ingredients[]` (with `quantity_text`, `is_optional`, `owned`), `equipment[]`, `preferences[]`, `details` (`{author, updated_at, instructions[]}` or `null`). Also logs a visit. | 20 |
| `POST /recipes/create` | recipe body below | `{recipe_id}` | 11, 12 |
| `POST /recipes/update` | `recipe_id` + recipe body | `{recipe_id}` | 11, 12, 20 |
| `POST /recipes/delete` | `{recipe_id}` | `{recipe_id}` | 20 |

Search body (all fields optional):

| Field | Type | Meaning |
|---|---|---|
| `name` | string | Part of the recipe name (case-insensitive) |
| `include_ingredients`, `include_categories` | int[] | Recipe must contain **any** of these; more matches rank higher |
| `exclude_ingredients`, `exclude_categories` | int[] | Recipe must contain **none** of these |
| `include_preferences` | int[] | Recipe must suit **all** of these |
| `exclude_preferences` | int[] | Recipe must suit **none** of these |
| `use_inventory` | bool, default `true` | Apply the equipment cut-off and the missing-ingredient ranking |
| `log` | bool, default `false` | Save this search to `search_history` |
| `limit`, `offset` | int (1–100, default 20), int | Paging |

Recipe body (create/update):

| Field | Type |
|---|---|
| `recipe_name` | string, required, max 128 |
| `description` | string |
| `cook_time_min`, `serving` | int > 0, or `null` |
| `image_path` | one of `images/savory.png`, `images/dessert.png`, `images/snack.png`, `images/vegan-salad.png`, or `null` |
| `ingredients` | `[{ingredient_id, quantity_text, is_optional}]` |
| `equipment_ids`, `preference_ids` | int[] |
| `author` | string (stored in Mongo) |
| `instructions` | string[] (stored in Mongo; blank lines are dropped) |

Recipe errors: **11** unknown ingredient/equipment/preference id, **12** same ingredient listed twice, **20** recipe not found.

### My kitchen

`{kind}` is `ingredients`, `equipment` or `allergies`.

| Method & path | Body | Returns | Errors |
|---|---|---|---|
| `GET /inventory/{kind}` | none | `[{id, name}]` | |
| `POST /inventory/{kind}/add` | `{id}` | `{id, name}` | 11 unknown id, 12 already added |
| `POST /inventory/{kind}/update` | `{old_id, new_id}` | `{id, name}` | 11, 12, 20 not in your kitchen |
| `POST /inventory/{kind}/delete` | `{id}` | `{id}` | 20 |

### Bookmarks

| Method & path | Body | Returns | Errors |
|---|---|---|---|
| `GET /bookmarks` | none | `[{recipe_id, recipe_name, cook_time_min, serving, image_path, bookmarked_at}]` | |
| `POST /bookmarks/add` | `{recipe_id}` | `{recipe_id}` | 12 already bookmarked, 20 no such recipe |
| `POST /bookmarks/delete` | `{recipe_id}` | `{recipe_id}` | 20 not bookmarked |

### History and activity

| Method & path | Body | Returns | Errors |
|---|---|---|---|
| `GET /history/searches` | none | last 50 `search_history` documents | |
| `GET /history/visited` | none | last 50 visits, with recipe name, time and picture | |
| `GET /history/audit` | none | last 100 `audit_logs` documents | |
| `POST /history/delete` | `{kind: "searches" \| "visited", id}` | `{id}` | 11 invalid id, 20 not found |
| `POST /history/clear` | `{kind}` | `{deleted}` | |

### Images

`GET /images/{file}` serves the local recipe pictures. `recipes.image_path` holds a relative path such as `images/savory.png`.

## Project structure

```
backend/
  Dockerfile, pyproject.toml
  src/
    main.py                 FastAPI app, error handlers, routes, /images
    lib/db.py               Postgres pool, Mongo client, USER_ID
    lib/audit.py            commit_with_audit (Postgres commit + Mongo audit log)
    views/catalog.py        /catalog
    views/recipes.py        /recipes (search, detail, create/update/delete)
    views/inventory.py      /inventory
    views/bookmarks.py      /bookmarks
    views/history.py        /history
    images/                 Local recipe pictures
    recipe_schema_ver_02.sql, seed_user_demo.sql, seed_recipes.sql, mongo_seed.js
frontend/
  Dockerfile, package.json, app.json, index.js
  src/
    App.tsx                 Home page: search, filters, recipe grid
    api/orderUpApi.ts       API client and types
    components/             Sidebar, inventory, history and recipe editor modals
    Equipment/RecipeDetailModal.tsx   Recipe page
compose.yml                 Production services
compose.override.yml        Development (watch) settings
```

## Screenshots

> _TODO: add annotated screenshots to `docs/screenshots/`: every CRUD action, Mongo data, and the transaction before/after plus the rollback scenario._
