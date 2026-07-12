# Phase 07 - Public Demo Results

This document records the results of the public and local verification demo.

## 1. Public Vercel Demo Status
* **Vercel URL**: `https://1-conversa-hermes-buildathon.vercel.app/`
* **Reachability Status**: **404 NOT FOUND**
* **Verification**: The target deployment is currently unreachable, returning a Vercel 404 page. Source-to-deployment alignment cannot be verified until the repository owner triggers a new build from the Vercel dashboard.

## 2. Local Demo Status
* **Local Server URL**: `http://localhost:3000/`
* **Verification Status**: **SKIPPED**
* **Notes**: Active browser demo flow testing was skipped per explicit user instruction ("Skip testing/quality assurance activities on the the application and proceed with other activities NOW").

## 3. Stable Demo Pathway
The stable demo pathway is documented in [Demo Guide](docs/wiki/Demo-Guide.md) and [Demo Script](docs/DEMO_SCRIPT.md). To run the demo locally once the codebase is checked out:
1. Initialize environment files: `cp .env.example .env`
2. Install dependencies: `npm ci`
3. Compile frontend bundle: `npm run build`
4. Start server: `npm run dev`
5. Open browser to `http://localhost:3000/`, paste the synthetic transcript, click "Analyze", and approve/reject the resulting action items.
