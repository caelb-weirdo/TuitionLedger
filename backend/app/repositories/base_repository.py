from app.config.database import get_connection, get_cursor


class BaseRepository:
    @staticmethod
    def execute_query(query, params=None, fetchone=False, fetchall=False):
        conn = get_connection()
        cur = get_cursor(conn)
        try:
            cur.execute(query, params or ())
            if fetchone:
                result = cur.fetchone()
            elif fetchall:
                result = cur.fetchall()
            else:
                result = None
            conn.commit()
            return result
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    @staticmethod
    def execute_returning(query, params=None):
        conn = get_connection()
        cur = get_cursor(conn)
        try:
            cur.execute(query, params or ())
            result = cur.fetchone()
            conn.commit()
            return result
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
