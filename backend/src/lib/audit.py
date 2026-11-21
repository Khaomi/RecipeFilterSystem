from datetime import UTC, datetime

import psycopg
from lib.db import mongo
from pymongo.errors import PyMongoError


def commit_with_audit(conn: psycopg.Connection, action: str, fields: dict):
    """Commit the open Postgres transaction together with an audit_logs entry in Mongo.

    Both succeed or neither does: if the audit log can't be written, the SQL changes are
    rolled back; if the SQL commit fails, the audit log is removed again.
    """
    try:
        log_id = mongo.audit_logs.insert_one(
            {"action": action, "fields": fields, "logged_at": datetime.now(UTC)}
        ).inserted_id
    except PyMongoError:
        conn.rollback()
        raise

    try:
        conn.commit()
    except psycopg.Error:
        mongo.audit_logs.delete_one({"_id": log_id})
        raise
