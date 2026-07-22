# Troubleshooting

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Common issues and resolution paths for Conversa.

## Troubleshooting Table

| Symptom | Likely cause | Verification | Resolution |
| :--- | :--- | :--- | :--- |
| **Dependency installation fails** | Node/npm version mismatch or lockfile conflict. | Run `node -v` and `npm -v`. Check error logs. | Clean cache: `npm cache clean --force` and run `npm ci` to install from lockfile. |
| **TypeScript check fails** | Build configurations out of sync with new code additions. | Run `npm run typecheck` to view target syntax errors. | Address compiler errors. Ensure types are defined for new domain interfaces. |
| **Lint fails** | Code formatting rules violated or unused imports. | Run `npm run lint` locally. | Fix errors automatically with `npx eslint --fix .` or resolve manually. |
| **Vitest fails** | Regression in domain logic or mock changes. | Run `npm run test` or `npx vitest run --reporter=verbose`. | Re-verify in-memory mocks and ensure tests scope tenant parameters correctly. |
| **Build fails** | Vite configuration issue or static assets missing. | Run `npm run build` to see output logs. | Ensure no compilation errors exist and that output directories are empty. |
| **Vercel deployment fails** | Incorrect output directory or serverless routing conflict. | Inspect Vercel build output console logs. | Ensure output is set to `dist` and server route overrides align with Vite SPA. |
| **Missing env variables** | `.env` not loaded in local terminal or missing Vercel keys. | Console logs show missing parameters during start. | Copy `.env.example` to `.env` and fill values, or add env keys in Vercel settings. |
| **Transcript analysis fails** | OpenAI API key missing, invalid, or expired. | Check network logs for `401 Unauthorized` or `429 Rate Limit`. | Provide a valid OpenAI API key in the client configuration panel. |
| **Empty actions returned** | Transcript contains no actionable items or parser error. | Verify OpenAI response in the browser console. | Refine the prompt or enter a more descriptive synthetic transcript. |
| **Missing storage object** | Audio asset cleared from volatile memory. | Request returns `404 Storage Reference Not Found`. | Re-upload the meeting audio. Storage is volatile and is cleared post-analysis. |
| **OpenAI config error** | Wrong API key format or incorrect endpoint configuration. | Test endpoint directly using curl or check API wrapper setup. | Re-enter key. Verify billing status and access limits on OpenAI developer dashboard. |
| **Tenant/workspace not found** | Scoping headers (`x-tenant-id`, `x-workspace-id`) missing. | Request returns `400 Bad Request` or `401 Unauthorized`. | Ensure client requests include valid tenant/workspace header strings. |
| **Approval conflicts** | Action item updated concurrently or not found in memory. | Request returns `409 Conflict` or `404 Not Found`. | Refresh the page. Since storage is in-memory, session conflicts require restart. |
| **Logger output missing** | Redaction filter swallowed output or logger level disabled. | Check Console output configurations. | Verify if output contains credentials (which are censored) or adjust logger verbosity. |
| **Wiki publishing fails** | Remote wiki repository not initialized or permission denied. | Run `git push` on wiki repository to inspect remote error. | Enable Wiki in the GitHub repository settings and initialize the first page. |
| **Source/deployment mismatch** | Deployments not synchronized with the latest main commit. | Check commit hash displayed in the deployed application footer. | Trigger a manual redeployment in the Vercel dashboard using the correct branch. |
