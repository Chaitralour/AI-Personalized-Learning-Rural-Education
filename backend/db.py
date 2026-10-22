import os
import mysql.connector
from mysql.connector import Error


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=os.getenv("RURALEDU_DB_HOST", "localhost"),
            user=os.getenv("RURALEDU_DB_USER", "root"),
            password=os.getenv("RURALEDU_DB_PASSWORD", ""),
            database=os.getenv("RURALEDU_DB_NAME", "ruraledu"),
            port=int(os.getenv("RURALEDU_DB_PORT", "3306")),
        )
        return connection
    except Error as error:
        print("Database connection failed:", error)
        return None
