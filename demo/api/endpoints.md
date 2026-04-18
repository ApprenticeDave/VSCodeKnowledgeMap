# API Endpoints

All endpoints are prefixed with `/api/v1`.

## Authentication

| Method | Path           | Description          |
|--------|----------------|----------------------|
| POST   | `/auth/login`  | User login           |
| POST   | `/auth/signup` | User registration    |
| POST   | `/auth/refresh`| Refresh access token |

See [Auth Module](../architecture/auth.md) for implementation details.

## Users

| Method | Path           | Description      |
|--------|----------------|------------------|
| GET    | `/users/me`    | Current user     |
| PUT    | `/users/me`    | Update profile   |

## Data

| Method | Path           | Description      |
|--------|----------------|------------------|
| GET    | `/items`       | List all items   |
| POST   | `/items`       | Create item      |
| GET    | `/items/:id`   | Get item by ID   |

See [Data Layer](../architecture/data-layer.md) for storage details.

## Error Handling

All errors follow [RFC 7807](https://www.rfc-editor.org/rfc/rfc7807) format.
See [troubleshooting](../guides/troubleshooting.md) for common error codes.

## Related

- [Architecture Overview](../architecture/overview.md)
- [API Testing with Postman](https://www.postman.com/)
