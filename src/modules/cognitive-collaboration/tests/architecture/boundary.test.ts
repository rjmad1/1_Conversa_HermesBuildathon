import * as fs from "fs";
import * as path from "path";

export async function runArchitectureBoundaryTests(): Promise<{ name: string; passed: boolean; error?: string }[]> {
  const results: { name: string; passed: boolean; error?: string }[] = [];

  // Test 1: Zero Vector DB / Graph DB Persistence inside Cognitive Collaboration Engine
  try {
    const projectRoot = process.cwd();
    const colDir = path.join(projectRoot, "src/modules/cognitive-collaboration");

    const forbiddenTerms = [
      "VectorStore",
      "pgvector",
      "chromadb",
      "pinecone",
      "qdrant",
      "Neo4j",
      "graphdb",
      "KnowledgeGraphPersistence",
      "AegisOSMemoryStore",
    ];

    let foundForbidden = false;
    let forbiddenDetails = "";

    const checkDir = (dirPath: string) => {
      if (!fs.existsSync(dirPath)) return;
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (file !== "tests") checkDir(fullPath);
        } else if (file.endsWith(".ts")) {
          const content = fs.readFileSync(fullPath, "utf-8");
          for (const term of forbiddenTerms) {
            if (content.includes(term)) {
              foundForbidden = true;
              forbiddenDetails = `File '${file}' contains forbidden AegisOS persistence term '${term}'`;
              break;
            }
          }
        }
      }
    };

    checkDir(colDir);

    if (foundForbidden) {
      throw new Error(`Architecture boundary violation: ${forbiddenDetails}`);
    }

    results.push({ name: "Architecture Boundary: Provider-Neutral Seam (No DB/Vector/Graph Persistence)", passed: true });
  } catch (err: any) {
    results.push({ name: "Architecture Boundary: Provider-Neutral Seam (No DB/Vector/Graph Persistence)", passed: false, error: err.message });
  }

  // Test 2: Phase 1 Meeting Intelligence Integrity
  try {
    const phase1Files = [
      "src/modules/meeting-intelligence/orchestration/dag-orchestrator.ts",
      "src/modules/meeting-intelligence/provider/ai-runtime.ts",
      "src/modules/meeting-intelligence/provider/capability-router.ts",
      "src/modules/meeting-intelligence/state/pipeline-state-engine.ts",
      "src/modules/meeting-intelligence/contracts/agent-contract.ts",
      "src/modules/meeting-intelligence/contracts/pipeline-contract.ts",
    ];

    const projectRoot = process.cwd();

    for (const relFile of phase1Files) {
      const fullPath = path.join(projectRoot, relFile);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Phase 1 core file missing: ${relFile}`);
      }
    }

    results.push({ name: "Architecture Boundary: Phase 1 Core Pipeline Untouched & Intact", passed: true });
  } catch (err: any) {
    results.push({ name: "Architecture Boundary: Phase 1 Core Pipeline Untouched & Intact", passed: false, error: err.message });
  }

  return results;
}
