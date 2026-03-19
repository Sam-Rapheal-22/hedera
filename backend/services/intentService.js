import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { JsonOutputParser } from '@langchain/core/output_parsers';

// Initialize the model (requires OPENAI_API_KEY in .env)
const model = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // using mini for speed/cost efficiency on simple extraction
  temperature: 0,
});

const outputParser = new JsonOutputParser();

const prompt = PromptTemplate.fromTemplate(`
You are an Intent Extraction Agent for a DeFi application on Hedera powered by Bonzo Finance.
Extract the user's financial intent from their message.

Rules for extraction:
1. "risk_level": Classify as "low", "medium", or "high". 
   - Safe, low risk, stable, protect my money, no risk = low
   - Some risk, medium, balanced, decent yield = medium
   - High yield, maximize returns, aggressive, I can handle risk = high
2. "action_type": Classify as "deposit" (supply/lend), "withdraw", or "query" (check balance). Default to "deposit" if implying they want to earn yield or do something with their assets.
3. "amount": Extract numeric amount if mentioned. Otherwise null.
4. "asset": Extract asset token if mentioned (e.g., "HBAR", "USDC", "SAUCE", "KARATE"). Otherwise null.
5. "intent_summary": A one sentence summary of what the user wants.

User Message: {message}

Respond ONLY in valid JSON format matching this schema exactly:
{{
  "intent_summary": "string",
  "risk_level": "low" | "medium" | "high",
  "action_type": "deposit" | "withdraw" | "query",
  "amount": number | null,
  "asset": "string" | null
}}
`);

const chain = prompt.pipe(model).pipe(outputParser);

/**
 * Extracts structured intent from a natural language user message.
 * @param {string} userMessage - The raw message string from the user.
 * @returns {Promise<Object>} The structured intent data
 */
export async function extractIntent(userMessage) {
  try {
    const result = await chain.invoke({ message: userMessage });
    return result;
  } catch (error) {
    console.error("Error extracting intent:", error.message);
    throw error;
  }
}
