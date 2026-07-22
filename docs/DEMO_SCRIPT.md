# Demo Script

> **Current-state notice:** Conversa is an active MVP prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This script details the exact walk-through for the **Pasted Transcript & Action Governance** demo flow.

* **Approximate Duration**: 2 minutes.
* **Test Fixture**: Use the synthetic transcript below.

---

## Interactive Steps

### 1. Create a Meeting
* **Action**: On the "1 · Meeting Setup" card, enter:
  * **Title**: `Beta Release Planning`
  * **Meeting Type**: `CEREMONY`
  * **Scheduled date/time**: (Leave blank or select current date)
* **Action**: Click the **Create meeting** button.
* **Expected Output**: The card advances to the "2 · Input" screen.

### 2. Paste Meeting Transcript
* **Action**: Scroll to the "Paste transcript" section.
* **Action**: Copy and paste the following text:
  ```text
  Team agreed to launch the beta on the 15th. Priya owns the launch checklist. We decided to defer the billing integration. Rajeev will draft the RFC by Friday.
  ```
* **Action**: Click the **Analyze pasted transcript** button.
* **Expected Output**: Displays "3 · Processing" showing progress ticks for validating transcript and analyzing. UI then navigates to "4 · Review".

### 3. Review AI-Extracted Actions
* **Action**: Review the generated sections:
  * **Summary**: Verifies the launch decisions.
  * **Decisions**: "We decided to defer the billing integration."
  * **Proposed Actions**: Two action cards are rendered:
    1. **Launch the beta on the 15th** (Owner: Priya, Priority: HIGH)
    2. **Draft the RFC** (Owner: Rajeev, Priority: MEDIUM)

### 4. Approve Action Item
* **Action**: Click **Approve** on Priya's action card.
* **Expected Output**: Card refreshes; Priya's action status updates from `PROPOSED` to `APPROVED`.

### 5. Reject Action Item with Reason
* **Action**: Click **Reject** on Rajeev's action card.
* **Action**: Enter `"Design dependencies unresolved"` in the reason input field.
* **Action**: Click **Confirm reject**.
* **Expected Output**: Card refreshes; Rajeev's action status updates from `PROPOSED` to `REJECTED`.

### 6. Inspect Audit Trail
* **Action**: Click **View audit timeline** at the bottom of the review card.
* **Expected Output**: Chronological events are listed, including:
  * `MEETING_CREATED`
  * `TRANSCRIPT_SUBMITTED`
  * `ANALYSIS_COMPLETED`
  * `ACTION_APPROVED`
  * `ACTION_REJECTED`
* **Action**: Click **Back to review** to return.

---

## Recovery Steps on Failure
* If the server fails to load or logs errors:
  1. Restart the server locally: `npm run dev` (clears in-memory cache).
  2. Verify that there is no other application blocking port `3000`.
  3. Ensure no `.env` file is overriding variables to non-existent backends (e.g. if `STORAGE_BACKEND` is set to `r2` or `PERSISTENCE_BACKEND` is set to `d1`, remove them to fall back to memory).
