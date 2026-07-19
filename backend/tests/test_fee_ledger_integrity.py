from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parents[1]))

from routes.fees import FEE_LEDGER_QUERY


def normalized(sql):
    return " ".join(sql.lower().split())


def test_fee_ledger_only_counts_active_enrollments():
    sql = normalized(FEE_LEDGER_QUERY)

    assert "join class_students cs" in sql
    assert "cs.student_id=f.student_id" in sql
    assert "cs.class_id=f.class_id" in sql
    assert "cs.status='active'" in sql
    assert "c.status='active'" in sql
