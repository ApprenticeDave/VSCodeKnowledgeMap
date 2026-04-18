# Setup Guide

How to get the project running locally.

## Prerequisites

- [Node.js 20+](https://nodejs.org/) installed
- [Docker](https://www.docker.com/) for database containers
- [Git](https://git-scm.com/) for version control

## Steps

1. Clone the repo
2. Copy `.env.example` to `.env`
3. Run `docker compose up -d` to start PostgreSQL and Redis
4. Run `npm install`
5. Run `npm run migrate` to set up the database schema
6. Run `npm run dev` to start the development server

## Environment Variables

| Variable       | Description                |
|----------------|----------------------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL`    | Redis connection string     |
| `JWT_SECRET`   | Secret for signing tokens   |

See [auth module](../architecture/auth.md) for token configuration.

## Next Steps

- [API Endpoints](../api/endpoints.md) — start making requests
- [Contributing](contributing.md) — how to submit changes
- [Troubleshooting](troubleshooting.md) — if something goes wrong
