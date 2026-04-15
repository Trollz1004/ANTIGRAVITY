# System Architecture

This document describes the architecture of the ANTIGRAVITY platform, including YouAndINotAI and related services.

## Overview

The ANTIGRAVITY platform consists of multiple interconnected services designed to facilitate real-world community connections while maintaining strong safety and privacy controls.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Public Internet                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐     ┌─────────────────┐    ┌────────────┐ │
│  │              │     │                 │    │            │ │
│  │   Browser    │────▶│  Cloudflare     │───▶│   Paper-   │ │
│  │              │     │    Pages        │    │   clip     │ │
│  └──────────────┘     └─────────────────┘    │            │ │
│                            │                 └────────────┘ │
│                            ▼                                │
│                       ┌──────────┐                          │
│                       │          │                          │
│                       │ YouAndINotAI │                      │
│                       │   Frontend   │                      │
│                       │              │                      │
│                       └──────────┘                          │
│                            │                                │
│                            ▼                                │
│  ┌──────────────┐     ┌─────────────────┐    ┌────────────┐ │
│  │              │     │                 │    │            │ │
│  │   Mobile     │────▶│  Cloudflare     │───▶│   YouAnd-  │ │
│  │   Apps       │     │    Tunnel       │    │   INotAI   │ │
│  │              │     │                 │    │   API      │ │
│  └──────────────┘     └─────────────────┘    │            │ │
│                            │                 └────────────┘ │
│                            ▼                     │         │
│                    ┌──────────────┐              │         │
│                    │   Google     │◀─────────────┘         │
│                    │ Cloud Run    │                        │
│                    └──────────────┘                        │
│                            │                               │
│                            ▼                               │
│                    ┌──────────────┐                       │
│                    │              │                       │
│                    │ PostgreSQL   │                       │
│                    │   Docker     │                       │
│                    │              │                       │
│                    └──────────────┘                       │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Backend Services

### YouAndINotAI API (FastAPI)

- **Language**: Python
- **Framework**: FastAPI
- **Hosting**: Google Cloud Run
- **Database**: PostgreSQL

Key responsibilities:

- User authentication and management
- Matching algorithms
- Safety and moderation features
- Payment processing integration
- Event and volunteering coordination

### Data Flow

1. User registration/authentication
2. Profile creation and verification
3. Discovery and matching
4. Communication through messaging system
5. Event/volunteering coordination
6. Payment processing for premium features

## Frontend Applications

### YouAndINotAI Web Application

- **Framework**: React 19
- **Hosting**: Cloudflare Pages
- **Build Tool**: Vite

Key features:

- User interface for registration/login
- Profile management
- Discovery interface
- Messaging system
- Safety tools
- Event/volunteering discovery

## Infrastructure Components

### Database

- **PostgreSQL**: Primary data store
- **Host**: Docker container on SABRETOOTH node
- **Port**: 5432

### Authentication

- JWT-based authentication
- OAuth integrations for third-party services
- Multi-factor authentication support

### Payments

- **Provider**: Square
- **Account**: joshlcoleman@gmail.com
- **Features**: Subscription management, one-time payments

### CDN and Hosting

- **Frontend**: Cloudflare Pages
- **API Gateway**: Cloudflare Tunnel
- **Security**: Cloudflare protection

## Security Architecture

### Data Protection

- Encryption at rest and in transit
- Role-based access control
- Audit logging for all critical operations
- Regular security assessments

### Safety Features

- User blocking and reporting
- Content moderation
- Privacy controls
- Emergency contact integration

## Monitoring and Observability

### Health Checks

- API health endpoints
- Database connectivity monitoring
- Payment system status
- Third-party service dependencies

### Logging

- Structured JSON logging
- Request correlation IDs
- Error tracking integration (planned)
- Performance metrics (planned)

## Disaster Recovery

### Backup Strategy

- Automated database backups
- Configuration version control
- Infrastructure as Code
- Recovery procedure documentation

## Scalability Considerations

### Current Capacity

- User base: Small-medium scale
- Requests per second: Low-moderate
- Storage: Minimal to moderate

### Scaling Plan

- Horizontal scaling for API services
- Database read replicas
- CDN caching for static assets
- Load balancing (future)

## Future Improvements

### Planned Enhancements

1. Microservices architecture
2. Real-time communication features
3. Advanced analytics dashboards
4. Mobile app native implementation
5. Enhanced AI-driven matching
