import {
  IPipelineStateRepository,
  PipelineCheckpoint,
  PipelineRunSnapshot
} from "../contracts/pipeline-contract";
import * as fs from "fs";
import * as path from "path";

export class InMemoryPipelineStateRepository implements IPipelineStateRepository {
  private snapshots: Map<string, PipelineRunSnapshot> = new Map();
  private meetingIdToRunId: Map<string, string> = new Map();

  public async saveSnapshot(snapshot: PipelineRunSnapshot): Promise<void> {
    snapshot.updatedAt = Date.now();
    this.snapshots.set(snapshot.runId, JSON.parse(JSON.stringify(snapshot)));
    this.meetingIdToRunId.set(snapshot.meetingId, snapshot.runId);
  }

  public async loadSnapshot(runId: string): Promise<PipelineRunSnapshot | null> {
    const snap = this.snapshots.get(runId);
    return snap ? JSON.parse(JSON.stringify(snap)) : null;
  }

  public async loadByMeetingId(meetingId: string): Promise<PipelineRunSnapshot | null> {
    const runId = this.meetingIdToRunId.get(meetingId);
    if (!runId) return null;
    return this.loadSnapshot(runId);
  }

  public async persistCheckpoint(runId: string, checkpoint: PipelineCheckpoint): Promise<void> {
    const snap = this.snapshots.get(runId);
    if (!snap) throw new Error(`[InMemoryPipelineStateRepository] Run '${runId}' not found.`);
    snap.checkpoints.push(checkpoint);
    snap.latestCheckpoint = checkpoint;
    snap.updatedAt = Date.now();
    this.snapshots.set(runId, JSON.parse(JSON.stringify(snap)));
  }

  public async restoreLatestCheckpoint(runId: string): Promise<PipelineCheckpoint | null> {
    const snap = this.snapshots.get(runId);
    if (!snap || !snap.latestCheckpoint) return null;
    return JSON.parse(JSON.stringify(snap.latestCheckpoint));
  }

  public clear(): void {
    this.snapshots.clear();
    this.meetingIdToRunId.clear();
  }
}

export class JsonSnapshotPipelineStateRepository implements IPipelineStateRepository {
  private inMemory = new InMemoryPipelineStateRepository();
  private storageDir: string;

  constructor(storageDir: string) {
    this.storageDir = storageDir;
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  public async saveSnapshot(snapshot: PipelineRunSnapshot): Promise<void> {
    await this.inMemory.saveSnapshot(snapshot);
    const filePath = path.join(this.storageDir, `${snapshot.runId}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(snapshot, null, 2), "utf-8");
  }

  public async loadSnapshot(runId: string): Promise<PipelineRunSnapshot | null> {
    const mem = await this.inMemory.loadSnapshot(runId);
    if (mem) return mem;

    const filePath = path.join(this.storageDir, `${runId}.json`);
    if (!fs.existsSync(filePath)) return null;

    const raw = await fs.promises.readFile(filePath, "utf-8");
    const snap = JSON.parse(raw) as PipelineRunSnapshot;
    await this.inMemory.saveSnapshot(snap);
    return snap;
  }

  public async loadByMeetingId(meetingId: string): Promise<PipelineRunSnapshot | null> {
    return this.inMemory.loadByMeetingId(meetingId);
  }

  public async persistCheckpoint(runId: string, checkpoint: PipelineCheckpoint): Promise<void> {
    await this.inMemory.persistCheckpoint(runId, checkpoint);
    const snap = await this.inMemory.loadSnapshot(runId);
    if (snap) {
      const filePath = path.join(this.storageDir, `${runId}.json`);
      await fs.promises.writeFile(filePath, JSON.stringify(snap, null, 2), "utf-8");
    }
  }

  public async restoreLatestCheckpoint(runId: string): Promise<PipelineCheckpoint | null> {
    return this.inMemory.restoreLatestCheckpoint(runId);
  }
}
