import { NextRequest, NextResponse } from 'next/server';
import { ChatOpenAI } from '@langchain/openai';
import { ConversationChain } from 'langchain/chains';
import { PromptTemplate } from '@langchain/core/prompts';
import { createAdminClient } from '@/lib/supabase/admin';
import { auth } from '@clerk/nextjs/server';
import { 
  SupabaseConversationMemory, 
  CONVERSATION_CONTEXTS, 
  getConversationProgress,
  validateConversationData 
} from '@/lib/conversation-memory';
import { 
  SmartDataExtractor, 
  getNextQuestions,
  HackathonDataSchema,
  ProfileDataSchema 
} from '@/lib/data-extraction-utils';

const llm = new ChatOpenAI({
  modelName: 'gpt-4',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});



const SYSTEM_PROMPTS = {
  hackathon: `You are Spot, DevSpot's AI assistant helping Technology Owners create hackathons. You are enthusiastic, professional, and knowledgeable about hackathon best practices.

Key requirements for hackathons:
- Minimum $20,000 USDC total bounty required
- Must have clear challenges and judging criteria
- Proper timeline with registration, hacking, and submission phases

Always be encouraging and guide users step by step. Ask one question at a time and extract specific information based on the current step.`,

  profile: `You are Spot, DevSpot's AI assistant helping developers build their technology profiles. You are supportive and help showcase their skills and experience effectively.

Focus on gathering:
- Programming languages and frameworks
- Project experience and achievements  
- Areas of expertise and interests
- GitHub/portfolio links`,

  explore: `You are Spot, DevSpot's AI assistant. You help users understand the platform, discover hackathons, and learn about opportunities.

You can provide information about:
- How DevSpot works
- Current and upcoming hackathons
- Platform features and benefits
- How to get started as a participant or organizer`
};





async function generatePrompt(mode: string, conversationData: any, message: string): Promise<string> {
  const context = CONVERSATION_CONTEXTS[mode as keyof typeof CONVERSATION_CONTEXTS];
  const systemPrompt = SYSTEM_PROMPTS[mode as keyof typeof SYSTEM_PROMPTS];
  
  const progress = getConversationProgress(conversationData, mode);
  const validation = validateConversationData(conversationData, mode);
  
  let contextInfo = "";
  if (Object.keys(conversationData).length > 0) {
    contextInfo = `\n\nProgress: ${progress.completionPercentage}% complete
Current data collected: ${JSON.stringify(conversationData, null, 2)}
Next to collect: ${progress.currentStep}`;
  }
  
  let validationInfo = "";
  if (validation.errors.length > 0) {
    validationInfo = `\n\nValidation errors to address: ${validation.errors.join(', ')}`;
  }
  if (validation.warnings.length > 0) {
    validationInfo += `\nWarnings: ${validation.warnings.join(', ')}`;
  }
  
  return `${systemPrompt}

${context?.systemContext || ''}

Current focus: ${progress.currentStep}
${contextInfo}
${validationInfo}

User message: "${message}"

Respond naturally and guide the user toward completing the missing information. Be encouraging and specific about what you need next.`;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId, mode } = await request.json();
    
    if (!message || !mode) {
      return NextResponse.json({ error: 'Message and mode are required' }, { status: 400 });
    }

    const supabase = await createAdminClient();
    let conversation;
    let hackathonData;

    if (conversationId) {
      const { data } = await supabase
        .from('conversations')
        .select('*, hackathons(*)')
        .eq('id', conversationId)
        .single();
      conversation = data;
      hackathonData = data?.hackathons;
    } else if (mode === 'hackathon') {
      const { data: newHackathon } = await supabase
        .from('hackathons')
        .insert({
          title: 'Untitled Hackathon',
          status: 'draft',
          creator_id: userId
        })
        .select()
        .single();

      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          hackathon_id: newHackathon?.id,
          current_step: 'hackathon_start',
          conversation_data: {},
          method: 'ai'
        })
        .select()
        .single();

      conversation = newConversation;
      hackathonData = newHackathon;
    } else {
      const { data: newConversation } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          current_step: `${mode}_start`,
          conversation_data: {},
          method: 'ai'
        })
        .select()
        .single();

      conversation = newConversation;
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Failed to create/find conversation' }, { status: 500 });
    }

    const conversationData = conversation.conversation_data || {};
    
    const memory = new SupabaseConversationMemory(conversation.id);
    await memory.loadMemoryFromDatabase();
    await memory.saveMessage('user', message);
    
    const extractor = new SmartDataExtractor();
    let extractedData: any = {};
    
    if (mode === 'hackathon') {
      extractedData = await extractor.extractHackathonData(message, conversationData);
    } else if (mode === 'profile') {
      extractedData = await extractor.extractProfileData(message, conversationData);
    }
    
    const updatedData = { ...conversationData, ...extractedData };

    const promptText = await generatePrompt(mode, updatedData, message);
    
    const prompt = PromptTemplate.fromTemplate(promptText);
    const chain = new ConversationChain({
      llm,
      memory,
      prompt
    });

    const response = await chain.call({ input: message });
    
    await memory.saveMessage('ai', response.response);
    
    const progress = getConversationProgress(updatedData, mode);
    const validation = validateConversationData(updatedData, mode);
    const nextQuestions = getNextQuestions(
      updatedData, 
      mode === 'hackathon' ? HackathonDataSchema : ProfileDataSchema, 
      mode
    );
    
    await supabase
      .from('conversations')
      .update({
        current_step: progress.currentStep,
        conversation_data: updatedData,
        last_updated: new Date().toISOString()
      })
      .eq('id', conversation.id);

    if (hackathonData && Object.keys(extractedData).length > 0) {
      const hackathonUpdates: any = {};
      
      if (extractedData.title) hackathonUpdates.title = extractedData.title;
      if (extractedData.organization) hackathonUpdates.organization = extractedData.organization;
      if (extractedData.format) hackathonUpdates.format = extractedData.format;
      if (extractedData.event_size) hackathonUpdates.event_size = extractedData.event_size;
      if (extractedData.total_budget) {
        hackathonUpdates.total_budget = extractedData.total_budget;
        hackathonUpdates.budget_currency = 'USD';
      }

      if (Object.keys(hackathonUpdates).length > 0) {
        await supabase
          .from('hackathons')
          .update(hackathonUpdates)
          .eq('id', hackathonData.id);
      }
    }

    return NextResponse.json({
      response: response.response,
      conversationId: conversation.id,
      progress: progress.completionPercentage,
      currentStep: progress.currentStep,
      extractedData,
      nextQuestions,
      validation: {
        isValid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}