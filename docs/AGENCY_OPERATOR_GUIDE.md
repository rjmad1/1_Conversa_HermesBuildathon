# Agency Operator Guide

This guide is designed for PMs and non-engineers to configure, monitor, and approve multi-agent analysis runs.

## Operating the Crew

1. **Accessing the Control Panel**
   - Click the **Agency Control** tab in the navigation menu.

2. **Selecting a Meeting**
   - Enter or paste the Meeting UUID into the **Active Meeting ID** input field.

3. **Configuring Specialist Roles**
   - Toggle checkboxes to enable/disable specific specialists (`DECISION_SPECIALIST`, `RISK_SPECIALIST`, `ACTION_SPECIALIST`).
   - Observe the live **Planned Agent Sequence** diagram updating dynamically based on your settings.

4. **Adjusting Confidence & Approvals**
   - Use the slider to set the **Confidence Threshold** (default: 0.8).
   - Check the **Pause before final approval** toggle to require a human signature before saving extracted action items.

5. **Starting the Run**
   - Click **Start Managed Agency Run**.
   - You will be redirected to the **Agency Runs** page where execution status, latency, token usage, and costs are updated live.

6. **Approving or Requesting Revisions**
   - If paused, click **Approve final output** to commit the actions or **Reject final output** to cancel them.
   - If a step fails with an `ESCALATED` status, click **Re-run failed specialist step** to trigger execution again.
