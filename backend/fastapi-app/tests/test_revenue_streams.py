"""Tests for revenue stream tracking and allocation."""

from app.revenue_allocation import (
    REVENUE_STREAM_TO_BUCKET_MAPPING,
    calculate_stream_allocation,
)
from app.revenue_streams import (
    REVENUE_STREAM_CONFIGS,
    RevenueStream,
    RevenueStreamConfig,
    RevenueStreamTracker,
)


def test_revenue_stream_enum():
    """Test RevenueStream enum values."""
    assert RevenueStream.SECURITY_CLEANUP.value == 1
    assert RevenueStream.AGENTIC_WORKFLOWS.value == 2
    assert RevenueStream.STOREFRONT_DEPLOYMENT.value == 3
    assert RevenueStream.TECH_DEBT_CLEANUP.value == 4
    assert RevenueStream.API_MANAGEMENT.value == 5

    # Test all streams are defined
    assert len(RevenueStream) == 5


def test_revenue_stream_configs_exist():
    """Test that all revenue stream configurations exist."""
    assert len(REVENUE_STREAM_CONFIGS) == 5

    # Test each stream has required config
    for stream in RevenueStream:
        config = REVENUE_STREAM_CONFIGS[stream]
        assert config.stream_id == stream
        assert config.name
        assert config.description
        assert isinstance(config, RevenueStreamConfig)


def test_revenue_stream_config_values():
    """Test specific revenue stream configuration values."""
    # Security Cleanup
    config = REVENUE_STREAM_CONFIGS[RevenueStream.SECURITY_CLEANUP]
    assert config.name == "Security Cleanup"
    assert config.setup_fee_usd == 1500.0
    assert config.monthly_recurring_usd == 200.0
    assert config.sprint_based is False

    # Orchestration Engine
    config = REVENUE_STREAM_CONFIGS[RevenueStream.AGENTIC_WORKFLOWS]
    assert config.name == "Agentic Workflows"
    assert config.setup_fee_usd == 2500.0
    assert config.monthly_recurring_usd == 500.0

    # Digital Storefront Accelerator
    config = REVENUE_STREAM_CONFIGS[RevenueStream.STOREFRONT_DEPLOYMENT]
    assert config.name == "Storefront Deployment"
    assert config.setup_fee_usd == 950.0
    assert config.transaction_fee_percent == 3.0

    # Legacy Modernizer
    config = REVENUE_STREAM_CONFIGS[RevenueStream.TECH_DEBT_CLEANUP]
    assert config.name == "Tech Debt Cleanup"
    assert config.sprint_based is True
    assert config.sprint_cost_usd == 4000.0

    # Guardian Gateway
    config = REVENUE_STREAM_CONFIGS[RevenueStream.API_MANAGEMENT]
    assert config.name == "API Management"
    assert config.setup_fee_usd == 1200.0
    assert config.transaction_fee_percent == 0.05


def test_revenue_stream_to_bucket_mapping():
    """Test revenue stream to bucket mapping."""
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Security Cleanup"] == 1
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Agentic Workflows"] == 2
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Storefront Deployment"] == 5
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Tech Debt Cleanup"] == 7
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["API Management"] == 8

    # Verify mapping covers all streams
    expected_mapping = {
        "Security Cleanup": 1,
        "Agentic Workflows": 2,
        "Storefront Deployment": 5,
        "Tech Debt Cleanup": 7,
        "API Management": 8,
    }
    assert expected_mapping == REVENUE_STREAM_TO_BUCKET_MAPPING


def test_revenue_stream_tracker_initialization():
    """Test RevenueStreamTracker initialization."""
    tracker = RevenueStreamTracker()

    # Check all streams have metrics initialized
    assert len(tracker.stream_metrics) == 5
    assert len(tracker.total_by_stream) == 5

    for stream in RevenueStream:
        assert stream in tracker.stream_metrics
        assert stream in tracker.total_by_stream

        # Check initial metrics values
        metrics = tracker.stream_metrics[stream]
        assert metrics["setup_fee_collected"] == 0.0
        assert metrics["monthly_recurring_total"] == 0.0
        assert metrics["transaction_fees_collected"] == 0.0
        assert metrics["sprint_fees_collected"] == 0.0
        assert metrics["total_contributed_usd"] == 0.0
        assert metrics["transaction_count"] == 0
        assert metrics["last_updated"] is None


def test_record_setup_fee():
    """Test recording setup fees."""
    tracker = RevenueStreamTracker()

    result = tracker.record_setup_fee(
        RevenueStream.SECURITY_CLEANUP,
        1500.0,
        "payment_setup_123",
    )

    # Check result
    assert result["stream_id"] == RevenueStream.SECURITY_CLEANUP.value
    assert result["stream_name"] == "Security Cleanup"
    assert result["amount_usd"] == 1500.0
    assert result["type"] == "setup_fee"
    assert result["payment_id"] == "payment_setup_123"

    # Check metrics updated
    assert tracker.total_by_stream[RevenueStream.SECURITY_CLEANUP] == 1500.0
    assert (
        tracker.stream_metrics[RevenueStream.SECURITY_CLEANUP]["setup_fee_collected"]
        == 1500.0
    )
    assert (
        tracker.stream_metrics[RevenueStream.SECURITY_CLEANUP]["total_contributed_usd"]
        == 1500.0
    )
    assert (
        tracker.stream_metrics[RevenueStream.SECURITY_CLEANUP]["transaction_count"] == 1
    )


def test_record_monthly_recurring():
    """Test recording monthly recurring revenue."""
    tracker = RevenueStreamTracker()

    result = tracker.record_monthly_recurring(
        RevenueStream.AGENTIC_WORKFLOWS,
        500.0,
        "payment_monthly_456",
    )

    # Check result
    assert result["stream_id"] == RevenueStream.AGENTIC_WORKFLOWS.value
    assert result["stream_name"] == "Agentic Workflows"
    assert result["amount_usd"] == 500.0
    assert result["type"] == "monthly_recurring"

    # Check metrics updated
    assert tracker.total_by_stream[RevenueStream.AGENTIC_WORKFLOWS] == 500.0
    assert (
        tracker.stream_metrics[RevenueStream.AGENTIC_WORKFLOWS][
            "monthly_recurring_total"
        ]
        == 500.0
    )


def test_record_transaction_fee():
    """Test recording transaction fees."""
    tracker = RevenueStreamTracker()

    result = tracker.record_transaction_fee(
        RevenueStream.STOREFRONT_DEPLOYMENT,
        300.0,
        20,
    )

    # Check result
    assert result["stream_id"] == RevenueStream.STOREFRONT_DEPLOYMENT.value
    assert result["stream_name"] == "Storefront Deployment"
    assert result["amount_usd"] == 300.0
    assert result["transaction_count"] == 20
    assert result["type"] == "transaction_fee"

    # Check metrics updated
    assert tracker.total_by_stream[RevenueStream.STOREFRONT_DEPLOYMENT] == 300.0
    assert (
        tracker.stream_metrics[RevenueStream.STOREFRONT_DEPLOYMENT][
            "transaction_fees_collected"
        ]
        == 300.0
    )


def test_record_sprint_fee():
    """Test recording sprint-based fees."""
    tracker = RevenueStreamTracker()

    result = tracker.record_sprint_fee(
        RevenueStream.TECH_DEBT_CLEANUP,
        4000.0,
        1,
    )

    # Check result
    assert result["stream_id"] == RevenueStream.TECH_DEBT_CLEANUP.value
    assert result["stream_name"] == "Tech Debt Cleanup"
    assert result["amount_usd"] == 4000.0
    assert result["sprint_weeks"] == 1
    assert result["type"] == "sprint_fee"

    # Check metrics updated
    assert tracker.total_by_stream[RevenueStream.TECH_DEBT_CLEANUP] == 4000.0
    assert (
        tracker.stream_metrics[RevenueStream.TECH_DEBT_CLEANUP]["sprint_fees_collected"]
        == 4000.0
    )


def test_get_stream_summary():
    """Test getting stream summary."""
    tracker = RevenueStreamTracker()

    # Record some transactions
    tracker.record_setup_fee(
        RevenueStream.SECURITY_CLEANUP, 1500.0, "payment_setup_123"
    )
    tracker.record_monthly_recurring(
        RevenueStream.SECURITY_CLEANUP, 200.0, "payment_monthly_456"
    )

    summary = tracker.get_stream_summary(RevenueStream.SECURITY_CLEANUP)

    # Check summary content
    assert summary["stream_id"] == RevenueStream.SECURITY_CLEANUP.value
    assert summary["stream_name"] == "Security Cleanup"
    assert (
        summary["description"]
        == "Comprehensive security audit and vulnerability scanning service"
    )
    assert summary["setup_fee_collected"] == 1500.0
    assert summary["monthly_recurring_total"] == 200.0
    assert summary["total_contributed_usd"] == 1700.0
    assert summary["transaction_count"] == 2


def test_get_all_streams_summary():
    """Test getting all streams summary."""
    tracker = RevenueStreamTracker()

    # Record some transactions for multiple streams
    tracker.record_setup_fee(
        RevenueStream.SECURITY_CLEANUP, 1500.0, "payment_setup_123"
    )
    tracker.record_setup_fee(
        RevenueStream.AGENTIC_WORKFLOWS, 2500.0, "payment_setup_456"
    )
    tracker.record_transaction_fee(RevenueStream.STOREFRONT_DEPLOYMENT, 300.0, 20)

    summaries = tracker.get_all_streams_summary()

    # Check we have all 5 streams
    assert len(summaries) == 5

    # Find Security Cleanup summary
    security_summary = next(
        s for s in summaries if s["stream_name"] == "Security Cleanup"
    )
    assert security_summary["setup_fee_collected"] == 1500.0

    # Find Agentic Workflows summary
    agentic_summary = next(
        s for s in summaries if s["stream_name"] == "Agentic Workflows"
    )
    assert agentic_summary["setup_fee_collected"] == 2500.0

    # Find Storefront Deployment summary
    storefront_summary = next(
        s for s in summaries if s["stream_name"] == "Storefront Deployment"
    )
    assert storefront_summary["transaction_fees_collected"] == 300.0


def test_calculate_stream_allocation_setup_fee():
    """Test calculate_stream_allocation with setup fee."""
    config = RevenueStreamConfig(
        stream_id=RevenueStream.SECURITY_CLEANUP,
        name="Security Cleanup",
        description="Test",
        setup_fee_usd=1500.0,
        monthly_recurring_usd=None,
        transaction_fee_percent=None,
        sprint_based=False,
        sprint_cost_usd=None,
    )

    allocation = calculate_stream_allocation(10000, "Security Cleanup", config)

    assert allocation["charitable"] == 1000.0
    assert allocation["operating"] == 9000.0
    assert allocation["setup_fee"] == 1500.0
    assert allocation["recurring_fee"] == 0.0
    assert allocation["transaction_fee"] == 0.0
    assert allocation["sprint_fee"] == 0.0


def test_calculate_stream_allocation_transaction_fee():
    """Test calculate_stream_allocation with transaction fee."""
    config = RevenueStreamConfig(
        stream_id=RevenueStream.STOREFRONT_DEPLOYMENT,
        name="Storefront Deployment",
        description="Test",
        setup_fee_usd=None,
        monthly_recurring_usd=None,
        transaction_fee_percent=3.0,
        sprint_based=False,
        sprint_cost_usd=None,
    )

    allocation = calculate_stream_allocation(10000, "Storefront Deployment", config)

    assert allocation["charitable"] == 1000.0
    assert allocation["operating"] == 9000.0
    assert allocation["setup_fee"] == 0.0
    assert allocation["recurring_fee"] == 0.0
    assert allocation["transaction_fee"] == 300.0
    assert allocation["sprint_fee"] == 0.0


def test_calculate_stream_allocation_zero_amount():
    """Test calculate_stream_allocation with zero amount."""
    config = RevenueStreamConfig(
        stream_id=RevenueStream.SECURITY_CLEANUP,
        name="Security Cleanup",
        description="Test",
        setup_fee_usd=1500.0,
        monthly_recurring_usd=None,
        transaction_fee_percent=None,
        sprint_based=False,
        sprint_cost_usd=None,
    )

    allocation = calculate_stream_allocation(0, "Security Cleanup", config)

    assert allocation["charitable"] == 0.0
    assert allocation["operating"] == 0.0
    assert allocation["setup_fee"] == 0.0
    assert allocation["recurring_fee"] == 0.0
    assert allocation["transaction_fee"] == 0.0
    assert allocation["sprint_fee"] == 0.0


def test_revenue_streams_integration():
    """Test integration between revenue streams and allocation."""
    # Test that we can map streams to buckets
    from app.revenue_allocation import REVENUE_STREAM_TO_BUCKET_MAPPING

    # Security Cleanup (Infrastructure Immunity) → Kids Fund (bucket 1)
    bucket = REVENUE_STREAM_TO_BUCKET_MAPPING["Security Cleanup"]
    assert bucket == 1

    # Verify all streams have mappings
    for stream_name in REVENUE_STREAM_TO_BUCKET_MAPPING:
        bucket = REVENUE_STREAM_TO_BUCKET_MAPPING[stream_name]
        assert 1 <= bucket <= 10


def test_revenue_stream_allocation_summary():
    """Test revenue stream allocation aggregate summary."""
    tracker = RevenueStreamTracker()

    # Record various fees across streams
    tracker.record_setup_fee(RevenueStream.SECURITY_CLEANUP, 1500.0, "payment_1")
    tracker.record_setup_fee(RevenueStream.AGENTIC_WORKFLOWS, 2500.0, "payment_2")
    tracker.record_monthly_recurring(RevenueStream.SECURITY_CLEANUP, 200.0, "payment_3")
    tracker.record_transaction_fee(RevenueStream.STOREFRONT_DEPLOYMENT, 300.0, 20)
    tracker.record_sprint_fee(RevenueStream.TECH_DEBT_CLEANUP, 4000.0, 1)
    tracker.record_setup_fee(RevenueStream.API_MANAGEMENT, 1200.0, "payment_4")

    # Get aggregate summary
    summary = tracker.get_aggregate_summary()

    # Check summary content
    assert summary["total_streams"] == 5
    assert summary["total_revenue_usd"] == 9700.0

    # Check individual stream totals
    assert summary["by_stream"][1]["stream_name"] == "Security Cleanup"
    assert summary["by_stream"][1]["total_contributed_usd"] == 1700.0

    assert summary["by_stream"][2]["stream_name"] == "Agentic Workflows"
    assert summary["by_stream"][2]["total_contributed_usd"] == 2500.0

    assert summary["by_stream"][5]["stream_name"] == "Storefront Deployment"
    assert summary["by_stream"][5]["total_contributed_usd"] == 300.0

    assert summary["by_stream"][7]["stream_name"] == "Tech Debt Cleanup"
    assert summary["by_stream"][7]["total_contributed_usd"] == 4000.0

    assert summary["by_stream"][8]["stream_name"] == "API Management"
    assert summary["by_stream"][8]["total_contributed_usd"] == 1200.0
