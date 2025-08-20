"use client";
import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import ActionButton from '@/components/ui/ActionButton';
import ModeCard from '@/components/ui/ModelCard';
import { Zap, User, Compass, Bot, FileEdit } from 'lucide-react';

type Mode = 'hackathon' | 'profile' | 'explore' | null;
type Method = 'ai' | 'manual' | null;
type Message = {
  id: number;
  sender: 'bot' | 'user';
  content: string;
};
const DevSpotChatInterface = () => {
  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [selectedMethod, setSelectedMethod] = useState<Method>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'bot',
      content: 'Welcome to DevSpot! I can help you create your technology profile, host a hackathon, and more. What can I do for you?'
    }
  ]);

  const handleModeSelect = (mode:Mode ) => {
    setSelectedMode(mode);
    
    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user' as 'user',
      content: mode === 'hackathon' ? 'Help me create a hackathon' : 
               mode === 'profile' ? 'Create my technology profile' :
               'I want to explore DevSpot'
    };

    const newBotMessage: Message = {
      id: Date.now() + 1,
      sender: 'bot' as 'bot',
      content: mode === 'hackathon' 
        ? "Great! I'd love to help you create an amazing hackathon. How would you like to proceed?"
        : mode === 'profile'
        ? "Perfect! Let's build your technology profile. I'll guide you through the process."
        : "Perfect! I'm here to help you explore DevSpot. You can ask me about hackathons, how to participate, platform features, or anything else you'd like to know!"
    };

    setMessages(prev => [...prev, newUserMessage, newBotMessage]);
  };

  const handleMethodSelect = (method:Method) => {
    setSelectedMethod(method);
    
    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user' as 'user',
      content: method === 'ai' ? 'AI-Powered Setup' : 'Manual Form'
    };

    const newBotMessage: Message = {
      id: Date.now() + 1,
      sender: 'bot' as 'bot',
      content: method === 'ai' 
        ? "Excellent choice! I'll guide you through creating your hackathon step by step. Let's start with the basics - what would you like to call your hackathon?"
        : "Great! I'll redirect you to our form interface where you can fill out all the details manually. This gives you full control over every aspect of your hackathon setup."
    };

    setMessages(prev => [...prev, newUserMessage, newBotMessage]);
  };

  const handleSendMessage = (message: string) => {
    const newUserMessage: Message = {
      id: Date.now(),
      sender: 'user' as 'user',
      content: message
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    setTimeout(() => {
      const botResponse: Message = {
        id: Date.now(),
        sender: 'bot' as 'bot',
        content: "Thanks for your message! This is where the AI conversation would continue based on your input."
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const showInitialOptions = selectedMode === null;
  const showMethodSelection = selectedMode === 'hackathon' && selectedMethod === null;
  const showChatInterface = selectedMode === 'explore' || 
                           (selectedMode === 'hackathon' && selectedMethod === 'ai') ||
                           (selectedMode === 'profile');

  return (
    <div className="h-screen bg-devspot-dark text-white flex flex-col">
      <Header onSearch={(query) => console.log('Search:', query)} />
      
      <div className="flex-1 flex ">
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
                      onClick={() => handleModeSelect('hackathon')}
                    />
                    <ModeCard
                      icon={User}
                      title="Create my technology profile"
                      description="Build your developer profile and showcase your skills"
                      onClick={() => handleModeSelect('profile')}
                    />
                    <ModeCard
                      icon={Compass}
                      title="I want to explore DevSpot"
                      description="Learn about the platform and discover opportunities"
                      onClick={() => handleModeSelect('explore')}
                    />
                  </div>
                )}

                {message.sender === 'bot' && 
                 message.content.includes("How would you like to proceed?") && 
                 showMethodSelection && (
                  <div className="flex gap-4">
                    <ActionButton
                      onClick={() => handleMethodSelect('ai')}
                      variant="primary"
                      icon={Bot}
                    >
                      AI-Powered Setup
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleMethodSelect('manual')}
                      variant="secondary"
                      icon={FileEdit}
                    >
                      Manual Form
                    </ActionButton>
                  </div>
                )}
              </MessageBubble>
            ))}
          </div>
          {showChatInterface && (
            <ChatInput 
              onSend={handleSendMessage}
              placeholder="Reply to Spot..."
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DevSpotChatInterface;