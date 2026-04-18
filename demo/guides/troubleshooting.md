# Troubleshooting

Common issues and how to resolve them.

## Database Connection Failed

Make sure Docker is running and the database container is up.
See [setup guide](setup.md) for Docker instructions.

## Authentication Errors

- Check `JWT_SECRET` is set correctly in `.env`
- Ensure tokens haven't expired — see [auth module](../architecture/auth.md)
- Verify credentials against the [login endpoint](../api/endpoints.md)

## 404 on API Routes

- Ensure the server is running on the expected port
- Check [API endpoints](../api/endpoints.md) for correct paths
- Verify the `/api/v1` prefix is included

## Redis Connection Issues

- Check `REDIS_URL` in your `.env` file
- See [data layer docs](../architecture/data-layer.md) for caching setup

## Still Stuck?

- Search [Stack Overflow](https://stackoverflow.com/) for the error message
- Check [Node.js debugging guide](https://nodejs.org/en/docs/guides/debugging-getting-started)
- Open an issue on [GitHub Issues](https://github.com/)

## Related

- [Setup Guide](setup.md)
- [Architecture Overview](../architecture/overview.md)
