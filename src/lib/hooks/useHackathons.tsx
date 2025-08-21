import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

interface Hackathon {
  id: string
  title: string
  organization: string | null
  status: 'draft' | 'published' | 'active' | 'completed'
  created_at: string
  challenges: Challenge[]
}

interface Challenge {
  id: string
  title: string
  description: string
  prize_amount: number
}

export function useHackathons() {
  const { user } = useUser()
  const [hackathons, setHackathons] = useState<Hackathon[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchHackathons = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/hackathons')
        
        if (!response.ok) {
          throw new Error('Failed to fetch hackathons')
        }

        const data = await response.json()
        setHackathons(data.hackathons || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchHackathons()
  }, [user])

  const createHackathon = async (hackathonData: any, challenges: any[]) => {
    try {
      const response = await fetch('/api/hackathons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hackathon: hackathonData,
          challenges
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create hackathon')
      }

      const data = await response.json()
      setHackathons(prev => [data.hackathon, ...prev])
      return data.hackathon
    } catch (err) {
      throw err
    }
  }

  const updateHackathon = async (id: string, updates: any) => {
    try {
      const response = await fetch(`/api/hackathons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update hackathon')
      }

      const data = await response.json()
      setHackathons(prev => prev.map(h => h.id === id ? { ...h, ...data.hackathon } : h))
      return data.hackathon
    } catch (err) {
      throw err
    }
  }

  return {
    hackathons,
    loading,
    error,
    createHackathon,
    updateHackathon
  }
}