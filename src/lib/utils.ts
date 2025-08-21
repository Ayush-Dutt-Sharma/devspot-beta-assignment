// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate unique IDs
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Format currency
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount)
}

// Format date for display
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj)
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Debounce function for search inputs
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Sleep/delay utility
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

// Get initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}

export interface ConversationStep {
  step: string
  data: Record<string, any>
  completed: boolean
  timestamp: string
}

export interface HackathonDraftData {
  title?: string
  organization?: string
  registration_date?: string
  hacking_start?: string
  submission_deadline?: string
  format?: 'virtual' | 'in_person' | 'hybrid'
  target_audience?: string
  event_size?: number
  total_budget?: number
  challenges?: Array<{
    title: string
    description: string
    judging_criteria: string[]
    resources: string[]
    prize_amount: number
  }>
  current_challenge_index?: number
}

export function mergeConversationData(
  existing: HackathonDraftData,
  newData: Partial<HackathonDraftData>
): HackathonDraftData {
  return {
    ...existing,
    ...newData,
    challenges: newData.challenges || existing.challenges || []
  }
}

export function getConversationProgress(data: HackathonDraftData): {
  completed: number
  total: number
  percentage: number
} {
  const requiredFields = [
    'title',
    'registration_date',
    'hacking_start', 
    'submission_deadline'
  ]
  
  const completed = requiredFields.filter(field => data[field as keyof HackathonDraftData]).length
  const hasChallenges = (data.challenges?.length || 0) >= 1
  const challengesComplete = data.challenges?.every(c => c.title && c.description) || false
  
  const totalSteps = requiredFields.length + 1 // +1 for challenges
  const completedSteps = completed + (hasChallenges && challengesComplete ? 1 : 0)
  
  return {
    completed: completedSteps,
    total: totalSteps,
    percentage: Math.round((completedSteps / totalSteps) * 100)
  }
}

interface PrizeRecommendation {
  structure: 'even_split' | 'overall_winners' | 'hybrid'
  breakdown: string
  rationale: string
  distribution: { [key: string]: number }
}

export function recommendPrizeStructure(
  totalAmount: number,
  challengeCount: number,
  additionalAmount: number = 0
): PrizeRecommendation {
  const baseAmount = 20000 // $20k minimum
  const total = baseAmount + additionalAmount

  if (additionalAmount === 0) {
    // Only minimum bounty
    if (challengeCount <= 2) {
      const perChallenge = baseAmount / challengeCount
      return {
        structure: 'even_split',
        breakdown: `${perChallenge.toLocaleString()} per challenge`,
        rationale: 'Even distribution works well with fewer challenges',
        distribution: {
          [`Challenge 1`]: perChallenge,
          [`Challenge 2`]: challengeCount > 1 ? perChallenge : 0
        }
      }
    } else {
      return {
        structure: 'overall_winners',
        breakdown: '1st: $10,000, 2nd: $6,000, 3rd: $4,000',
        rationale: 'Overall competition creates stronger engagement with multiple challenges',
        distribution: {
          '1st Place': 10000,
          '2nd Place': 6000,
          '3rd Place': 4000
        }
      }
    }
  } else {
    // Additional funding provided
    const challengePrize = additionalAmount / challengeCount
    return {
      structure: 'hybrid',
      breakdown: `Overall winners: ${baseAmount.toLocaleString()} + Per-challenge: ${challengePrize.toLocaleString()}`,
      rationale: 'Hybrid structure rewards both overall excellence and challenge-specific innovation',
      distribution: {
        'Overall Pool': baseAmount,
        [`Per Challenge (${challengeCount})`]: challengePrize
      }
    }
  }
}