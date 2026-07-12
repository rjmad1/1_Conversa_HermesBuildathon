# Agency Observability

Wiki page detailing runs, steps, costing, and trace visualization.

See [AGENCY_OBSERVABILITY_GUIDE.md](../AGENCY_OBSERVABILITY_GUIDE.md) for full descriptions.

## Monitored Metrics
- **Latencies**: Tracked at both run and step levels.
- **Tokens**: Counted where the provider returns them.
- **Pricing**: Estimated per rate limits configured in `model-pricing.ts`.
- **Auditing**: Plan creation, step execution, and approval actions recorded.
