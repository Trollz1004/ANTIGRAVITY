# Contributing to ANTIGRAVITY

Thank you for your interest in contributing to the ANTIGRAVITY project! This document provides guidelines for contributing to this repository.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Branch Organization](#branch-organization)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Style Guides](#style-guides)
- [Testing](#testing)
- [Documentation](#documentation)

## Code of Conduct

This project adheres to the Contributor Covenant code of conduct. By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/ANTIGRAVITY.git`
3. Create a branch for your feature: `git checkout -b feature/your-feature-name`

## Branch Organization

We use the following branch naming conventions:

- `main` - Production branch (protected)
- `develop` - Integration branch for upcoming releases
- `feature/feature-name` - New features
- `bugfix/issue-name` - Bug fixes
- `hotfix/urgent-fix` - Urgent production fixes

## Development Workflow

### Setting Up Your Environment

Follow the setup instructions in the root [README.md](../README.md).

### Coding Standards

#### Python (Backend)

- Follow PEP 8 style guide
- Use Black formatter
- Use Ruff linter
- Write type hints where possible
- Include docstrings for public functions and classes

#### JavaScript/TypeScript (Frontend)

- Use Prettier for code formatting
- Use ESLint for linting
- Follow React best practices
- Use TypeScript for type safety

### Git Hooks

Pre-commit hooks are configured to run:

- Code formatting (Black, Prettier)
- Linting (Ruff, ESLint)
- Tests (when applicable)

Install hooks with: `pre-commit install`

## Pull Request Process

1. Ensure your changes are well-tested
2. Update documentation as needed
3. Add/modify tests if applicable
4. Ensure all CI checks pass
5. Submit PR with clear title and description
6. Request review from maintainers

### PR Description Template

```markdown
## Summary

Brief description of the changes.

## Details

More detailed explanation of the implementation.

## Testing

How were these changes tested?

## Related Issues

Fixes #123
```

## Style Guides

### Commits

- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests liberally

### Code Comments

- Use clear, concise language
- Explain why, not what
- Update comments when code changes
- Remove commented-out code

## Testing

### Backend Testing

- Unit tests for business logic
- Integration tests for API endpoints
- Test coverage target: 80%+

### Frontend Testing

- Unit tests for components and utilities
- Integration tests for user flows
- Visual regression tests for UI components

Run tests with:

```bash
# Backend tests
cd backend/fastapi-app
pytest

# Frontend tests
cd frontend/react-app
npm test
```

## Documentation

Keep documentation up-to-date with code changes:

- Update API documentation when endpoints change
- Add new workflows to workflow documentation
- Update README files when setup changes

## Governance

### Release Process

1. Version bump in package.json/pyproject.toml
2. Update CHANGELOG.md
3. Create release tag
4. Deploy to production

### Security

- Report vulnerabilities to security@youandinotai.com
- Do not disclose security issues publicly
- Follow responsible disclosure practices

## Questions?

Feel free to ask questions in issues or discussions. We're happy to help!
