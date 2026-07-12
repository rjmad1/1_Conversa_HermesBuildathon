# Deployment Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document describes how to deploy Conversa.

## Target Platform: Vercel
Conversa is structured to run as a serverless project on Vercel:
1. **Frontend Assets**: Bundled by Vite into the `dist/` folder and served via Vercel's Edge network.
2. **Backend API**: The Hono server is routed via Vercel Serverless Functions.

## Standard Deployment Steps

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```
2. Link the repository to your Vercel project:
   ```bash
   vercel link
   ```
3. Set environment variables on Vercel:
   * Go to Vercel Settings -> Environment Variables.
   * Add any external provider keys (e.g. OpenAI keys if not using BYOK).
4. Run the build & deploy command:
   ```bash
   vercel --prod
   ```

## Known Deploying Constraints
* **Cold Starts**: Serverless functions will lose in-memory repository states on cold start.
* **Timeout Limit**: Serverless functions on the Hobby tier are capped at 10 seconds (Pro tier 60 seconds). This makes the pasted transcript path the only reliable route for long meeting data.
