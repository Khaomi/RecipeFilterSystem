from datetime import UTC, datetime

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from lib.db import mongo, pg
from pydantic import BaseModel
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/bookmarks")


class BookmarkBody(BaseModel):
    recipe_id: int


@router.get("")
def list_bookmarks():
    docs = list(mongo.bookmarks.find({}, {"_id": 0}).sort("bookmarked_at", -1))
    with pg.connection() as conn:
        recipes = {
            row["recipe_id"]: row
            for row in conn.execute(
                """
                select recipe_id, recipe_name, cook_time_min, serving, image_path
                from recipes
                where recipe_id = any(%s)
                """,
                ([doc["recipe_id"] for doc in docs],),
            )
        }
    # Bookmarks of recipes that were deleted from Postgres are skipped.
    return [{**recipes[doc["recipe_id"]], **doc} for doc in docs if doc["recipe_id"] in recipes]


@router.post("/add")
def add_bookmark(body: BookmarkBody):
    with pg.connection() as conn:
        exists = conn.execute("select 1 from recipes where recipe_id = %s", (body.recipe_id,)).fetchone()
    if exists is None:
        return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Recipe not found"})

    try:
        mongo.bookmarks.insert_one({"recipe_id": body.recipe_id, "bookmarked_at": datetime.now(UTC)})
    except DuplicateKeyError:
        return JSONResponse(status_code=409, content={"errorCode": 12, "error": "Already bookmarked"})
    return {"recipe_id": body.recipe_id}


@router.post("/delete")
def delete_bookmark(body: BookmarkBody):
    if mongo.bookmarks.delete_one({"recipe_id": body.recipe_id}).deleted_count == 0:
        return JSONResponse(status_code=404, content={"errorCode": 20, "error": "Not bookmarked"})
    return {"recipe_id": body.recipe_id}
