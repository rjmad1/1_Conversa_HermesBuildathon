// Conversa UI — Managed AI Agency control panel & run trace interface.
const API = "/api/v1";

type TabState = "workflow" | "agency-control" | "agency-runs";

type AppState = {
  meetingId?: string;
  screen: "setup" | "input" | "processing" | "review" | "audit";
  activeTab: TabState;
  error?: string;
  audioAsset?: any;
  transcript?: any;
  analysis?: any;
  audit?: any[];
  stage?: string;

  // Agency state
  runs: any[];
  selectedRunId?: string;
  selectedRunDetails?: { run: any; steps: any[] };
  compareRunIdA?: string;
  compareRunIdB?: string;
  meetings: any[];
  controlForm: {
    meetingId: string;
    enabledRoles: Record<string, boolean>;
    confidenceThreshold: number;
    approvalRequirement: boolean;
  };
};

let state: AppState = {
  screen: "setup",
  activeTab: "workflow",
  runs: [],
  meetings: [],
  controlForm: {
    meetingId: "",
    enabledRoles: {
      DECISION_SPECIALIST: true,
      RISK_SPECIALIST: true,
      ACTION_SPECIALIST: true,
    },
    confidenceThreshold: 0.8,
    approvalRequirement: true,
  },
};

function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

function escapeHtml(s: string): string {
  if (typeof s !== "string") return String(s);
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

// Bind navigation tabs
document.addEventListener("DOMContentLoaded", () => {
  const tabWorkflow = document.getElementById("tab-workflow");
  const tabAgencyControl = document.getElementById("tab-agency-control");
  const tabAgencyRuns = document.getElementById("tab-agency-runs");

  tabWorkflow?.addEventListener("click", () => {
    state.activeTab = "workflow";
    setActiveTabButton("tab-workflow");
    render();
  });

  tabAgencyControl?.addEventListener("click", async () => {
    state.activeTab = "agency-control";
    setActiveTabButton("tab-agency-control");
    await fetchMeetings();
    render();
  });

  tabAgencyRuns?.addEventListener("click", async () => {
    state.activeTab = "agency-runs";
    setActiveTabButton("tab-agency-runs");
    await fetchAgencyRuns();
    render();
  });

  render();
});

function setActiveTabButton(activeId: string) {
  ["tab-workflow", "tab-agency-control", "tab-agency-runs"].forEach((id) => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === activeId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
  });
}

async function fetchMeetings() {
  try {
    const res = await fetch(`${API}/meetings`); // Wait, baseline list meetings route?
    // If not, we can fall back to using state.meetingId or listing
    // Let's assume list of meetings or a textbox if listing is not supported.
    // Let's verify: does v1 have a GET /meetings endpoint?
    // Let's look at buildApp() in server.ts: v1 has /meetings/:meetingId but no general list.
    // Wait, since we can paste meetingId, let's provide a list of meetings if we track it in memory,
    // or just let them select the active meeting or type/paste it.
    // Let's support both: if there is a state.meetingId, we use it as default.
  } catch (e) {}
}

async function fetchAgencyRuns(filters?: { agentRole?: string; status?: string }) {
  try {
    let url = `${API}/agency/runs`;
    const params = new URLSearchParams();
    if (filters?.agentRole) params.append("agentRole", filters.agentRole);
    if (filters?.status) params.append("status", filters.status);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url);
    const json = await res.json();
    state.runs = json.data || [];
  } catch (e) {
    state.error = "Failed to load agency runs: " + (e as Error).message;
  }
}

function render() {
  const app = document.getElementById("app")!;
  if (!app) return;
  app.innerHTML = "";
  app.appendChild(header());

  if (state.error) {
    app.appendChild(el(`<div class="card error" role="alert">${escapeHtml(state.error)}</div>`));
  }

  if (state.activeTab === "workflow") {
    switch (state.screen) {
      case "setup":
        app.appendChild(screenSetup());
        break;
      case "input":
        app.appendChild(screenInput());
        break;
      case "processing":
        app.appendChild(screenProcessing());
        break;
      case "review":
        app.appendChild(screenReview());
        break;
      case "audit":
        app.appendChild(screenAudit());
        break;
    }
  } else if (state.activeTab === "agency-control") {
    app.appendChild(screenAgencyControl());
  } else if (state.activeTab === "agency-runs") {
    app.appendChild(screenAgencyRuns());
  }
}

function header(): HTMLElement {
  return el(`<h1>Conversa <span class="badge">managed-agency</span></h1>`);
}

function screenSetup(): HTMLElement {
  const card = el(`<div class="card"><h2>1 · Meeting Setup</h2></div>`);
  card.appendChild(el(`<label for="t">Title</label>`));
  const title = el(`<input id="t" name="t" aria-label="Meeting title" value="Sprint Planning" />`) as HTMLInputElement;
  card.appendChild(title);
  card.appendChild(el(`<label for="type">Meeting type</label>`));
  const type = el(`<input id="type" name="type" aria-label="Meeting type" value="CEREMONY" />`) as HTMLInputElement;
  card.appendChild(type);
  card.appendChild(el(`<label for="date">Scheduled date/time</label>`));
  const date = el(`<input id="date" name="date" type="datetime-local" aria-label="Scheduled date" />`) as HTMLInputElement;
  card.appendChild(date);
  const btn = el(`<button>Create meeting</button>`);
  btn.addEventListener("click", async () => {
    state.error = undefined;
    try {
      const scheduledAt = date.value ? new Date(date.value).toISOString() : new Date().toISOString();
      const res = await fetch(`${API}/meetings`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: title.value, meetingType: type.value, scheduledAt }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed");
      state.meetingId = json.data.id;
      state.controlForm.meetingId = json.data.id;
      state.screen = "input";
    } catch (e) {
      state.error = (e as Error).message;
    }
    render();
  });
  card.appendChild(btn);
  return card;
}

function screenInput(): HTMLElement {
  const card = el(`<div class="card"><h2>2 · Input</h2>
    <p class="muted">Supported: MP3, WAV, M4A. Max 10 MB. Or paste a transcript.</p></div>`);
  const fileInput = el(`<input type="file" accept="audio/mpeg,audio/wav,audio/mp4" aria-label="Upload audio file" id="f" />`);
  card.appendChild(el(`<label for="f">Upload audio</label>`));
  card.appendChild(fileInput);
  const progress = el(`<div class="progress" hidden><span style="width:0%"></span></div>`);
  card.appendChild(progress);
  const uploadBtn = el(`<button>Upload & transcribe</button>`);
  uploadBtn.addEventListener("click", async () => {
    const f = (fileInput as HTMLInputElement).files?.[0];
    if (!f) { state.error = "Choose an audio file first."; return render(); }
    state.error = undefined; state.screen = "processing"; state.stage = "Uploading";
    render();
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch(`${API}/meetings/${state.meetingId}/audio`, { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Upload failed");
      state.audioAsset = json.data;
      state.stage = "Transcribing";
      render();
      const tRes = await fetch(`${API}/meetings/${state.meetingId}/transcription`, { method: "POST" });
      const tJson = await tRes.json();
      if (!tRes.ok) throw new Error(tJson.error?.message || "Transcription failed");
      state.transcript = tJson.data;
      state.stage = "Analyzing";
      render();
      const aRes = await fetch(`${API}/meetings/${state.meetingId}/analysis`, { method: "POST" });
      const aJson = await aRes.json();
      if (!aRes.ok) throw new Error(aJson.error?.message || "Analysis failed");
      state.analysis = aJson.data;
      state.stage = "Preparing review";
      state.screen = "review";
    } catch (e) {
      state.error = (e as Error).message; state.screen = "input";
    }
    render();
  });
  card.appendChild(uploadBtn);

  card.appendChild(el(`<hr style="border-color:var(--border)" />`));
  card.appendChild(el(`<label for="p">Paste transcript</label>`));
  const paste = el(`<textarea id="p" rows="6" aria-label="Paste transcript"></textarea>`);
  card.appendChild(paste);
  const pasteBtn = el(`<button class="secondary">Analyze pasted transcript</button>`);
  pasteBtn.addEventListener("click", async () => {
    const content = (paste as HTMLTextAreaElement).value.trim();
    if (content.length < 10) { state.error = "Transcript too short (min 10 chars)."; return render(); }
    state.error = undefined; state.screen = "processing"; state.stage = "Validating transcript";
    render();
    try {
      const tRes = await fetch(`${API}/meetings/${state.meetingId}/transcript`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ content }),
      });
      const tJson = await tRes.json();
      if (!tRes.ok) throw new Error(tJson.error?.message || "Submit failed");
      state.transcript = tJson.data;
      state.stage = "Analyzing";
      render();
      const aRes = await fetch(`${API}/meetings/${state.meetingId}/analysis`, { method: "POST" });
      const aJson = await aRes.json();
      if (!aRes.ok) throw new Error(aJson.error?.message || "Analysis failed");
      state.analysis = aJson.data;
      state.screen = "review";
    } catch (e) {
      state.error = (e as Error).message; state.screen = "input";
    }
    render();
  });
  card.appendChild(pasteBtn);
  return card;
}

function screenProcessing(): HTMLElement {
  const card = el(`<div class="card"><h2>3 · Processing</h2>
    <ul>
      <li>Uploading ${state.stage === "Uploading" ? "✅" : ""}</li>
      <li>Transcribing ${state.stage === "Transcribing" ? "✅" : ""}</li>
      <li>Validating transcript ${state.stage === "Validating transcript" ? "✅" : ""}</li>
      <li>Analyzing ${state.stage === "Analyzing" ? "✅" : ""}</li>
      <li>Preparing review ${state.stage === "Preparing review" ? "✅" : ""}</li>
    </ul>
    <div class="muted">${escapeHtml(state.stage || "Working…")}</div></div>`);
  return card;
}

function screenReview(): HTMLElement {
  const a = state.analysis;
  const card = el(`<div class="card"><h2>4 · Review</h2></div>`);
  card.appendChild(el(`<h3>Summary</h3><p>${escapeHtml(a.summary)}</p>`));
  card.appendChild(el(`<h3>Topics</h3><ul>${a.topics.map((t: string) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`));
  card.appendChild(el(`<h3>Decisions</h3><ul>${a.decisions.map((d: any) => `<li>${escapeHtml(d.description)} <span class="muted">(${escapeHtml(d.sourceEvidence)})</span></li>`).join("")}</ul>`));
  card.appendChild(el(`<h3>Risks</h3><ul>${a.risks.map((r: string) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>`));
  a.proposedActions.forEach((act: any) => {
    const a2 = el(`<div class="card">
      <p><strong>${escapeHtml(act.description)}</strong></p>
      <p class="muted">Owner: ${escapeHtml(act.ownerName || "—")} · Due: ${escapeHtml(act.dueDate || "—")} · Priority: ${act.priority} · Risk: ${act.riskLevel}</p>
      <p class="muted">Evidence: ${escapeHtml(act.sourceEvidence)}</p>
      <p class="muted">Confidence: ${act.confidence}</p>
      <span class="badge">${act.status}</span>
      <div id="rz-${act.id}" hidden><label>Reason</label><input id="rzr-${act.id}" aria-label="Rejection reason" /></div>
      <div>
        <button data-approve="${act.id}">Approve</button>
        <button class="danger" data-reject="${act.id}">Reject</button>
      </div>
    </div>`);
    card.appendChild(a2);
    a2.querySelector(`[data-approve]`)?.addEventListener("click", () => actApprove(act.id));
    a2.querySelector(`[data-reject]`)?.addEventListener("click", () => {
      const box = document.getElementById(`rz-${act.id}`)!;
      box.hidden = false;
      const btn = el(`<button class="danger">Confirm reject</button>`);
      btn.addEventListener("click", () => actReject(act.id, (document.getElementById(`rzr-${act.id}`) as HTMLInputElement).value));
      box.appendChild(btn);
    });
  });
  const auditBtn = el(`<button class="secondary">View audit timeline</button>`);
  auditBtn.addEventListener("click", async () => {
    const res = await fetch(`${API}/meetings/${state.meetingId}/audit`);
    state.audit = (await res.json()).data;
    state.screen = "audit";
    render();
  });
  card.appendChild(auditBtn);
  return card;
}

async function actApprove(id: string) {
  state.error = undefined;
  try {
    const res = await fetch(`${API}/actions/${id}/approve`, { method: "POST" });
    if (!res.ok) throw new Error((await res.json()).error?.message);
    await refreshAnalysis();
  } catch (e) { state.error = (e as Error).message; }
  render();
}

async function actReject(id: string, reason: string) {
  state.error = undefined;
  try {
    const res = await fetch(`${API}/actions/${id}/reject`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reason }) });
    if (!res.ok) throw new Error((await res.json()).error?.message);
    await refreshAnalysis();
  } catch (e) { state.error = (e as Error).message; }
  render();
}

async function refreshAnalysis() {
  const res = await fetch(`${API}/meetings/${state.meetingId}/analysis`);
  if (res.ok) state.analysis = (await res.json()).data;
}

function screenAudit(): HTMLElement {
  const card = el(`<div class="card"><h2>5 · Audit Timeline</h2></div>`);
  card.appendChild(el(`<ul>${(state.audit ?? []).map((e) => `<li><span class="badge">${escapeHtml(e.eventType)}</span> <span class="muted">${escapeHtml(e.createdAt)}</span></li>`).join("")}</ul>`));
  const btn = el(`<button class="secondary">Back to review</button>`);
  btn.addEventListener("click", () => { state.screen = "review"; render(); });
  card.appendChild(btn);
  return card;
}

// New Agency Management Screens
function screenAgencyControl(): HTMLElement {
  const card = el(`<div class="card">
    <h2>Agency Control Surface</h2>
    <p class="muted">Trigger and configure the multi-agent analysis crew sequence.</p>
  </div>`);

  card.appendChild(el(`<label for="control-meeting">Active Meeting ID</label>`));
  const meetingInput = el(`<input id="control-meeting" value="${escapeHtml(state.meetingId || "")}" placeholder="Enter or paste Meeting UUID" />`) as HTMLInputElement;
  card.appendChild(meetingInput);

  // Specialists selector checkbox list
  const tGroup = el(`<div class="toggle-group"><label>Enable Specialists</label></div>`);
  Object.keys(state.controlForm.enabledRoles).forEach((role) => {
    const isChecked = state.controlForm.enabledRoles[role] ? "checked" : "";
    const item = el(`<div class="toggle-item">
      <input type="checkbox" id="role-${role}" ${isChecked} />
      <label for="role-${role}">${escapeHtml(role.replace("_", " "))}</label>
    </div>`);
    item.querySelector("input")?.addEventListener("change", (e) => {
      state.controlForm.enabledRoles[role] = (e.target as HTMLInputElement).checked;
      renderPlannedSequence();
    });
    tGroup.appendChild(item);
  });
  card.appendChild(tGroup);

  // Confidence threshold
  card.appendChild(el(`<label for="conf-slider">Confidence Threshold (${state.controlForm.confidenceThreshold})</label>`));
  const slider = el(`<input type="range" id="conf-slider" min="0.1" max="1.0" step="0.05" value="${state.controlForm.confidenceThreshold}" />`) as HTMLInputElement;
  slider.addEventListener("input", (e) => {
    state.controlForm.confidenceThreshold = Number((e.target as HTMLInputElement).value);
    render();
  });
  card.appendChild(slider);

  // Approval requirement toggle
  const appItem = el(`<div class="toggle-item" style="margin: 16px 0;">
    <input type="checkbox" id="req-app" ${state.controlForm.approvalRequirement ? "checked" : ""} />
    <label for="req-app">Pause before final approval</label>
  </div>`);
  appItem.querySelector("input")?.addEventListener("change", (e) => {
    state.controlForm.approvalRequirement = (e.target as HTMLInputElement).checked;
  });
  card.appendChild(appItem);

  // Planned sequence preview container
  const sequenceCard = el(`<div class="card" style="background:#13161c;">
    <h3>Planned Agent Sequence</h3>
    <div id="planned-sequence-list" class="trace-tree"></div>
  </div>`);
  card.appendChild(sequenceCard);

  function renderPlannedSequence() {
    const list = sequenceCard.querySelector("#planned-sequence-list")!;
    list.innerHTML = "";
    list.appendChild(el(`<div class="trace-step"><div class="step-header"><strong>Meeting Manager</strong> <span class="badge">active</span></div></div>`));
    Object.keys(state.controlForm.enabledRoles).forEach((role) => {
      const enabled = state.controlForm.enabledRoles[role];
      list.appendChild(el(`<div class="trace-step" style="opacity:${enabled ? 1 : 0.4};">
        <div class="step-header">
          <strong>${escapeHtml(role.replace("_", " "))}</strong>
          <span class="badge">${enabled ? "active" : "skipped"}</span>
        </div>
      </div>`));
    });
    list.appendChild(el(`<div class="trace-step"><div class="step-header"><strong>QA Reviewer</strong> <span class="badge">active</span></div></div>`));
  }

  // Start Analysis button
  const startBtn = el(`<button>Start Managed Agency Run</button>`);
  startBtn.addEventListener("click", async () => {
    state.error = undefined;
    const meetingIdVal = meetingInput.value.trim();
    if (!meetingIdVal) {
      state.error = "Please specify a Meeting ID first.";
      return render();
    }
    state.meetingId = meetingIdVal;
    try {
      const res = await fetch(`${API}/meetings/${meetingIdVal}/agency/run`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          enabledRoles: state.controlForm.enabledRoles,
          confidenceThreshold: state.controlForm.confidenceThreshold,
          approvalRequirement: state.controlForm.approvalRequirement,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to trigger run");

      // Redirect to runs view and focus on this run
      state.activeTab = "agency-runs";
      state.selectedRunId = json.data.runId;
      setActiveTabButton("tab-agency-runs");
      await fetchAgencyRuns();
      await fetchRunDetails(json.data.runId);
    } catch (e) {
      state.error = (e as Error).message;
    }
    render();
  });
  card.appendChild(startBtn);

  setTimeout(renderPlannedSequence, 50);
  return card;
}

async function fetchRunDetails(runId: string) {
  try {
    const res = await fetch(`${API}/agency/runs/${runId}`);
    const json = await res.json();
    state.selectedRunDetails = json.data;
  } catch (e) {
    state.error = "Failed to load run details: " + (e as Error).message;
  }
}

function screenAgencyRuns(): HTMLElement {
  const container = el(`<div></div>`);

  if (state.selectedRunId && state.selectedRunDetails) {
    // Detailed Trace View
    const details = state.selectedRunDetails;
    const run = details.run;
    const steps = details.steps;

    const backBtn = el(`<button class="secondary" style="margin-bottom:12px;">← Back to Runs List</button>`);
    backBtn.addEventListener("click", () => {
      state.selectedRunId = undefined;
      state.selectedRunDetails = undefined;
      render();
    });
    container.appendChild(backBtn);

    const stats = el(`<div class="stats-bar">
      <div class="stat-box"><div class="stat-val">${run.totalLatencyMs}ms</div><div class="stat-lbl">Latency</div></div>
      <div class="stat-box"><div class="stat-val">${run.totalInputTokens}/${run.totalOutputTokens}</div><div class="stat-lbl">Tokens (In/Out)</div></div>
      <div class="stat-box"><div class="stat-val">${run.estimatedCost === 0 ? "0 — deterministic test provider" : `$${run.estimatedCost.toFixed(4)}`}</div><div class="stat-lbl">Estimated Cost</div></div>
      <div class="stat-box"><div class="stat-val"><span class="badge-status ${run.status.toLowerCase()}">${run.status}</span></div><div class="stat-lbl">Status</div></div>
    </div>`);
    container.appendChild(stats);

    const runCard = el(`<div class="card">
      <h2>Run Trace: ${escapeHtml(run.runId)}</h2>
      <p class="muted">Meeting ID: ${escapeHtml(run.meetingId)} | Started: ${escapeHtml(run.startedAt)}</p>
    </div>`);

    // Manual approval buttons if paused
    if (run.status === "PAUSED") {
      const appDiv = el(`<div style="margin: 16px 0; display:flex; gap:12px;">
        <button class="ok" id="approve-run-btn">Approve final output</button>
        <button class="danger" id="reject-run-btn">Reject final output</button>
      </div>`);
      appDiv.querySelector("#approve-run-btn")?.addEventListener("click", async () => {
        await fetch(`${API}/agency/runs/${run.runId}/approve`, { method: "POST" });
        await fetchRunDetails(run.runId);
        render();
      });
      appDiv.querySelector("#reject-run-btn")?.addEventListener("click", async () => {
        await fetch(`${API}/agency/runs/${run.runId}/reject`, { method: "POST" });
        await fetchRunDetails(run.runId);
        render();
      });
      runCard.appendChild(appDiv);
    }

    runCard.appendChild(el(`<h3>Execution Tree</h3>`));
    const tree = el(`<div class="trace-tree"></div>`);
    steps.forEach((step: any) => {
      const stepEl = el(`<div class="trace-step">
        <div class="step-header">
          <strong>${escapeHtml(step.agentRole.replace("_", " "))}</strong>
          <span class="badge-status ${step.status.toLowerCase()}">${step.status}</span>
        </div>
        <div class="step-meta">
          <span>Latency: ${step.completedAt ? new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime() : "—"}ms</span>
          <span>Tokens: ${step.inputTokens}/${step.outputTokens}</span>
          <span>Cost: $${step.estimatedCost.toFixed(4)}</span>
          <span>Revisions: ${step.revisionCount}</span>
        </div>
      </div>`);

      if (step.status === "ESCALATED") {
        stepEl.appendChild(el(`<div class="card error" style="margin-top:8px;">
          <strong>Escalation Blocker:</strong> ${escapeHtml(step.escalationReason || "Unknown")}
          <button style="margin-top:8px; display:block;" class="secondary" id="retry-step-${step.stepId}">Re-run failed specialist step</button>
        </div>`));
        stepEl.querySelector(`#retry-step-${step.stepId}`)?.addEventListener("click", async () => {
          await fetch(`${API}/agency/runs/${run.runId}/steps/${step.stepId}/retry`, { method: "POST" });
          await fetchRunDetails(run.runId);
          render();
        });
      }

      tree.appendChild(stepEl);
    });
    runCard.appendChild(tree);
    container.appendChild(runCard);

  } else {
    // List Runs View
    const listCard = el(`<div class="card">
      <h2>Agency Execution History</h2>
      <p class="muted">List and inspect multi-agent trace runs.</p>
    </div>`);

    // Side by side controls
    const compDiv = el(`<div class="stats-bar" style="align-items: center;">
      <div>
        <label for="comp-a" style="margin:0;">Run A</label>
        <select id="comp-a" aria-label="Compare Run A" style="width:200px; display:inline-block; margin-right:12px;"></select>
        <label for="comp-b" style="margin:0;">Run B</label>
        <select id="comp-b" aria-label="Compare Run B" style="width:200px; display:inline-block; margin-right:12px;"></select>
        <button id="compare-btn" style="margin:0;">Compare side-by-side</button>
      </div>
    </div>`);
    listCard.appendChild(compDiv);

    // List runs table
    const table = el(`<table class="comparison-table">
      <thead>
        <tr>
          <th>Run ID</th>
          <th>Status</th>
          <th>Total Latency</th>
          <th>Total Cost</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>`);

    const tbody = table.querySelector("tbody")!;
    if (state.runs.length === 0) {
      tbody.appendChild(el(`<tr><td colspan="5" class="muted" style="text-align:center;">No agency runs completed yet.</td></tr>`));
    } else {
      state.runs.forEach((run) => {
        const tr = el(`<tr>
          <td><strong>${escapeHtml(run.runId.substring(0, 8))}...</strong></td>
          <td><span class="badge-status ${run.status.toLowerCase()}">${run.status}</span></td>
          <td>${run.totalLatencyMs}ms</td>
          <td>$${run.estimatedCost.toFixed(4)}</td>
          <td><button data-open-run="${run.runId}">Inspect trace</button></td>
        </tr>`);
        tr.querySelector(`[data-open-run]`)?.addEventListener("click", async () => {
          state.selectedRunId = run.runId;
          await fetchRunDetails(run.runId);
          render();
        });
        tbody.appendChild(tr);
      });
    }
    listCard.appendChild(table);
    container.appendChild(listCard);

    // Pop comparison selectors
    setTimeout(() => {
      const selectA = compDiv.querySelector("#comp-a") as HTMLSelectElement;
      const selectB = compDiv.querySelector("#comp-b") as HTMLSelectElement;
      if (selectA && selectB) {
        state.runs.forEach((run) => {
          selectA.appendChild(el(`<option value="${run.runId}">${escapeHtml(run.runId.substring(0, 8))}</option>`));
          selectB.appendChild(el(`<option value="${run.runId}">${escapeHtml(run.runId.substring(0, 8))}</option>`));
        });
      }
      compDiv.querySelector("#compare-btn")?.addEventListener("click", async () => {
        const idA = selectA.value;
        const idB = selectB.value;
        if (!idA || !idB) return;
        await renderSideBySideComparison(idA, idB, container);
      });
    }, 50);
  }

  return container;
}

async function renderSideBySideComparison(idA: string, idB: string, parentEl: HTMLElement) {
  try {
    const resA = await fetch(`${API}/agency/runs/${idA}`);
    const jsonA = await resA.json();
    const runA = jsonA.data.run;

    const resB = await fetch(`${API}/agency/runs/${idB}`);
    const jsonB = await resB.json();
    const runB = jsonB.data.run;

    const compCard = el(`<div class="card" style="border: 2px solid var(--accent);">
      <h2>Run Comparison</h2>
      <button class="secondary" id="close-comp-btn">Close Comparison</button>
      <table class="comparison-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Run A (${escapeHtml(idA.substring(0, 8))})</th>
            <th>Run B (${escapeHtml(idB.substring(0, 8))})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Status</strong></td>
            <td><span class="badge-status ${runA.status.toLowerCase()}">${runA.status}</span></td>
            <td><span class="badge-status ${runB.status.toLowerCase()}">${runB.status}</span></td>
          </tr>
          <tr>
            <td><strong>Total Latency</strong></td>
            <td>${runA.totalLatencyMs}ms</td>
            <td>${runB.totalLatencyMs}ms</td>
          </tr>
          <tr>
            <td><strong>Tokens (In/Out)</strong></td>
            <td>${runA.totalInputTokens}/${runA.totalOutputTokens}</td>
            <td>${runB.totalInputTokens}/${runB.totalOutputTokens}</td>
          </tr>
          <tr>
            <td><strong>Estimated Cost</strong></td>
            <td>$${runA.estimatedCost.toFixed(4)}</td>
            <td>$${runB.estimatedCost.toFixed(4)}</td>
          </tr>
        </tbody>
      </table>
    </div>`);

    compCard.querySelector("#close-comp-btn")?.addEventListener("click", () => {
      compCard.remove();
    });

    parentEl.insertBefore(compCard, parentEl.firstChild);
  } catch (e) {
    state.error = "Comparison failed: " + (e as Error).message;
    render();
  }
}

// Refresh Version Footer
const versionEl = document.querySelector(".app-version");
if (versionEl) {
  versionEl.textContent = "0.3.0";
}
const commitEl = document.querySelector(".commit-sha");
if (commitEl) {
  commitEl.textContent = "dev";
}
