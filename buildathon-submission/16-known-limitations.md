# Known Limitations

Following our successful Horizon 2 graduation, we have completely eliminated the primary architectural constraints of the MVP (namely ephemeral in-memory storage and lack of production identity management). 

However, the following limitations remain as we prepare for the Horizon 3 scale-out:

## 1. External System Integrations
While Conversa perfectly identifies and captures actionable meeting outputs internally, the bi-directional push of these actions into third-party ecosystem tools (Jira, Asana, Slack, Linear) is still in the mock/planning phases. Currently, actions are stored in Conversa's Convex database but must be manually transposed if the team operates primarily in another ticketing system.

## 2. Advanced Media Parsing
The pipeline currently excels at raw text transcriptions and audio processing via OpenAI integrations. However, real-time video parsing, speaker biometrics (identifying who is speaking by voice print automatically), and emotional sentiment analysis through webcam feeds remain out of scope for the current pilot release.

## 3. Custom Agent Logic Customization
Users cannot yet define their own specialized agents through the UI (e.g. "Create an Engineering Architecture Agent"). They must rely on the provided baseline roles (Risk Specialist, Action Specialist, Decision Specialist).
