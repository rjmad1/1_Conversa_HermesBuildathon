# Publication Guide

> **Current-state notice:** Conversa is an active Buildathon prototype. It contains incomplete, experimental, mocked, and security-remediation work. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

This document serves as the guide for publishing this codebase safely to public portfolios.

## 1. Safety Publication Checklist

1. **Verify Secret Redaction**: Ensure no `.env` file containing OpenAI keys is commited.
2. **Exclude Build Assets**: Ensure `node_modules/` and `dist/` folders are ignored by git.
3. **Disclosures Present**: Confirm the **Current-state notice** is prepended to public README files.
4. **All Tests Passing**: Run `npm run typecheck`, `npm run lint`, and all test commands, confirming all execute with zero errors.

## 2. File Inclusions and Exclusions

Refer to [Publication Manifest](../publication-readiness-artifacts/09-publication-manifest.md) for the complete list of files categorized for publishing or exclusion.
