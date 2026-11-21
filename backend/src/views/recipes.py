from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from lib.db import USER_ID, mongo, pg
from pydantic import BaseModel, Field
from pymongo.errors import PyMongoError

router = APIRouter(prefix="/recipes")


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


@router.post("/search")
def search_recipes(body: SearchBody):
    # Ingredient/category includes are "any": a recipe needs at least one match
    # and ranks higher with more matches. Preference includes are "all".
    # Every exclude is a hard filter.
    with pg.connection() as conn:
        rows = conn.execute(
            """
            select r.recipe_id, r.recipe_name, r.cook_time_min, r.serving, r.image_path,
                   count(ri.ingredient_id) filter (where not ri.is_optional) as required_count,
                   count(ri.ingredient_id) filter (
                       where ri.ingredient_id = any(%(inc_i)s::int[])
                          or i.category_id = any(%(inc_c)s::int[])
                   ) as matched_count
            from recipes r
            left join recipe_ingredients ri using (recipe_id)
            left join ingredients i using (ingredient_id)
            where r.recipe_name ilike %(name)s
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
            order by matched_count desc, r.recipe_name, r.recipe_id
            limit %(limit)s offset %(offset)s
            """,
            {
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
                    "filters": body.model_dump(exclude={"name", "limit", "offset", "log"}),
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
                   ri.quantity_text, ri.is_optional
            from recipe_ingredients ri
            join ingredients i using (ingredient_id)
            join ingredient_categories c using (category_id)
            where ri.recipe_id = %s
            order by ri.is_optional, i.ingredient_name
            """,
            (recipe_id,),
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

    # Instructions, tips, pictures etc. live in Mongo; null if not added yet.
    recipe["details"] = mongo.recipe_details.find_one({"recipe_id": recipe_id}, {"_id": 0, "recipe_id": 0})
    return recipe
