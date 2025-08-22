"use client";
import React, { useState, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import ModeCard from '@/components/ui/ModelCard';
import { Zap, User, Compass } from 'lucide-react';
import { useUser, SignInButton } from '@clerk/nextjs';

type Mode = 'hackathon' | 'profile' | 'explore' | null;
type Message = {
  id: number;
  sender: 'bot' | 'user';
  content: string;
};

const DevSpotChatInterface = () => {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      content: 'Welcome to DevSpot! I can help you create your technology profile, host a hackathon, and more. What can I do for you?'
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isLoaded, user } = useUser();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleModeSelect = async (mode: Mode) => {
    setSelectedMode(mode);
    setIsLoading(true);
    
    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: mode === 'hackathon' ? 'Help me create a hackathon' : 
               mode === 'profile' ? 'Create my technology profile' :
               'I want to explore DevSpot'
    };

    setMessages(prev => [...prev, newUserMessage]);

    try {
      if (mode === 'hackathon') {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_step: 'hackathon_start',
            conversation_data: {},
            method: 'ai'
          })
        });

        if (response.ok) {
          const data = await response.json();
          setConversationId(data.conversation.id);
        }
      }

      const newBotMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        content: mode === 'hackathon' 
          ? "Perfect! I'll help you create an amazing hackathon. Let's start with the basics - what would you like to call your hackathon?"
          : mode === 'profile'
          ? "Perfect! Let's build your technology profile. I'll guide you through the process step by step."
          : "Perfect! I'm here to help you explore DevSpot. You can ask me about hackathons, how to participate, platform features, or anything else you'd like to know!"
      };

      setMessages(prev => [...prev, newBotMessage]);
    } catch (error) {
      console.error('Error selecting mode:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message: string) => {
    if (isLoading) return;
       setSelectedMode('hackathon');
    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: message
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          conversationId,
          mode: 'hackathon'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        const newBotMessage: Message = {
          id: Date.now() + 1,
          sender: 'bot',
          content: data.response
        };
        
        setMessages(prev => [...prev, newBotMessage]);

        if (data.conversationId && !conversationId) {
          setConversationId(data.conversationId);
        }

        console.log('Conversation progress:', data.progress);
        console.log('Extracted data:', data.extractedData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'bot',
        content: "I'm sorry, I encountered an error. Please try again."
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const showInitialOptions = selectedMode === null;

  if (isLoaded && !user) {
    return (
      <div className="h-screen bg-devspot-dark text-white flex flex-col">
        <Header onSearch={(query) => console.log('Search:', query)} />
        
        <div className="flex-1 flex">
          <Sidebar activeItem="Chat with Spot" />
        
          <div className="flex-1 flex items-center justify-center">
            <div className="card-primary max-w-md text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
              <p className="text-devspot-text-secondary mb-6">
                Please sign in to create hackathons and access all DevSpot features.
              </p>
              <SignInButton mode="modal">
                <button className="btn-primary w-full">
                  Sign In to Continue
                </button>
              </SignInButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  
  return (
    <div className="h-screen bg-devspot-dark text-white flex flex-col">
      <Header onSearch={(query) => console.log('Search:', query)} />

      <div className="flex-1 flex">
        <Sidebar activeItem="Chat with Spot" />
   
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message.content} 
                sender={message.sender}
              >
                {message.sender === 'bot' && index === 0 && showInitialOptions && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ModeCard
                      icon={Zap}
                      title="Help me create a hackathon"
                      description="Get AI assistance to design your perfect hackathon event"
                      onClick={() => handleSendMessage('Start creating the hackathon')}
                    />
                  </div>
                )}
                
              </MessageBubble>
            ))}
            
            <div ref={messagesEndRef} />
             {isLoading && (
                  <div className="flex items-center gap-2 mt-2 text-devspot-text-secondary">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-devspot-blue-500 rounded-full animate-bounce"></div>
                    </div>
                    <span className="text-sm">Spot is thinking...</span>
                  </div>
                )}
          </div>
          
          <ChatInput 
            onSend={handleSendMessage}
            placeholder="Reply to Spot..."
            disabled={isLoading}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default DevSpotChatInterface;