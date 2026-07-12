# Agency Limitations

Wiki page summarizing Conversa managed AI agency boundaries.

See [AGENCY_LIMITATIONS.md](../AGENCY_LIMITATIONS.md) for full descriptions.

## Boundaries
- **Storage**: In-memory only (reset on reload).
- **Authentication**: Headers-based mock validation.
- **Memory**: Scoped to the current run trace.
- **Actions**: High-risk actions require manual review and approval before execution.
