# Changelog

---
### 📋 Document Metadata
- **Purpose**: Tracks historical project changes, releases, and milestones.
- **Audience**: Builders, compliance auditors, and AI assistants.
- **Last Generated**: 2026-07-13T05:20:47+05:30
- **Confidence Level**: High (Grounded in repository git logs).
- **Evidence Used**: Repository git logs.
- **Cross References**: See [ROADMAP.md](file:///c:/Users/rajaj/Projects/1_Conversa/docs/ROADMAP.md) for future releases.
- **Open Questions**: None.
- **Known Limitations**: Historical data is simplified; does not include full commit hashes.
- **Recommended Next Actions**: Review the security enhancements in [SECURITY.md](file:///c:/Users/rajaj/Projects/1_Conversa/SECURITY.md).
---

All notable changes to this project will be documented in this file.

The release classification is: **Experimental Buildathon snapshot — not production-ready.**

## [0.3.1] - 2026-07-13
### Added
- central `authGuard` middleware for role-based access control (`admin`, `approver`, `viewer`).
- production authentication adapter (`ProdIdentityAdapter`) enforcing Bearer Tokens.
- request body limit protection (2MB non-audio, configurable `AUDIO_MAX_BYTES` for audio).
- rate limiting on transcription, analysis, agency, and reset operations.
- automated security containment regression test suite.

## [0.3.0] - 2026-07-12
### Fixed
- tenant-isolation vulnerabilities in Hono handlers and repository layers.
- recursively redacted JSON logging up to depth 10.
- stabilized all Vitest test runner assertions.

## [0.2.0] - 2026-07-10
### Added
- Hono REST API framework integration.
- Vite Vanilla SPA client interface.
- In-memory data repository implementations.
- Synthetic pasted transcript analysis flow.

## [0.1.0] - 2026-07-08
### Added
- Initial commit of the Conversa prototype core.
