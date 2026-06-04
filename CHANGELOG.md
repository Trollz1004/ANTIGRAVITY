# Changelog

All notable changes to the ANTIGRAVITY project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Repository structure with `/frontend`, `/backend`, `/infra`, `/scripts`, `/docs` directories
- Prettier + ESLint for JS/TS formatting and linting
- Black + Ruff for Python formatting and linting
- Git hooks configuration for pre-commit checks
- Comprehensive documentation in docs/ directory:
  - `contributing.md` - Contribution guidelines
  - `architecture.md` - System architecture overview
  - `api.md` - API endpoints and usage
  - `workflows.md` - Core business workflows
- `.env.example` file with all required environment variables
- README.md with setup instructions and project overview
- SECURITY.md with vulnerability reporting process
- docs/governance.md with branch protection, PR approval rules, release/versioning
- CHANGELOG.md for release tracking

### Changed

- Organized existing YouAndINotAI apps into proper directory structure
- Updated root README.md with new structure and setup instructions

### Fixed

- Improved consistency between repository structure and documentation

### Removed

- None

## [1.0.0] - 2026-04-15

### Added

- Initial project structure and documentation
- Basic CI validation workflow
- Deployment workflow to Google Cloud Run

[Unreleased]: https://github.com/Trollz1004/Antigravity/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Trollz1004/Antigravity/releases/tag/v1.0.0
