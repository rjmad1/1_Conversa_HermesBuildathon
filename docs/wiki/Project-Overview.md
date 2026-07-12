# Project Overview

Conversa is an **audio-first** meeting intelligence platform designed to extract, analyze, and manage action items from project meetings.

## Key Features

1. **Audio Validation**: Rigorous file header and extension validation to filter out unsupported formats (e.g. video files, mp4).
2. **Pasted Transcript Pathway**: Allows users to paste raw dialogue transcripts to bypass audio timeouts, serving as the primary stable pathway.
3. **AI Transcript Analysis**: Employs OpenAI GPT endpoints to extract structured summaries, decisions, risks, and proposed action items.
4. **Approval Workflow**: A human-in-the-loop interface where administrators can explicitly approve or reject proposed action items.
5. **Secure Audits**: Scopes and isolates actions and audit logs strictly to the caller's tenant and workspace.
6. **Log Redaction**: Automatic log scrubbing to prevent leakage of credentials, keys, or raw audio content.
