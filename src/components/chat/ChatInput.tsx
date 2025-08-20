"use client";
import React, { useState } from 'react';
import ActionButton from '../ui/ActionButton';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, placeholder = "Reply to Spot...", disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSend(message);
    setMessage('');
  };

  const handleKeyPress = (e:React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-devspot-gray-700 p-4 bg-devspot-dark">
      <div className="flex gap-3 max-w-4xl mx-auto">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="input-primary flex-1"
        />
        <ActionButton 
          onClick={handleSend}
          variant="primary"
          disabled={!message.trim() || disabled}
          icon={Send}
          className="px-4 py-3"
        />
      </div>
    </div>
  );
};
export default ChatInput;