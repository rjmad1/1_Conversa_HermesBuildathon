# Configuration

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document lists all system configuration properties.

## Environment Variable Schema

| Key | Default | Type | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `5173` | Number | Port on which the API and Vite dev server run. |
| `AUDIO_MAX_BYTES` | `10485760` (10MB) | Number | Limit of file payload size allowed. |
| `AUDIO_MAX_SECONDS` | `7200` (2 hours) | Number | Maximum duration allowed for meeting audios. |
| `AUDIO_ALLOWED_MIME_TYPES` | `audio/mpeg,audio/wav,audio/mp4` | String | List of accepted file MIME formats. |
| `OPENAI_API_KEY` | *(None)* | String | Optional backend API key for OpenAI Whisper and GPT extraction. |

## Client-Side Configurations (BYOK)
To protect user credentials and avoid storing server-side keys, Conversa employs a Bring Your Own Key (BYOK) paradigm. Users input their `OPENAI_API_KEY` in the browser configuration panel. This key is stored in volatile memory and passed in headers only.
