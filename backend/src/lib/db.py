import os

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from pymongo import MongoClient

pg = ConnectionPool(os.environ["POSTGRESDB_URL"], kwargs={"row_factory": dict_row}, open=True)
mongo = MongoClient(os.environ["MONGODB_URL"]).get_database("project")
