# 🧠 AI-Powered Decision Room

> A group decision-making tool that combines a **deterministic constraint engine** with a **Large Language Model (LLM)** — so you always get a transparent, auditable recommendation grounded in real data, not AI guesswork.

---

## ✨ What Is This?

Ever been in a situation where a group of people need to agree on something — a lunch spot, an event venue, a freelancer to hire — but everyone has different preferences and deal-breakers?

**Decision Room** is built for exactly that. You define your options, each person adds their requirements (both must-haves and nice-to-haves), and the engine figures out which option best satisfies everyone. Then an AI assistant explains the reasoning in plain English.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A free [Groq API Key](https://console.groq.com/) (optional — the app works in both Demo Mode and also you can use AI model assistant without api key)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/decision-room.git
cd decision-room

# 2. Install dependencies
npm install

# 3. Set up your environment
cp .env.example .env
```

Open `.env` and add your Groq API key:

```
GROQ_API_KEY=your_groq_api_key_here
```

### Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. That's it!

> **No API key?** No problem. The app runs in **Demo Mode** automatically when no key is provided, using a local mock assistant so you can still explore the full functionality.

### Running Tests

```bash
npm test
```

---

## 🗂️ Project Structure

```
decision-room/
├── app/
│   ├── api/assistant/route.ts    # The AI backend: tool-calling loop + Groq integration
│   ├── page.tsx                  # Main UI: the entire frontend lives here
│   ├── layout.tsx                # Root layout with metadata
│   └── globals.css               # Global styles (light theme)
│
├── components/
│   ├── AssistantPnael.tsx        # AI chat panel: sends questions, renders structured AI response
│   ├── OptionCard.tsx            # Renders a single ranked option with its score/status
│   ├── OptionForm.tsx            # Form to create/edit an option and its attributes
│   ├── ParticipantForm.tsx       # Form to create/edit a participant and their constraints
│   └── RankingPanel.tsx          # Orchestrates the ranked list of OptionCards
│
├── lib/
│   ├── types.ts                  # All TypeScript interfaces: Decision, Option, Participant, Constraint, etc.
│   ├── deterministicEngine.ts    # The core scoring logic: hard filters, soft scoring, conflict detection
│   ├── tools.ts                  # Wraps engine functions as LLM-callable tools (tool definitions + dispatcher)
│   ├── recommendationSchema.ts   # Zod schema to validate the AI's JSON response
│   ├── storage.ts                # localStorage persistence: save/load/delete decisions
│   ├── decisionFactory.ts        # Factory functions to create empty Decision, Option, Participant objects
│   ├── seedData.ts               # Pre-built example decisions for the three domains
│   ├── mockAssistant.ts          # A local fallback that mimics the AI assistant without an API call
│   └── engine.test.ts            # Unit tests for the deterministic engine
│
└── .env.example                  # Template for required environment variables
```

---

## 🏛️ Architecture Overview

The app is built around a clean separation between three layers:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Next.js)                        │
│                                                                 │
│  page.tsx ──► RankingPanel ──► deterministicEngine.ts           │
│      │                           (runs in the browser)          │
│      └──► AssistantPanel ──────────────────────────────────┐    │
│                                                            │    │
└────────────────────────────────────────────────────────────┼────┘
                                                             │ HTTP POST
                                           ┌─────────────────▼────────────┐
                                           │   /api/assistant (Next.js)   │
                                           │                              │
                                           │  1. Receives question +      │
                                           │     decision object          │
                                           │                              │
                                           │  2. Calls Groq (Llama 3.3)   │
                                           │     with tool definitions     │
                                           │                              │
                                           │  3. Handles tool calls in a  │
                                           │     loop (max 6 iterations): │
                                           │     → getOptions()           │
                                           │     → getConstraints()       │
                                           │     → calculateScores()      │
                                           │     → findConflicts()        │
                                           │                              │
                                           │  4. Validates JSON with Zod  │
                                           │  5. Returns structured result│
                                           └──────────────────────────────┘
```

### The Two-Engine Design

The most important design decision is the **strict split between the LLM and the deterministic engine**:

| Layer | Role | Where it runs |
|---|---|---|
| **Deterministic Engine** | Hard filtering, soft scoring, conflict detection | Browser (pure TypeScript) |
| **LLM (Llama 3.3 via Groq)** | Natural language explanation, reasoning, communication | Server (`/api/assistant`) |

The AI is **never** allowed to compute rankings itself. It *calls* the engine through a set of tool definitions and is forced to reason over the real results. This prevents hallucinated scores, invented option names, or fabricated recommendations.

### The Data Model

Everything flows from these five core types:

```typescript
Decision
├── id, title, domain, createdAt
├── options: Option[]
│   └── { id, name, attributes: Record<string, AttributeValue> }
└── participants: Participant[]
    └── { id, name, constraints: Constraint[] }
        └── { attribute, operator, value, type: 'hard' | 'soft', weight? }
```

- **Hard constraints** are deal-breakers. If an option fails even one, it is disqualified entirely.
- **Soft constraints** are preferences. Each matched preference adds its `weight` to the option's score.
- Options are ranked: qualified options first (by score), disqualified options last.

### Persistence

Decisions are stored in the browser's `localStorage` — no backend database required. This keeps the app completely self-contained. The `storage.ts` module handles serialization and gracefully falls back to in-memory state if localStorage is unavailable.

---

## 🎨 Key Features

- **Three pre-built domains**: Event planning, Service hiring, and Food/restaurant decisions — each with a relevant attribute schema out of the box.
- **Hard vs. Soft constraints**: Define true deal-breakers separately from "nice to have" preferences, with configurable weights.
- **Conflict detection**: The engine automatically surfaces when two participants have contradictory requirements, telling you *which* constraints clash and whether it's a showstopper or a trade-off.
- **AI explanation with grounded data**: The AI assistant always calls the engine first, then writes its explanation based on real scores — not guesswork.
- **Demo Mode**: The entire app works offline (no API key) using a local mock assistant.
- **Persistent sessions**: All your decisions are saved locally and survive page refreshes. Switch between them from the dropdown at the top.

---

## ⚙️ Assumptions & Design Decisions

1. **Client-side state over a database.** Since this is a prototype, all state lives in the browser. This trades scalability for simplicity and makes the app work with zero backend infrastructure.

2. **Fixed attribute schema per domain.** Each domain (event, service, food) has a predefined list of attributes. This keeps the constraint form simple and typesafe, but means you can't add custom fields without editing the code.

3. **The LLM is an explainer, not a judge.** The AI's role is purely communicative. The ranking order seen in the UI is always computed by the deterministic engine, never by the LLM. This ensures the output is auditable and reproducible.

4. **Groq + Llama 3.3-70b.** Groq was chosen for its speed (sub-second inference) and its generous free tier. Llama 3.3-70b was chosen as a strong open-source model with reliable tool-calling capability.

5. **Zod validation on AI output.** The AI's JSON response is validated against a strict schema before being used. If the AI returns malformed output or invents an option ID that doesn't exist, the server returns an error instead of silently accepting bad data.

6. **No auth, no multi-tenancy.** The app is designed as a single-user, local tool. All decisions are stored in the user's own browser.

---

## ⚠️ Known Limitations

- **Data doesn't sync across devices.** Since storage uses `localStorage`, your decisions exist only in the browser they were created in. Opening the app on a different device starts from scratch.

- **Fixed domains only.** You can only choose from Event, Service, or Food. There is no way to create a custom domain or add attributes beyond what each domain defines in `DOMAIN_ATTRIBUTES`.

- **No user accounts.** There is no authentication or user identity. Anyone who opens the app on your machine can see and edit your decisions.

- **LLM API dependency.** The full AI experience requires a valid Groq API key and an active internet connection. The mock assistant is a useful fallback but provides canned responses, not real reasoning.

- **Conflict detection is simple.** The current algorithm flags any two constraints from different participants that point to the same attribute with different values. It does not reason about *whether* those conflicts can actually be resolved given the current options.

- **No history or undo.** If you delete a decision or an option, it is gone immediately. There is no confirmation dialog or undo mechanism.

---

## 🔭 What I Would Build With Another Day

These are the most impactful improvements I would make with more time:

### 1. Custom Attributes (High Priority)
Allow users to define their own attribute keys and types directly in the UI, rather than being limited to the pre-built domain schemas. This would make the tool genuinely domain-agnostic. A user could type in `"team_size": number` or `"has_parking": boolean` for any kind of decision they want to make.

### 2. Better UI Design
The current UI is functional but basic. I would invest in:
- Drag-and-drop reordering of options and participants
- Animated transitions when ranked results update
- A proper mobile-responsive layout
- A dedicated "results" view that's optimized for sharing

### 3. Database & Backend Persistence
Replace `localStorage` with a real database (e.g., PostgreSQL with Prisma). This would enable:
- Decisions that persist across devices
- Shareable decision links (e.g., `/d/abc123`)
- Exporting results to PDF or CSV

### 4. Authentication & Collaboration
Add user accounts (e.g., with NextAuth.js) so multiple people can contribute to the same decision asynchronously — each participant filling in their own constraints via a shared link, without needing to be in the same room.

### 5. More Domains
Expand the pre-built domain library. Good candidates:
- **Product/Feature Prioritization** (for teams)
- **Job Offer Comparison** (salary, role, commute, growth)
- **Travel/Hotel Selection**
- **Technical Tool Selection** (e.g., picking a database or framework)

### 6. Weighted Participant Influence
Currently, all participants have equal weight in the overall decision. A "veto power" or "importance weight" per participant would make the tool more realistic for organizational decisions where some stakeholders matter more than others.

### 7. AI-Suggested Constraints
After the AI sees your options, it could proactively suggest constraints you might not have thought of ("You haven't specified a deadline — is turnaround time important to you?").

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2 | Full-stack React framework (App Router) |
| React | 19 | UI library |
| TypeScript | 5 | Type safety across the entire codebase |
| Tailwind CSS | 4 | Utility-first styling |
| Groq SDK | 1.3 | API client for the Groq LLM service |
| Zod | 4.4 | Runtime schema validation for AI output |
| Vitest | 4.1 | Unit testing |

---

## 📄 License

This project is open source. Feel free to fork, extend, and adapt it for your own use.
