# Getting Started

> **Current-state notice:** Conversa is an active Buildathon prototype containing experimental, incomplete, mocked, and recently remediated functionality. It is not approved for production use, confidential meetings, regulated data, or uncontrolled multi-tenant deployment.

Get up and running with Conversa locally.

## Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

## Local Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface by opening `http://localhost:5173` (or the port output by the console).

## Executing the Test Suite
Conversa includes a full suite of unit, integration, and E2E tests:

* Run all unit tests:
  ```bash
  npm run test
  ```
* Run integration tests:
  ```bash
  npm run test:integration
  ```
* Run end-to-end tests:
  ```bash
  npm run test:e2e
  ```
