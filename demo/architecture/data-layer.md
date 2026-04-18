# Data Layer

Manages all database interactions and caching.

## Database

Uses PostgreSQL with connection pooling.

- [pg](https://www.npmjs.com/package/pg) — PostgreSQL client
- [Schema migrations](../guides/setup.md) are handled during setup

## Caching

Redis is used for session storage and query caching.

- [ioredis](https://www.npmjs.com/package/ioredis) — Redis client

## Related

- [Architecture Overview](overview.md)
- [Auth Module](auth.md) — uses data layer for credential lookup
- [API Endpoints](../api/endpoints.md) — consumes data layer
