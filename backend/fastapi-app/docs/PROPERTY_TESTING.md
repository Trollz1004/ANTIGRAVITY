# Property-Based Testing Guide

## Overview

Property-based testing uses the [Hypothesis](https://hypothesis.readthedocs.io/) library to
automatically generate random inputs and verify that code invariants hold across all of them.
Unlike example-based tests that check specific inputs, property-based tests explore a vast
input space and find edge cases humans might miss.

## What's Tested

### 1. Password Hashing (`test_property_based.py::test_password_hash_*`)

- **Determinism**: `hash_password(p)` always produces the same output for the same `p`
- **Verification**: `verify_password(p, hash_password(p))` is always `True`
- **Wrong password rejection**: `verify_password(wrong, hash_password(p))` is `False`
- **Non-reversibility**: `hash_password(p) != p` (hash is never plain text)

### 2. Schema Validation (`test_property_based.py::test_health_response_*`)

- **HealthResponse construction**: Valid status/user_count combinations always construct
- **Type safety**: `payment_proof_labels` is always a list

### 3. Rate Limiting Logic (`test_property_based.py::test_rate_limit_counter_logic`)

- **Invariant: allowed ≤ limit**: Never more requests allowed than the limit
- **Invariant: total = allowed + blocked**: All requests are accounted for
- **Over-limit blocking**: Requests beyond limit are always blocked
- **Under-limit allowance**: Requests within limit are never blocked

### 4. Input Sanitization (`test_property_based.py::test_string_*`)

- **No crash on any input**: String operations (strip, lower, encode, len) never crash
- **Email validation stability**: Regex-based validation never raises unhandled exceptions

## Running

```bash
cd backend/fastapi-app
python -m pytest tests/test_property_based.py -v --timeout=60
```

## Adding New Property Tests

1. Use `@given(st.strategy())` to describe the input space
2. Use `@settings(max_examples=N)` to control test count
3. Assert invariants (properties that should always hold), not specific values
4. Keep tests fast — avoid I/O, use mocks for external services
