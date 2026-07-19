from decimal import Decimal

import pytest

from validators import (
    ValidationError,
    browser_id,
    fee_month,
    money,
    person_name,
    qr_duration,
    sri_lankan_phone,
    student_code,
    time_range,
)


def test_phone_normalizes_local_number():
    assert sri_lankan_phone("0771234567") == "+94771234567"


@pytest.mark.parametrize("value", ["+94771234567", "0712345678", "771234567", "94771234567"])
def test_phone_accepts_supported_formats(value):
    assert sri_lankan_phone(value).startswith("+94")


@pytest.mark.parametrize("value", ["", "+94abc", "+9477123"])
def test_phone_rejects_invalid_values(value):
    with pytest.raises(ValidationError):
        sri_lankan_phone(value)


def test_names_allow_normal_punctuation():
    assert person_name("A. Kavindu O'Neil-Silva") == "A. Kavindu O'Neil-Silva"


def test_student_code_is_normalized():
    assert student_code(" stu001 ") == "STU001"


def test_browser_identifier_accepts_uuid():
    value = "550e8400-e29b-41d4-a716-446655440000"
    assert browser_id(value) == value


def test_time_range_rejects_end_before_start():
    with pytest.raises(ValidationError, match="later"):
        time_range("18:00", "16:00")


def test_money_and_month_are_normalized():
    assert money("2000") == Decimal("2000.00")
    assert fee_month("2026-07").isoformat() == "2026-07-01"


@pytest.mark.parametrize("value", [5, "10"])
def test_qr_duration_accepts_only_approved_values(value):
    assert qr_duration(value) in (5, 10, 15)


def test_qr_duration_accepts_fifteen_minutes():
    assert qr_duration(15) == 15


def test_qr_duration_rejects_other_values():
    with pytest.raises(ValidationError):
        qr_duration(6)


def test_qr_duration_error_mentions_all_supported_values():
    with pytest.raises(ValidationError, match="5, 10, or 15"):
        qr_duration("five")


def test_person_name_accepts_sinhala_and_tamil_letters():
    assert person_name("කවිඳු පෙරේරා") == "කවිඳු පෙරේරා"
    assert person_name("அருண் குமார்") == "அருண் குமார்"


def test_person_name_rejects_digits_and_symbols():
    with pytest.raises(ValidationError):
        person_name("Student 123")
    with pytest.raises(ValidationError):
        person_name("@@@")
