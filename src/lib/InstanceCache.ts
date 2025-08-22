import { 
  SupabaseConversationMemory
} from '@/lib/conversation-memory';
import { 
  SmartDataExtractor, 
} from '@/lib/data-extraction-utils';
import { ChatOpenAI } from '@langchain/openai';

class InstanceCache {
  private static extractorInstance: SmartDataExtractor | null = null;
  private static llmInstance: ChatOpenAI | null = null;
  private static conversationMemories = new Map<string, SupabaseConversationMemory>();
  private static lastCleanup = Date.now();
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000;
  private static readonly MEMORY_TTL = 60 * 60 * 1000;

  static getExtractor(): SmartDataExtractor {
    if (!this.extractorInstance) {
      this.extractorInstance = new SmartDataExtractor();
    }
    return this.extractorInstance;
  }

  static getLLM(): ChatOpenAI {
    if (!this.llmInstance) {
      this.llmInstance = new ChatOpenAI({
        modelName: 'gpt-4',
        temperature: 0.7,
        openAIApiKey: process.env.OPENAI_API_KEY,
        streaming: true,
      });
    }
    return this.llmInstance;
  }

  static async getConversationMemory(conversationId: string): Promise<SupabaseConversationMemory> {
    // Clean up old memories periodically
    this.cleanupIfNeeded();

    const existing = this.conversationMemories.get(conversationId);
    if (existing) {
      return existing;
    }

    const memory = new SupabaseConversationMemory(conversationId);
    await memory.loadMemoryFromDatabase();
    this.conversationMemories.set(conversationId, memory);
    
    return memory;
  }

  private static cleanupIfNeeded(): void {
    const now = Date.now();
    if (now - this.lastCleanup < this.CLEANUP_INTERVAL) {
      return;
    }

    // Remove old conversation memories
    for (const [id, memory] of this.conversationMemories.entries()) {
      // If memory hasn't been accessed recently, remove it
      // Note: This is a simple cleanup - in production you might want to track last access time
      if (this.conversationMemories.size > 1000) { // Keep max 50 memories
        this.conversationMemories.delete(id);
      }
    }

    this.lastCleanup = now;
  }

  // Method to clear specific conversation memory (useful when conversation ends)
  static clearConversationMemory(conversationId: string): void {
    this.conversationMemories.delete(conversationId);
  }

  // Method to clear all caches (useful for testing or memory management)
  static clearAll(): void {
    this.extractorInstance = null;
    this.llmInstance = null;
    this.conversationMemories.clear();
  }
}

export default InstanceCache;