"""
Revenue Stream Tracking for CFO Agent

Tracks the 5 revenue streams defined in the CFO agent instructions:
1. Infrastructure Immunity - Security Cleanup
2. Orchestration Engine - Agentic Workflows
3. Digital Storefront Accelerator - Storefront Deployment
4. Legacy Modernizer - Tech Debt Cleanup
5. Guardian Gateway - API Management

Maps streams to ledger buckets and tracks per-stream metrics.
"""

from dataclasses import dataclass
from datetime import datetime, timezone
from enum import IntEnum
from typing import Dict, List, Optional


# Revenue stream definitions matching CFO agent instructions
class RevenueStream(IntEnum):
    SECURITY_CLEANUP = 1  # Infrastructure Immunity
    AGENTIC_WORKFLOWS = 2  # Orchestration Engine
    STOREFRONT_DEPLOYMENT = 3  # Digital Storefront Accelerator
    TECH_DEBT_CLEANUP = 4  # Legacy Modernizer
    API_MANAGEMENT = 5  # Guardian Gateway

    @property
    def name_with_space(self):
        return self.name.replace("_", " ")


@dataclass
class RevenueStreamConfig:
    """Configuration for each revenue stream."""

    stream_id: RevenueStream
    name: str
    description: str
    setup_fee_usd: Optional[float]
    monthly_recurring_usd: Optional[float]
    transaction_fee_percent: Optional[float]
    sprint_based: bool = False
    sprint_cost_usd: Optional[float] = None


# Configuration mapping revenue streams to pricing models
REVENUE_STREAM_CONFIGS = {
    RevenueStream.SECURITY_CLEANUP: RevenueStreamConfig(
        stream_id=RevenueStream.SECURITY_CLEANUP,
        name="Security Cleanup",
        description="Comprehensive security audit and vulnerability scanning service",
        setup_fee_usd=1500.0,
        monthly_recurring_usd=200.0,
        transaction_fee_percent=None,
        sprint_based=False,
        sprint_cost_usd=None,
    ),
    RevenueStream.AGENTIC_WORKFLOWS: RevenueStreamConfig(
        stream_id=RevenueStream.AGENTIC_WORKFLOWS,
        name="Agentic Workflows",
        description="Automated workflow and process orchestration platform",
        setup_fee_usd=2500.0,
        monthly_recurring_usd=500.0,
        transaction_fee_percent=None,
        sprint_based=False,
        sprint_cost_usd=None,
    ),
    RevenueStream.STOREFRONT_DEPLOYMENT: RevenueStreamConfig(
        stream_id=RevenueStream.STOREFRONT_DEPLOYMENT,
        name="Storefront Deployment",
        description="Rapid storefront deployment and optimization service",
        setup_fee_usd=950.0,
        monthly_recurring_usd=None,
        transaction_fee_percent=3.0,
        sprint_based=False,
        sprint_cost_usd=None,
    ),
    RevenueStream.TECH_DEBT_CLEANUP: RevenueStreamConfig(
        stream_id=RevenueStream.TECH_DEBT_CLEANUP,
        name="Tech Debt Cleanup",
        description="Legacy system modernization and refactoring sprints",
        setup_fee_usd=None,
        monthly_recurring_usd=None,
        transaction_fee_percent=None,
        sprint_based=True,
        sprint_cost_usd=4000.0,
    ),
    RevenueStream.API_MANAGEMENT: RevenueStreamConfig(
        stream_id=RevenueStream.API_MANAGEMENT,
        name="API Management",
        description="API security monitoring and protection gateway",
        setup_fee_usd=1200.0,
        monthly_recurring_usd=None,
        transaction_fee_percent=0.05,  # 0.05 per 1k requests
        sprint_based=False,
        sprint_cost_usd=None,
    ),
}


class RevenueStreamTracker:
    """Tracks revenue contributions per stream."""

    def __init__(self):
        self.stream_metrics: Dict[RevenueStream, Dict] = {}
        self.total_by_stream: Dict[RevenueStream, float] = {}
        self._initialize_metrics()

    def _initialize_metrics(self):
        """Initialize empty metrics for each stream."""
        for stream in RevenueStream:
            self.stream_metrics[stream] = {
                "setup_fee_collected": 0.0,
                "monthly_recurring_total": 0.0,
                "transaction_fees_collected": 0.0,
                "sprint_fees_collected": 0.0,
                "total_contributed_usd": 0.0,
                "transaction_count": 0,
                "last_updated": None,
            }
            self.total_by_stream[stream] = 0.0

    def record_setup_fee(
        self,
        stream_id: RevenueStream,
        amount_usd: float,
        payment_id: str,
        timestamp: Optional[datetime] = None,
    ):
        """Record a setup fee for a revenue stream."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        config = REVENUE_STREAM_CONFIGS[stream_id]

        # Update metrics
        self.stream_metrics[stream_id]["setup_fee_collected"] += amount_usd
        self.stream_metrics[stream_id]["total_contributed_usd"] += amount_usd
        self.stream_metrics[stream_id]["transaction_count"] += 1
        self.stream_metrics[stream_id]["last_updated"] = timestamp.isoformat()

        # Update total
        self.total_by_stream[stream_id] += amount_usd

        return {
            "stream_id": stream_id.value,
            "stream_name": config.name,
            "amount_usd": amount_usd,
            "type": "setup_fee",
            "payment_id": payment_id,
            "timestamp": timestamp.isoformat(),
        }

    def record_monthly_recurring(
        self,
        stream_id: RevenueStream,
        amount_usd: float,
        payment_id: str,
        timestamp: Optional[datetime] = None,
    ):
        """Record monthly recurring revenue for a stream."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        config = REVENUE_STREAM_CONFIGS[stream_id]

        # Update metrics
        self.stream_metrics[stream_id]["monthly_recurring_total"] += amount_usd
        self.stream_metrics[stream_id]["total_contributed_usd"] += amount_usd
        self.stream_metrics[stream_id]["transaction_count"] += 1
        self.stream_metrics[stream_id]["last_updated"] = timestamp.isoformat()

        # Update total
        self.total_by_stream[stream_id] += amount_usd

        return {
            "stream_id": stream_id.value,
            "stream_name": config.name,
            "amount_usd": amount_usd,
            "type": "monthly_recurring",
            "payment_id": payment_id,
            "timestamp": timestamp.isoformat(),
        }

    def record_transaction_fee(
        self,
        stream_id: RevenueStream,
        amount_usd: float,
        transaction_count: int,
        timestamp: Optional[datetime] = None,
    ):
        """Record transaction fees for a stream."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        config = REVENUE_STREAM_CONFIGS[stream_id]

        # Update metrics
        self.stream_metrics[stream_id]["transaction_fees_collected"] += amount_usd
        self.stream_metrics[stream_id]["total_contributed_usd"] += amount_usd
        self.stream_metrics[stream_id]["transaction_count"] += transaction_count
        self.stream_metrics[stream_id]["last_updated"] = timestamp.isoformat()

        # Update total
        self.total_by_stream[stream_id] += amount_usd

        return {
            "stream_id": stream_id.value,
            "stream_name": config.name,
            "amount_usd": amount_usd,
            "transaction_count": transaction_count,
            "type": "transaction_fee",
            "timestamp": timestamp.isoformat(),
        }

    def record_sprint_fee(
        self,
        stream_id: RevenueStream,
        amount_usd: float,
        sprint_weeks: int,
        timestamp: Optional[datetime] = None,
    ):
        """Record sprint-based fees for Tech Debt Cleanup."""
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)

        config = REVENUE_STREAM_CONFIGS[stream_id]

        # Update metrics
        self.stream_metrics[stream_id]["sprint_fees_collected"] += amount_usd
        self.stream_metrics[stream_id]["total_contributed_usd"] += amount_usd
        self.stream_metrics[stream_id]["transaction_count"] += sprint_weeks
        self.stream_metrics[stream_id]["last_updated"] = timestamp.isoformat()

        # Update total
        self.total_by_stream[stream_id] += amount_usd

        return {
            "stream_id": stream_id.value,
            "stream_name": config.name,
            "amount_usd": amount_usd,
            "sprint_weeks": sprint_weeks,
            "type": "sprint_fee",
            "timestamp": timestamp.isoformat(),
        }

    def get_stream_summary(self, stream_id: RevenueStream) -> Dict:
        """Get summary for a specific stream."""
        metrics = self.stream_metrics[stream_id]
        config = REVENUE_STREAM_CONFIGS[stream_id]

        return {
            "stream_id": stream_id.value,
            "stream_name": config.name,
            "description": config.description,
            "setup_fee_collected": metrics["setup_fee_collected"],
            "monthly_recurring_total": metrics["monthly_recurring_total"],
            "transaction_fees_collected": metrics["transaction_fees_collected"],
            "sprint_fees_collected": metrics["sprint_fees_collected"],
            "total_contributed_usd": metrics["total_contributed_usd"],
            "transaction_count": metrics["transaction_count"],
            "last_updated": metrics["last_updated"],
        }

    def get_all_streams_summary(self) -> List[Dict]:
        """Get summary for all streams."""
        return [self.get_stream_summary(stream) for stream in RevenueStream]

    def get_aggregate_summary(self) -> Dict:
        """Get aggregate summary across all streams."""
        total_by_stream = {}
        grand_total = 0.0

        for stream in RevenueStream:
            config = REVENUE_STREAM_CONFIGS[stream]
            amount = self.total_by_stream[stream]

            total_by_stream[stream.value] = {
                "stream_name": config.name,
                "total_contributed_usd": round(amount, 2),
            }

            grand_total += amount

        return {
            "total_streams": len(RevenueStream),
            "total_revenue_usd": round(grand_total, 2),
            "by_stream": total_by_stream,
        }


# Global instance
_tracker = RevenueStreamTracker()


def get_tracker() -> RevenueStreamTracker:
    """Get the global revenue stream tracker instance."""
    return _tracker
