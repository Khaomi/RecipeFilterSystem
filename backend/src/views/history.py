from typing import Literal

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter
from fastapi.responses import JSONResponse
from lib.db import mongo, pg
from pydantic import BaseModel

router = APIRouter(prefix="/history")

Kind = Literal["searches", "visited"]
COLLECTIONS = {"searches": "search_history", "visited": "visited_recipes"}


class DeleteBody(BaseModel):
    kind: Kind
    id: str


class ClearBody(BaseModel):
    kind: Kind


@router.get("/searches")
def list_searches():
    docs = mongo.search_history.find().sort("searched_at", -1).limit(50)
    return [{**doc, "_id": str(doc["_id"])} for doc in docs]


@router.get("/visited")
def list_visited():
    docs = list(mongo.visited_recipes.find().sort("visited_at", -1).limit(50))
    with pg.connection() as conn:
        recipes = {
            row["recipe_id"]: row
            for row in conn.execute(
                """
                select recipe_id, recipe_name, cook_time_min, serving, image_path
                from recipes
                where recipe_id = any(%s)
                """,
                (list({doc["recipe_id"] for doc in docs}),),
            )
        }
    # Visits of recipes that were deleted from Postgres are skipped.
    return [
        {**recipes[doc["recipe_id"]], **doc, "_id": str(doc["_id"])}
        for doc in docs
        if doc["recipe_id"] in recipes
    ]


@router.get("/audit")
def list_audit_logs():
    docs = mongo.audit_logs.find().sort("logged_at", -1).limit(100)
    return [{**doc, "_id": str(doc["_id"])} for doc in docs]


@router.post("/delete")
def delete_entry(body: DeleteBody):
    try:
        entry_id = ObjectId(body.id)
    except InvalidId:
        return JSONResponse(status_code=400, content={"errorCode": 11, "error": "Invalid entry id"})

    if mongo[COLLECTIONS[body.kind]].delete_one({"_id": entry_id}).deleted_count == 0:
        return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Entry not found"})
    return {"id": body.id}


@router.post("/clear")
def clear_history(body: ClearBody):
    return {"deleted": mongo[COLLECTIONS[body.kind]].delete_many({}).deleted_count}
