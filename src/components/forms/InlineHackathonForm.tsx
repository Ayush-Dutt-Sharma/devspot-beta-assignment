import React, { useState } from 'react'
import { HackathonDraftData } from '@/lib/utils'

interface InlineHackathonFormProps {
  data: HackathonDraftData
  onUpdate: (updates: Partial<HackathonDraftData>) => void
  onSave: () => void
}

export default function InlineHackathonForm({ data, onUpdate, onSave }: InlineHackathonFormProps) {
  const [activeSection, setActiveSection] = useState<string>('basic')

  return (
    <div className="card-primary">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Quick Form</h3>
        <button onClick={onSave} className="btn-primary text-sm">
          Save Progress
        </button>
      </div>

      <div className="flex gap-2 mb-6 border-b border-devspot-gray-600">
        {[
          { key: 'basic', label: 'Basic Info' },
          { key: 'challenges', label: 'Challenges' },
          { key: 'budget', label: 'Budget' }
        ].map((section) => (
          <button
            key={section.key}
            onClick={() => setActiveSection(section.key)}
            className={`px-4 py-2 text-sm transition-colors border-b-2 ${
              activeSection === section.key
                ? 'text-devspot-blue-400 border-devspot-blue-500'
                : 'text-devspot-text-secondary border-transparent hover:text-white'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {activeSection === 'basic' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
              Hackathon Title
            </label>
            <input
              type="text"
              value={data.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="input-primary w-full"
              placeholder="Enter hackathon name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Registration Opens
              </label>
              <input
                type="datetime-local"
                value={data.registration_date || ''}
                onChange={(e) => onUpdate({ registration_date: e.target.value })}
                className="input-primary w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                Hacking Starts
              </label>
              <input
                type="datetime-local"
                value={data.hacking_start || ''}
                onChange={(e) => onUpdate({ hacking_start: e.target.value })}
                className="input-primary w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
              Format
            </label>
            <select
              value={data.format || 'virtual'}
              onChange={(e) => onUpdate({ format: e.target.value as any })}
              className="input-primary w-full"
            >
              <option value="virtual">Virtual</option>
              <option value="in_person">In Person</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
        </div>
      )}

      {activeSection === 'challenges' && (
        <div className="space-y-4">
          {(data.challenges || []).map((challenge, index) => (
            <div key={index} className="p-4 bg-devspot-dark rounded-lg border border-devspot-gray-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                    Challenge {index + 1} Title
                  </label>
                  <input
                    type="text"
                    value={challenge.title}
                    onChange={(e) => {
                      const updatedChallenges = [...(data.challenges || [])]
                      updatedChallenges[index] = { ...challenge, title: e.target.value }
                      onUpdate({ challenges: updatedChallenges })
                    }}
                    className="input-primary w-full"
                    placeholder="Challenge title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                    Prize Amount (USD)
                  </label>
                  <input
                    type="number"
                    value={challenge.prize_amount || ''}
                    onChange={(e) => {
                      const updatedChallenges = [...(data.challenges || [])]
                      updatedChallenges[index] = { ...challenge, prize_amount: parseInt(e.target.value) || 0 }
                      onUpdate({ challenges: updatedChallenges })
                    }}
                    className="input-primary w-full"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
                  Description
                </label>
                <textarea
                  value={challenge.description}
                  onChange={(e) => {
                    const updatedChallenges = [...(data.challenges || [])]
                    updatedChallenges[index] = { ...challenge, description: e.target.value }
                    onUpdate({ challenges: updatedChallenges })
                  }}
                  className="input-primary w-full h-20 resize-none"
                  placeholder="Describe the challenge"
                />
              </div>
            </div>
          ))}

          <button
            onClick={() => {
              const newChallenge = {
                title: '',
                description: '',
                judging_criteria: [],
                resources: [],
                prize_amount: 0
              }
              onUpdate({ challenges: [...(data.challenges || []), newChallenge] })
            }}
            className="btn-secondary w-full"
          >
            Add Challenge
          </button>
        </div>
      )}

      {activeSection === 'budget' && (
        <div className="space-y-4">
          <div className="bg-devspot-blue-500/10 border border-devspot-blue-500/30 rounded-lg p-4">
            <p className="text-devspot-text-secondary text-sm">
              Minimum bounty requirement: <strong className="text-white">$20,000 USDC</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-devspot-text-secondary mb-2">
              Additional Budget (Optional)
            </label>
            <input
              type="number"
              value={data.total_budget ? (data.total_budget > 20000 ? data.total_budget - 20000 : 0) : 0}
              onChange={(e) => onUpdate({ total_budget: 20000 + (parseInt(e.target.value) || 0) })}
              className="input-primary w-full"
              placeholder="Additional amount beyond $20,000"
              min="0"
            />
            <p className="text-sm text-devspot-text-muted mt-1">
              Total Budget: ${(data.total_budget || 20000).toLocaleString()}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}