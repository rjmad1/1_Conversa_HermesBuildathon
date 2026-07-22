# Contributing to Conversa

Thank you for your interest in Conversa!

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

## Development Model

Conversa is a **Hono REST API** paired with a **Vite Vanilla JS SPA**. 

We operate a strict validation pipeline. Before submitting any changes or opening a Pull Request, you must verify the local build and test suites.

## Submission Guidelines

1. **Keep it Audio-First**: Video support is explicitly out of scope for this release.
2. **Follow Type Safety**: No `any` types in TypeScript.
3. **Verify All Gates**: Ensure all tests, lints, and type checks pass.
4. **No Secrets**: Never commit private keys, tokens, or credentials.
5. **No Forced History Writes**: Do not force-push to the main branch.

## Run Verification Suite

To run all quality gates locally:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:integration
npm run test:e2e
npm run build
```
