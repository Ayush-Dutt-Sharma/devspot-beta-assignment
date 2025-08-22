import { BufferMemory } from 'langchain/memory';
import { ChatMessageHistory } from 'langchain/memory';
import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ConversationMessage {
  sender: 'user' | 'ai';
  content: string;
  metadata?: any;
  timestamp: string;
}

export interface ConversationData {
  messages?: ConversationMessage[];
  [key: string]: any;
}

export class SupabaseConversationMemory extends BufferMemory {
  private conversationId: string;
  private supabase: any;

  constructor(conversationId: string) {
    super({
      returnMessages: true,
      memoryKey: 'history'
    });
    this.conversationId = conversationId;
    this.supabase = createAdminClient();
  }

  async loadMemoryFromDatabase(): Promise<void> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', this.conversationId)
        .single();

      if (conversation?.conversation_data?.messages) {
        const messages: ConversationMessage[] = conversation.conversation_data.messages;
        
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
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', this.conversationId)
        .single();

      const currentData: ConversationData = conversation?.conversation_data || {};
      const messages: ConversationMessage[] = currentData.messages || [];

      const newMessage: ConversationMessage = {
        sender,
        content,
        metadata: metadata || {},
        timestamp: new Date().toISOString()
      };

      messages.push(newMessage);

      const updatedData: ConversationData = {
        ...currentData,
        messages
      };

      await this.supabase
        .from('conversations')
        .update({
          conversation_data: updatedData,
          last_updated: new Date().toISOString()
        })
        .eq('id', this.conversationId);

    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  async saveConversationData(data: Record<string, any>): Promise<void> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', this.conversationId)
        .single();

      const currentData: ConversationData = conversation?.conversation_data || {};

      const updatedData: ConversationData = {
        ...currentData,
        ...data,
        messages: currentData.messages || []
      };

      await this.supabase
        .from('conversations')
        .update({
          conversation_data: updatedData,
          last_updated: new Date().toISOString()
        })
        .eq('id', this.conversationId);

    } catch (error) {
      console.error('Error saving conversation data:', error);
    }
  }

  async getConversationData(): Promise<ConversationData> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', this.conversationId)
        .single();

      return conversation?.conversation_data || {};
    } catch (error) {
      console.error('Error getting conversation data:', error);
      return {};
    }
  }

  async updateCurrentStep(step: string): Promise<void> {
    try {
      await this.supabase
        .from('conversations')
        .update({
          current_step: step,
          last_updated: new Date().toISOString()
        })
        .eq('id', this.conversationId);
    } catch (error) {
      console.error('Error updating current step:', error);
    }
  }

  async clearMemory(): Promise<void> {
    try {
      const { data: conversation } = await this.supabase
        .from('conversations')
        .select('conversation_data')
        .eq('id', this.conversationId)
        .single();

      const currentData: ConversationData = conversation?.conversation_data || {};
      const updatedData: ConversationData = {
        ...currentData,
        messages: []
      };

      await this.supabase
        .from('conversations')
        .update({
          conversation_data: updatedData,
          last_updated: new Date().toISOString()
        })
        .eq('id', this.conversationId);
      
      this.clear();
    } catch (error) {
      console.error('Error clearing memory:', error);
    }
  }

  async deleteConversation(): Promise<void> {
    try {
      await this.supabase
        .from('conversations')
        .delete()
        .eq('id', this.conversationId);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
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