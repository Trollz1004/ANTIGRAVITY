"""Shared 18+ age-gate helpers."""

from datetime import date, datetime, timezone

from fastapi import HTTPException


def calculate_age(date_of_birth: date, *, today: date | None = None) -> int:
    today = today or datetime.now(timezone.utc).date()
    years = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return years


def ensure_adult(date_of_birth: date) -> int:
    age = calculate_age(date_of_birth)
    if age < 18:
        raise HTTPException(status_code=400, detail="YouAndINotAI is strictly 18+ only")
    return age
