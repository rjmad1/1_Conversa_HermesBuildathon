# Phase 06 - Vercel Traceability

This document records the traceability, configuration settings, and deployment alignment status of the public Vercel application.

## 1. Reachability Status
* **Target App URL**: `https://1-conversa-hermes-buildathon.vercel.app/`
* **Reachability Status**: **UNREACHABLE / 404 NOT FOUND**
* **Verification Method**: Checked via `read_url_content` returning a HTTP 404 response.
* **Traceability Verdict**: **UNALIGNED / VERCEL PENDING**

> [!WARNING]
> Because the Vercel deployment currently returns a 404 error, the deployment does not reflect the current codebase HEAD (`a0bde80`) or our newly applied quality refactoring commits. Local code is fully validated, but Vercel deployment remains pending owner re-configuration/deployment activation on the Vercel dashboard.

---

## 2. Dashboard Alignment Settings
To align the live Vercel application once the repository owner re-deploys, the following project settings must be verified on Vercel:

### Project Settings
* **Framework Preset**: `Vite` (Vite SPA)
* **Build Command**: `npm run build` (which compiles the TypeScript files and bundles UI via Vite)
* **Output Directory**: `dist`
* **Root Directory**: `./`

### Git Integration Settings
* **Connected Repository**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon`
* **Production Branch**: `main`

### Environment Variables
Configure the following variables in the Vercel project dashboard to support local and mock runtime bounds:
* `AUDIO_MAX_BYTES` = `10485760` (10 MB)
* `AUDIO_ALLOWED_MIME_TYPES` = `audio/mpeg,audio/wav,audio/mp4`

---

## 3. Frontend Footer Traceability Link
To maintain trace link integrity, we have modified the Vite SPA entry point `src/ui/index.html` to display a persistent footer containing:
* **GitHub Repository Link**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon`
* **GitHub Wiki Link**: `https://github.com/rjmad1/1_Conversa_HermesBuildathon/wiki`
* **Build Warning**: `Buildathon Prototype — Not Production Ready.`
* **Current Commit Hash**: `a0bde80` (to be updated on the final pushed commit)
