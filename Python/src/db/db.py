import psycopg2
from psycopg2 import DatabaseError
from decouple import config

def get_connection():
    try:
        return psycopg2.connect(
            host = config('PG_HOST'),
            user = config('PG_USER'),
            password = config('PG_PASSWORD'),
            database = config('PG_DATABASE')
        )
    except DatabaseError as ex:
        raise ex