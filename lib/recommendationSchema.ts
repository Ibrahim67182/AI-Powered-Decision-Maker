
// AI model response structure 

import { z } from 'zod';

export const recommendationSchema = z.object({
  recommendedOptionId: z.string(),
  explanation: z.string(),
  tradeoffs: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  supportingFacts: z.array(z.string()),
});

export type Recommendation = z.infer<typeof recommendationSchema>;