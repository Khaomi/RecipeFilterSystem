# System Architecture of "Order up!" RecipeFilterSystem

## 1. Overview

```mermaid
flowchart LR
    user(["User<br/>Web browser"])

    subgraph docker["Docker Compose"]
        subgraph fe["frontend container · node:22-alpine"]
            expo["Expo dev server (web)<br/>React Native + react-native-web<br/>TypeScript · :8081"]
        end

        subgraph be["backend container · python:3.15-alpine"]
            api["FastAPI + Uvicorn · :8000<br/>CORS: localhost:8081"]
            routers["Routers<br/>/catalog · /recipes · /inventory<br/>/bookmarks · /history"]
            static["StaticFiles<br/>/images → backend/src/images"]
            lib["lib/db.py<br/>psycopg ConnectionPool · MongoClient<br/>lib/audit.py<br/>commit_with_audit()"]
            api --> routers --> lib
            api --> static
        end

        pg[("PostgreSQL 18.6<br/>db: project<br/>Relational data")]
        mg[("MongoDB 9.0<br/>db: project<br/>Documents and logs")]
    end

    user -->|"1. load app<br/>http://localhost:8081"| expo
    user -->|"2. fetch JSON / images<br/>EXPO_PUBLIC_API_URL<br/>http://localhost:8000"| api
    lib -->|"POSTGRESDB_URL<br/>psycopg 3"| pg
    lib -->|"MONGODB_URL<br/>pymongo"| mg
```


## 2. Containers (`compose.yml`)

| Service | Image / Build | Published port | Seed | Volume |
|---|---|---|---|---|
| frontend | `frontend/Dockerfile` (node 22, pnpm, `expo start --web`) | `${FRONTEND_PORT:-8081}:8081` | — | — |
| backend | `backend/Dockerfile` (Python 3.15, uv, FastAPI, Uvicorn) | `${BACKEND_PORT:-8000}:8000` | — | — |
| postgresql | `postgres:18.6-alpine` | internal 5432 | `01_schema.sql` ← `recipe_schema_ver_02.sql`<br/>`02_seed_user_demo.sql`<br/>`03_seed_recipes.sql` | `postgres_data` |
| mongodb | `mongo:9.0` | internal 27017 | `01_seed.js` ← `mongo_seed.js` | `mongo_data` |

The seed scripts in `/docker-entrypoint-initdb.d` run **only on an empty volume**.
To reseed, run `docker compose down -v`.

```mermaid
flowchart LR
    pg["postgresql<br/>healthcheck pg_isready"] -->|service_healthy| be["backend"]
    mg["mongodb<br/>healthcheck mongosh ping"] -->|service_healthy| be
    be -->|service_started| fe["frontend"]
```

## 3. Backend API and data ownership

```mermaid
flowchart LR
    subgraph routers["FastAPI routers"]
        cat["/catalog<br/>GET ingredients · categories<br/>equipment · preferences"]
        rec["/recipes<br/>POST search · GET {id}<br/>POST create · update · delete"]
        inv["/inventory/{kind}<br/>kind = ingredients | equipment | allergies<br/>GET · add · update · delete"]
        bm["/bookmarks<br/>GET · add · delete"]
        hist["/history<br/>GET searches · visited · audit<br/>POST delete · clear"]
    end

    subgraph PG["PostgreSQL"]
        pgc["ingredient_categories · ingredients<br/>equipment · tags · preferences"]
        pgr["recipes + recipe_ingredients<br/>recipe_equipment · recipe_tags · recipe_preferences"]
        pgu["users + user_ingredients · user_equipment<br/>user_allergies · user_preferences"]
    end

    subgraph MG["MongoDB"]
        md["recipe_details<br/>(cooking steps)"]
        mb["bookmarks"]
        ms["search_history"]
        mv["visited_recipes"]
        ma["audit_logs"]
    end

    cat --> pgc
    rec --> pgr
    rec -->|"search reads inventory"| pgu
    rec --> md
    rec -->|"log search (best-effort)"| ms
    rec -->|"GET {id}"| mv
    rec -->|"create / update / delete"| ma
    inv --> pgu
    inv -->|"add / update / delete"| ma
    bm --> mb
    hist --> ms & mv & ma
```

**Split of responsibilities**
- **PostgreSQL** holds structured, relational data: the catalog, recipes and their M:N relations, and the user's inventory, allergies and preferences.
  The search runs here: include/exclude filters and ranking by fewest missing ingredients, with staples counted as owned.
- **MongoDB** holds flexible documents and logs: cooking steps, bookmarks, search and visit history, and the audit trail.

## 4. Cross-database consistency (write path)

```mermaid
sequenceDiagram
    participant B as Browser
    participant A as FastAPI router
    participant P as PostgreSQL
    participant M as MongoDB

    B->>A: POST /inventory/ingredients/add
    A->>P: BEGIN, then INSERT user_ingredients
    A->>M: insert audit_logs {action, fields, logged_at}
    alt Mongo insert fails
        A->>P: ROLLBACK
        A-->>B: 500 {errorCode: 30}
    else Mongo OK
        A->>P: COMMIT
        alt COMMIT fails
            A->>M: delete that audit_logs doc
            A-->>B: 500 {errorCode: 30}
        else
            A-->>B: 200 OK
        end
    end
```


## 5. Development and CI

```mermaid
flowchart LR
    dev(["Developer"]) -->|"docker compose watch"| ovr["compose.override.yml"]
    ovr -->|"frontend/src → /app/src<br/>backend/src → /app/backend/src<br/>sync+restart"| svc["containers"]
    ovr -->|"package.json / pyproject.toml / Dockerfile<br/>rebuild"| svc

    push(["git push / PR"]) --> ci["GitHub Actions"]
    ci --> s1["uv sync"] --> s2["ruff check"] --> s3["validate compose<br/>prod + dev"] --> s4["docker build<br/>frontend & backend"]
```

## Tech stack summary

| Layer | Technology |
|---|---|
| Frontend | Expo 58, React 19.3, React Native 0.88 + react-native-web, TypeScript |
| Backend | Python 3.15, FastAPI, Uvicorn, psycopg 3 + psycopg-pool, pymongo |
| Databases | PostgreSQL 18.6, MongoDB 9.0 |
| Tooling | Docker Compose (watch), uv workspace, pnpm, ruff, GitHub Actions |
