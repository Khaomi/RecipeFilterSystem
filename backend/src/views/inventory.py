from typing import Literal

import psycopg
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from lib.audit import commit_with_audit
from lib.db import USER_ID, pg
from psycopg import sql
from pydantic import BaseModel

router = APIRouter(prefix="/inventory")

Kind = Literal["ingredients", "equipment", "allergies"]

# Fixed table/column names per kind, so request input never reaches the SQL text.
TABLES = {
    kind: {
        "user": sql.Identifier(user_table),
        "col": sql.Identifier(id_col),
        "cat": sql.Identifier(catalog_table),
        "name": sql.Identifier(name_col),
    }
    for kind, (user_table, id_col, catalog_table, name_col) in {
        "ingredients": ("user_ingredients", "ingredient_id", "ingredients", "ingredient_name"),
        "equipment": ("user_equipment", "equipment_id", "equipment", "equipment_name"),
        "allergies": ("user_allergies", "ingredient_id", "ingredients", "ingredient_name"),
    }.items()
}
# Used in audit_logs actions, e.g. "add_ingredient", "edit_equipment", "delete_allergy".
NOUN = {"ingredients": "ingredient", "equipment": "equipment", "allergies": "allergy"}


class ItemBody(BaseModel):
    id: int


class UpdateBody(BaseModel):
    old_id: int
    new_id: int


@router.get("/{kind}")
def list_items(kind: Kind):
    with pg.connection() as conn:
        return conn.execute(
            sql.SQL(
                """
                select c.{col} as id, c.{name} as name
                from {user} u
                join {cat} c using ({col})
                where u.user_id = %s
                order by c.{name}
                """
            ).format(**TABLES[kind]),
            (USER_ID,),
        ).fetchall()


@router.post("/{kind}/add")
def add_item(kind: Kind, body: ItemBody):
    t = TABLES[kind]
    with pg.connection() as conn:
        try:
            conn.execute(
                sql.SQL("insert into {user} (user_id, {col}) values (%s, %s)").format(**t),
                (USER_ID, body.id),
            )
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            return JSONResponse(status_code=400, content={"errorCode": 11, "error": "Unknown item id"})
        except psycopg.errors.UniqueViolation:
            conn.rollback()
            return JSONResponse(status_code=409, content={"errorCode": 12, "error": "Already in inventory"})

        name = conn.execute(
            sql.SQL("select {name} as name from {cat} where {col} = %s").format(**t), (body.id,)
        ).fetchone()["name"]
        commit_with_audit(conn, f"add_{NOUN[kind]}", {"id": body.id, "name": name})
    return {"id": body.id, "name": name}


@router.post("/{kind}/update")
def update_item(kind: Kind, body: UpdateBody):
    t = TABLES[kind]
    with pg.connection() as conn:
        try:
            cur = conn.execute(
                sql.SQL("update {user} set {col} = %s where user_id = %s and {col} = %s").format(**t),
                (body.new_id, USER_ID, body.old_id),
            )
        except psycopg.errors.ForeignKeyViolation:
            conn.rollback()
            return JSONResponse(status_code=400, content={"errorCode": 11, "error": "Unknown item id"})
        except psycopg.errors.UniqueViolation:
            conn.rollback()
            return JSONResponse(status_code=409, content={"errorCode": 12, "error": "Already in inventory"})
        if cur.rowcount == 0:
            conn.rollback()
            return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Not in inventory"})

        names = {
            row["id"]: row["name"]
            for row in conn.execute(
                sql.SQL("select {col} as id, {name} as name from {cat} where {col} = any(%s)").format(**t),
                ([body.old_id, body.new_id],),
            )
        }
        commit_with_audit(
            conn,
            f"edit_{NOUN[kind]}",
            {"old_val": names[body.old_id], "new_val": names[body.new_id]},
        )
    return {"id": body.new_id, "name": names[body.new_id]}


@router.post("/{kind}/delete")
def delete_item(kind: Kind, body: ItemBody):
    with pg.connection() as conn:
        row = conn.execute(
            sql.SQL(
                """
                delete from {user} u
                using {cat} c
                where u.user_id = %s and u.{col} = %s and c.{col} = u.{col}
                returning c.{name} as name
                """
            ).format(**TABLES[kind]),
            (USER_ID, body.id),
        ).fetchone()
        if row is None:
            conn.rollback()
            return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Not in inventory"})

        commit_with_audit(conn, f"delete_{NOUN[kind]}", {"id": body.id, "name": row["name"]})
    return {"id": body.id}
