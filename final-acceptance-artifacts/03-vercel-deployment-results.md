# Final Acceptance Artifact 03: Vercel Deployment Results

This document verifies the Vercel serverless configuration and routing alignment for the Conversa application.

## Vercel Deployment Details
- **Project URL:** [1-conversa-hermes-buildathon.vercel.app](https://1-conversa-hermes-buildathon.vercel.app/)
- **Deployment ID:** `dpl_9C19Fbmk6oL4om5zY4tkSZrmgGMN`
- **Target environment:** Production
- **Ready State:** READY

## Routing Configuration
The [vercel.json](file:///c:/Users/rajaj/Projects/1_Conversa/vercel.json) file was configured to route requests:
- `/api/(.*)` routes to `/api/index.js` (compiled serverless bundle).
- `/(.*)` routes to `/index.html` (Vite SPA frontend).

```json
{
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "src/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## API Bundling Solution
To prevent `ERR_UNSUPPORTED_DIR_IMPORT` or `ERR_MODULE_NOT_FOUND` crashes in Node's ESM runtime on Vercel, a custom build step was added to [package.json](file:///c:/Users/rajaj/Projects/1_Conversa/package.json):
```json
"build": "tsc --noEmit && vite build && npx esbuild api/server.ts --bundle --platform=node --format=esm --target=node20 --outfile=api/index.js --packages=external"
```
This bundles only the local source files into `api/index.js` with the named HTTP method exports (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`), which Vercel requires to route incoming API requests.
