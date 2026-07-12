# Conversa - Detailed Implementation Plan

# AI Meeting Orchestration Platform - 4-Hour MVP Implementation Plan

## A. PROJECT OVERVIEW

We're building a **working prototype** of the AI Meeting Orchestration Platform in **4 hours** using **Next.js 14+ (App Router)** deployed to **Vercel**. The system accepts audio file uploads OR transcript paste, transcribes audio using OpenAI Whisper (user's API key), extracts structured action items with GPT-4 using JSON mode, and exposes results via HTTP endpoint with optional MCP server wrapper. This is a **Serverless-First Monolith** with zero infrastructure management—everything runs as Next.js API routes on Vercel's edge network.

**Core Flow:**

1. User uploads audio (MP3/WAV) or pastes transcript
2. System transcribes audio via OpenAI Whisper API (if audio provided)
3. GPT-4 extracts action items with description, owner, due date, priority
4. Results returned as JSON via HTTP endpoint
5. UI displays results with download option

**Key Constraints:**

- BYOK (Bring Your Own Key) model—no server-side API key storage
- Vercel function timeout: 60s max (Pro tier assumed)
- Single Next.js codebase with API routes
- No separate backend services or databases
- No authentication/multi-tenancy in MVP

---

## B. TECHNOLOGY STACK & DEPENDENCIES

**Core Framework:**

- Next.js 14+ (App Router with React Server Components)
- React 18+ for UI components
- TypeScript for type safety

**AI & Processing:**

- OpenAI SDK (official Node.js client) for Whisper and GPT-4 API calls
- Zod for runtime schema validation and type inference

**UI & Styling:**

- Tailwind CSS for utility-first styling
- Headless UI (optional) for accessible components
- Lucide React for icons

**File Handling:**

- Built-in Next.js FormData handling (no multer needed)
- Browser File API for client-side file validation

**Deployment:**

- Vercel (automatic via Git push)
- Edge Runtime for API routes where possible

---

## C. FILE STRUCTURE

```
meeting-orchestration/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── api/
│   │   ├── transcribe/
│   │   │   └── route.ts
│   │   ├── extract-actions/
│   │   │   └── route.ts
│   │   └── mcp/
│   │       └── route.ts
│   └── globals.css
├── lib/
│   ├── types.ts
│   ├── schemas.ts
│   └── openai-client.ts
├── components/
│   ├── FileUpload.tsx
│   ├── TranscriptInput.tsx
│   ├── ActionItemsDisplay.tsx
│   └── ApiKeyInput.tsx
├── public/
│   └── sample-meeting.mp3
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## D. COMPLETE FILE-BY-FILE IMPLEMENTATION

### FILE: package.json

**Purpose:** Project dependencies and scripts for Next.js application

**DEPENDENCIES:**
Include Next.js, React, React DOM, TypeScript, Tailwind CSS, OpenAI SDK, Zod, Lucide React, and Headless UI with standard latest versions (no specific version pinning for MVP speed).

**SCRIPTS:**
Define dev server command, production build command, start command for production preview, and lint command for code quality checks.

**CONFIGURATION:**
Set Node.js engine requirement to 18 or higher, configure TypeScript strict mode, and enable ESLint for Next.js best practices.

---

### FILE: tsconfig.json

**Purpose:** TypeScript compiler configuration for Next.js App Router

**COMPILER OPTIONS:**
Enable strict type checking, configure module resolution for Node.js, set JSX to preserve for React, enable incremental compilation, and configure path aliases for clean imports (@ for root, @/components, @/lib).

**INCLUDE PATHS:**
Specify app directory, components directory, lib directory, and Next.js type definitions for full TypeScript coverage.

**EXCLUDE PATHS:**
Exclude node_modules and Next.js build output directories to prevent unnecessary type checking overhead.

---

### FILE: next.config.js

**Purpose:** Next.js framework configuration for API routes and deployment

**API ROUTE CONFIGURATION:**
Set maximum request body size to 10MB for audio file uploads, configure response size limit to 5MB, and set function timeout to 60 seconds (Vercel Pro limit).

**RUNTIME CONFIGURATION:**
Enable Edge Runtime for lightweight API routes where possible, configure Node.js runtime for routes requiring file processing, and set environment variable handling for client-side API key input.

**SECURITY HEADERS:**
Add Content Security Policy headers for XSS protection, configure CORS headers for API routes to allow cross-origin requests during development, and set strict transport security for HTTPS enforcement.

**OPTIMIZATION:**
Enable SWC minification for faster builds, configure image optimization for any future UI enhancements, and set compression for API responses.

---

### FILE: tailwind.config.ts

**Purpose:** Tailwind CSS configuration for UI styling

**CONTENT PATHS:**
Scan app directory, components directory, and pages directory for Tailwind class usage to enable tree-shaking and minimal CSS bundle size.

**THEME CUSTOMIZATION:**
Extend default theme with custom color palette for action item priorities (high: red, medium: yellow, low: green), define spacing scale for consistent layout, and configure typography plugin for readable transcript display.

**PLUGINS:**
Include Tailwind Forms plugin for styled form inputs, add Tailwind Typography plugin for prose content, and configure Headless UI plugin for accessible component styling.

---

### FILE: app/globals.css

**Purpose:** Global styles and Tailwind directives

**TAILWIND DIRECTIVES:**
Import Tailwind base styles, components layer, and utilities layer with proper ordering for CSS specificity.

**CUSTOM STYLES:**
Define global CSS variables for theme colors (primary, secondary, accent), set base typography styles for body text and headings, and configure scrollbar styling for transcript display areas.

**COMPONENT OVERRIDES:**
Style file input elements to match design system, customize button focus states for accessibility, and define loading spinner animation keyframes.

---

### FILE: lib/types.ts

**Purpose:** TypeScript type definitions for application data structures

**ACTION ITEM TYPE:**
Define ActionItem interface with id (string), description (string), owner (string), dueDate (ISO 8601 string), priority (enum: high, medium, low), and optional context (string) for additional meeting notes.

**EXTRACTION RESULT TYPE:**
Define ExtractionResult interface containing transcript (string), actionItems (array of ActionItem), summary (string), and extractedAt (ISO timestamp) for audit trail.

**TRANSCRIPTION RESULT TYPE:**
Define TranscriptionResult interface with text (string), duration (number in seconds), and language (string) for Whisper API response mapping.

**API ERROR TYPE:**
Define ApiError interface with error (string), code (string), and optional details (object) for consistent error handling across API routes.

---

### FILE: lib/schemas.ts

**Purpose:** Zod schemas for runtime validation and type inference

**ACTION ITEM SCHEMA:**
Create Zod schema matching ActionItem type with string validations (min length, max length), date validation for dueDate (ISO 8601 format), enum validation for priority, and optional context field with max length constraint.

**EXTRACTION REQUEST SCHEMA:**
Define schema for API request validation with transcript (required string, min 10 chars), apiKey (required string, starts with "sk-"), and optional configuration object for model selection and temperature.

**TRANSCRIPTION REQUEST SCHEMA:**
Define schema for file upload validation with **audio** file type check (audio/mpeg for MP3, audio/wav for WAV, audio/mp4 for **M4A** — note `audio/mp4` is the M4A *audio* container, not video/mp4), file size limit (10MB max), and apiKey validation.

**GPT RESPONSE SCHEMA:**
Create schema for OpenAI JSON mode response validation with actionItems array, summary string, and metadata object to ensure API returns expected structure before processing.

---

### FILE: lib/openai-client.ts

**Purpose:** OpenAI API client wrapper with error handling

**CLIENT INITIALIZATION:**
Create function that accepts user's API key and returns configured OpenAI client instance with timeout settings (30s for Whisper, 45s for GPT-4) and retry logic (3 attempts with exponential backoff).

**TRANSCRIPTION FUNCTION:**
Implement async function that accepts audio file buffer and API key, calls Whisper API with audio/transcriptions endpoint, handles rate limiting errors (429) with retry, validates response format, and returns TranscriptionResult with text, duration estimate, and detected language.

**ACTION EXTRACTION FUNCTION:**
Implement async function that accepts transcript string and API key, constructs GPT-4 prompt with JSON mode instructions and action item schema, calls chat completions endpoint with response_format set to json_schema, validates response against Zod schema, handles hallucination edge cases (empty arrays, invalid dates), and returns ExtractionResult with parsed action items and summary.

**ERROR HANDLING:**
Wrap all API calls in try-catch blocks, map OpenAI error codes to user-friendly messages (invalid API key, rate limit, timeout, model unavailable), log errors with sanitized details (no API keys in logs), and return structured ApiError objects for consistent client-side handling.

---

### FILE: app/api/transcribe/route.ts

**Purpose:** API route for audio transcription via OpenAI Whisper

**REQUEST HANDLING:**
Accept POST requests with multipart/form-data containing audio file and apiKey, validate request using Zod schema, check file size and type constraints, and return 400 error for invalid inputs with specific validation messages.

**FILE PROCESSING:**
Extract audio file from FormData, convert to Buffer for OpenAI API compatibility, validate audio format (MP3, WAV, M4A), and handle file read errors with appropriate error responses.

**WHISPER API CALL:**
Initialize OpenAI client with user's API key, call transcription function from openai-client.ts, handle API errors (invalid key, rate limit, timeout), and map errors to HTTP status codes (401 for auth, 429 for rate limit, 500 for server errors).

**RESPONSE FORMATTING:**
Return JSON response with transcription text, duration estimate, detected language, and timestamp, set appropriate Content-Type header, and include CORS headers for cross-origin requests during development.

**TIMEOUT HANDLING:**
Implement 55-second timeout (5s buffer before Vercel's 60s limit), return 408 error if transcription exceeds timeout, and suggest user to split large audio files into smaller chunks.

---

### FILE: app/api/extract-actions/route.ts

**Purpose:** API route for extracting action items from transcript using GPT-4

**REQUEST HANDLING:**
Accept POST requests with JSON body containing transcript and apiKey, validate request using Zod schema, check transcript length (min 10 chars, max 50k chars for token limits), and return 400 error for invalid inputs.

**GPT-4 PROMPT CONSTRUCTION:**
Build system prompt instructing GPT-4 to extract action items with specific schema (description, owner, due date, priority), include few-shot examples for better accuracy, specify JSON mode output format, and set temperature to 0.7 for balanced creativity and consistency.

**ACTION EXTRACTION:**
Initialize OpenAI client with user's API key, call action extraction function from openai-client.ts with constructed prompt, handle API errors (invalid key, rate limit, context length exceeded), and validate response against Zod schema before returning.

**POST-PROCESSING:**
Parse GPT-4 JSON response, generate unique IDs for each action item (UUID or timestamp-based), validate due dates are in future (warn if past dates detected), ensure priority values are valid enums, and add extractedAt timestamp for audit trail.

**RESPONSE FORMATTING:**
Return JSON response with actionItems array, summary string, transcript echo for verification, and extractedAt timestamp, set appropriate Content-Type header, and include metadata about extraction (model used, token count if available).

**ERROR HANDLING:**
Catch JSON parsing errors from malformed GPT-4 responses, handle empty action item arrays gracefully (return empty array with warning message), log extraction failures with sanitized details, and return structured ApiError for client-side handling.

---

### FILE: app/api/mcp/route.ts

**Purpose:** MCP (Model Context Protocol) server endpoint for tool integration

**MCP PROTOCOL HANDLING:**
Accept POST requests with MCP-formatted JSON body, validate request structure (method, params), and return 400 error for invalid MCP requests with protocol-specific error codes.

**TOOL DEFINITION:**
Define "extract_meeting_actions" tool with input schema (transcript, apiKey), output schema (actionItems array), description for MCP clients, and metadata (version, author, capabilities).

**TOOL EXECUTION:**
Handle "tools/call" method by routing to extract-actions logic, validate tool name matches "extract_meeting_actions", execute action extraction with provided parameters, and return MCP-formatted response with result content.

**TOOL LISTING:**
Handle "tools/list" method by returning available tools array with extract_meeting_actions definition, include tool metadata (name, description, inputSchema), and format response according to MCP specification.

**RESPONSE FORMATTING:**
Return MCP-compliant JSON responses with result object containing content array, set appropriate Content-Type header (application/json), and include MCP version header for protocol compatibility.

**FALLBACK BEHAVIOR:**
For unsupported MCP methods, return 501 Not Implemented error, for unknown tool names, return 404 error with available tools list, and log MCP requests for debugging and usage analytics.

---

### FILE: components/ApiKeyInput.tsx

**Purpose:** React component for secure API key input with validation

**COMPONENT STATE:**
Manage API key input value with useState, track validation state (valid, invalid, pending), and store error messages for display below input field.

**INPUT RENDERING:**
Render password-type input field for API key entry, display placeholder text ("sk-..."), show/hide toggle button for key visibility, and apply Tailwind styling for consistent appearance.

**VALIDATION LOGIC:**
Validate API key format on blur event (starts with "sk-", min 40 chars), show inline error message for invalid format, debounce validation to avoid excessive checks, and emit validated key to parent component via callback prop.

**SECURITY CONSIDERATIONS:**
Never log API key values, clear input on component unmount, disable autocomplete and autofill for input field, and show warning message about BYOK model (keys never stored server-side).

**ACCESSIBILITY:**
Add ARIA labels for screen readers, ensure keyboard navigation works correctly, provide clear error messages for validation failures, and use semantic HTML for form structure.

---

### FILE: components/FileUpload.tsx

**Purpose:** React component for audio file upload with drag-and-drop

**COMPONENT STATE:**
Manage selected file with useState, track upload progress (0-100%), store upload status (idle, uploading, success, error), and hold error messages for display.

**FILE INPUT RENDERING:**
Render file input with accept attribute for **audio** types (audio/mpeg for MP3, audio/wav for WAV, audio/mp4 for **M4A**), display selected file name and size, show upload button when file selected, and apply Tailwind styling for drag-and-drop area. No camera/video input, preview, or permission prompt is rendered.

**DRAG-AND-DROP HANDLING:**
Implement onDragOver and onDrop event handlers, prevent default browser behavior for file drops, validate dropped file type and size, and update component state with selected file.

**FILE VALIDATION:**
Check file size against 10MB limit, validate file type matches accepted audio formats, show error message for invalid files, and clear previous errors on new file selection.

**UPLOAD LOGIC:**
Create FormData with audio file and API key, call /api/transcribe endpoint with POST request, track upload progress using fetch API, handle response (success or error), and emit transcription result to parent component via callback prop.

**PROGRESS DISPLAY:**
Show progress bar during upload, display percentage complete, animate progress bar smoothly, and show success/error icons when upload finishes.

**ERROR HANDLING:**
Catch network errors and display user-friendly messages, handle API errors (invalid key, rate limit, timeout), show retry button on failure, and clear error state on new upload attempt.

---

### FILE: components/TranscriptInput.tsx

**Purpose:** React component for manual transcript paste with character count

**COMPONENT STATE:**
Manage transcript text with useState, track character count, store validation state (valid, invalid), and hold error messages for display.

**TEXTAREA RENDERING:**
Render textarea with placeholder text ("Paste your meeting transcript here..."), display character count below textarea (current/max), show validation error messages, and apply Tailwind styling for consistent appearance.

**CHARACTER LIMIT:**
Set maximum character limit to 50,000 (token limit consideration), show warning when approaching limit (90% threshold), prevent input beyond limit, and display remaining characters in real-time.

**VALIDATION LOGIC:**
Validate minimum transcript length (10 chars), check for empty or whitespace-only input, show inline error message for invalid input, and emit validated transcript to parent component via callback prop.

**FORMATTING HELPERS:**
Provide "Clear" button to reset textarea, show "Paste from Clipboard" button for convenience, trim whitespace from pasted content, and preserve line breaks for readability.

**ACCESSIBILITY:**
Add ARIA labels for screen readers, ensure keyboard navigation works correctly, provide clear error messages for validation failures, and use semantic HTML for form structure.

---

### FILE: components/ActionItemsDisplay.tsx

**Purpose:** React component for displaying extracted action items with download

**COMPONENT PROPS:**
Accept actionItems array, summary string, transcript text, and extractedAt timestamp as props from parent component.

**ACTION ITEMS RENDERING:**
Map over actionItems array and render each item as card with description, owner, due date, priority badge, and optional context, apply priority-based color coding (high: red, medium: yellow, low: green), and sort items by priority and due date.

**SUMMARY DISPLAY:**
Render meeting summary in separate section above action items, apply typography styling for readability, and show extractedAt timestamp for audit trail.

**PRIORITY BADGES:**
Render priority as colored badge (high: red background, medium: yellow, low: green), use Tailwind utility classes for styling, and add icons for visual distinction (Lucide React icons).

**DOWNLOAD FUNCTIONALITY:**
Provide "Download JSON" button to export results, create JSON blob with actionItems, summary, and transcript, trigger browser download with filename (meeting-actions-{timestamp}.json), and show success message after download.

**EMPTY STATE:**
Show placeholder message when no action items extracted, suggest user to try different transcript or check API key, and provide "Try Again" button to reset form.

**ACCESSIBILITY:**
Use semantic HTML for list structure, add ARIA labels for action item cards, ensure keyboard navigation works correctly, and provide clear visual hierarchy for priority levels.

---

### FILE: app/layout.tsx

**Purpose:** Root layout component for Next.js App Router

**METADATA CONFIGURATION:**
Define page title ("AI Meeting Orchestration - MVP"), description for SEO, viewport settings for responsive design, and favicon path.

**HTML STRUCTURE:**
Render html tag with lang attribute, include head with metadata, render body with children prop, and apply global CSS classes for consistent styling.

**FONT CONFIGURATION:**
Import and configure Inter font from next/font/google, apply font to body element, and set font-display to swap for performance.

**GLOBAL PROVIDERS:**
Wrap children with any necessary context providers (none needed for MVP), include error boundary for graceful error handling, and add analytics script if needed (optional).

---

### FILE: app/page.tsx

**Purpose:** Main page component orchestrating the entire user flow

**COMPONENT STATE:**
Manage API key with useState, track current step (input, transcribing, extracting, results), store transcript text, hold extraction results, and manage error state.

**LAYOUT STRUCTURE:**
Render header with app title and description, display API key input at top, show file upload and transcript input side-by-side, render action items display when results available, and apply responsive grid layout with Tailwind.

**WORKFLOW ORCHESTRATION:**
Handle file upload by calling transcribe API, store transcript result and move to extraction step, call extract-actions API with transcript and API key, store extraction results and display action items, and handle errors at each step with user-friendly messages.

**STEP INDICATORS:**
Show progress indicator for current step (1: Input, 2: Transcribing, 3: Extracting, 4: Results), highlight active step, and disable future steps until previous steps complete.

**ERROR HANDLING:**
Catch errors from API calls, display error messages with retry button, clear error state on new attempt, and log errors to console for debugging.

**LOADING STATES:**
Show loading spinner during transcription, display progress message ("Transcribing audio..."), show loading spinner during extraction, and display progress message ("Extracting action items...").

**RESULTS DISPLAY:**
Render ActionItemsDisplay component with extraction results, show transcript in collapsible section for verification, provide "Start Over" button to reset workflow, and celebrate success with subtle animation.

**ACCESSIBILITY:**
Use semantic HTML for page structure, add ARIA labels for interactive elements, ensure keyboard navigation works correctly, and provide clear visual feedback for all actions.

---

### FILE: README.md

**Purpose:** Project documentation with setup and usage instructions

**PROJECT DESCRIPTION:**
Explain what the MVP does (audio transcription + action extraction), list key features (BYOK, serverless, no auth), and describe target use case (4-hour prototype for internal demo).

**SETUP INSTRUCTIONS:**
Provide step-by-step setup commands (npm install, npm run dev), explain environment variable requirements (none for MVP), and list prerequisites (Node.js 18+, OpenAI API key).

**USAGE GUIDE:**
Describe how to use the app (enter API key, upload audio or paste transcript, view results), explain BYOK model (keys never stored), and provide example workflow with screenshots (optional).

**DEPLOYMENT INSTRUCTIONS:**
Explain Vercel deployment process (connect GitHub repo, auto-deploy on push), list environment variables to set in Vercel dashboard (none for MVP), and provide production URL example.

**API DOCUMENTATION:**
Document /api/transcribe endpoint (POST, multipart/form-data, returns TranscriptionResult), document /api/extract-actions endpoint (POST, JSON body, returns ExtractionResult), and document /api/mcp endpoint (POST, MCP-formatted JSON, returns MCP response).

**LIMITATIONS:**
List known limitations (60s timeout, 10MB file size, no auth, no database), explain Vercel function constraints, and suggest future improvements (multi-tenancy, persistent storage, real-time streaming).

**TROUBLESHOOTING:**
Provide common error solutions (invalid API key, rate limit, timeout), explain how to debug API errors (check browser console, inspect network tab), and link to OpenAI API documentation for reference.

---

## E. DEPLOYMENT GUIDE

**LOCAL DEVELOPMENT:**

1. Clone repository and navigate to project directory
2. Run `npm install` to install all dependencies
3. Start development server with `npm run dev`
4. Open browser to `http://localhost:3000`
5. Enter OpenAI API key (starts with "sk-") in input field
6. Upload audio file or paste transcript to test workflow

**VERCEL DEPLOYMENT:**

1. Push code to GitHub repository (main branch)
2. Connect repository to Vercel via dashboard (vercel.com)
3. Configure project settings (Framework Preset: Next.js, Root Directory: ./)
4. Deploy with default settings (no environment variables needed for BYOK model)
5. Vercel auto-deploys on every push to main branch
6. Access production URL provided by Vercel (e.g., meeting-orchestration.vercel.app)

**TESTING PRODUCTION:**

1. Visit production URL in browser
2. Enter valid OpenAI API key
3. Upload sample audio file (public/sample-meeting.mp3) or paste test transcript
4. Verify transcription and action extraction work correctly
5. Download JSON results and inspect structure
6. Test error handling by entering invalid API key

**MONITORING:**

1. Check Vercel dashboard for function logs and errors
2. Monitor function execution time (should be under 60s)
3. Track API usage in OpenAI dashboard (user's account)
4. Review browser console for client-side errors

**ROLLBACK:**

1. If deployment fails, Vercel automatically rolls back to previous version
2. Manual rollback via Vercel dashboard (Deployments → select previous version → Promote to Production)

---

## F. DEPENDENCY ANALYSIS

**FILE DEPENDENCIES:**

```
package.json (no imports, defines dependencies)
tsconfig.json (no imports, TypeScript config)
next.config.js (no imports, Next.js config)
tailwind.config.ts (no imports, Tailwind config)
app/globals.css (imports Tailwind directives)

lib/types.ts (no imports, type definitions)
lib/schemas.ts (imports: zod, lib/types.ts)
lib/openai-client.ts (imports: openai, lib/types.ts, lib/schemas.ts)

app/api/transcribe/route.ts (imports: next/server, lib/openai-client.ts, lib/schemas.ts)
app/api/extract-actions/route.ts (imports: next/server, lib/openai-client.ts, lib/schemas.ts)
app/api/mcp/route.ts (imports: next/server, lib/openai-client.ts, lib/schemas.ts)

components/ApiKeyInput.tsx (imports: react, lib/schemas.ts)
components/FileUpload.tsx (imports: react, lib/types.ts)
components/TranscriptInput.tsx (imports: react)
components/ActionItemsDisplay.tsx (imports: react, lib/types.ts, lucide-react)

app/layout.tsx (imports: react, next/font/google, app/globals.css)
app/page.tsx (imports: react, components/*, lib/types.ts)

README.md (no imports, documentation)
```

**IMPLEMENTATION ORDER:**

1. **Configuration Files:** package.json → tsconfig.json → next.config.js → tailwind.config.ts → app/globals.css
2. **Type Definitions:** lib/types.ts → lib/schemas.ts
3. **Core Logic:** lib/openai-client.ts
4. **API Routes:** app/api/transcribe/route.ts → app/api/extract-actions/route.ts → app/api/mcp/route.ts
5. **UI Components:** components/ApiKeyInput.tsx → components/FileUpload.tsx → components/TranscriptInput.tsx → components/ActionItemsDisplay.tsx
6. **App Structure:** app/layout.tsx → app/page.tsx
7. **Documentation:** README.md

**FUNCTION DEPENDENCIES:**

```
lib/openai-client.ts:
  - initializeClient() → OpenAI constructor
  - transcribeAudio() → initializeClient(), Whisper API, Zod validation
  - extractActions() → initializeClient(), GPT-4 API, Zod validation, JSON parsing

app/api/transcribe/route.ts:
  - POST handler → FormData parsing, transcribeAudio(), error handling

app/api/extract-actions/route.ts:
  - POST handler → JSON parsing, extractActions(), error handling

app/api/mcp/route.ts:
  - POST handler → MCP protocol parsing, extractActions(), MCP response formatting

components/FileUpload.tsx:
  - handleFileSelect() → file validation
  - handleUpload() → fetch /api/transcribe, progress tracking

components/TranscriptInput.tsx:
  - handleTextChange() → character count, validation

components/ActionItemsDisplay.tsx:
  - renderActionItem() → priority badge, date formatting
  - handleDownload() → JSON blob creation, browser download

app/page.tsx:
  - handleFileUpload() → FileUpload callback, state update
  - handleTranscriptSubmit() → fetch /api/extract-actions, state update
  - handleError() → error display, retry logic
```

**DATA FLOW:**

```
1. User enters API key → ApiKeyInput validates → stored in page.tsx state
2. User uploads audio → FileUpload validates → FormData created
3. FormData sent to /api/transcribe → Whisper API called → TranscriptionResult returned
4. Transcript stored in page.tsx state → displayed in TranscriptInput (read-only)
5. Transcript sent to /api/extract-actions → GPT-4 API called → ExtractionResult returned
6. ExtractionResult stored in page.tsx state → passed to ActionItemsDisplay
7. ActionItemsDisplay renders action items → user downloads JSON

Alternative flow (paste transcript):
1. User enters API key → ApiKeyInput validates → stored in page.tsx state
2. User pastes transcript → TranscriptInput validates → stored in page.tsx state
3. Transcript sent to /api/extract-actions → GPT-4 API called → ExtractionResult returned
4. ExtractionResult stored in page.tsx state → passed to ActionItemsDisplay
5. ActionItemsDisplay renders action items → user downloads JSON

MCP flow:
1. MCP client sends POST to /api/mcp with tool call
2. /api/mcp routes to extractActions() logic
3. ExtractionResult returned in MCP-formatted response
```

**CRITICAL DEPENDENCIES:**

- OpenAI SDK must be available before any API calls
- Zod schemas must be defined before API route validation
- Type definitions must exist before component implementation
- Tailwind config must be set before styling components
- Next.js config must be correct before deployment to Vercel

**RUNTIME DEPENDENCIES:**

- User's OpenAI API key must be valid (sk-* format)
- Vercel function timeout must not exceed 60s
- Audio files must be under 10MB
- Transcripts must be under 50k characters
- Network connection required for OpenAI API calls

---

## CRITICAL IMPLEMENTATION NOTES

**SECURITY:**

- Never log API keys in server-side code
- Validate all user inputs with Zod schemas
- Sanitize error messages before returning to client
- Use HTTPS only (enforced by Vercel)
- Implement rate limiting if abuse detected (future enhancement)

**PERFORMANCE:**

- Keep function execution under 55s to avoid Vercel timeout
- Optimize audio file processing (stream if possible)
- Cache OpenAI client instances per request (not across requests)
- Minimize bundle size by tree-shaking unused code
- Use Edge Runtime for lightweight API routes

**ERROR HANDLING:**

- Catch all errors and return structured ApiError objects
- Map OpenAI error codes to user-friendly messages
- Provide retry mechanisms for transient failures
- Log errors with sanitized details for debugging
- Show clear error messages in UI with actionable guidance

**TESTING:**

- Test with various audio formats (MP3, WAV, M4A)
- Test with long transcripts (near 50k char limit)
- Test with invalid API keys (expect 401 errors)
- Test timeout scenarios (large audio files)
- Test MCP endpoint with sample MCP client

**FUTURE ENHANCEMENTS:**

- Add authentication and multi-tenancy
- Implement persistent storage (database)
- Add real-time streaming for long audio files
- Support **video file uploads (extract audio)** as a *documented future capability* only — deferred, not implemented. Video remains out of scope this release; if reintroduced it reuses the audio ingestion → transcription → analysis pipeline behind a new `MediaType` (see `docs/adr/0002-audio-first-media-scope.md`).
- **Authoritative audio-first specs for agents are in `docs/` (start `docs/INDEX.md`).** This plan's audio/transcript path is re-expressed as implementable contracts there (media domain, validation, API, UX, deployment, SRE, tests).
- Integrate with calendar APIs for automatic meeting capture
- Add Jira/Salesforce direct integration (post-MVP)
- Implement agent collaboration (multi-agent workflows)
- Add meeting memory and context retrieval

---

This plan is optimized for **4-hour execution** with **zero infrastructure management**. Every component is designed for **immediate deployment to Vercel** with **no backend services** required. The BYOK model eliminates API key storage concerns, and the serverless architecture ensures **automatic scaling** and **global edge distribution**. 

**Next Steps:**

1. Run `npx create-next-app@latest meeting-orchestration --typescript --tailwind --app`
2. Copy file contents from this plan into project structure
3. Run `npm install openai zod lucide-react @headlessui/react`
4. Test locally with `npm run dev`
5. Push to GitHub and deploy to Vercel
6. Share production URL with stakeholders for demo

**Time Estimate:**

- Setup and configuration: 30 minutes
- Core API routes: 60 minutes
- UI components: 90 minutes
- Testing and debugging: 60 minutes
- **Total: 4 hours**

---

Generated by Socrates AI Architecture - 7/12/2026