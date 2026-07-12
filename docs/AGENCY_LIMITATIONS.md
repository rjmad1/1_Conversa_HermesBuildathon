# Agency Limitations

This document lists the limitations of the current Conversa AI Agency implementation.

## Limits in this Phase

1. **In-Memory Storage Only**
   - All agency run states, step traces, and extracted analysis outputs are stored in-memory. They do not persist across server restarts.

2. **No Production Authentication**
   - Authentication relies on development/mock HTTP headers (`x-tenant-id`, `x-workspace-id`). No token rotation or durable identity provider exists.

3. **No Durable Long-Term memory**
   - Memory is scoped to the active run, cross-agent handoffs, and follow-up query tasks within the same meeting. No vector storage or cross-meeting long-term memory exists.

4. **No Autonomous External-System Writes**
   - The agents propose actions (internal or external system types) but never execute write operations to external tools/APIs autonomously. All actions remain proposed until human approval.

5. **Single Automatic Revision**
   - Maximum one automatic revision loop is supported per specialist step.
