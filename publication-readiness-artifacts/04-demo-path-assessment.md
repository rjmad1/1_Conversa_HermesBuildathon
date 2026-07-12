# Phase 5 - Stable Demo Path Assessment

This document outlines the most reliable, secure, and fully verified end-to-end workflow to demonstrate Conversa's capabilities without exposing risks or hitting mocked edges.

## 1. Selected Demo Workflow: Pasted Transcript & Action Governance

This workflow utilizes the pasted transcript route, which bypasses the audio-parsing layer and tests the entire analysis, approval, rejection, and audit-trail flow.

### Step-by-Step Sequence:

1. **Step 1: Meeting Creation**
   - **Action**: Enter "Launch Sync" in the title field, set type to "CEREMONY", and click "Create Meeting".
   - **Internal API**: `POST /api/v1/meetings`
   - **Outcome**: A meeting ID is generated, and UI advances to the Input screen.
2. **Step 2: Submit Synthetic Transcript**
   - **Action**: In the "Paste Transcript" textarea, copy/paste the following synthetic text:
     ```text
     Team agreed to launch the beta on the 15th. Priya owns the launch checklist. We decided to defer the billing integration. Rajeev will draft the RFC by Friday.
     ```
   - **Action**: Click "Analyze pasted transcript".
   - **Internal API**: `POST /api/v1/meetings/:id/transcript` -> `POST /api/v1/meetings/:id/analysis`
   - **Outcome**: The AI/Fake provider processes the transcript. The UI navigates to the Review page.
3. **Step 3: Review Analysis Results**
   - **Action**: Verify the structured extraction on-screen:
     - **Summary**: Displays the meeting overview.
     - **Decisions**: "We decided to defer the billing integration."
     - **Proposed Actions**:
       1. Description: "Launch the beta on the 15th" (Owner: Priya, Priority: HIGH)
       2. Description: "Draft the RFC" (Owner: Rajeev, Priority: MEDIUM)
4. **Step 4: Approve Action Item**
   - **Action**: On Priya's HIGH priority action card, click the **Approve** button.
   - **Internal API**: `POST /api/v1/actions/:actionId/approve`
   - **Outcome**: The action's status updates to `APPROVED`.
5. **Step 5: Reject Action Item**
   - **Action**: On Rajeev's RFC action card, click the **Reject** button. Enter reason `"Require initial design specs first"` and click **Confirm reject**.
   - **Internal API**: `POST /api/v1/actions/:actionId/reject` with `{ reason: "..." }`
   - **Outcome**: The action's status updates to `REJECTED`.
6. **Step 6: Inspect Audit Log**
   - **Action**: Click **View audit timeline** at the bottom of the review card.
   - **Internal API**: `GET /api/v1/meetings/:id/audit`
   - **Outcome**: Renders chronological events: `MEETING_CREATED`, `TRANSCRIPT_SUBMITTED`, `ANALYSIS_COMPLETED`, `ACTION_APPROVED`, `ACTION_REJECTED`.

## 2. Capabilities & Paths to Avoid During Demo

To prevent failures, do not attempt to demonstrate:
* **Real Audio Upload (Whisper API)**: Requires internet connectivity, real audio bytes, and valid `OPENAI_API_KEY` configured in the backend environment. If not present, the API will throw provider errors.
* **External Tool Writes**: Do not promise or show links to Jira, Slack, or Salesforce. These are only present in documentation and roadmap plans; no code exists.
* **Enterprise Multi-Tenancy Logins**: The interface currently uses development headers (`x-tenant-id`) for tenant scoping; there is no login page or JWT parsing. Keep the demonstration inside the single development tenant workspace.
* **Persistent DB State**: Do not refresh the page or restart the server after creating items, as all data is stored in-memory and will be lost on restart.
