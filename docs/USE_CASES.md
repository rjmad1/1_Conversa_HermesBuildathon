# Conversa Use Cases

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document details 18 business use cases for Conversa, specifying their actors, preconditions, flows, approval points, and current support levels.

---

## 1. Sprint Planning
* **ID**: UC-001
* **Name**: Sprint Planning Task Extraction
* **Actor**: Scrum Master / Engineering Team
* **Problem**: Manually writing down tickets from discussion is tedious.
* **Trigger**: Sprint planning session ends.
* **Preconditions**: Meeting transcript paste available.
* **Main flow**: User pastes transcript; AI identifies user stories and assigns owners/estimates.
* **Human approval point**: Scrum master reviews proposed tickets before export.
* **Expected outcome**: Proposed tasks ready for Jira.
* **Current support level**: **Partially supported** (pasted transcript path works; Jira exporter is mocked).
* **Missing capability**: Live Jira API exporter.
* **Risks**: Incorrect estimation values or wrong owners.

## 2. Daily Stand-up
* **ID**: UC-002
* **Name**: Daily Stand-up Progress Tracker
* **Actor**: Developer / Scrum Master
* **Problem**: Writing daily updates takes away time from stand-up meetings.
* **Trigger**: Stand-up meeting concludes.
* **Preconditions**: Audio or transcript is submitted.
* **Main flow**: Conversa summarizes what was done yesterday, today, and blockers.
* **Human approval point**: No approval needed (informational summary).
* **Expected outcome**: Daily summary posted to Slack.
* **Current support level**: **Partially supported** (summary extraction works; Slack webhook is mocked).
* **Missing capability**: Live Slack API connector.
* **Risks**: Blocker items could be missed if phrasing is vague.

## 3. Retrospective
* **ID**: UC-003
* **Name**: Retrospective Action Items Extraction
* **Actor**: Team Lead
* **Problem**: Retro items are forgotten and never executed.
* **Trigger**: Retrospective meeting concludes.
* **Preconditions**: Retrospective transcript is submitted.
* **Main flow**: AI identifies "What went well", "What didn't", and concrete action items.
* **Human approval point**: Team Lead approves action items.
* **Expected outcome**: Tasks are created in Confluence/Jira.
* **Current support level**: **Partially supported** (action item extraction is live; exporters are mocked).
* **Missing capability**: Confluence exporter integration.
* **Risks**: Conversational sarcasm may mock or skew retro summary.

## 4. Product Discovery
* **ID**: UC-004
* **Name**: Product Discovery Feature Extraction
* **Actor**: Product Manager
* **Problem**: Customer feature requests are missed during discovery calls.
* **Trigger**: Discovery call ends.
* **Preconditions**: Audio transcript is submitted.
* **Main flow**: AI pulls user needs, problems, and proposed features.
* **Human approval point**: PM reviews features before sending to Productboard.
* **Expected outcome**: New feature ideas logged.
* **Current support level**: **Conceptual** (not implemented in the MVP UI).
* **Missing capability**: Productboard connector.
* **Risks**: Over-indexing on niche client requests.

## 5. Customer QBR (Quarterly Business Review)
* **ID**: UC-005
* **Name**: QBR Deliverables Tracker
* **Actor**: Customer Success Manager (CSM)
* **Problem**: Customer complaints and CSM commitments are lost in notes.
* **Trigger**: QBR meeting ends.
* **Preconditions**: CSM transcript is pasted.
* **Main flow**: AI extracts client complaints, CSM promises, and timelines.
* **Human approval point**: CSM approves commitments.
* **Expected outcome**: Actions sent to Salesforce.
* **Current support level**: **Conceptual**.
* **Missing capability**: Salesforce integration.
* **Risks**: Unrealistic timelines captured as official tasks.

## 6. Sales Discovery
* **ID**: UC-006
* **Name**: Sales Opportunity Logging
* **Actor**: Account Executive (AE)
* **Problem**: AEs forget to log budget, authority, need, and timeline (BANT) details.
* **Trigger**: Sales call ends.
* **Preconditions**: AE submits the transcript.
* **Main flow**: AI extracts BANT metrics and updates the CRM.
* **Human approval point**: AE reviews and approves CRM update.
* **Expected outcome**: Opportunity created in HubSpot/Salesforce.
* **Current support level**: **Conceptual**.
* **Missing capability**: CRM integration.
* **Risks**: Mismatched opportunity values.

## 7. Incident Review
* **ID**: UC-007
* **Name**: Post-Mortem Root Cause Capture
* **Actor**: SRE / Incident Commander
* **Problem**: Timeline details during post-mortem are difficult to reconstruct.
* **Trigger**: Post-incident review ends.
* **Preconditions**: Incident review transcript is pasted.
* **Main flow**: AI reconstructs incident timeline and extracts prevention tasks.
* **Human approval point**: Incident commander approves post-mortem draft.
* **Expected outcome**: Markdown post-mortem document generated.
* **Current support level**: **Partially supported** (text summary/decisions extracted, doc output is manual).
* **Missing capability**: Automatic Confluence page generation.
* **Risks**: Chronological errors in timeline reconstruction.

## 8. Architecture Decision Meeting
* **ID**: UC-008
* **Name**: Architecture Decision Record (ADR) Auto-Generation
* **Actor**: Software Architect
* **Problem**: Teams forget to document *why* a technical choice was made.
* **Trigger**: Design review ends.
* **Preconditions**: Technical transcript is pasted.
* **Main flow**: AI extracts context, alternatives considered, and final decision.
* **Human approval point**: Lead Architect reviews and approves ADR before committing.
* **Expected outcome**: ADR Markdown file generated.
* **Current support level**: **Partially supported** (summary and decisions extracted).
* **Missing capability**: Git integration to commit ADR directly.
* **Risks**: AI hallucinates architectural trade-offs.

## 9. Steering Committee
* **ID**: UC-009
* **Name**: Steering Committee Executive Summary
* **Actor**: Program Director
* **Problem**: Executives do not read long meeting transcripts.
* **Trigger**: SteerCo meeting ends.
* **Preconditions**: Transcript is pasted.
* **Main flow**: AI extracts high-level project status, funding changes, and risks.
* **Human approval point**: Program Director approves summary.
* **Expected outcome**: Exec-ready PDF or email draft.
* **Current support level**: **Manual** (can copy text summary, no auto-email/PDF generation).
* **Missing capability**: PDF formatter and SMTP email sender.
* **Risks**: Nuanced political discussions summarized incorrectly.

## 10. Compliance Review
* **ID**: UC-010
* **Name**: Compliance Gap Tracker
* **Actor**: Compliance Officer
* **Problem**: Regulatory audits require tracking of compliance gaps discussed.
* **Trigger**: Audit meeting ends.
* **Preconditions**: Audit transcript is submitted.
* **Main flow**: AI extracts non-compliance points and remediation tasks.
* **Human approval point**: Compliance Officer signs off on tasks.
* **Expected outcome**: Tasks logged in internal compliance matrix.
* **Current support level**: **Conceptual**.
* **Missing capability**: Compliance dashboard.
* **Risks**: Missing subtle compliance issues due to technical jargon.

## 11. Training Session
* **ID**: UC-011
* **Name**: Training Q&A Extraction
* **Actor**: Trainer
* **Problem**: Questions asked during training are never answered afterwards.
* **Trigger**: Training session ends.
* **Preconditions**: Training transcript is pasted.
* **Main flow**: AI extracts Q&A pairs and follow-up resources requested.
* **Human approval point**: Trainer approves FAQ list.
* **Expected outcome**: Shared Q&A page updated.
* **Current support level**: **Manual** (can copy summary text).
* **Missing capability**: Wiki Q&A formatter.
* **Risks**: Wrong answers summarized as truth.

## 12. Project Status Meeting
* **ID**: UC-012
* **Name**: Status Update Sync
* **Actor**: Project Manager
* **Problem**: Status meetings waste time on verbal updates.
* **Trigger**: Status meeting ends.
* **Preconditions**: Status transcript is pasted.
* **Main flow**: AI extracts project health indicators and red/amber/green status.
* **Human approval point**: PM approves status report.
* **Expected outcome**: Dashboard updated.
* **Current support level**: **Partially supported** (summary and risks extracted).
* **Missing capability**: Interactive dashboard.
* **Risks**: Underestimating project delays.

## 13. Release-Readiness Review
* **ID**: UC-013
* **Name**: Release Checklist Verification
* **Actor**: Release Manager
* **Problem**: Missed checks cause broken production deployments.
* **Trigger**: Go/No-Go meeting ends.
* **Preconditions**: Release review transcript is pasted.
* **Main flow**: AI extracts Go/No-Go decisions and outstanding tasks.
* **Human approval point**: Release Manager approves checklist status.
* **Expected outcome**: Release status marked as Approved/Blocked.
* **Current support level**: **Partially supported** (decision and action item capture).
* **Missing capability**: Automated CI/CD release gate block.
* **Risks**: Missing critical deployment dependencies.

## 14. Launch Planning
* **ID**: UC-014
* **Name**: Go-To-Market (GTM) Owner Assignment
* **Actor**: Marketing Director
* **Problem**: Launch deadlines slip due to unclear task ownership.
* **Trigger**: Launch planning session concludes.
* **Preconditions**: Planning transcript is pasted.
* **Main flow**: AI extracts channel plan, launch date, and task owners.
* **Human approval point**: Marketing Director approves GTM task list.
* **Expected outcome**: GTM roadmap created.
* **Current support level**: **Partially supported** (action item extraction).
* **Missing capability**: Gantt chart renderer.
* **Risks**: Confusing target channels or timelines.

## 15. Research Synthesis
* **ID**: UC-015
* **Name**: User Research Insights Log
* **Actor**: UX Researcher
* **Problem**: Synthesizing 10+ user interviews takes weeks.
* **Trigger**: Interview recording is transcribed.
* **Preconditions**: Transcript is pasted.
* **Main flow**: AI identifies recurring user pain points and feature feedback.
* **Human approval point**: Researcher approves extracted insights.
* **Expected outcome**: Insights logged in research wiki.
* **Current support level**: **Manual** (can copy text summary).
* **Missing capability**: Insights tagging database.
* **Risks**: Bias in AI summary overlooking outlier opinions.

## 16. Meeting-to-Jira
* **ID**: UC-016
* **Name**: Automated Jira Ticket Export
* **Actor**: Product Manager / Developer
* **Problem**: Manually entering tickets into Jira is time-consuming.
* **Trigger**: Meeting analysis finishes.
* **Preconditions**: User approves proposed action item scoped for Jira.
* **Main flow**: User clicks "Approve"; backend formats task payload and calls Jira API.
* **Human approval point**: User approves individual proposed action in the UI.
* **Expected outcome**: Jira ticket created with summary and due date.
* **Current support level**: **Partially supported** (UI approval flow is functional, API connection is mocked).
* **Missing capability**: Actual Jira API client connector.
* **Risks**: Credential management on external APIs.

## 17. Meeting-to-Slack Approval
* **ID**: UC-017
* **Name**: Slack Integration for Action Approvals
* **Actor**: Team Lead
* **Problem**: Leads do not want to open a new dashboard to approve tasks.
* **Trigger**: Action item is proposed by the AI.
* **Preconditions**: Slack integration active.
* **Main flow**: Conversa pushes proposed action to Slack channel with Approve/Reject buttons.
* **Human approval point**: Team Lead clicks Slack interactive button.
* **Expected outcome**: Status updated in Conversa database.
* **Current support level**: **Conceptual**.
* **Missing capability**: Slack interactive block middleware.
* **Risks**: Accidental button clicks in Slack.

## 18. Institutional Memory
* **ID**: UC-018
* **Name**: Workspace Knowledge Base Sync
* **Actor**: All Workspace Members
* **Problem**: Historical decisions are lost as employees change roles.
* **Trigger**: Any meeting analysis completes.
* **Preconditions**: Approved decisions exist.
* **Main flow**: Conversa indexes approved decisions and makes them searchable.
* **Human approval point**: Automated indexing upon approval of decisions.
* **Expected outcome**: searchable team knowledge base.
* **Current support level**: **Partially supported** (decision capture is live; search index is planned).
* **Missing capability**: Vector database search indexing.
* **Risks**: Ingestion of stale decisions.
