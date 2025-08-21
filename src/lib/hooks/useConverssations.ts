import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface ConversationData {
  hackathon_title?: string
  organization?: string
  format?: string
  challenges?: any[]
  current_challenge_index?: number
  [key: string]: any
}

interface Conversation {
  id: string
  user_id: string
  hackathon_id: string | null
  current_step: string
  conversation_data: ConversationData
  method: 'ai' | 'manual'
  last_updated: string
}

export function useConversation() {
  const { user } = useUser()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchConversation = async () => {
      try {
        const response = await fetch('/api/conversations')
        
        if (response.ok) {
          const data = await response.json()
          setConversation(data.conversation)
        }
      } catch (err) {
        console.error('Error fetching conversation:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchConversation()
  }, [user])

  const updateConversation = async (updates: Partial<Conversation>) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update conversation')
      }

      const data = await response.json()
      setConversation(data.conversation)
      return data.conversation
    } catch (err) {
      throw err
    }
  }

  const clearConversation = () => {
    setConversation(null)
  }

  return {
    conversation,
    loading,
    updateConversation,
    clearConversation
  }
}
