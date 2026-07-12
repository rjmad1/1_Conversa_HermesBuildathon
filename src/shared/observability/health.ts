export interface ReadinessProbe {
  ready(): Promise<boolean>;
}

export interface ReadinessDeps {
  persistence?: ReadinessProbe;
  providers?: ReadinessProbe[];
}

export interface HealthReport {
  status: "ok" | "degraded";
  live: boolean;
  ready: boolean;
  details: Record<string, boolean>;
}

/** Liveness confirms the process is running. Always true if reachable. */
export function liveness(): { live: true; version: string; commit: string } {
  const commit = (process.env.VITE_GIT_COMMIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || "dev").substring(0, 7);
  const version = process.env.VITE_APP_VERSION || "0.3.0";
  return { live: true, version, commit };
}

/** Readiness validates required dependencies (persistence, providers). */
export async function readiness(deps: ReadinessDeps): Promise<HealthReport> {
  const details: Record<string, boolean> = {};
  if (deps.persistence) {
    details.persistence = await deps.persistence.ready().catch(() => false);
  }
  let providersOk = true;
  for (const p of deps.providers ?? []) {
    providersOk = providersOk && (await p.ready().catch(() => false));
  }
  if (deps.providers && deps.providers.length > 0) details.providers = providersOk;

  const ready = Object.values(details).every(Boolean);
  return { status: ready ? "ok" : "degraded", live: true, ready, details };
}
