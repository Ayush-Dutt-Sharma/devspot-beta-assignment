import React from 'react'
import { Award, TrendingUp } from 'lucide-react'
import { recommendPrizeStructure } from '@/lib/utils'

interface PrizeRecommendationProps {
  challengeCount: number
  additionalAmount: number
  onAcceptRecommendation: (distribution: { [key: string]: number }) => void
}

export function PrizeRecommendation({ 
  challengeCount, 
  additionalAmount, 
  onAcceptRecommendation 
}: PrizeRecommendationProps) {
  const recommendation = recommendPrizeStructure(20000, challengeCount, additionalAmount)

  return (
    <div className="card-primary">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="text-devspot-blue-500" size={24} />
        <h3 className="text-lg font-semibold text-white">Prize Structure Recommendation</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Award className="text-devspot-warning" size={16} />
          <span className="text-sm font-medium text-devspot-warning capitalize">
            {recommendation.structure.replace('_', ' ')} Structure
          </span>
        </div>
        
        <p className="text-devspot-text-secondary text-sm">
          {recommendation.rationale}
        </p>
        
        <div className="bg-devspot-dark rounded-lg p-4">
          <div className="text-white font-medium mb-2">Recommended Distribution:</div>
          <div className="text-devspot-blue-400">{recommendation.breakdown}</div>
          
          <div className="mt-3 space-y-2">
            {Object.entries(recommendation.distribution).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-devspot-text-secondary">{key}:</span>
                <span className="text-white">${value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        
        <button
          onClick={() => onAcceptRecommendation(recommendation.distribution)}
          className="btn-secondary w-full"
        >
          Apply This Structure
        </button>
      </div>
    </div>
  )
}