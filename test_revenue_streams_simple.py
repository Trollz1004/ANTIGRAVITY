#!/usr/bin/env python3
"""
Simple test script for revenue stream tracking.
This script can be run independently without pytest dependencies.
"""

from app.revenue_streams import (
    RevenueStream,
    RevenueStreamTracker,
    REVENUE_STREAM_CONFIGS,
)
from app.revenue_allocation import REVENUE_STREAM_TO_BUCKET_MAPPING, calculate_stream_allocation

def test_revenue_stream_enum():
    """Test RevenueStream enum values."""
    print("✓ Testing RevenueStream enum values...")
    assert RevenueStream.SECURITY_CLEANUP.value == 1
    assert RevenueStream.AGENTIC_WORKFLOWS.value == 2
    assert RevenueStream.STOREFRONT_DEPLOYMENT.value == 3
    assert RevenueStream.TECH_DEBT_CLEANUP.value == 4
    assert RevenueStream.API_MANAGEMENT.value == 5
    print("  ✓ All stream values are correct")

def test_revenue_stream_configs_exist():
    """Test that all revenue stream configurations exist."""
    print("✓ Testing revenue stream configurations...")
    assert len(REVENUE_STREAM_CONFIGS) == 5
    print(f"  ✓ {len(REVENUE_STREAM_CONFIGS)} configurations found")
    
    for stream in RevenueStream:
        config = REVENUE_STREAM_CONFIGS[stream]
        assert config.stream_id == stream
        assert config.name
        assert config.description
    print("  ✓ All configurations have required fields")

def test_revenue_stream_config_values():
    """Test specific revenue stream configuration values."""
    print("✓ Testing revenue stream config values...")
    
    # Security Cleanup
    config = REVENUE_STREAM_CONFIGS[RevenueStream.SECURITY_CLEANUP]
    assert config.name == "Security Cleanup"
    assert config.setup_fee_usd == 1500.0
    assert config.monthly_recurring_usd == 200.0
    print("  ✓ Security Cleanup config is correct")
    
    # Orchestration Engine
    config = REVENUE_STREAM_CONFIGS[RevenueStream.AGENTIC_WORKFLOWS]
    assert config.name == "Agentic Workflows"
    assert config.setup_fee_usd == 2500.0
    assert config.monthly_recurring_usd == 500.0
    print("  ✓ Agentic Workflows config is correct")
    
    # Digital Storefront Accelerator
    config = REVENUE_STREAM_CONFIGS[RevenueStream.STOREFRONT_DEPLOYMENT]
    assert config.name == "Storefront Deployment"
    assert config.setup_fee_usd == 950.0
    assert config.transaction_fee_percent == 3.0
    print("  ✓ Storefront Deployment config is correct")
    
    # Legacy Modernizer
    config = REVENUE_STREAM_CONFIGS[RevenueStream.TECH_DEBT_CLEANUP]
    assert config.name == "Tech Debt Cleanup"
    assert config.sprint_based is True
    assert config.sprint_cost_usd == 4000.0
    print("  ✓ Tech Debt Cleanup config is correct")
    
    # Guardian Gateway
    config = REVENUE_STREAM_CONFIGS[RevenueStream.API_MANAGEMENT]
    assert config.name == "API Management"
    assert config.setup_fee_usd == 1200.0
    assert config.transaction_fee_percent == 0.05
    print("  ✓ API Management config is correct")

def test_revenue_stream_to_bucket_mapping():
    """Test revenue stream to bucket mapping."""
    print("✓ Testing revenue stream to bucket mapping...")
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Security Cleanup"] == 1
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Agentic Workflows"] == 2
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Storefront Deployment"] == 5
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["Tech Debt Cleanup"] == 7
    assert REVENUE_STREAM_TO_BUCKET_MAPPING["API Management"] == 8
    print("  ✓ All stream-to-bucket mappings are correct")

def test_revenue_stream_tracker_basic():
    """Test basic RevenueStreamTracker functionality."""
    print("✓ Testing RevenueStreamTracker basic functionality...")
    tracker = RevenueStreamTracker()
    
    # Record setup fee for Security Cleanup
    result = tracker.record_setup_fee(
        RevenueStream.SECURITY_CLEANUP,
        1500.0,
        "payment_setup_123",
    )
    
    assert result["stream_id"] == RevenueStream.SECURITY_CLEANUP.value
    assert result["stream_name"] == "Security Cleanup"
    assert result["amount_usd"] == 1500.0
    assert result["type"] == "setup_fee"
    print("  ✓ Setup fee recording works")
    
    # Record monthly recurring for Agentic Workflows
    result = tracker.record_monthly_recurring(
        RevenueStream.AGENTIC_WORKFLOWS,
        500.0,
        "payment_monthly_456",
    )
    
    assert result["stream_id"] == RevenueStream.AGENTIC_WORKFLOWS.value
    assert result["stream_name"] == "Agentic Workflows"
    assert result["type"] == "monthly_recurring"
    print("  ✓ Monthly recurring recording works")
    
    # Record transaction fee for Storefront Deployment
    result = tracker.record_transaction_fee(
        RevenueStream.STOREFRONT_DEPLOYMENT,
        300.0,
        20,
    )
    
    assert result["stream_id"] == RevenueStream.STOREFRONT_DEPLOYMENT.value
    assert result["stream_name"] == "Storefront Deployment"
    assert result["transaction_count"] == 20
    print("  ✓ Transaction fee recording works")
    
    # Record sprint fee for Tech Debt Cleanup
    result = tracker.record_sprint_fee(
        RevenueStream.TECH_DEBT_CLEANUP,
        4000.0,
        1,
    )
    
    assert result["stream_id"] == RevenueStream.TECH_DEBT_CLEANUP.value
    assert result["stream_name"] == "Tech Debt Cleanup"
    assert result["sprint_weeks"] == 1
    print("  ✓ Sprint fee recording works")

def test_revenue_stream_summary():
    """Test revenue stream summary functionality."""
    print("✓ Testing revenue stream summary...")
    tracker = RevenueStreamTracker()
    
    # Record some transactions
    tracker.record_setup_fee(RevenueStream.SECURITY_CLEANUP, 1500.0, "payment_setup_123")
    tracker.record_monthly_recurring(RevenueStream.SECURITY_CLEANUP, 200.0, "payment_monthly_456")
    
    summary = tracker.get_stream_summary(RevenueStream.SECURITY_CLEANUP)
    
    assert summary["stream_name"] == "Security Cleanup"
    assert summary["setup_fee_collected"] == 1500.0
    assert summary["monthly_recurring_total"] == 200.0
    assert summary["total_contributed_usd"] == 1700.0
    assert summary["transaction_count"] == 2
    print("  ✓ Stream summary is correct")
    
    # Test aggregate summary
    aggregate = tracker.get_aggregate_summary()
    assert aggregate["total_streams"] == 5
    assert aggregate["total_revenue_usd"] == 1700.0
    print("  ✓ Aggregate summary is correct")

def test_calculate_stream_allocation():
    """Test calculate_stream_allocation function."""
    print("✓ Testing calculate_stream_allocation...")
    
    from app.revenue_streams import RevenueStreamConfig
    
    # Test setup fee allocation
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
    
    assert allocation[""] == 100.0
    assert allocation["operating"] == 9900.0
    assert allocation["setup_fee"] == 1500.0
    print("  ✓ Setup fee allocation is correct")
    
    # Test transaction fee allocation
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
    
    assert allocation["transaction_fee"] == 300.0
    print("  ✓ Transaction fee allocation is correct")

def test_revenue_stream_mapping_integration():
    """Test integration between revenue streams and allocation."""
    print("✓ Testing revenue stream mapping integration...")
    
    # Verify mapping covers all streams
    expected_mapping = {
        "Security Cleanup": 1,
        "Agentic Workflows": 2,
        "Storefront Deployment": 5,
        "Tech Debt Cleanup": 7,
        "API Management": 8,
    }
    
    assert REVENUE_STREAM_TO_BUCKET_MAPPING == expected_mapping
    print("  ✓ Revenue stream to bucket mapping is correct")
    
    # Test stream-to-bucket lookup
    from app.revenue_streams import RevenueStream
    for stream_name, bucket in REVENUE_STREAM_TO_BUCKET_MAPPING.items():
        assert 1 <= bucket <= 10
    print("  ✓ All buckets are valid (1-10)")

def run_all_tests():
    """Run all tests."""
    print("=" * 60)
    print("REVENUE STREAM TRACKING TESTS")
    print("=" * 60)
    print()
    
    test_revenue_stream_enum()
    test_revenue_stream_configs_exist()
    test_revenue_stream_config_values()
    test_revenue_stream_to_bucket_mapping()
    test_revenue_stream_tracker_basic()
    test_revenue_stream_summary()
    test_calculate_stream_allocation()
    test_revenue_stream_mapping_integration()
    
    print()
    print("=" * 60)
    print("ALL TESTS PASSED!")
    print("=" * 60)
    print()
    print("Summary of implemented features:")
    print("1. ✓ RevenueStream enum with 5 revenue streams")
    print("2. ✓ RevenueStreamConfig dataclass with stream-specific pricing")
    print("3. ✓ RevenueStreamTracker class for tracking metrics per stream")
    print("4. ✓ REVENUE_STREAM_TO_BUCKET_MAPPING (stream → ledger bucket)")
    print("5. ✓ calculate_stream_allocation function with stream-specific logic")
    print("6. ✓ Stream-specific tracking: setup fees, monthly recurring, transaction fees, sprint fees")
    print()
    print("Revenue streams mapped to ledger buckets:")
    for stream_name, bucket in REVENUE_STREAM_TO_BUCKET_MAPPING.items():
        print(f"  - {stream_name}: bucket {bucket}")

if __name__ == "__main__":
    run_all_tests()