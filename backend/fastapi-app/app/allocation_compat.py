"""Compatibility constants for legacy database column names.

Keep historical storage names isolated here so runtime code can use current
business-only names without forcing an unsafe live database rename.
"""

ENGAGEMENT_SCORE_COLUMN = "mission_impact_score"
MEMBER_BADGE_COLUMN = "intent_badge"
ACCOUNTING_RESERVE_CENTS_COLUMN = "business_reserve_amount_cents"
ACCOUNTING_RESERVE_PERCENT_COLUMN = "business_reserve_percent"
ACCOUNTING_LANE_COLUMN = "beneficiary_lane"
LEGACY_ACCOUNTING_LANE_DEFAULT = "kids_support"
ACCOUNTING_LANE_DEFAULT = "platform_operations"
