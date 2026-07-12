import { buildApp } from "../../src/app";
import { redact } from "../../src/shared/security/redaction";
import { logger, setLogSink } from "../../src/shared/logging/logger";
import assert from "node:assert";

async function runSmokeTest() {
  console.log("=== START VERIFICATION SMOKE TEST ===");
  const app = buildApp();

  // Custom log sink to verify structured logger output
  const loggedLines: any[] = [];
  setLogSink({
    write: (entry) => {
      loggedLines.push(entry);
    }
  });

  const headersOwner = {
    "content-type": "application/json",
    "x-tenant-id": "owner-tenant",
    "x-workspace-id": "owner-workspace",
    "x-actor-id": "owner-user",
  };

  const headersAttackerTenant = {
    "content-type": "application/json",
    "x-tenant-id": "attacker-tenant",
    "x-workspace-id": "owner-workspace",
    "x-actor-id": "attacker-user",
  };

  const headersAttackerWorkspace = {
    "content-type": "application/json",
    "x-tenant-id": "owner-tenant",
    "x-workspace-id": "attacker-workspace",
    "x-actor-id": "owner-user",
  };

  // 1. Health endpoint checks
  console.log("1. Checking health endpoints...");
  const resLive = await app.request("/api/health/live");
  assert.strictEqual(resLive.status, 200);
  const resReady = await app.request("/api/health/ready");
  assert.strictEqual(resReady.status, 200);

  // 2. Meeting creation
  console.log("2. Creating meeting under owner-tenant/owner-workspace...");
  const resCreate = await app.request("/api/v1/meetings", {
    method: "POST",
    headers: headersOwner,
    body: JSON.stringify({ title: "Audit Sync", meetingType: "DECISION", scheduledAt: new Date().toISOString() })
  });
  assert.strictEqual(resCreate.status, 201);
  const meeting = (await resCreate.json() as any).data;
  console.log(`- Meeting created: ID = ${meeting.id}`);

  // 3. Audio asset registration & 4. Storage bytes write
  console.log("3 & 4. Registering audio and uploading synthetic bytes...");
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: "audio/mpeg" });
  formData.append("file", audioBlob, "meeting.mp3");
  const resUpload = await app.request(`/api/v1/meetings/${meeting.id}/audio`, {
    method: "POST",
    headers: {
      "x-tenant-id": "owner-tenant",
      "x-workspace-id": "owner-workspace",
      "x-actor-id": "owner-user",
    },
    body: formData
  });
  assert.strictEqual(resUpload.status, 201);
  const audioAsset = (await resUpload.json() as any).data;
  console.log(`- Audio asset registered, storageReference = ${audioAsset.storageReference}`);

  // 5 & 6. Fake transcription and transcript persistence check
  console.log("5 & 6. Running transcription...");
  const resTranscribe = await app.request(`/api/v1/meetings/${meeting.id}/transcription`, {
    method: "POST",
    headers: headersOwner
  });
  assert.strictEqual(resTranscribe.status, 200);
  const transcript = (await resTranscribe.json() as any).data;
  assert.ok(transcript.content.length > 0);
  console.log(`- Transcript persisted: ID = ${transcript.id}`);

  // 7. Analysis generation
  console.log("7. Generating analysis...");
  const resAnalyze = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
    method: "POST",
    headers: headersOwner
  });
  assert.strictEqual(resAnalyze.status, 201);
  const analysis = (await resAnalyze.json() as any).data;
  const actionId = analysis.proposedActions[0].id;
  console.log(`- Analysis created with action item ID = ${actionId}`);

  // 8. Owner analysis retrieval
  console.log("8. Retrieving analysis as owner...");
  const resGetAnalysisOwner = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
    method: "GET",
    headers: headersOwner
  });
  assert.strictEqual(resGetAnalysisOwner.status, 200);

  // 9. Wrong-tenant analysis retrieval
  console.log("9. Retrieving analysis as wrong-tenant...");
  const resGetAnalysisWrongTenant = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
    method: "GET",
    headers: headersAttackerTenant
  });
  assert.strictEqual(resGetAnalysisWrongTenant.status, 404);

  // 10. Wrong-workspace analysis retrieval
  console.log("10. Retrieving analysis as wrong-workspace...");
  const resGetAnalysisWrongWorkspace = await app.request(`/api/v1/meetings/${meeting.id}/analysis`, {
    method: "GET",
    headers: headersAttackerWorkspace
  });
  assert.strictEqual(resGetAnalysisWrongWorkspace.status, 404);

  // 11 & 12. Owner action retrieval, approval/rejection mutations
  console.log("11 & 12. Performing action approval as owner...");
  const resApproveOwner = await app.request(`/api/v1/actions/${actionId}/approve`, {
    method: "POST",
    headers: headersOwner
  });
  assert.strictEqual(resApproveOwner.status, 200);

  // 13. Wrong-tenant mutation denial
  console.log("13. Attempting approval as wrong-tenant...");
  const resApproveWrongTenant = await app.request(`/api/v1/actions/${actionId}/approve`, {
    method: "POST",
    headers: headersAttackerTenant
  });
  assert.strictEqual(resApproveWrongTenant.status, 404);

  // 14. Wrong-workspace mutation denial
  console.log("14. Attempting approval as wrong-workspace...");
  const resApproveWrongWorkspace = await app.request(`/api/v1/actions/${actionId}/approve`, {
    method: "POST",
    headers: headersAttackerWorkspace
  });
  assert.strictEqual(resApproveWrongWorkspace.status, 404);

  // 15. Owner audit retrieval
  console.log("15. Retrieving audit events as owner...");
  const resAuditOwner = await app.request(`/api/v1/meetings/${meeting.id}/audit`, {
    method: "GET",
    headers: headersOwner
  });
  assert.strictEqual(resAuditOwner.status, 200);
  const auditData = (await resAuditOwner.json() as any).data;
  assert.ok(auditData.length > 0);

  // 16. Foreign audit denial
  console.log("16. Retrieving audit events as wrong-tenant...");
  const resAuditWrongTenant = await app.request(`/api/v1/meetings/${meeting.id}/audit`, {
    method: "GET",
    headers: headersAttackerTenant
  });
  assert.strictEqual(resAuditWrongTenant.status, 404);

  // 17. Structured logger output check
  console.log("17. Verifying structured logging output...");
  assert.ok(loggedLines.length > 0);
  const auditLog = loggedLines.find((l) => l.operation === "CreateMeeting");
  assert.ok(auditLog);
  assert.strictEqual(auditLog.level, "info");
  assert.strictEqual(auditLog.msg, "meeting created");

  // 18. Nested sensitive-value redaction check
  console.log("18. Verifying deep redaction on logs...");
  const testPayload = {
    apiKey: "sk-test-key",
    subDetails: {
      password: "secretpassword",
      storageReference: "bucket/object",
      normal: "ok"
    }
  };
  const redactedResult = redact(testPayload);
  assert.strictEqual(redactedResult.apiKey, "[REDACTED]");
  assert.strictEqual(redactedResult.subDetails.password, "[REDACTED]");
  assert.strictEqual(redactedResult.subDetails.storageReference, "[REDACTED]");
  assert.strictEqual(redactedResult.subDetails.normal, "ok");

  console.log("=== VERIFICATION SMOKE TEST PASSED SUCCESSFULLY ===");
}

runSmokeTest().catch((err) => {
  console.error("Smoke test failed:", err);
  process.exit(1);
});
