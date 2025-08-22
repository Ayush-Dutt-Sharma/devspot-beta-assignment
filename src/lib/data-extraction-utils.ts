import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';
import { HACKATHON_STEPS, CHALLENGE_CREATION_STEPS } from '@/lib/constants';

const llm = new ChatGoogleGenerativeAI({
  model: 'gemini-2.0-flash-exp',
  temperature: 0,
  apiKey: process.env.GOOGLE_API_KEY,
});

export const HackathonDataSchema = z.object({
  title: z.string().optional().describe('The hackathon name or title'),
  organization: z.string().optional().describe('The organizing company or institution'),
  registration_date: z.string().optional().describe('When registration opens (ISO date format)'),
  hacking_start: z.string().optional().describe('When the hacking period begins (ISO date format)'),
  submission_deadline: z.string().optional().describe('Final submission deadline (ISO date format)'),
  format: z.enum(['virtual', 'in_person', 'hybrid']).optional().describe('Event format'),
  target_audience: z.string().optional().describe('Who the hackathon is for (students, professionals, etc.)'),
  event_size: z.number().optional().describe('Expected number of participants'),
  total_budget: z.number().optional().describe('Total prize budget in USD'),
  budget_currency: z.string().default('USD').describe('Currency for the budget')
});



export class SmartDataExtractor {
  private hackathonParser: StructuredOutputParser<any>;

  constructor() {
    this.hackathonParser = StructuredOutputParser.fromZodSchema(HackathonDataSchema);
  }

  async extractHackathonData(message: string, context?: any, hackathonData?: any, currentStep?:string): Promise<Partial<z.infer<typeof HackathonDataSchema>>> {
    // const formatInstructions = this.hackathonParser.getFormatInstructions();
    
 const prompt = new PromptTemplate({
      template: `You are Spot, DevSpot's AI assistant helping Technology Owners create hackathons. You are enthusiastic, professional, and knowledgeable about hackathon best practices

Always be encouraging and guide users step by step. Ask one question at a time and extract specific information based on the current step.     
      
The First step to understand what to ask next is to understand the current step and what data we already have in hackathonData.
You will always ask questions in the order provided in the STEPS ARRAY.
IF you are working on a Individual Challenge Setup then complete all the fields for that challenge before moving to next challenge or next step.
Extract hackathon information from the user's message. Be conservative - only extract information that is explicitly mentioned or clearly implied.
Today's date: {currentDate}

Validation rules (These validations rules will work on the basis of at which step we are currently in the conversation and what data we already have in hackathonData):
- total_budget must be a number >= 20000
- format must be one of: virtual, in_person, hybrid
- registration_date >= today's date
- hacking_start >= registration_date
- submission_deadline >= hacking_start

One step can be completed only when all the required fields for that step are present in the hackathonData.
Like I provided in the STEPS ARRAY one step can ask multiple fields, so if all the fields are present in the hackathonData then we can say that step is completed.
IT IS VERY IMPORTANT TO FOLLOW THE STEPS ARRAY AND ASK QUESTIONS IN THE ORDER THEY ARE PROVIDED.
IT IS ALSO IMPORTANT TO ASK QUESTIONS ONLY FOR THE CURRENT STEP AND NOT FOR THE NEXT STEPS.
IT IS IMPORTANT THAT ONE STEP CAN ASK MULTIPLE FIELDS, BUT USER MIGHT NOT PROVIDE ALL THE FIELDS IN ONE MESSAGE, SO YOU SHOULD ASK FOR THE NEXT FIELD IN THE 'clarificationQuestion' AND DOESN'T MOVE TO NEXTSTEP TILL CURRENT STEP IS DONE.

ALL HACKTHON STEPS: {HACKATHON_STEPS}
CHALLENGE CREATION STEPS: {CHALLENGE_CREATION_STEPS}
Current context: {context}
User message: "{message}"
Hackathon current step: {currentStep}
Hackathon existing data: {hackathonData}

Your answers should be crisp, polite, and to the point.

You will always respond in JSON format as per the instructions below (the values should be extracted from the user message and existing hackathon data): 
{{
  "hackathon_data": {{
    "title": "Hackathon Title",
    "organization": "Organizing Company",
    "registration_date": "2023-10-01T00:00:00Z",
    "hacking_start": "2023-11-01T00:00:00Z",
    "submission_deadline": "2023-11-15T00:00:00Z",
    "format": "virtual",
    "target_audience": "students and professionals",
    "event_size": 100,
    "total_budget": 50000,
    "challenges_count": 0
  }},
  "shouldGoToNextStep": true,
  "newInformationOrUpdate": "new",
  "clarificationQuestion": "What organization will be hosting this hackathon?",
  "nextInformationQuestion": "When would you like registration to open?",
  "reasonForNextStepDecision": "All required fields for current step are present",
  "isComplete": true,
  "nextPlannedStep": string | null (if shouldGoToNextStep is true, provide the next step from STEPS ARRAY else null),
  "isHackathonDataComplete": true or false (if all required fields are present in hackathon_data)
  "isAllChallengesDataComplete": true or false (if all required fields are present in challenges_data)
  "numOfChallenges": number (if challenges_data is present, provide the number of challenges)
  "currentChallengeData":{{
    "title": "Challenge Title",
    "prize_amount": 1000,
    "sponsors: ["Sponsor 1", "Sponsor 2"](Not required field),
    "judging_criteria": ["Criteria 1", "Criteria 2"](At least 4 judging criteria is required),
    "resources": ["Resource 1", "Resource 2"](Not required field),}}
}}`,
 inputVariables: ['message', 'context', 'hackathonData', 'currentStep', 'currentDate', 'HACKATHON_STEPS', 'CHALLENGE_CREATION_STEPS'],
    //   partialVariables: { format_instructions: formatInstructions }
    });

    const input = await prompt.format({
      message,
      context: context ? JSON.stringify(context) : 'No previous context',
        hackathonData: hackathonData ? JSON.stringify(hackathonData) : 'No existing data',
        currentStep,
        currentDate: new Date().toISOString(),
        HACKATHON_STEPS,
        CHALLENGE_CREATION_STEPS
    });

    try {
      const response = await llm.invoke(input);
      const responseContent = response.content as string;
      
      // Clean the response content
      const cleanedContent = this.cleanResponseContent(responseContent);
      //@ts-ignore
      return JSON.parse(cleanedContent) || {};
    } catch (error) {
      console.error('Error extracting hackathon data:', error);
      return this.fallbackExtraction(message, 'hackathon');
    }
  }


  private cleanExtractedData(data: any): any {
    const cleaned: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined && value !== '' && value !== 'unknown') {
        if (Array.isArray(value) && value.length > 0) {
          cleaned[key] = value.filter(item => item && item !== 'unknown');
        } else if (typeof value === 'string' && value.length > 0) {
          cleaned[key] = value.trim();
        } else if (typeof value === 'number' && !isNaN(value)) {
          cleaned[key] = value;
        } else if (typeof value === 'boolean') {
          cleaned[key] = value;
        }
      }
    }
    
    return cleaned;
  }

  private cleanResponseContent(content: string): string {
    // Remove markdown code blocks if present
    let cleaned = content.trim();
    
    // Remove ```json and ``` markers
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '');
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '');
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.replace(/\s*```$/, '');
    }
    
    // Remove any leading/trailing whitespace
    cleaned = cleaned.trim();
    
    return cleaned;
  }
  private fallbackExtraction(message: string, type: 'hackathon' | 'profile'): any {
    const extracted: any = {};
    const lowerMessage = message.toLowerCase();

    if (type === 'hackathon') {
      if (lowerMessage.includes('virtual')) extracted.format = 'virtual';
      else if (lowerMessage.includes('in-person') || lowerMessage.includes('in person')) extracted.format = 'in_person';
      else if (lowerMessage.includes('hybrid')) extracted.format = 'hybrid';

      const budgetMatch = message.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (budgetMatch) {
        extracted.total_budget = parseFloat(budgetMatch[1].replace(/,/g, ''));
      }

      const numberMatch = message.match(/(\d+)\s*(?:people|participants|attendees)/i);
      if (numberMatch) {
        extracted.event_size = parseInt(numberMatch[1]);
      }

      const dateMatches = message.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\w+\s+\d{1,2},?\s+\d{4})/g);
      if (dateMatches && dateMatches.length > 0) {
        if (dateMatches.length >= 3) {
          extracted.registration_date = this.parseDate(dateMatches[0]);
          extracted.hacking_start = this.parseDate(dateMatches[1]);
          extracted.submission_deadline = this.parseDate(dateMatches[2]);
        } else if (dateMatches.length === 2) {
          extracted.hacking_start = this.parseDate(dateMatches[0]);
          extracted.submission_deadline = this.parseDate(dateMatches[1]);
        }
      }
    }

    return extracted;
  }

  private extractTechnologies(message: string, technologies: string[]): string[] {
    const found: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    for (const tech of technologies) {
      if (lowerMessage.includes(tech.toLowerCase())) {
        found.push(tech);
      }
    }
    
    return found;
  }

  private parseDate(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return date.toISOString();
    } catch {
      return null;
    }
  }
}

export function validateExtractedData(data: any, schema: z.ZodSchema): { isValid: boolean; errors: string[] } {
  try {
    schema.parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

export function getNextQuestions(currentData: any, schema: z.ZodSchema, mode: string): string[] {
  const questions: string[] = [];
  
  if (mode === 'hackathon') {
    if (!currentData.title) questions.push("What would you like to call your hackathon?");
    if (!currentData.organization) questions.push("Which organization is hosting this event?");
    if (!currentData.hacking_start) questions.push("When would you like the hacking period to begin?");
    if (!currentData.submission_deadline) questions.push("When should the final submissions be due?");
    if (!currentData.format) questions.push("Will this be virtual, in-person, or hybrid?");
    if (!currentData.total_budget) questions.push("What's your total budget for prizes and bounties?");
    if (!currentData.target_audience) questions.push("Who is your target audience for this hackathon?");
  } else if (mode === 'profile') {
    if (!currentData.name) questions.push("What's your full name?");
    if (!currentData.role) questions.push("What's your current role or job title?");
    if (!currentData.programming_languages || currentData.programming_languages.length === 0) {
      questions.push("What programming languages do you work with?");
    }
    if (!currentData.experience_level) questions.push("How would you describe your experience level?");
    if (!currentData.github_url) questions.push("Do you have a GitHub profile you'd like to share?");
  }
  
  return questions.slice(0, 2);
}