from datetime import UTC, datetime
from typing import Literal

import psycopg
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from lib.audit import commit_with_audit
from lib.db import USER_ID, mongo, pg
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

router = APIRouter(prefix="/recipes")


class RecipeIngredientBody(BaseModel):
    ingredient_id: int
    quantity_text: str = Field("", max_length=64)
    is_optional: bool = False


class RecipeBody(BaseModel):
    recipe_name: str = Field(min_length=1, max_length=128)
    description: str = ""
    cook_time_min: int | None = Field(None, gt=0)
    serving: int | None = Field(None, gt=0)
    # Only the local category pictures can be picked.
    image_path: (
        Literal["images/savory.png", "images/dessert.png", "images/snack.png", "images/vegan-salad.png"]
        | None
    ) = None
    ingredients: list[RecipeIngredientBody] = []
    equipment_ids: list[int] = []
    preference_ids: list[int] = []
    # Stored in Mongo recipe_details
    author: str = ""
    instructions: list[str] = []


class RecipeUpdateBody(RecipeBody):
    recipe_id: int


class RecipeIdBody(BaseModel):
    recipe_id: int


def _write_links(conn: psycopg.Connection, recipe_id: int, body: RecipeBody):
    """Insert the recipe's ingredient, equipment and preference rows (used by create and update)."""
    with conn.cursor() as cur:
        cur.executemany(
            "insert into recipe_ingredients (recipe_id, ingredient_id, quantity_text, is_optional) values (%s, %s, %s, %s)",
            [(recipe_id, i.ingredient_id, i.quantity_text or None, i.is_optional) for i in body.ingredients],
        )
        cur.executemany(
            "insert into recipe_equipment (recipe_id, equipment_id) values (%s, %s)",
            [(recipe_id, e) for e in set(body.equipment_ids)],
        )
        cur.executemany(
            "insert into recipe_preferences (recipe_id, preference_id) values (%s, %s)",
            [(recipe_id, p) for p in set(body.preference_ids)],
        )


def _commit_recipe(conn: psycopg.Connection, recipe_id: int, body: RecipeBody | None, action: str, fields: dict):
    """Write (or, with body=None, delete) the Mongo recipe_details, then commit Postgres with an audit log.

    All or nothing: if any step fails, Postgres is rolled back and the previous recipe_details
    document is put back.
    """
    previous = mongo.recipe_details.find_one({"recipe_id": recipe_id})
    try:
        if body is None:
            mongo.recipe_details.delete_one({"recipe_id": recipe_id})
        else:
            mongo.recipe_details.update_one(
                {"recipe_id": recipe_id},
                {
                    "$set": {
                        "author": body.author,
                        "instructions": [step.strip() for step in body.instructions if step.strip()],
                        "updated_at": datetime.now(UTC),
                    }
                },
                upsert=True,
            )
        commit_with_audit(conn, action, fields)
    except Exception:
        conn.rollback()
        try:
            if previous is None:
                mongo.recipe_details.delete_one({"recipe_id": recipe_id})
            else:
                mongo.recipe_details.replace_one({"recipe_id": recipe_id}, previous, upsert=True)
        except PyMongoError:
            pass
        raise


class SearchBody(BaseModel):
    name: str = ""
    include_ingredients: list[int] = []
    exclude_ingredients: list[int] = []
    include_categories: list[int] = []
    exclude_categories: list[int] = []
    include_preferences: list[int] = []
    exclude_preferences: list[int] = []
    limit: int = Field(20, ge=1, le=100)
    offset: int = Field(0, ge=0)
    # The frontend sets this only when the user submits a search, not on every keystroke.
    log: bool = False
    # False skips the equipment cut-off and the missing-ingredient ranking ("Use my kitchen" off).
    # Allergies are always applied.
    use_inventory: bool = True


@router.post("/search")
def search_recipes(body: SearchBody):
    # Ingredient/category includes are "any": a recipe needs at least one match
    # and ranks higher with more matches. Preference includes are "all".
    # Every exclude is a hard filter.
    # Inventory: recipes needing equipment the user lacks, or containing a required allergen,
    # are cut. An optional allergen keeps the recipe but sorts it last (allergen_optional).
    # Then recipes rank by fewest missing ingredients; staples count as owned.
    with pg.connection() as conn:
        rows = conn.execute(
            """
            select r.recipe_id, r.recipe_name, r.cook_time_min, r.serving, r.image_path,
                   count(ri.ingredient_id) filter (where not ri.is_optional) as required_count,
                   count(ri.ingredient_id) filter (
                       where ri.ingredient_id = any(%(inc_i)s::int[])
                          or i.category_id = any(%(inc_c)s::int[])
                   ) as matched_count,
                   count(ri.ingredient_id) filter (
                       where not ri.is_optional and (ui.ingredient_id is not null or i.is_staple)
                   ) as owned_count,
                   count(ri.ingredient_id) filter (
                       where not ri.is_optional and ui.ingredient_id is null and not i.is_staple
                   ) as missing_count,
                   coalesce(bool_or(ua.ingredient_id is not null), false) as allergen_optional
            from recipes r
            left join recipe_ingredients ri using (recipe_id)
            left join ingredients i using (ingredient_id)
            left join user_ingredients ui on ui.ingredient_id = ri.ingredient_id and ui.user_id = %(u)s
            left join user_allergies ua on ua.ingredient_id = ri.ingredient_id and ua.user_id = %(u)s
            where r.recipe_name ilike %(name)s
              and (not %(inv)s or not exists (
                  select 1
                  from recipe_equipment re
                  where re.recipe_id = r.recipe_id
                    and re.equipment_id not in (select equipment_id from user_equipment where user_id = %(u)s)
              ))
              and not exists (
                  select 1
                  from recipe_ingredients a
                  join user_allergies aa on aa.ingredient_id = a.ingredient_id and aa.user_id = %(u)s
                  where a.recipe_id = r.recipe_id and not a.is_optional
              )
              and not exists (
                  select 1
                  from recipe_ingredients x
                  join ingredients xi using (ingredient_id)
                  where x.recipe_id = r.recipe_id
                    and (x.ingredient_id = any(%(exc_i)s::int[]) or xi.category_id = any(%(exc_c)s::int[]))
              )
              and not exists (
                  select 1
                  from recipe_preferences p
                  where p.recipe_id = r.recipe_id and p.preference_id = any(%(exc_p)s::int[])
              )
              and (
                  select count(*)
                  from recipe_preferences p
                  where p.recipe_id = r.recipe_id and p.preference_id = any(%(inc_p)s::int[])
              ) = cardinality(%(inc_p)s::int[])
            group by r.recipe_id
            having cardinality(%(inc_i)s::int[]) + cardinality(%(inc_c)s::int[]) = 0
                or count(ri.ingredient_id) filter (
                       where ri.ingredient_id = any(%(inc_i)s::int[])
                          or i.category_id = any(%(inc_c)s::int[])
                   ) > 0
            order by allergen_optional, matched_count desc,
                     case when %(inv)s then count(ri.ingredient_id) filter (
                         where not ri.is_optional and ui.ingredient_id is null and not i.is_staple
                     ) end,
                     r.recipe_name, r.recipe_id
            limit %(limit)s offset %(offset)s
            """,
            {
                "u": USER_ID,
                "inv": body.use_inventory,
                "name": f"%{body.name}%",
                "inc_i": body.include_ingredients,
                "exc_i": body.exclude_ingredients,
                "inc_c": body.include_categories,
                "exc_c": body.exclude_categories,
                "inc_p": list(set(body.include_preferences)),
                "exc_p": body.exclude_preferences,
                "limit": body.limit,
                "offset": body.offset,
            },
        ).fetchall()

        if body.log:
            inventory = conn.execute(
                """
                select array(select ingredient_id from user_ingredients where user_id = %(u)s) as ingredients,
                       array(select equipment_id from user_equipment where user_id = %(u)s) as equipment
                """,
                {"u": USER_ID},
            ).fetchone()

    # History is best-effort: a Mongo outage must not hide the search results.
    if body.log:
        try:
            mongo.search_history.insert_one(
                {
                    "name": body.name,
                    "filters": body.model_dump(exclude={"name", "limit", "offset", "log", "use_inventory"}),
                    "use_inventory": body.use_inventory,
                    "available_ingredients": inventory["ingredients"],
                    "available_equipment": inventory["equipment"],
                    "result_ids": [row["recipe_id"] for row in rows],
                    "searched_at": datetime.now(UTC),
                }
            )
        except PyMongoError:
            pass
    return rows


@router.get("/{recipe_id}")
def get_recipe(recipe_id: int):
    with pg.connection() as conn:
        recipe = conn.execute(
            """
            select recipe_id, recipe_name, description, cook_time_min, serving, image_path
            from recipes
            where recipe_id = %s
            """,
            (recipe_id,),
        ).fetchone()
        if recipe is None:
            return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Recipe not found"})

        recipe["ingredients"] = conn.execute(
            """
            select i.ingredient_id, i.ingredient_name, i.category_id, c.category_name, i.is_staple,
                   ri.quantity_text, ri.is_optional,
                   -- Same rule as missing_count in search: owned if in inventory or a staple.
                   (ui.ingredient_id is not null or i.is_staple) as owned
            from recipe_ingredients ri
            join ingredients i using (ingredient_id)
            join ingredient_categories c using (category_id)
            left join user_ingredients ui on ui.ingredient_id = ri.ingredient_id and ui.user_id = %s
            where ri.recipe_id = %s
            order by ri.is_optional, i.ingredient_name
            """,
            (USER_ID, recipe_id),
        ).fetchall()
        recipe["equipment"] = conn.execute(
            """
            select e.equipment_id, e.equipment_name
            from recipe_equipment re
            join equipment e using (equipment_id)
            where re.recipe_id = %s
            order by e.equipment_name
            """,
            (recipe_id,),
        ).fetchall()
        recipe["preferences"] = conn.execute(
            """
            select p.preference_id, p.preference_name
            from recipe_preferences rp
            join preferences p using (preference_id)
            where rp.recipe_id = %s
            order by p.preference_name
            """,
            (recipe_id,),
        ).fetchall()

    # Author, instructions etc. live in Mongo; details is null if not added yet or Mongo is down.
    # Opening a recipe also logs the visit to visited_recipes.
    recipe["details"] = None
    try:
        recipe["details"] = mongo.recipe_details.find_one({"recipe_id": recipe_id}, {"_id": 0, "recipe_id": 0})
        mongo.visited_recipes.insert_one({"recipe_id": recipe_id, "visited_at": datetime.now(UTC)})
    except PyMongoError:
        pass
    return recipe


# Recipe create/update/delete. Each one is a single transaction across Postgres
# (recipes + its 3 link tables) and Mongo (recipe_details + audit_logs).


@router.post("/create")
def create_recipe(body: RecipeBody):
    with pg.connection() as conn:
        try:
            recipe_id = conn.execute(
                """
                insert into recipes (recipe_name, description, cook_time_min, serving, image_path)
                values (%s, %s, %s, %s, %s)
                returning recipe_id
                """,
                (body.recipe_name, body.description or None, body.cook_time_min, body.serving, body.image_path),
            ).fetchone()["recipe_id"]
            _write_links(conn, recipe_id, body)
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            return JSONResponse(status_code=400, content={"errorCode": 11, "error": "Unknown ingredient/equipment/preference id"})
        except psycopg.errors.UniqueViolation:
            conn.rollback()
            return JSONResponse(status_code=409, content={"errorCode": 12, "error": "Ingredient listed twice"})

        _commit_recipe(conn, recipe_id, body, "add_recipe", {"id": recipe_id, "name": body.recipe_name})
    return {"recipe_id": recipe_id}


@router.post("/update")
def update_recipe(body: RecipeUpdateBody):
    with pg.connection() as conn:
        try:
            old = conn.execute(
                "select recipe_name from recipes where recipe_id = %s for update", (body.recipe_id,)
            ).fetchone()
            if old is None:
                conn.rollback()
                return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Recipe not found"})

            conn.execute(
                """
                update recipes
                set recipe_name = %s, description = %s, cook_time_min = %s, serving = %s, image_path = %s
                where recipe_id = %s
                """,
                (
                    body.recipe_name,
                    body.description or None,
                    body.cook_time_min,
                    body.serving,
                    body.image_path,
                    body.recipe_id,
                ),
            )
            # Replace the links with the submitted ones.
            conn.execute("delete from recipe_ingredients where recipe_id = %s", (body.recipe_id,))
            conn.execute("delete from recipe_equipment where recipe_id = %s", (body.recipe_id,))
            conn.execute("delete from recipe_preferences where recipe_id = %s", (body.recipe_id,))
            _write_links(conn, body.recipe_id, body)
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            return JSONResponse(status_code=400, content={"errorCode": 11, "error": "Unknown ingredient/equipment/preference id"})
        except psycopg.errors.UniqueViolation:
            conn.rollback()
            return JSONResponse(status_code=409, content={"errorCode": 12, "error": "Ingredient listed twice"})

        _commit_recipe(
            conn, body.recipe_id, body, "edit_recipe", {"old_val": old["recipe_name"], "new_val": body.recipe_name}
        )
    return {"recipe_id": body.recipe_id}


@router.post("/delete")
def delete_recipe(body: RecipeIdBody):
    with pg.connection() as conn:
        # Link rows are removed by "on delete cascade".
        row = conn.execute(
            "delete from recipes where recipe_id = %s returning recipe_name", (body.recipe_id,)
        ).fetchone()
        if row is None:
            conn.rollback()
            return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Recipe not found"})

        _commit_recipe(conn, body.recipe_id, None, "delete_recipe", {"id": body.recipe_id, "name": row["recipe_name"]})
    return {"recipe_id": body.recipe_id}
