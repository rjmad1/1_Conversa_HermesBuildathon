# Public Deployment Results

This document verifies the routing alignment, endpoint health, and dynamic component behaviors of the Conversa application on the live Vercel production server.

## Public Vercel Environment Verification

- **Production URL**: `https://1-conversa-hermes-buildathon.vercel.app/`
- **Build Commit SHA**: `d3706af`
- **Build Status**: READY (Deployment successfully compiled with Vite frontend assets and esbuild-bundled backend server).
- **Liveness API Status**: HTTP 200 `{"live":true,"version":"0.3.0","commit":"d3706af"}`
- **Readiness API Status**: HTTP 200 `{"status":"ok","live":true,"ready":true,"details":{"persistence":true}}`

---

## Live UI Capability Walkthrough

- **Agency Control Page Loads**: **Yes**. Toggling the `tab-agency-control` loads the form inputs successfully.
- **Agency Runs Page Loads**: **Yes**. Loads transient history and dropdown lists.
- **Run Trace Opens**: **Yes**. Displays step details and status.
- **Compare Runs Works**: **Yes**. Dropdowns and compare-table render side by side.
- **Specialist Selection Works**: **Yes**. Toggling roles changes steps dynamically.
- **Confidence Threshold Slider Works**: **Yes**. Slider handles confidence inputs.
- **Approval Pause Works**: **Yes**. Puts run in `PAUSED` status.
- **Retry / Revision Works**: **Yes**. Triggers revision loop on correct steps and retries escalated steps.
- **Escalation is Visible**: **Yes**. Warning card displays the escalation blocker.
- **Build SHA Matches GitHub**: **Yes**. Renders in health payload.
- **No Route Returns 404 / FUNCTION_INVOCATION_FAILED**: **Yes**. Routing rewrites route requests correctly.
