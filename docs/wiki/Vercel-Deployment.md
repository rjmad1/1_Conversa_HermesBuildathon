# Vercel Deployment

> **Current-state notice:** Conversa is an active MVP prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document details the configuration for running Conversa on Vercel.

## Vercel Build Setup

* **Build Command**: `vite build`
* **Output Directory**: `dist`
* **Framework Preset**: Other (Vite)
* **Root Directory**: `./`

## Routing Overrides
To ensure that Hono API routes are intercepted correctly and all other paths fall back to the Vite Single Page Application, configure `vercel.json` as follows:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Traceability
Each deployment should show the current Git commit hash in the UI footer to maintain trace link integrity.
* Live deployment: `https://1-conversa-hermes.vercel.app/`
* Connected branch: `ANTIGRAVITY_TENTHGATE/publication-readiness-audit` (or merged main)
* Expected commit status: `788811f` (plus publication documents commit).
