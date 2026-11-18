# ALWAYS EXPOSE ON PORT 8000

import psycopg
import uvicorn
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError
from views import catalog, recipes

app = FastAPI()
app.include_router(catalog.router)
app.include_router(recipes.router)


@app.exception_handler(RequestValidationError)
async def invalid_request(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"errorCode": 10, "error": "Invalid request"})


@app.exception_handler(psycopg.Error)
@app.exception_handler(PyMongoError)
async def database_error(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"errorCode": 30, "error": "Database error"})


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
