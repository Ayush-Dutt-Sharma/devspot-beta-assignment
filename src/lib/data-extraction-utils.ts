import { ChatOpenAI } from '@langchain/openai';
import { StructuredOutputParser, OutputFixingParser } from 'langchain/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { z } from 'zod';

const llm = new ChatOpenAI({
  modelName: 'gpt-3.5-turbo',
  temperature: 0,
  openAIApiKey: process.env.OPENAI_API_KEY,
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
  budget_currency: z.string().default('USD').describe('Currency for the budget'),
  themes: z.array(z.string()).optional().describe('Main themes or focus areas'),
  location: z.string().optional().describe('Physical location if applicable'),
  description: z.string().optional().describe('Event description or summary')
});

export const ProfileDataSchema = z.object({
  name: z.string().optional().describe('Full name'),
  role: z.string().optional().describe('Current job title or role'),
  experience_level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).optional(),
  programming_languages: z.array(z.string()).optional().describe('Programming languages known'),
  frameworks: z.array(z.string()).optional().describe('Frameworks and libraries used'),
  tools: z.array(z.string()).optional().describe('Development tools and platforms'),
  github_url: z.string().optional().describe('GitHub profile URL'),
  portfolio_url: z.string().optional().describe('Portfolio or personal website'),
  linkedin_url: z.string().optional().describe('LinkedIn profile URL'),
  specializations: z.array(z.string()).optional().describe('Areas of expertise'),
  interests: z.array(z.string()).optional().describe('Technical interests or focus areas'),
  years_experience: z.number().optional().describe('Years of programming experience'),
  education: z.string().optional().describe('Educational background'),
  location: z.string().optional().describe('Current location')
});

export class SmartDataExtractor {
  private hackathonParser: StructuredOutputParser<any>;
  private profileParser: StructuredOutputParser<any>;

  constructor() {
    this.hackathonParser = StructuredOutputParser.fromZodSchema(HackathonDataSchema);
    this.profileParser = StructuredOutputParser.fromZodSchema(ProfileDataSchema);
  }

  async extractHackathonData(message: string, context?: any): Promise<Partial<z.infer<typeof HackathonDataSchema>>> {
    const formatInstructions = this.hackathonParser.getFormatInstructions();
    
    const prompt = new PromptTemplate({
      template: `Extract hackathon information from the user's message. Be conservative - only extract information that is explicitly mentioned or clearly implied.

Current context: {context}
User message: "{message}"

{format_instructions}

If no relevant information is found, return an empty object.`,
      inputVariables: ['message', 'context'],
      partialVariables: { format_instructions: formatInstructions }
    });

    const input = await prompt.format({
      message,
      context: context ? JSON.stringify(context) : 'No previous context'
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await this.hackathonParser.parse(response.content as string);
      return this.cleanExtractedData(parsed);
    } catch (error) {
      console.error('Error extracting hackathon data:', error);
      return this.fallbackExtraction(message, 'hackathon');
    }
  }

  async extractProfileData(message: string, context?: any): Promise<Partial<z.infer<typeof ProfileDataSchema>>> {
    const formatInstructions = this.profileParser.getFormatInstructions();
    
    const prompt = new PromptTemplate({
      template: `Extract developer profile information from the user's message. Only extract explicitly mentioned information.

Current context: {context}
User message: "{message}"

{format_instructions}

If no relevant information is found, return an empty object.`,
      inputVariables: ['message', 'context'],
      partialVariables: { format_instructions: formatInstructions }
    });

    const input = await prompt.format({
      message,
      context: context ? JSON.stringify(context) : 'No previous context'
    });

    try {
      const response = await llm.invoke(input);
      const parsed = await this.profileParser.parse(response.content as string);
      return this.cleanExtractedData(parsed);
    } catch (error) {
      console.error('Error extracting profile data:', error);
      return this.fallbackExtraction(message, 'profile');
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
    } else if (type === 'profile') {
      const languages = this.extractTechnologies(message, [
        'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'go', 'rust', 'swift', 'kotlin',
        'php', 'ruby', 'scala', 'dart', 'r', 'matlab', 'sql', 'html', 'css'
      ]);
      if (languages.length > 0) extracted.programming_languages = languages;

      const frameworks = this.extractTechnologies(message, [
        'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt', 'express', 'fastapi', 'django',
        'flask', 'spring', 'laravel', 'rails', 'tensorflow', 'pytorch', 'keras', 'pandas', 'numpy'
      ]);
      if (frameworks.length > 0) extracted.frameworks = frameworks;

      const experienceMatch = message.match(/(\d+)\s*years?\s*(?:of\s*)?experience/i);
      if (experienceMatch) {
        extracted.years_experience = parseInt(experienceMatch[1]);
      }

      const githubMatch = message.match(/github\.com\/[\w-]+/i);
      if (githubMatch) {
        extracted.github_url = `https://${githubMatch[0]}`;
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