"""Tests for app.allocation_compat — legacy column name constants."""

from app.allocation_compat import (
    ACCOUNTING_LANE_COLUMN,
    ACCOUNTING_LANE_DEFAULT,
    ACCOUNTING_RESERVE_CENTS_COLUMN,
    ACCOUNTING_RESERVE_PERCENT_COLUMN,
    ENGAGEMENT_SCORE_COLUMN,
    LEGACY_ACCOUNTING_LANE_DEFAULT,
    MEMBER_BADGE_COLUMN,
)


class TestAllocationCompat:
    def test_all_constants_are_strings(self):
        for const in [
            ENGAGEMENT_SCORE_COLUMN,
            MEMBER_BADGE_COLUMN,
            ACCOUNTING_RESERVE_CENTS_COLUMN,
            ACCOUNTING_RESERVE_PERCENT_COLUMN,
            ACCOUNTING_LANE_COLUMN,
            LEGACY_ACCOUNTING_LANE_DEFAULT,
            ACCOUNTING_LANE_DEFAULT,
        ]:
            assert isinstance(const, str)
            assert len(const) > 0

    def test_current_and_legacy_differ(self):
        assert LEGACY_ACCOUNTING_LANE_DEFAULT != ACCOUNTING_LANE_DEFAULT
