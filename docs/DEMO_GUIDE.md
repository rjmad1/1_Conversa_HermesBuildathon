# Demo Guide

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This guide provides the workflow and verification instructions for running the stable Conversa demonstration.

## Demo Preconditions

1. **Node.js Environment**: Verify Node.js (v18+) is installed.
2. **Setup Dependencies**: Run `npm ci` to install pinned packages.
3. **Build Frontend**: Run `npm run build` to compile the single page client SPA.
4. **Boot Server**: Run `npm run dev` (or `npm run serve` to preview built assets).

## How to Access
Once the dev server boots, open your browser and navigate to:
```text
http://localhost:3000
```

Refer to the [Demo Script](DEMO_SCRIPT.md) for the exact walk-through steps and expected outputs.
