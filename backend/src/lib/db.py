import os
from datetime import timedelta, timezone

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pymongo import MongoClient

pg = ConnectionPool(os.environ["POSTGRESDB_URL"], kwargs={"row_factory": dict_row}, open=True)
# Mongo stores dates in UTC; reads come back as Thai time (UTC+7, no daylight saving).
mongo = MongoClient(
    os.environ["MONGODB_URL"],
    serverSelectionTimeoutMS=2000,
    tz_aware=True,
    tzinfo=timezone(timedelta(hours=7)),
).get_database("project")

# Local single-user app: every user_* row belongs to this seeded user.
USER_ID = 1
