"""Tests for the lead parser."""

from hermes_sideworld.models import Lead
from hermes_sideworld.parser import parse_leads


def test_parse_single_lead():
    data = [{"name": "Acme Corp", "source": "test", "url": "https://acme.example"}]
    result = parse_leads(data, source="test")
    assert result.total == 1
    assert result.leads[0].name == "Acme Corp"
    assert result.source == "test"
    assert len(result.errors) == 0


def test_parse_lead_with_error():
    data = [
        {"name": "Good Lead", "source": "test"},
        {"source": "missing-name"},  # missing required 'name'
    ]
    result = parse_leads(data, source="test")
    assert result.total == 1
    assert len(result.errors) == 1


def test_parse_empty():
    result = parse_leads([], source="test")
    assert result.total == 0
    assert result.leads == []


def test_lead_model_optional_fields():
    lead = Lead(name="Test", source="unit")
    assert lead.email is None
    assert lead.phone is None
    assert lead.notes is None