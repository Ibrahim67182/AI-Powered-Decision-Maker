import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { Decision } from '@/lib/types';
import { toolDefinitions, runTool } from '@/lib/tools';



// The model must return exactly this shape once it's done calling tools
// If it doesnt, we reject the response rather than trust unvalidated output

const recommendationSchema = z.object({
  recommendedOptionId: z.string(),
  explanation: z.string(),
  tradeoffs: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  supportingFacts: z.array(z.string()),
});




export type Recommendation = z.infer<typeof recommendationSchema>;

// interface to track the tools called and their success/failure for debugging and transparency of ai assistant

interface TraceEntry {
  tool: string;
  status: 'success' | 'error';
  error?: string;
}


const MAX_TOOL_ITERATIONS = 6;


// system prompt for ai to make response inthe way like a decision maker 

const SYSTEM_PROMPT = `You are an expert and highly experienced decision maker assistant. You help a user understand which option best fits their group's constraints and preferences.

You do not know anything about the current decision until you call tools. You MUST call getOptions, getConstraints, and calculateScores before making any recommendation — never guess or invent option names, ids, participants, or scores. Also call findConflicts tool if it would help explain trade-offs.

Once you have enough information, respond with ONLY a JSON object (no markdown, no prose, no code fences, no any other format) matching exactly this shape:
{
  "recommendedOptionId": string,   // must be an actual option id returned by getOptions/calculateScores
  "explanation": string,           // why this option is the best fit, grounded in the scores/constraints
  "tradeoffs": string[],           // downsides or compromises of the recommended option
  "unresolvedQuestions": string[], // anything ambiguous, e.g. unresolved conflicts between participants
  "supportingFacts": string[]      // concrete facts from the tool results that back up the recommendation
}

If no option satisfies every hard constraint, set recommendedOptionId to "" and explain why in "explanation", listing which hard constraints blocked every option in "unresolvedQuestions".

Never invent data. Only reference options, participants, and scores that the tools actually returned.`;



// now the actual api call funtion POST method for prompt submission

export async function POST(req: NextRequest) {
 
  const trace: TraceEntry[] = [];

  try {

    const body = await req.json();
    const { question, decision } = body as { question: string; decision: Decision };

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "question" in request body.', trace },
        { status: 400 }
      );
    }
    if (!decision || !Array.isArray(decision.options)) {
      return NextResponse.json(
        { error: 'Missing or invalid "decision" in request body.', trace },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        {
          error: 'AI provider is not configured (missing API key). Try demo mode instead.',
          trace,
        },
        { status: 503 }
      );
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: question },
    ];

    let finalContent: string | null = null;
    let iterations = 0;

    // main tool calling loop for our llm model 

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations++;

      let response;
      try {
        response = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages,
          tools: toolDefinitions as any,
          tool_choice: 'auto',
        });
      } catch (apiError) {
        // Groq API unreachable, rate-limited, or erroring
        return NextResponse.json(
          {
            error: 'The AI provider is currently unavailable. Please try again shortly.',
            trace,
          },
          { status: 502 }
        );
      }

      const choice = response.choices[0]?.message;
      if (!choice) {
        return NextResponse.json(
          { error: 'AI provider returned an empty response.', trace },
          { status: 502 }
        );
      }

      messages.push(choice);

      if (!choice.tool_calls || choice.tool_calls.length === 0) {
        finalContent = choice.content ?? '';
        break;
      }

      // if ai model calls tools then handle them in loop and feed the results back to the model for next iteration

      for (const call of choice.tool_calls) {

        const toolName = call.function.name;
        
        try {
          const result = runTool(toolName, decision);
          trace.push({ tool: toolName, status: 'success' });
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result),
          });
        } catch (toolError) {
          const errMsg = toolError instanceof Error ? toolError.message : 'Unknown tool error';
          trace.push({ tool: toolName, status: 'error', error: errMsg });
          // Feed the error back to the model so it can adjust, instead of crashing
          messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify({ error: errMsg }),
          });
        }
      }
    }

    if (finalContent === null) {
      return NextResponse.json(
        { error: 'AI assistant did not reach a final answer in time. Please try again.', trace },
        { status: 504 }
      );
    }

    // Strip potential markdown code fences before parsing, in case the model ignores instructions
    const cleaned = finalContent.replace(/```json\s*|```/g, '').trim();

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: 'AI assistant returned a malformed response and could not be validated.',
          raw: finalContent,
          trace,
        },
        { status: 502 }
      );
    }

    const validation = recommendationSchema.safeParse(parsedJson);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'AI assistant response failed validation.',
          details: validation.error.flatten(),
          trace,
        },
        { status: 502 }
      );
    }

    const recommendation = validation.data;

    // Guard against a hallucinated option id that doesn't exist in this decision 
    if (recommendation.recommendedOptionId) {
      const optionExists = decision.options.some(o => o.id === recommendation.recommendedOptionId);
      if (!optionExists) {
        return NextResponse.json(
          {
            error: 'AI assistant referenced an option that does not exist in this decision.',
            recommendation,
            trace,
          },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ recommendation, trace });
  } catch (unexpectedError) {
    const message = unexpectedError instanceof Error ? unexpectedError.message : 'Unexpected server error';
    return NextResponse.json({ error: message, trace }, { status: 500 });
  }
}