from app.status import Check, worst_status


def test_worst_status_prefers_red() -> None:
    assert worst_status([Check("a", "green", ""), Check("b", "red", "")]) == "red"


def test_worst_status_prefers_yellow_over_green() -> None:
    assert worst_status([Check("a", "green", ""), Check("b", "yellow", "")]) == "yellow"
