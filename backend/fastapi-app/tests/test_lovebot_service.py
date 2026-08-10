"""Unit coverage for the LoveBot service scoring and content helpers."""

from datetime import date

from app.lovebot_service import LoveBotService, lovebot_service


def test_get_random_quote_filters_by_category():
    service = LoveBotService()
    for _ in range(20):
        quote = service.get_random_quote("deep")
        assert quote["category"] == "deep"


def test_get_random_quote_falls_back_when_category_unknown():
    service = LoveBotService()
    quote = service.get_random_quote("does-not-exist")
    assert quote in service.quotes


def test_get_random_quote_without_category_returns_any_quote():
    service = LoveBotService()
    assert service.get_random_quote() in service.quotes


def test_get_random_pickup_line_returns_known_line():
    service = LoveBotService()
    assert service.get_random_pickup_line() in service.pickup_lines


def _score_for(name1: str, name2: str) -> int:
    combined = name1.strip().lower() + name2.strip().lower()
    return sum(ord(c) for c in combined) % 101


def test_calculate_compatibility_is_deterministic_and_ignores_surrounding_space():
    service = LoveBotService()
    padded = service.calculate_compatibility("  Avery ", "Jordan  ")
    plain = service.calculate_compatibility("avery", "jordan")
    assert padded == plain
    assert padded["score"] == _score_for("Avery", "Jordan")


def test_calculate_compatibility_covers_every_message_band():
    service = LoveBotService()
    seen: dict[str, int] = {}
    alphabet = "abcdefghijklmnopqrstuvwxyz"
    for first in alphabet:
        for second in alphabet:
            result = service.calculate_compatibility(first, second * 3)
            seen[result["message"]] = result["score"]

    expected = {
        "A match made in heaven! Your energies are perfectly aligned.": lambda s: s
        > 80,
        "Great potential! There's a strong connection here.": lambda s: 60 < s <= 80,
        "A solid foundation to build upon. Communication will be key.": lambda s: 40
        < s
        <= 60,
        "Opposites attract, but it might take some work to find common ground.": lambda s: s
        <= 40,
    }
    assert set(seen) == set(expected)
    for message, score in seen.items():
        assert expected[message](score), (message, score)


def test_calculate_birthday_match_high_score_message():
    service = LoveBotService()
    result = service.calculate_birthday_match(date(1990, 1, 1), date(1990, 1, 2))
    assert result["score"] == 99
    assert result["message"] == "Astrological alignment analysis complete."


def test_calculate_birthday_match_low_score_message():
    service = LoveBotService()
    result = service.calculate_birthday_match(date(1990, 1, 1), date(1990, 4, 1))
    assert result["score"] == 10
    assert result["message"] == "The stars suggest a journey of discovery."


def test_calculate_birthday_match_is_order_independent():
    service = LoveBotService()
    forward = service.calculate_birthday_match(date(1988, 5, 4), date(1991, 9, 17))
    backward = service.calculate_birthday_match(date(1991, 9, 17), date(1988, 5, 4))
    assert forward == backward


def test_gift_ideas_differ_per_recipient():
    service = LoveBotService()
    feminine = service.get_gift_ideas("feminine")
    masculine = service.get_gift_ideas("masculine")
    neutral = service.get_gift_ideas()

    assert service.get_gift_ideas("unknown") == neutral
    assert feminine != masculine != neutral
    for ideas in (feminine, masculine, neutral):
        assert len(ideas) == 5
        assert all(isinstance(idea, str) and idea for idea in ideas)


def test_module_singleton_is_configured():
    assert isinstance(lovebot_service, LoveBotService)
    assert "attracting_partners_neutral" in lovebot_service.tips
