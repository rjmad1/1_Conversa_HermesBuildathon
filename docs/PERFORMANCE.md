# Conversa — Performance & Scalability Analysis

---
### 📋 Document Metadata
- **Purpose**: Details computational hot paths, API bottlenecks, concurrency models, memory footprints, and optimization strategies.
- **Audience**: Platform developers, performance engineers, and site reliability engineers.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in code profiling, sequential agency run loop, and file validation rules).
- **Evidence Used**: Ingestion constraints, sequential multi-agent loop, and Whisper API calls.
- **Cross References**: See [ARCHITECTURE.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ARCHITECTURE.md), [SERVICES.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/SERVICES.md), [DEPLOYMENT.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/DEPLOYMENT.md).
- **Open Questions**: Load testing benchmarks under simulated concurrent traffic.
- **Known Limitations**: Ephemeral DB locks block real horizontal scalability testing.
- **Recommended Next Actions**: Benchmark parallel execution of specialist agents in pre-production.
---

## 1. Hot Paths & Core Bottlenecks

### 1.1 Ingestion Hashing (`POST /meetings/:meetingId/audio`)
* **Operation**: Reads the complete audio file stream into memory, checks bounds, and hashes the file payload (SHA-256) to calculate a checksum.
* **Bottleneck**: CPU-bound hashing operations on large files (up to 10MB) can cause event-loop lag.
* **Mitigation**: Offload stream parsing and hashing to non-blocking edge workers or pipeline streams directly to storage.

### 1.2 Transcription Latency (`POST /meetings/:meetingId/transcription`)
* **Operation**: Transfers raw audio files to external Whisper APIs and waits for plain text.
* **Bottleneck**: High network latency (10s to 30s depending on file duration). Exceeds default Vercel serverless function timeout (60 seconds) for large files.
* **Mitigation**: Migrate hosting to Cloudflare Workers (retaining longer execution limits) or transition transcription to an asynchronous background worker queue.

### 1.3 Multi-Agent Sequential Chain (`POST /meetings/:meetingId/agency/run`)
* **Operation**: The meeting agency coordinator invokes the LLM sequentially for each configured specialist (Decision -> Risk -> Action) plus QA review steps.
* **Bottleneck**: Latency scales linearly with the number of specialists and revision iterations.
* **Mitigation**: Execute specialist extraction tasks (Decision, Risk, and Action) concurrently in parallel promises, combining findings prior to invoking the final QA Reviewer.

---

## 2. Memory & Concurrency Footprint

### 2.1 Volatile Database Maps
* Under dev/testing runs, all repositories store entities in Node.js heap memory Maps.
* **Risk**: High concurrent upload volume can lead to out-of-memory crashes on single instances.
* **Resolution**: Enforce strict client body limits (2MB on JSON payloads, `AUDIO_MAX_BYTES` on audio uploads).

### 2.2 Concurrency Model
* Hono utilizes Node.js's single-threaded asynchronous event loop.
* Non-blocking promises handle network requests (OpenAI API), keeping the event loop responsive for concurrent requests.
