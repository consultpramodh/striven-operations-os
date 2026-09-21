# Security and Write Safety

## Secrets

- Never commit Striven Client ID, Client Secret, access tokens, or refresh tokens.
- Secrets must remain server-side.
- Logs must never include Authorization headers or credential values.
- Tenant manifests committed to source control must contain no tenant record data.

## Stage modes

1. Discovery
2. Read-only
3. Controlled write
4. Production write

The repository currently implements **Discovery** only.

## Hard rules

- Never guess a CustomerID, SalesOrderID, TaskID, AssetID, EmployeeID, or custom-field ID.
- Fail closed when a mapping is unresolved.
- Search before create once writes are introduced.
- All future mutations must pass a single write gate.
- All future mutations must be idempotent, auditable, and verified.
