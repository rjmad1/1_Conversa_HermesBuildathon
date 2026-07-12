// Conversa UI — Audio-to-Governed-Action vertical slice.
// No camera, no video, no browser API-key input. Calls the same-origin API.

const API = "/api/v1";
type AppState = {
  meetingId?: string;
  screen: "setup" | "input" | "processing" | "review" | "audit";
  error?: string;
  audioAsset?: any;
  transcript?: any;
  analysis?: any;
  audit?: any[];
  stage?: string;
};

let state: AppState = { screen: "setup" };

function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

function render() {
  const app = document.getElementById("app")!;
  app.innerHTML = "";
  app.appendChild(header());
  if (state.error) app.appendChild(el(`<div class="card error" role="alert">${escapeHtml(state.error)}</div>`));
  switch (state.screen) {
    case "setup": return app.appendChild(screenSetup());
    case "input": return app.appendChild(screenInput());
    case "processing": return app.appendChild(screenProcessing());
    case "review": return app.appendChild(screenReview());
    case "audit": return app.appendChild(screenAudit());
  }
}

function header(): HTMLElement {
  return el(`<h1>Conversa <span class="badge">audio-first</span></h1>`);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
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

render();

// Update version and commit SHA in footer at startup
const versionEl = document.querySelector(".app-version");
if (versionEl) {
  versionEl.textContent = import.meta.env.VITE_APP_VERSION || "0.3.0";
}
const commitEl = document.querySelector(".commit-sha");
if (commitEl) {
  commitEl.textContent = import.meta.env.VITE_GIT_COMMIT_SHA || "dev";
}
