import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  placeholder = "Type your message...", 
  disabled = false,
  isLoading = false 
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isLoading) {
      onSend(message.trim());
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 120; // Max 5 lines approximately
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      
      // Remove scrollbar by setting overflow-y to hidden when not needed
      if (scrollHeight <= maxHeight) {
        textareaRef.current.style.overflowY = 'hidden';
      } else {
        textareaRef.current.style.overflowY = 'auto';
      }
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const isDisabled = disabled || isLoading;
  const canSend = message.trim() && !isDisabled;

  return (
    <div className="border-t border-devspot-dark-light bg-devspot-dark p-4">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isDisabled ? "Spot is responding..." : placeholder}
            disabled={isDisabled}
            className={`w-full resize-none rounded-lg border px-4 py-3 mb-[-5px] pr-12 text-white placeholder-devspot-text-muted focus:outline-none focus:ring-2 focus:ring-devspot-blue-500 transition-all duration-200 ${
              isDisabled 
                ? 'bg-devspot-dark-light border-devspot-dark-light cursor-not-allowed opacity-60' 
                : 'bg-devspot-dark-light border-gray-600 hover:border-gray-500'
            }`}
            rows={1}
            style={{ 
              minHeight: '48px',
              overflowY: 'hidden'
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={!canSend}
          className={`flex items-center justify-center w-12 h-12 rounded-lg transition-all duration-200 ${
            canSend
              ? 'bg-devspot-blue-500 hover:bg-devspot-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-60'
          }`}
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
      
      {/* {isLoading && (
        <div className="flex items-center gap-2 mt-2 text-devspot-text-secondary text-sm">
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce"></div>
          </div>
          <span>AI is processing your message...</span>
        </div>
      )} */}
    </div>
  );
};

export default ChatInput;