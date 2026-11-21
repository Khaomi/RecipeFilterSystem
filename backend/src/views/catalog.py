from fastapi import APIRouter
from lib.db import pg

router = APIRouter(prefix="/catalog")


@router.get("/ingredients")
def list_ingredients(q: str = "", category_id: int | None = None):
    with pg.connection() as conn:
        return conn.execute(
            """
            select i.ingredient_id, i.ingredient_name, i.category_id, c.category_name, i.is_staple
            from ingredients i
            join ingredient_categories c using (category_id)
            where i.ingredient_name ilike %(q)s
              and (%(category_id)s::int is null or i.category_id = %(category_id)s)
            order by i.ingredient_name
            """,
            {"q": f"%{q}%", "category_id": category_id},
        ).fetchall()


@router.get("/categories")
def list_categories():
    with pg.connection() as conn:
        return conn.execute(
            "select category_id, category_name from ingredient_categories order by category_name"
        ).fetchall()


@router.get("/equipment")
def list_equipment(q: str = ""):
    with pg.connection() as conn:
        return conn.execute(
            """
            select equipment_id, equipment_name
            from equipment
            where equipment_name ilike %s
            order by equipment_name
            """,
            (f"%{q}%",),
        ).fetchall()


@router.get("/preferences")
def list_preferences():
    with pg.connection() as conn:
        return conn.execute(
            "select preference_id, preference_name from preferences order by preference_name"
        ).fetchall()
