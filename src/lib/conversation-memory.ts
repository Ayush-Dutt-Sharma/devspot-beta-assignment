import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/memory';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender: 'user' | 'ai';
  content: string;
  metadata?: any;
  created_at: string;
}

export class SupabaseConversationMemory extends BufferMemory {
  private conversationId: string;
  private supabase: any;

  constructor(conversationId: string){
    super({
      returnMessages: true,
      memoryKey: 'history'
    });
    this.conversationId = conversationId;
    this.supabase = createAdminClient();
  }

  async loadMemoryFromDatabase(): Promise<void> {
    try {
      const { data: messages } = await this.supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', this.conversationId)
        .order('created_at', { ascending: true });

      if (messages && messages.length > 0) {
        const langchainMessages: BaseMessage[] = messages.map((msg: ConversationMessage) => {
          return msg.sender === 'user' 
            ? new HumanMessage(msg.content)
            : new AIMessage(msg.content);
        });

        const chatHistory = new ChatMessageHistory(langchainMessages);
        this.chatHistory = chatHistory;
      }
    } catch (error) {
      console.error('Error loading conversation memory:', error);
    }
  }

  async saveMessage(sender: 'user' | 'ai', content: string, metadata?: any): Promise<void> {
    try {
      await this.supabase
        .from('conversation_messages')
        .insert({
          conversation_id: this.conversationId,
          sender,
          content,
          metadata: metadata || {}
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async clearMemory(): Promise<void> {
    try {
      await this.supabase
        .from('conversation_messages')
        .delete()
        .eq('conversation_id', this.conversationId);
      
      this.clear();
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  }
}

export async function createConversationTable() {
  const supabase = await createAdminClient();
  
  const { error } = await supabase.rpc('create_conversation_messages_table');
  
  if (error) {
    console.error('Error creating conversation_messages table:', error);
  }
}

type ValidationRules = Record<string, (value: any) => boolean>;

interface BaseContext {
  systemContext: string;
}

interface FieldContext extends BaseContext {
  requiredFields: string[];
  validationRules?: ValidationRules;
}

interface KnowledgeContext extends BaseContext {
  knowledgeBase: Record<string, string>;
}

type ConversationContext = FieldContext | KnowledgeContext;

export const CONVERSATION_CONTEXTS: Record<string, ConversationContext> = {
  hackathon: {
    systemContext: `You are helping create a hackathon. Keep track of:
    - Event details (title, organization, dates)
    - Format and logistics (virtual/in-person, audience, size)
    - Budget and prizes (minimum $20,000 USDC required)
    - Challenges and judging criteria
    - Timeline and milestones`,
    
    requiredFields: [
      'title',
      'organization', 
      'registration_date',
      'hacking_start',
      'submission_deadline',
      'format',
      'target_audience',
      'total_budget'
    ],
    
    validationRules: {
      total_budget: (value: number) => value >= 20000,
      format: (value: string) => ['virtual', 'in_person', 'hybrid'].includes(value)
    }
  },
  
  profile: {
    systemContext: `You are helping build a developer profile. Collect:
    - Personal information (name, role, experience level)
    - Technical skills (languages, frameworks, tools)
    - Project experience and achievements
    - Portfolio links and social profiles
    - Areas of interest and expertise`,
    
    requiredFields: [
      'name',
      'role',
      'experience_level',
      'programming_languages',
      'frameworks',
      'github_url'
    ]
  },
  
  explore: {
    systemContext: `You are providing information about DevSpot platform:
    - Platform features and capabilities
    - How to participate in hackathons
    - How to organize events
    - Community guidelines and best practices
    - Success stories and case studies`,
    
    knowledgeBase: {
      'platform_features': 'DevSpot enables Technology Owners to host hackathons and developers to participate in innovation challenges.',
      'participation': 'Developers can browse hackathons, join teams, submit projects, and compete for prizes.',
      'organizing': 'Technology Owners can create hackathons with custom challenges, set bounties, and manage participants.',
      'minimum_bounty': 'All hackathons must have a minimum total bounty of $20,000 USDC to ensure quality and participation.'
    }
  }
};

export function getConversationProgress(conversationData: any, mode: string): {
  completedSteps: string[];
  currentStep: string;
  nextSteps: string[];
  completionPercentage: number;
} {
  const context = CONVERSATION_CONTEXTS[mode];
  if (!context || !('requiredFields' in context)) {
    return {
      completedSteps: [],
      currentStep: 'start',
      nextSteps: [],
      completionPercentage: 0
    };
  }

  const requiredFields = context.requiredFields;
  const completedFields = requiredFields.filter(field => 
    conversationData[field] !== undefined && conversationData[field] !== null && conversationData[field] !== ''
  );
  
  const completionPercentage = Math.round((completedFields.length / requiredFields.length) * 100);
  const remainingFields = requiredFields.filter(field => !completedFields.includes(field));
  
  return {
    completedSteps: completedFields,
    currentStep: remainingFields[0] || 'review',
    nextSteps: remainingFields.slice(1),
    completionPercentage
  };
}

export function validateConversationData(conversationData: any, mode: string): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const context = CONVERSATION_CONTEXTS[mode];
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!context) {
    return { isValid: false, errors: ['Invalid conversation mode'], warnings: [] };
  }

  if ('requiredFields' in context) {
    for (const field of context.requiredFields) {
      if (!conversationData[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  if ('validationRules' in context && context.validationRules) {
    for (const [field, validator] of Object.entries(context.validationRules)) {
      const value = conversationData[field];
      if (value !== undefined && !validator(value)) {
        if (field === 'total_budget') {
          errors.push(`Budget must be at least $20,000 USDC (current: $${value})`);
        } else {
          errors.push(`Invalid value for ${field}: ${value}`);
        }
      }
    }
  }

  if (mode === 'hackathon' && conversationData.total_budget && conversationData.total_budget < 25000) {
    warnings.push('Consider increasing the budget above $25,000 for better participation');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
