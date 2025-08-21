'use client'
import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Plus, Trash2, DollarSign } from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  judging_criteria: string[]
  resources: string[]
  prize_amount: number
}

interface HackathonFormData {
  title: string
  organization: string
  registration_date: string
  hacking_start: string
  submission_deadline: string
  format: 'virtual' | 'in_person' | 'hybrid'
  target_audience: string
  event_size: number | null
  total_budget: number | null
  challenges: Challenge[]
}

const JUDGING_CRITERIA = [
  'Innovation / Creativity',
  'Technical Execution',
  'User Experience (UX)',
  'Impact / Usefulness',
  'Completeness / Functionality',
  'Presentation / Demo Quality',
  'Scalability / Future Potential',
  'Relevance to Theme / Challenge',
  'Use of Sponsor Tech / APIs',
  'Team Collaboration'
]

export default function HackathonForm() {
  const { user } = useUser()
  const supabase = createClient()
  
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<HackathonFormData>({
    title: '',
    organization: '',
    registration_date: '',
    hacking_start: '',
    submission_deadline: '',
    format: 'virtual',
    target_audience: '',
    event_size: null,
    total_budget: 20000, // Default $20k minimum
    challenges: [
      {
        id: '1',
        title: '',
        description: '',
        judging_criteria: [],
        resources: [],
        prize_amount: 0
      }
    ]
  })

  const addChallenge = () => {
    setFormData(prev => ({
      ...prev,
      challenges: [
        ...prev.challenges,
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          judging_criteria: [],
          resources: [],
          prize_amount: 0
        }
      ]
    }))
  }

  const updateChallengeResource = (challengeId: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c.id === challengeId 
          ? { 
              ...c, 
              resources: c.resources.map((r, i) => i === index ? value : r)
            } 
          : c
      )
    }))
  }

  const addResource = (challengeId: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c.id === challengeId 
          ? { ...c, resources: [...c.resources, ''] }
          : c
      )
    }))
  }

  const removeResource = (challengeId: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c.id === challengeId 
          ? { ...c, resources: c.resources.filter((_, i) => i !== index) }
          : c
      )
    }))
  }

  const handleCriteriaChange = (challengeId: string, criteria: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => {
        if (c.id === challengeId) {
          const currentCriteria = c.judging_criteria
          const isSelected = currentCriteria.includes(criteria)
          
          if (isSelected) {
            return { ...c, judging_criteria: currentCriteria.filter(cr => cr !== criteria) }
          } else if (currentCriteria.length < 4) {
            return { ...c, judging_criteria: [...currentCriteria, criteria] }
          }
        }
        return c
      })
    }))
  }

  const saveHackathon = async (status: 'draft' | 'published' = 'draft') => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', user.id)
        .single()

      if (!userData) {
        throw new Error('User not found')
      }

      const { data: hackathonData, error: hackathonError } = await supabase
        .from('hackathons')
        .insert({
          title: formData.title,
          organization: formData.organization || null,
          registration_date: formData.registration_date || null,
          hacking_start: formData.hacking_start || null,
          submission_deadline: formData.submission_deadline || null,
          format: formData.format,
          target_audience: formData.target_audience || null,
          event_size: formData.event_size,
          total_budget: formData.total_budget ? formData.total_budget * 100 : null, // Convert to cents
          status,
          creator_id: userData.id
        })
        .select()
        .single()

      if (hackathonError) throw hackathonError

      const challengesData = formData.challenges
        .filter(c => c.title && c.description)
        .map((challenge, index) => ({
          hackathon_id: hackathonData.id,
          title: challenge.title,
          description: challenge.description,
          judging_criteria: challenge.judging_criteria,
          resources: challenge.resources.filter(r => r.trim() !== ''),
          prize_amount: challenge.prize_amount * 100, // Convert to cents
          order_index: index
        }))

      if (challengesData.length > 0) {
        const { error: challengesError } = await supabase
          .from('challenges')
          .insert(challengesData)

        if (challengesError) throw challengesError
      }

      alert(`Hackathon ${status === 'draft' ? 'saved as draft' : 'published'} successfully!`)
      
      if (status === 'published') {
        window.location.href = `/payment/${hackathonData.id}`
      }
      
    } catch (error) {
      console.error('Error saving hackathon:', error)
      alert('Error saving hackathon. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const removeChallenge = (id: string) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.filter(c => c.id !== id)
    }))
  }

  const updateChallenge = (id: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      challenges: prev.challenges.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    }))}

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step <= currentStep 
                  ? 'bg-devspot-blue-500 text-white' 
                  : 'bg-devspot-gray-600 text-devspot-text-muted'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`w-16 h-1 ${
                  step < currentStep ? 'bg-devspot-blue-500' : 'bg-devspot-gray-600'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span>Basic Info</span>
          <span>Challenges</span>
          <span>Budget & Prizes</span>
          <span>Review</span>
        </div>
      </div>

      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Hackathon Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="input-primary w-full"
                placeholder="Enter hackathon name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Organization
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                className="input-primary w-full"
                placeholder="Your company/organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Registration Opens
              </label>
              <input
                type="datetime-local"
                value={formData.registration_date}
                onChange={(e) => setFormData(prev => ({ ...prev, registration_date: e.target.value }))}
                className="input-primary w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Hacking Starts
              </label>
              <input
                type="datetime-local"
                value={formData.hacking_start}
                onChange={(e) => setFormData(prev => ({ ...prev, hacking_start: e.target.value }))}
                className="input-primary w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Submission Deadline
              </label>
              <input
                type="datetime-local"
                value={formData.submission_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, submission_deadline: e.target.value }))}
                className="input-primary w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Format
              </label>
              <select
                value={formData.format}
                onChange={(e) => setFormData(prev => ({ ...prev, format: e.target.value as any }))}
                className="input-primary w-full"
              >
                <option value="virtual">Virtual</option>
                <option value="in_person">In Person</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Target Audience
              </label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
                className="input-primary w-full"
                placeholder="e.g., Students, Professionals, Mixed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Expected Participants
              </label>
              <input
                type="number"
                value={formData.event_size || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, event_size: e.target.value ? parseInt(e.target.value) : null }))}
                className="input-primary w-full"
                placeholder="Number of participants"
              />
            </div>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Challenges</h2>
            <button
              onClick={addChallenge}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={16} />
              Add Challenge
            </button>
          </div>

          {formData.challenges.map((challenge, index) => (
            <div key={challenge.id} className="card-primary space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Challenge {index + 1}</h3>
                {formData.challenges.length > 1 && (
                  <button
                    onClick={() => removeChallenge(challenge.id)}
                    className="btn-ghost p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                    Challenge Title *
                  </label>
                  <input
                    type="text"
                    value={challenge.title}
                    onChange={(e) => updateChallenge(challenge.id, 'title', e.target.value)}
                    className="input-primary w-full"
                    placeholder="Enter challenge title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                    Prize Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={challenge.prize_amount || ''}
                    onChange={(e) => updateChallenge(challenge.id, 'prize_amount', parseInt(e.target.value) || 0)}
                    className="input-primary w-full"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                  Description *
                </label>
                <textarea
                  value={challenge.description}
                  onChange={(e) => updateChallenge(challenge.id, 'description', e.target.value)}
                  className="input-primary w-full h-24 resize-none"
                  placeholder="Describe the challenge objectives and requirements"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                  Judging Criteria (Select up to 4)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {JUDGING_CRITERIA.map((criteria) => (
                    <label key={criteria} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={challenge.judging_criteria.includes(criteria)}
                        onChange={() => handleCriteriaChange(challenge.id, criteria)}
                        disabled={!challenge.judging_criteria.includes(criteria) && challenge.judging_criteria.length >= 4}
                        className="rounded border-devspot-gray-600 text-devspot-blue-500 focus:ring-devspot-blue-500"
                      />
                      <span className="text-sm text-devspot-text-secondary">{criteria}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                  Resources & Links
                </label>
                {challenge.resources.map((resource, resourceIndex) => (
                  <div key={resourceIndex} className="flex gap-2 mb-2">
                    <input
                      type="url"
                      value={resource}
                      onChange={(e) => updateChallengeResource(challenge.id, resourceIndex, e.target.value)}
                      className="input-primary flex-1"
                      placeholder="https://example.com/api-docs"
                    />
                    <button
                      onClick={() => removeResource(challenge.id, resourceIndex)}
                      className="btn-ghost p-2"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addResource(challenge.id)}
                  className="btn-secondary text-sm"
                >
                  Add Resource
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Budget & Prize Structure</h2>
          
          <div className="card-primary">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="text-devspot-blue-500" size={24} />
              <h3 className="text-lg font-semibold text-white">Minimum Bounty Requirement</h3>
            </div>
            <div className="bg-devspot-blue-500/10 border border-devspot-blue-500/30 rounded-lg p-4 mb-4">
              <p className="text-devspot-text-secondary">
                All hackathons on DevSpot require a minimum <strong className="text-white">$20,000 USDC</strong> bounty pool. 
                This will be collected before your hackathon is published.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Additional Budget (Optional)
              </label>
              <input
                type="number"
                value={formData.total_budget ? (formData.total_budget > 20000 ? formData.total_budget - 20000 : 0) : 0}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  total_budget: 20000 + (parseInt(e.target.value) || 0)
                }))}
                className="input-primary w-full"
                placeholder="Additional amount beyond $20,000"
                min="0"
              />
              <p className="text-sm text-devspot-text-muted mt-1">
                Total Budget: ${formData.total_budget?.toLocaleString() || '20,000'}
              </p>
            </div>
          </div>

          <div className="card-primary">
            <h3 className="text-lg font-semibold text-white mb-4">Prize Distribution Summary</h3>
            <div className="space-y-3">
              {formData.challenges.map((challenge, index) => (
                <div key={challenge.id} className="flex justify-between items-center p-3 bg-devspot-dark rounded-lg">
                  <span className="text-devspot-text-secondary">
                    {challenge.title || `Challenge ${index + 1}`}
                  </span>
                  <span className="text-white font-medium">
                    ${challenge.prize_amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="border-t border-devspot-gray-600 pt-3">
                <div className="flex justify-between items-center font-semibold">
                  <span className="text-white">Total Prize Pool:</span>
                  <span className="text-devspot-blue-400">
                    ${formData.challenges.reduce((sum, c) => sum + c.prize_amount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-devspot-text-muted">Minimum Bounty:</span>
                  <span className="text-devspot-text-muted">$20,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Review & Publish</h2>
          
          <div className="card-primary">
            <h3 className="text-lg font-semibold text-white mb-4">Hackathon Summary</h3>
            <div className="space-y-3">
              <div>
                <span className="text-devspot-text-muted">Title: </span>
                <span className="text-white">{formData.title}</span>
              </div>
              <div>
                <span className="text-devspot-text-muted">Organization: </span>
                <span className="text-white">{formData.organization || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-devspot-text-muted">Format: </span>
                <span className="text-white capitalize">{formData.format.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-devspot-text-muted">Challenges: </span>
                <span className="text-white">{formData.challenges.length}</span>
              </div>
              <div>
                <span className="text-devspot-text-muted">Total Budget: </span>
                <span className="text-white">${formData.total_budget?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-devspot-warning/10 border border-devspot-warning/30 rounded-lg p-4">
            <p className="text-devspot-text-secondary">
              <strong className="text-devspot-warning">Important:</strong> Publishing your hackathon will require 
              payment of the $20,000 minimum bounty before it goes live.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-4">
          <button
            onClick={() => saveHackathon('draft')}
            disabled={loading || !formData.title}
            className="btn-ghost"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          
          {currentStep === 4 ? (
            <button
              onClick={() => saveHackathon('published')}
              disabled={loading || !formData.title || formData.challenges.filter(c => c.title && c.description).length === 0}
              className="btn-primary"
            >
              {loading ? 'Publishing...' : 'Publish & Pay'}
            </button>
          ) : (
            <button
              onClick={nextStep}
              disabled={currentStep === 1 && !formData.title}
              className="btn-primary"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
