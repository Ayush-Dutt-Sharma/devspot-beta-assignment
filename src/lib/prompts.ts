import { 
  CONVERSATION_CONTEXTS, 
  getConversationProgress,
  validateConversationData 
} from '@/lib/conversation-memory';

const SYSTEM_PROMPTS = {
  hackathon: `You are Spot, DevSpot's AI assistant helping Technology Owners create hackathons. You are enthusiastic, professional, and knowledgeable about hackathon best practices.

Key requirements for hackathons:
- Minimum $20,000 USDC total bounty required
- Must have clear challenges and judging criteria
- Proper timeline with registration, hacking, and submission phases

Always be encouraging and guide users step by step. Ask one question at a time and extract specific information based on the current step.`,
};

async function generatePrompt(mode: string, conversationData: any, message: string): Promise<string> {
  const context = CONVERSATION_CONTEXTS[mode as keyof typeof CONVERSATION_CONTEXTS];
  const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS];
  
  const progress = getConversationProgress(conversationData, mode);
  const validation = validateConversationData(conversationData, mode);
  
  let contextInfo = "";
  if (Object.keys(conversationData).length > 0) {
    const dataString = JSON.stringify(conversationData, null, 2)
      .replace(/[{}]/g, match => match === '{' ? '{{' : '}}');
    
    contextInfo = `

Progress: ${progress.completionPercentage}% complete
Current data collected: ${dataString}
Next to collect: ${progress.currentStep}`;
  }
  
  let validationInfo = "";
  if (validation.errors.length > 0) {
    validationInfo = `

Validation errors to address: ${validation.errors.join(', ')}`;
  }
  if (validation.warnings.length > 0) {
    validationInfo += `
Warnings: ${validation.warnings.join(', ')}`;
  }
  
  return `${systemPrompt}

${context?.systemContext || ''}

Current focus: ${progress.currentStep}${contextInfo}${validationInfo}

User message: "${message}"

Respond naturally and guide the user toward completing the missing information. Be encouraging and specific about what you need next.`;
}

export { generatePrompt, SYSTEM_PROMPTS };