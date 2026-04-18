# Authentication Module

Handles user authentication via JWT tokens.

## How It Works

1. User submits credentials to the [login endpoint](../api/endpoints.md)
2. Server validates against the [data layer](data-layer.md)
3. JWT token issued on success

## Libraries

- [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) — JWT signing/verification
- [bcrypt](https://www.npmjs.com/package/bcrypt) — password hashing

## Configuration

See [setup guide](../guides/setup.md) for environment variable configuration.

## Related

- [Architecture Overview](overview.md)
- [API Endpoints](../api/endpoints.md)
