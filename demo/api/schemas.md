# API Schemas

JSON schemas used for request/response validation.

## User Schema

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "name": { "type": "string" }
  }
}
```

## Item Schema

```json
{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" }
  }
}
```

## Validation

Uses [Ajv](https://ajv.js.org/) for JSON schema validation.

## Related

- [API Endpoints](endpoints.md) — uses these schemas
- [Data Layer](../architecture/data-layer.md) — mirrors these structures
