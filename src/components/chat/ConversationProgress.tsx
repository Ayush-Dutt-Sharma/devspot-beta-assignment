import React from 'react'
import { CheckCircle, Circle, Clock } from 'lucide-react'
import { getConversationProgress, HackathonDraftData } from '@/lib/utils'

interface ConversationProgressProps {
  data: HackathonDraftData
  currentMethod: 'ai' | 'manual'
}

export function ConversationProgress({ data, currentMethod }: ConversationProgressProps) {
  const progress = getConversationProgress(data)
  
  const steps = [
    { key: 'title', label: 'Hackathon Title', completed: !!data.title },
    { key: 'dates', label: 'Event Dates', completed: !!(data.registration_date && data.hacking_start && data.submission_deadline) },
    { key: 'challenges', label: 'Challenges', completed: (data.challenges?.length || 0) >= 1 && data.challenges?.every(c => c.title && c.description) },
    { key: 'budget', label: 'Budget & Prizes', completed: !!data.total_budget }
  ]

  return (
    <div className="card-primary">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Progress</h3>
        <span className="text-sm text-devspot-blue-400">{progress.percentage}% complete</span>
      </div>
      
      <div className="w-full bg-devspot-gray-700 rounded-full h-2 mb-4">
        <div 
          className="bg-devspot-blue-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="flex items-center gap-3">
            {step.completed ? (
              <CheckCircle className="text-devspot-success" size={16} />
            ) : (
              <Circle className="text-devspot-gray-500" size={16} />
            )}
            <span className={`text-sm ${step.completed ? 'text-white' : 'text-devspot-text-secondary'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-devspot-dark rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={14} className="text-devspot-text-muted" />
          <span className="text-sm text-devspot-text-muted">Current Mode:</span>
        </div>
        <span className="text-sm text-white capitalize">
          {currentMethod === 'ai' ? 'AI Assistant' : 'Manual Form'}
        </span>
      </div>
    </div>
  )
}