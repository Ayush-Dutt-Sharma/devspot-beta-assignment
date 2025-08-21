import React from 'react'
import { Bot, FileEdit } from 'lucide-react'

interface ModeSwitchProps {
  currentMethod: 'ai' | 'manual'
  onSwitch: (method: 'ai' | 'manual') => void
  disabled?: boolean
}

export function ModeSwitch({ currentMethod, onSwitch, disabled = false }: ModeSwitchProps) {
  return (
    <div className="flex items-center gap-2 p-2 bg-devspot-dark-light rounded-lg border border-devspot-gray-600">
      <span className="text-sm text-devspot-text-muted">Switch to:</span>
      <button
        onClick={() => onSwitch(currentMethod === 'ai' ? 'manual' : 'ai')}
        disabled={disabled}
        className="btn-ghost text-xs flex items-center gap-1 px-2 py-1"
      >
        {currentMethod === 'ai' ? (
          <>
            <FileEdit size={14} />
            Manual Form
          </>
        ) : (
          <>
            <Bot size={14} />
            AI Assistant
          </>
        )}
      </button>
    </div>
  )
}