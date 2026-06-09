# Hermes Sideworld

Lead generation parsing engine for ANTIGRAVITY.

## Setup

```bash
cd apps/hermes-sideworld
uv venv
source .venv/bin/activate
uv pip install -e ".[dev]"
```

## Usage

```bash
sideworld --help
```

## Development

```bash
# Run tests
pytest

# Lint
ruff check src/ tests/
```

## Structure

```
hermes-sideworld/
├── pyproject.toml          # Project config & dependencies
├── README.md                # This file
├── src/
│   └── hermes_sideworld/
│       ├── __init__.py
│       ├── cli.py           # CLI entry point
│       ├── parser.py        # Lead parsing logic
│       └── models.py        # Pydantic data models
├── tests/
│   ├── __init__.py
│   └── test_parser.py
└── data/                    # Sample/seed data (gitignored)
```