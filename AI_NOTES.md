# AI Notes — Decision Room

A transparent account of every AI-related decision made in this project: what was chosen, why, and what the alternatives were.

---

## 🤖 Model & Provider Choice

### Runtime Model: Llama 3.3-70b via Groq

The app calls **Llama 3.3-70b-versatile** through the **Groq** inference API at runtime.

**Why Groq?**

Groq runs LLM inference on custom silicon (LPUs) that achieves genuinely fast responses — often 200–800 tokens per second. For an interactive app where a user clicks "Ask AI" and waits for a response, latency matters a lot. A 2-second response feels snappy; a 15-second response feels broken. Groq's free tier is also generous enough to use throughout development without cost concerns.

**Why Llama 3.3-70b?**

Three reasons:
1. **Tool calling works reliably.** This app depends on the model calling `getOptions`, `getConstraints`, `calculateScores`, and `findConflicts` in the right order before writing its response. Smaller models (7b, 13b) frequently skip tool calls or hallucinate results. Llama 3.3-70b is large enough to follow the multi-step tool-calling protocol consistently.
2. **It's open-source.** If Groq were unavailable, the same model weights could be run locally (e.g., with Ollama), and the code would need only a one-line change to the base URL.
3. **Strong reasoning quality.** The model needs to synthesize multiple tool results into a coherent recommendation. 70b-class models handle this well.

**Alternatives considered:**

| Option | Verdict |
|---|---|
| OpenAI GPT-4o | Reliable tool calling, but paid-only, higher cost |
| Anthropic Claude 3.5 Sonnet | Excellent reasoning, but no free tier for runtime use |
| Llama 3.1-8b via Groq | Free and fast, but inconsistent tool calling in testing |
| Google Gemini Flash | Fast and cheap, but less consistent JSON-only output |

---

## 🔧 Tools (Function Calling)

The AI assistant is given four tools, all of which are thin wrappers around the deterministic engine:

| Tool | What it returns | Why the AI needs it |
|---|---|---|
| `getOptions` | All options with their full attribute map | The AI has no access to the decision state — it must ask |
| `getConstraints` | All participant constraints (hard/soft), attributed by name | Needed to explain *whose* preference was or wasn't met |
| `calculateScores` | Ranked options with scores, disqualification status, and matched preferences | The authoritative ranking. The AI must use this, not invent its own |
| `findConflicts` | Contradictory constraints between participants | Lets the AI explain trade-offs and flag when no option can satisfy everyone |

**Design principle: the LLM is an explainer, not a calculator.**

The AI is explicitly told in the system prompt that it must *not* compute rankings itself. It can only call the tools and reason over their output. This is enforced architecturally — the tool implementations live on the server in `lib/deterministicEngine.ts` and are never visible to the model.

A naive implementation would just send the entire decision object to the LLM and say "tell me the best option." The problem is that LLMs will happily fabricate scores, invent attributes, or confidently recommend a disqualified option. By forcing the model to call the engine first, its recommendations are anchored to real, reproducible computations.

**Tool loop configuration:**

```
MAX_TOOL_ITERATIONS = 6
```

The model calls tools in a loop: it requests a tool, gets the result, then either calls another tool or writes its final answer. Six iterations is enough headroom for the model to call all four tools and still have a round for the final response, without running away indefinitely if the model gets confused.

---

## ✅ Validation Approach

The AI is instructed to respond with **only a JSON object** — no markdown, no prose, no code fences. Even with that instruction, models occasionally wrap the output in backticks or add a sentence before the JSON.

Two layers of defence handle this:

**Layer 1 — Cleaning:**
```typescript
const cleaned = finalContent.replace(/```json\s*|```/g, '').trim();
```
This strips any markdown code fences before parsing, catching the most common deviation.

**Layer 2 — Zod schema validation:**
```typescript
export const recommendationSchema = z.object({
  recommendedOptionId: z.string(),
  explanation: z.string(),
  tradeoffs: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  supportingFacts: z.array(z.string()),
});
```
If the parsed JSON doesn't match this exact shape, a `502` error is returned rather than silently passing through malformed data.

**Layer 3 — Hallucination guard:**
Even if the JSON is valid, there is one more check: the `recommendedOptionId` returned by the AI must actually exist in the current decision's option list.

```typescript
const optionExists = decision.options.some(o => o.id === recommendation.recommendedOptionId);
if (!optionExists) {
  return NextResponse.json({ error: 'AI assistant referenced an option that does not exist.' }, { status: 502 });
}
```

This prevents the model from recommending a made-up option or one from a previous iteration of the decision it was trained on.

---

## 🛡️ Failure Handling

The API route handles failures at every level and returns specific, useful error messages rather than generic "something went wrong":

| Failure scenario | HTTP status | Behaviour |
|---|---|---|
| Bad request body (missing question or decision) | `400` | Returns a descriptive validation error immediately |
| Groq API unreachable or rate-limited | `502` | Caught in the try/catch around `groq.chat.completions.create`, returns a retry message |
| Empty response from Groq | `502` | Checks `choices[0]?.message` exists before proceeding |
| Tool execution error | — | Error is fed *back to the model* as a tool result, so it can adapt instead of crashing the loop |
| AI never reached a final answer (loop exhausted) | `504` | Returns "did not reach a final answer in time" |
| Malformed JSON from AI | `502` | Caught before Zod runs, returns the raw content for debugging |
| Zod schema validation fails | `502` | Returns the full Zod error details |
| Hallucinated option ID | `502` | Catches ID that doesn't exist in the current decision |
| No API key configured | Auto | Falls back to `mockAssistant` — app still works |

**No API key → Mock Mode:**

```typescript
const shouldUseMock = useMock === true || !process.env.GROQ_API_KEY;
if (shouldUseMock) {
  const { recommendation, trace: mockTrace } = runMockAssistant(decision);
  return NextResponse.json({ recommendation, trace: mockTrace, mode: 'mock' });
}
```

The mock assistant in `lib/mockAssistant.ts` calls the real deterministic engine and generates a structured response locally, with no network call required. This means the app is fully functional as a demo even without an API key configured.

---

## 📊 Evaluation Approach

There is no automated AI evaluation pipeline in this project. Evaluation was done through:

**Manual testing with the seed decisions:**

The three seed decisions (`seedFood`, `seedEvent`, `seedService`) in `lib/seedData.ts` serve as known-good test cases with predictable correct answers. For example:
- In the food scenario, "Sushi Bar" is disqualified (price $42 > Amina's $30 hard limit, and no vegetarian option), so the correct top pick is "Terrace Kitchen".
- In the event scenario, "City Conference Center" is disqualified (cost $2500 > organiser's $2000 hard limit), so "Lakeside Hall" should be recommended.

Running the AI on these scenarios and checking that it identifies the right option and explains the right reasons served as a basic end-to-end evaluation.

**Deterministic engine unit tests:**

The engine itself (`lib/deterministicEngine.ts`) is covered by unit tests in `lib/engine.test.ts`. These test that `calculateScores` correctly disqualifies options that fail hard constraints and that `findConflicts` correctly surfaces contradictory participant preferences.

```bash
npm test
```

**What a production evaluation would look like:**

With more time, a proper evaluation would include:
- A curated set of decision scenarios with known ground-truth recommendations
- Automated comparison of the AI's `recommendedOptionId` against the expected winner
- Checking that `tradeoffs` and `unresolvedQuestions` are non-empty when conflicts exist
- Regression testing: ensuring a model upgrade doesn't change previously correct recommendations

---

## 🖥️ AI Coding Tools Used

This project was built with the help of two AI coding assistants, each used for different parts of the stack:

### Claude (Anthropic) — Backend & Logic

**Used for:**
- Designing the `deterministicEngine.ts` scoring and conflict detection logic
- Writing the `/api/assistant/route.ts` API route, including the tool-calling loop and multi-layer error handling
- Defining the TypeScript types in `types.ts` and the Zod validation schema
- Writing `tools.ts` (the tool definitions and dispatcher that bridges the LLM and the engine)
- Authoring the system prompt that instructs the AI to call tools before answering
- Writing unit tests in `engine.test.ts`

Claude was chosen for backend work because of its strong performance on code that requires careful multi-step reasoning — the tool-calling architecture in particular involves a lot of edge cases and control flow that benefited from Claude's attention to detail and ability to reason about failure modes.

### Gemini (Google) — Frontend & UI Design

**Used for:**
- Designing the component structure and layout of `page.tsx`
- Writing and iterating on the component styles across `AssistantPnael.tsx`, `OptionCard.tsx`, `OptionForm.tsx`, `ParticipantForm.tsx`, and `RankingPanel.tsx`
- Planning and executing the light-mode theme transition (from the original dark glassmorphic design)
- Restructuring the page layout from a two-column dashboard to the final single-column stacked flow
- UI micro-interactions: hover states, expand/collapse for participant constraints, readable typography for AI output

Gemini was used for frontend work because of its strong visual sense and ability to iterate quickly on CSS-heavy changes while maintaining existing component logic untouched.

---

## 💡 Key Insight

The most important AI-related lesson from this project was that **separating what the AI computes from what it communicates** is worth the extra engineering effort.

Giving the LLM a calculator (the deterministic engine tools) and making it use that calculator before speaking produced far more trustworthy output than asking it to reason about constraints directly. Users can click "see what the engine computed" and verify the AI's recommendation against the raw scores — nothing is hidden or guessed.

This pattern — LLM as a reasoning and communication layer, not as a computation layer — is broadly applicable to any domain where correctness and auditability matter.
