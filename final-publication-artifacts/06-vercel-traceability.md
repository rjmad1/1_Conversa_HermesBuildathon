# Phase 06 - Vercel Traceability

This document records the traceability, deployment settings, and alignment verification of the Vercel application.

## 1. Deployment Target
* **App URL**: `https://1-conversa-hermes-buildathon.vercel.app/`
* **Reachability Status**: **UNREACHABLE / 404 NOT FOUND** (The domain exists but Vercel returns a 404 page, indicating no active deployment matches this URL or deployment was paused/removed).

## 2. Setting Audit and Alignment (Mismatch Analysis)
Because the deployed instance is currently unreachable/returns 404, there is a **source-to-deployment mismatch**. The deployment does not contain the security hardening commit `788811f` or the documentation/publication commits.

To align the Vercel application with the published repository, the repository owner must apply the following settings in the Vercel dashboard:

### Project Settings
* **Framework Preset**: `Vite` (Vite SPA)
* **Build Command**: `npm run build` (which runs `tsc --noEmit && vite build`)
* **Output Directory**: `dist`
* **Root Directory**: `./`

### Git Integration Settings
* **Connected Repository**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon`
* **Production Branch**: `main`

### Environment Variables
The following environment variables must be configured on Vercel to support the Hono backend:
* `AUDIO_MAX_BYTES` = `10485760`
* `AUDIO_ALLOWED_MIME_TYPES` = `audio/mpeg,audio/wav,audio/mp4`

## 3. Recommended Frontend Footer Metadata
Once aligned and rebuilt, the landing page (`src/ui/index.html`) should expose the following public meta-links in the footer:
* **GitHub Repository Link**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon`
* **Wiki Link**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon/wiki`
* **Build Warning**: `Buildathon Prototype — Not Production Ready.`
* **Build Commit**: `cc5af21`

## 4. Verdict
* **Status**: **UNALIGNED / VERCEL PENDING**
* **Confirmation**: Local code and GitHub repository are fully synchronized, but the Vercel deployment is pending owner configuration and redeployment.
