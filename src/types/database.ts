export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          role: 'platform_owner' | 'technology_owner' | 'participant'
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          role?: 'platform_owner' | 'technology_owner' | 'participant'
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          role?: 'platform_owner' | 'technology_owner' | 'participant'
          onboarding_completed?: boolean
        }
      }
      hackathons: {
        Row: {
          id: string
          title: string
          organization: string | null
          registration_date: string | null
          hacking_start: string | null
          submission_deadline: string | null
          format: 'virtual' | 'in_person' | 'hybrid'
          target_audience: string | null
          event_size: number | null
          total_budget: number | null
          budget_currency: string
          minimum_bounty_paid: boolean
          status: 'draft' | 'published' | 'active' | 'completed'
          creator_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          organization?: string | null
          registration_date?: string | null
          hacking_start?: string | null
          submission_deadline?: string | null
          format?: 'virtual' | 'in_person' | 'hybrid'
          target_audience?: string | null
          event_size?: number | null
          total_budget?: number | null
          budget_currency?: string
          minimum_bounty_paid?: boolean
          status?: 'draft' | 'published' | 'active' | 'completed'
          creator_id: string
        }
        Update: {
          title?: string
          organization?: string | null
          registration_date?: string | null
          hacking_start?: string | null
          submission_deadline?: string | null
          format?: 'virtual' | 'in_person' | 'hybrid'
          target_audience?: string | null
          event_size?: number | null
          total_budget?: number | null
          budget_currency?: string
          minimum_bounty_paid?: boolean
          status?: 'draft' | 'published' | 'active' | 'completed'
        }
      }
      challenges: {
        Row: {
          id: string
          hackathon_id: string
          title: string
          description: string
          judging_criteria: string[]
          resources: string[] | null
          prize_amount: number
          prize_currency: string
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          hackathon_id: string
          title: string
          description: string
          judging_criteria: string[]
          resources?: string[] | null
          prize_amount?: number
          prize_currency?: string
          order_index?: number
        }
        Update: {
          title?: string
          description?: string
          judging_criteria?: string[]
          resources?: string[] | null
          prize_amount?: number
          prize_currency?: string
          order_index?: number
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          hackathon_id: string | null
          current_step: string
          conversation_data: Record<string, any>
          method: 'ai' | 'manual'
          last_updated: string
        }
        Insert: {
          id?: string
          user_id: string
          hackathon_id?: string | null
          current_step: string
          conversation_data?: Record<string, any>
          method?: 'ai' | 'manual'
        }
        Update: {
          hackathon_id?: string | null
          current_step?: string
          conversation_data?: Record<string, any>
          method?: 'ai' | 'manual'
        }
      }
    }
  }
}