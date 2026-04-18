# Architecture Overview

The system follows a layered architecture with clear separation of concerns.

## Components

- [Authentication](auth.md) — handles user identity and tokens
- [Data Layer](data-layer.md) — database access and caching
- [API Layer](../api/endpoints.md) — REST endpoints exposed to clients

## Diagram

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client   │───▶│   API    │───▶│   Data   │
└──────────┘    └──────────┘    └──────────┘
                     │
                ┌──────────┐
                │   Auth   │
                └──────────┘
```

## External Dependencies

- [Express.js](https://expressjs.com/) — HTTP framework
- [PostgreSQL](https://www.postgresql.org/) — primary database
- [Redis](https://redis.io/) — caching layer

## Related

- Back to [README](../README.md)
- [Troubleshooting](../guides/troubleshooting.md)
