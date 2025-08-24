"use client"
import React, { useState, useRef } from 'react';
import BotAvatar from "./BotLogo";
import { Upload, Check } from 'lucide-react';

type MessageBubbleProps = {
  message: string;
  sender: 'bot' | 'user';
  children?: React.ReactNode;
  isButtonVisible: boolean;
  buttonText?: string;
  onButtonClick?: () => void;
  selectableItems?: string[];
  showSelectableItems?: boolean;
  onItemsSelected?: (selectedItems: string[]) => void;
  showImageUpload?: boolean;
  onImageSelected?: (file: File) => void;
};

const MessageBubble = ({ 
  message, 
  sender, 
  children,
  isButtonVisible,
  buttonText,
  onButtonClick,
  selectableItems,
  showSelectableItems,
  onItemsSelected,
  showImageUpload,
  onImageSelected
}: MessageBubbleProps) => {
  const isBot = sender === 'bot';
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleItemToggle = (item: string) => {
    setSelectedItems(prev => {
      const newSelection = prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item];
      if (onItemsSelected) {
        onItemsSelected(newSelection);
      }
      
      return newSelection;
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onImageSelected) {
      setUploadedFileName(file.name);
      onImageSelected(file);
    }
  };

  return (
    <div className={`flex gap-3 ${!isBot ? 'justify-end' : ''} animate-fade-in`}>
      {isBot && <BotAvatar />}
      
      <div className={`max-w-2xl ${!isBot ? 'order-first' : ''}`}>
        <div className={isBot ? 'message-bot' : 'message-user'}>
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
        
        {(buttonText || (showSelectableItems && selectableItems) || showImageUpload) && (
          <div className="mt-3 space-y-3">
            
            {isButtonVisible && buttonText && onButtonClick && (
              <button
                onClick={onButtonClick}
                className="px-4 py-2 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm 
                         border border-white/20 rounded-lg text-white text-sm font-light
                         hover:from-white/15 hover:to-white/10 transition-all duration-200
                         hover:shadow-lg hover:shadow-white/5 active:scale-95"
              >
                {buttonText}
              </button>
            )}
            
            {showSelectableItems && selectableItems && selectableItems.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-white/60 font-light mb-2">Select options:</p>
                <div className="flex flex-wrap gap-2">
                  {selectableItems.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => handleItemToggle(item)}
                      className={`px-3 py-1.5 rounded-full text-xs font-light transition-all duration-200
                        ${selectedItems.includes(item)
                          ? 'bg-white/20 text-white border border-white/30 shadow-sm shadow-white/10'
                          : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {selectedItems.includes(item) && <Check className="w-3 h-3" />}
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {showImageUpload && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm 
                           border border-white/10 rounded-lg text-white/70 text-sm font-light
                           hover:bg-white/10 hover:text-white hover:border-white/20 
                           transition-all duration-200 group"
                >
                  <Upload className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {uploadedFileName ? (
                    <span className="text-white">{uploadedFileName}</span>
                  ) : (
                    <span>Upload Image</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
        
        {children && <div className="mt-4">{children}</div>}
      </div>
    </div>
  );
};

export default MessageBubble;