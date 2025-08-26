import { getReplicate } from "./Replicate";
import { PromptTemplate } from "@langchain/core/prompts";

export async function resolveDateWithAI(message: string) {
  const prompt = new PromptTemplate({
    template: `
    THINK SLOWLY AND DEEPLY ABOUT THE USER'S MESSAGE AND THE CURRENT CONTEXT.

CURRENT DATE: {currentDate} (format: YYYY-MM-DD HH:mm:ssZ, e.g., 2025-08-25 17:36:00+05:30)
USER MESSAGE: {message}

RESPONSE FORMAT:
Return only the ISO 8601 date string (e.g., "2025-08-25T00:00:00Z") or "INVALID".

INSTRUCTIONS:
1. Parse the user's message to identify the intended date for a hackathon event (e.g., registration date, start date, or deadline).
2. Return the date in ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ, e.g., 2025-08-25T00:00:00Z) to be compatible with JavaScript's Date constructor and PostgreSQL's TIMESTAMP WITH TIME ZONE.
3. Use the CURRENT DATE as the reference for relative dates (e.g., "next Friday", "next month 1st Friday").
4. Assume times are at 00:00:00Z unless specified.
5. If the message is ambiguous, unparseable, or in an unsupported format (e.g., MM-DD-YYYY), return "INVALID".

EXAMPLES:
- "20, 20th" -> "Than the Month and year is same as current"
- "20th AUG" -> "Than the year is same as current"
- "20th Aug 2025" -> "2025-08-20T00:00:00Z"
- "20/11/2025" (DD/MM/YYYY) -> "2025-11-20T00:00:00Z"
- "11/12/2025" (MM/DD/YYYY) -> "INVALID"
- "next Friday" (from 2025-08-25) -> "2025-08-29T00:00:00Z"
- "next month 1st Friday" (from 2025-08-25) -> "2025-09-05T00:00:00Z"
- "tomorrow" -> "2025-08-26T00:00:00Z"
- "invalid date" -> "INVALID"

RESPONSE FORMAT:
Return only the ISO 8601 date string (e.g., "2025-08-25T00:00:00Z") or "INVALID".
NO EXPLANATION NO OTHER COMMENT JUST AN DATE STRING OR "INVALID"
`,
    inputVariables: ["currentDate", "message"],
  });

  const input = await prompt.format({ currentDate: new Date(), message });
  try {
    let fullResponse = "";
    for await (const event of getReplicate().stream(
    //   "anthropic/claude-4-sonnet",
    "openai/gpt-oss-120b",
      {
        input: {
          prompt: input,
        },
      }
    )) {
      fullResponse += event.toString();
    }

    console.log("LLM raw response:", fullResponse);
    return fullResponse;
  } catch (error) {
    console.error("Error extracting hackathon data:", error);
    return "INVALID";
  }
}


export async function getSponsorsArrayFromResponseWithAI(message: string) {
  const prompt = new PromptTemplate({
    template: `
   THINK SLOWLY AND DEEPLY ABOUT THE USER'S MESSAGE AND THE CURRENT CONTEXT.

USER MESSAGE: {message}

INSTRUCTIONS:
1. Parse the user's message to identify names of sponsors or organizations (e.g., companies, institutions, or groups) mentioned for a hackathon.
2. Return an array of sponsor or organization names as strings, separated by commas (e.g., ["Company A", "Company B"]).
3. If the message contains "none", an empty string, or no identifiable sponsors/organizations, return an empty array ([""]).
4. Do not include explanations, comments, or any text outside the array.

EXAMPLES:
- "Sponsored by Google and Microsoft" -> ["Google", "Microsoft"]
- "Hosted by ACME Corp" -> ["ACME Corp"]
- "No sponsors" -> [""]
- "none" -> [""]
- "" -> [""]
- "Hackathon by TechUni" -> ["TechUni"]
- "Google, Microsoft, and no other sponsors" -> ["Google", "Microsoft"]

RESPONSE FORMAT:
["sponsor1", "sponsor2", ...] or [""]
`,
    inputVariables: ["message"],
  });

  const input = await prompt.format({ message });
  try {
    let fullResponse = "";
    for await (const event of getReplicate().stream(
    //   "anthropic/claude-4-sonnet",
    "openai/gpt-oss-120b",
      {
        input: {
          prompt: input,
        },
      }
    )) {
      fullResponse += event.toString();
    }

    console.log("LLM raw response:", fullResponse);
    return fullResponse;
  } catch (error) {
    console.error("Error extracting hackathon data:", error);
    return "INVALID";
  }
}

export async function getResourcesArrayFromResponseWithAI(message: string) {
  const prompt = new PromptTemplate({
    template: `
   THINK SLOWLY AND DEEPLY ABOUT THE USER'S MESSAGE AND THE CURRENT CONTEXT.

USER MESSAGE: {message}

INSTRUCTIONS:
1. Parse the user's message to identify resources, APIs, or links relevant to a hackathon challenge (e.g., datasets, tools, API names, or URLs).
2. Return an array of strings containing resource names, API names, or URLs. Each item should be a distinct resource, API, or link.
3. If no resources, APIs, or links are identified, return an empty array ([]).
4. If the message is ambiguous or unparseable, return [].
5. Do not include explanations, comments, or any text outside the array.

EXAMPLES:
- "Use the Google Maps API and OpenWeather API" -> ["Google Maps API", "OpenWeather API"]
- "Dataset at https://data.gov and GitHub" -> ["https://data.gov", "GitHub"]
- "No resources" -> []
- "none" -> []
- "" -> []
- "Use Twilio API and https://api.twilio.com/docs" -> ["Twilio API", "https://api.twilio.com/docs"]
- "invalid resource" -> ["INVALID"]

RESPONSE FORMAT:
["resource1", "resource2", ...] or []
`,
    inputVariables: ["message"],
  });

  const input = await prompt.format({ message });
  try {
    let fullResponse = "";
    for await (const event of getReplicate().stream(
    //   "anthropic/claude-4-sonnet",
    "openai/gpt-oss-120b",
      {
        input: {
          prompt: input,
        },
      }
    )) {
      fullResponse += event.toString();
    }

    console.log("LLM raw response:", fullResponse);
    return fullResponse;
  } catch (error) {
    console.error("Error extracting hackathon data:", error);
    return "INVALID";
  }
}