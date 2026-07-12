# Final Acceptance Artifact 04: Public Demo Results

This document verifies the end-to-end execution of the public demo workflow against the live Vercel API.

## Public Demo Flow Log
The integration test script `public-smoke-test.ts` was run directly against `https://1-conversa-hermes-buildathon.vercel.app` with the following output:

```text
=== START PUBLIC E2E VERIFICATION ===
1. Checking live health endpoint...
- Live Health response: {"live":true,"version":"0.3.0","commit":"d3706af"}
2. Checking ready health endpoint...
- Ready Health response: {"status":"ok","live":true,"ready":true,"details":{"persistence":true}}
3. Creating meeting...
- Meeting created successfully. ID: cba0dd12-02b3-4cd2-a8a6-3f054bc4cb98
4. Submitting transcript with benchmark text...
- Transcript submitted. ID: 67b65f3e-adc1-4542-ba22-5a25ad871434
5. Running transcript analysis...
- Analysis generated successfully.
6. Retrieving and validating analysis outputs...
- Summary: Extracted 3 decision(s), 3 proposed action(s), and 2 risk(s).
- Decisions found: 3
- Proposed Actions found: 3
- Risks found: 2
- Found Action ID for Priya: 492be390-9b6b-4eee-8db8-374223e36649
7. Testing action approval...
- Action approved successfully.
8. Verifying audit timeline logs...
- Retrieved 4 audit events.
- Found ACTION_APPROVED audit event in timeline!
=== PUBLIC E2E VERIFICATION PASSED SUCCESSFULLY ===
```

## Extracted Insights (Judge Heuristics)
The analysis engine successfully extracted the expected findings:
1. **Decisions:**
   - Use pasted-transcript workflow as the primary public demo path.
   - Publish with explicit experimental/prototype warning.
   - Keep production deployment blocked until authentication and durable persistence are implemented.
2. **Proposed Actions:**
   - Verify GitHub and Wiki navigation (Maya, due 15 July 2026).
   - Confirm deployed commit and run public smoke test (Priya, due 15 July 2026).
   - Approve publication only after link scan, security tests, and public demo pass (Daniel).
3. **Risks:**
   - Vercel traceability risk: deployed application may not match latest GitHub commit.
   - Production risk: authentication and durable persistence are missing prerequisites.
