# Repository Governance

## Overview

This document outlines the governance model for the ANTIGRAVITY repository and related projects. These guidelines ensure consistent, secure, and mission-aligned development practices across all contributors.

## Branch Protection Rules

### Main Branch (Production)

- Protected branch - direct pushes forbidden
- Requires at least 1 approved review from CODEOWNERS
- Status checks required:
  - CI/CD pipeline must pass
  - All tests must pass
  - Linting must pass
  - No security vulnerabilities
- Linear history enforced
- Include administrators in restrictions

### Develop Branch (Integration)

- Semi-protected branch
- Requires passing CI checks
- Allows fast-forward merges from feature branches
- Feature flags recommended for incomplete features

### Feature Branches

- Naming convention: `feature/descriptive-name`
- No mandatory CI checks for personal forks
- Required checks for branches in main repository

## Pull Request Approval Rules

### Review Requirements

- All PRs require at least 1 review from a CODEOWNER
- High-risk changes require 2 reviews
- CODEOWNERS are defined in the `.github/CODEOWNERS` file

### Approval Criteria

- Code follows established style guides
- Adequate test coverage (minimum 80%)
- No new linting errors
- Security considerations addressed
- Breaking changes documented
- Changelog updated

### Merge Requirements

- All CI status checks must pass
- No "Changes requested" reviews outstanding
- PR description must be filled out
- Self-approval prohibited

## Release and Versioning

### Versioning Scheme

We follow Semantic Versioning 2.0.0:

- MAJOR version for incompatible API changes
- MINOR version for backward-compatible functionality
- PATCH version for backward-compatible bug fixes

### Release Process

1. Create release branch from develop
2. Finalize changelog and version bump
3. Create tag and GitHub release
4. Deploy to production
5. Merge release branch back to main and develop

### Tagging Convention

- Tags follow version format: `v1.2.3`
- Pre-release versions use: `v1.2.3-beta.1`
- Release candidates use: `v1.2.3-rc.1`

## Code Ownership

### Current CODEOWNERS

- Backend/API: @cto
- Frontend: @uxdesigner
- Infrastructure: @cto
- Documentation: @cmo
- Security: @mission-guardian

### Becoming a CODEOWNER

CODEOWNERS are senior contributors with:

- Deep expertise in their domain
- Consistent contribution history
- Understanding of security and compliance requirements
- Approval from existing CODEOWNERS

## Mission Alignment Principles

### Charity-First Mission

- 10% of LLC-controlled revenue directed to children's charities
- All features evaluated for alignment with connecting humans for good
- Marketing emphasizes real-world connection over transaction

### Transparency and Auditability

- Core algorithms remain inspectable
- Financial flows documented and verifiable
- No hidden manipulation of user experiences for profit maximization

### Single Point of Failure Prevention

- Multiple administrators for critical services
- Key rotation procedures documented
- Succession planning for founder roles
- Decentralized decision-making where possible

## Compliance Requirements

### Florida Statute §496.405

- No use of "donate," "donation," or "solicitation" terminology
- Use "contractual revenue disbursement" instead
- Regular scanning for compliance violations
- Legal review of user-facing copy

### Data Privacy

- GDPR compliance for European users
- California Consumer Privacy Act compliance
- Right to deletion requests honored within 30 days
- Data minimization principles applied

### Accessibility Standards

- WCAG 2.1 AA compliance targeted
- Regular accessibility audits
- Automated accessibility testing in CI pipeline

## Issue Tracking and Resolution

### Priority Levels

- Critical: Blocks production or violates compliance
- High: Significantly impacts user experience or business
- Medium: Noticeable issues that should be addressed soon
- Low: Minor enhancements or cosmetic issues

### SLA Targets

- Critical issues: 4 hours acknowledgment, 24 hours resolution
- High priority issues: 1 business day acknowledgment, 1 week resolution
- Medium priority issues: 3 business days acknowledgment, 2 weeks resolution
- Low priority issues: 1 week acknowledgment, best effort resolution

## Quality Assurance Standards

### Testing Requirements

- Unit test coverage minimum: 80%
- Integration tests for all API endpoints
- End-to-end tests for critical user journeys
- Performance benchmarks for key operations
- Security scanning integrated into CI pipeline

### Code Review Standards

- Reviews must assess correctness, security, and maintainability
- Large changes should be broken into multiple smaller PRs
- Architecture changes require discussion with tech leads
- Dependencies additions require security review

## Change Management Process

### Major Feature Development

1. RFC (Request for Comments) created for significant changes
2. Architectural review by CTO and relevant CODEOWNERS
3. Prototype implementation if needed
4. Security and compliance review
5. User experience review
6. Gradual rollout with feature flags

### Emergency Changes

- Security patches may bypass normal review process
- Production incidents may require immediate fixes
- Post-mortem required for all emergency changes
- Emergency changes must be reviewed retroactively

## Succession Planning

### Founder Transition

- Decentralized governance to prevent single-person bottleneck
- Documentation-first approach to institutional knowledge
- Regular cross-training among team members
- External advisors for critical decisions

### Key Rotation Procedures

- Infrastructure API keys rotated quarterly
- Database passwords rotated annually
- SSL certificates monitored for renewal
- Access keys reviewed monthly

## Continuous Improvement

### Regular Reviews

- Monthly governance review meetings
- Quarterly security posture assessments
- Annual compliance audit preparation
- Sprint retrospectives for process improvements

### Feedback Mechanism

- Anonymous feedback channel for process suggestions
- Regular surveys of contributors
- Incident retrospectives for learning
- Community feedback incorporation
