# Demo Guide

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This page describes the steps to execute the stable Conversa demonstration workflow.

## Demonstration Pathway: Pasted Transcript Governance

The most stable demonstration pathway runs by pasting a meeting transcript, which verifies transcript analysis, action governance approvals/rejections, and compliance audit trail logging.

### Steps to Run:
1. Open the Vercel app: `https://1-conversa-hermes-buildathon.vercel.app/`
2. Provide your OpenAI API key in the configuration pane.
3. Select the **Pasted Transcript** pathway.
4. Input a synthetic meeting dialogue (e.g. outlining task actions, owners, and dates).
5. Click **Analyze Transcript** to run the GPT extractor.
6. Interact with the output: click **Approve** or **Reject** on action items.
7. Click **Show Audit Logs** to verify isolation boundaries.

> **Warning**: Do not upload large audio files or real customer transcripts.
