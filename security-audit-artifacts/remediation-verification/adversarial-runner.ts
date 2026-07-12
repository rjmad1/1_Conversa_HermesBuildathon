import { buildApp } from "../../src/app";
import assert from "node:assert";

async function runAdversarialAudit() {
  console.log("=== START ADVERSARIAL MULTI-TENANCY AUDIT ===");
  const app = buildApp();

  const headersA = {
    "content-type": "application/json",
    "x-tenant-id": "tenant-a",
    "x-workspace-id": "workspace-a",
    "x-actor-id": "user-a",
  };

  const headersB = {
    "content-type": "application/json",
    "x-tenant-id": "tenant-b",
    "x-workspace-id": "workspace-b",
    "x-actor-id": "user-b",
  };

  const headersA_wrongWorkspace = {
    "content-type": "application/json",
    "x-tenant-id": "tenant-a",
    "x-workspace-id": "workspace-b", // mismatched workspace
    "x-actor-id": "user-a",
  };

  const headersB_wrongTenant = {
    "content-type": "application/json",
    "x-tenant-id": "tenant-b",
    "x-workspace-id": "workspace-a", // mismatched tenant but matched workspace
    "x-actor-id": "user-b",
  };

  // 1. Setup: Tenant A creates a meeting, submits transcript, and generates analysis.
  console.log("\n[Setup] Tenant A creates meeting...");
  const createRes = await app.request("/api/v1/meetings", {
    method: "POST",
    headers: headersA,
    body: JSON.stringify({
      title: "Confidential Project Alpha",
      meetingType: "DECISION",
      scheduledAt: "2026-07-12T10:00:00Z",
    }),
  });
  assert.strictEqual(createRes.status, 201);
  const meetingA = (await createRes.json() as any).data;
  console.log(`[Setup] Created Meeting ID: ${meetingA.id}`);

  console.log("[Setup] Tenant A submits transcript...");
  const transcriptRes = await app.request(`/api/v1/meetings/${meetingA.id}/transcript`, {
    method: "POST",
    headers: headersA,
    body: JSON.stringify({
      content: "Team agreed to launch the beta on the 15th. Priya owns the launch. We decided to defer the billing integration. Rajeev will draft the RFC.",
    }),
  });
  assert.strictEqual(transcriptRes.status, 201);

  console.log("[Setup] Tenant A requests analysis...");
  const analyzeRes = await app.request(`/api/v1/meetings/${meetingA.id}/analysis`, {
    method: "POST",
    headers: headersA,
  });
  assert.strictEqual(analyzeRes.status, 201);
  const analysisA = (await analyzeRes.json() as any).data;
  const actionA1 = analysisA.proposedActions[0];
  console.log(`[Setup] Generated Analysis ID: ${analysisA.id}, Action ID: ${actionA1.id}`);

  // ==========================================
  // TENANT ISOLATION SCENARIOS
  // ==========================================
  console.log("\n--- Tenant Isolation Scenarios ---");

  // Scenario 1: Tenant A reads Tenant A analysis
  const readA_Res = await app.request(`/api/v1/meetings/${meetingA.id}/analysis`, {
    method: "GET",
    headers: headersA,
  });
  console.log(`Scenario T1 (Tenant A reads own analysis): HTTP ${readA_Res.status} (Expected: 200)`);

  // Scenario 2: Tenant B attempts to read Tenant A meeting analysis using a known meeting ID
  const readB_Res = await app.request(`/api/v1/meetings/${meetingA.id}/analysis`, {
    method: "GET",
    headers: headersB,
  });
  console.log(`Scenario T2 (Tenant B reads Tenant A analysis): HTTP ${readB_Res.status} (Expected: 404/403)`);

  // Scenario 3: Tenant B attempts to approve Tenant A action
  const approveB_Res = await app.request(`/api/v1/actions/${actionA1.id}/approve`, {
    method: "POST",
    headers: headersB,
  });
  console.log(`Scenario T3 (Tenant B approves Tenant A action): HTTP ${approveB_Res.status} (Expected: 404/403)`);

  // Scenario 4: Tenant B attempts to reject Tenant A action
  const rejectB_Res = await app.request(`/api/v1/actions/${actionA1.id}/reject`, {
    method: "POST",
    headers: headersB,
    body: JSON.stringify({ reason: "Malicious rejection" }),
  });
  console.log(`Scenario T4 (Tenant B rejects Tenant A action): HTTP ${rejectB_Res.status} (Expected: 404/403)`);

  // Scenario 5: Tenant B attempts to read Tenant A audit events
  const auditB_Res = await app.request(`/api/v1/meetings/${meetingA.id}/audit`, {
    method: "GET",
    headers: headersB,
  });
  console.log(`Scenario T5 (Tenant B reads Tenant A audit events): HTTP ${auditB_Res.status} (Expected: 404/403)`);

  // ==========================================
  // WORKSPACE ISOLATION SCENARIOS
  // ==========================================
  console.log("\n--- Workspace Isolation Scenarios ---");

  // Scenario W1: Workspace A accesses its own records
  // (Covered by Setup and Scenario T1)

  // Scenario W2: Workspace B (same tenant) attempts to read Workspace A meeting analysis
  const wsRead_Res = await app.request(`/api/v1/meetings/${meetingA.id}/analysis`, {
    method: "GET",
    headers: headersA_wrongWorkspace,
  });
  console.log(`Scenario W2 (Workspace B reads Workspace A analysis): HTTP ${wsRead_Res.status} (Expected: 404/403)`);

  // Scenario W3: Workspace B (same tenant) attempts to approve Workspace A action
  const wsApprove_Res = await app.request(`/api/v1/actions/${actionA1.id}/approve`, {
    method: "POST",
    headers: headersA_wrongWorkspace,
  });
  console.log(`Scenario W3 (Workspace B approves Workspace A action): HTTP ${wsApprove_Res.status} (Expected: 404/403)`);

  // Scenario W4: Workspace mismatch with valid entity ID (Workspace match string but tenant mismatch)
  const tenantMismatchRead_Res = await app.request(`/api/v1/meetings/${meetingA.id}/analysis`, {
    method: "GET",
    headers: headersB_wrongTenant,
  });
  console.log(`Scenario W4 (Tenant B Workspace A reads Tenant A Workspace A analysis): HTTP ${tenantMismatchRead_Res.status} (Expected: 404/403)`);

  // ==========================================
  // IDENTIFIER ENUMERATION SCENARIOS
  // ==========================================
  console.log("\n--- Identifier Enumeration Scenarios ---");

  const randomUUID = "d3b07384-d113-4ec2-a279-d75d50699ee5";

  // Scenario I1: Random valid UUID read
  const randomRead_Res = await app.request(`/api/v1/meetings/${randomUUID}/analysis`, {
    method: "GET",
    headers: headersA,
  });
  console.log(`Scenario I1 (Random valid UUID read): HTTP ${randomRead_Res.status} (Expected: 404)`);

  console.log("\n=== END ADVERSARIAL MULTI-TENANCY AUDIT ===");
}

runAdversarialAudit().catch((err) => {
  console.error("Audit script failed:", err);
  process.exit(1);
});
