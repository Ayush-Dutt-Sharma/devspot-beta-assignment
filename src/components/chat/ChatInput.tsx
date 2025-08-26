import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, X, Image, Upload } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string | string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  selectableItems?: string[];
  showSelectableItems?: boolean;
  showImageUpload?: boolean;
  imageUploadType?: 'logo' | 'banner';
  hackathonId?: string | null;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSend, 
  placeholder = "Type your message...", 
  disabled = false,
  isLoading = false,
  selectableItems = [],
  showSelectableItems = false,
  showImageUpload = false,
  imageUploadType = 'logo',
  hackathonId = null
}) => {
  const [message, setMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showSelectableItems) {
      setSelectedItems([]);
    }
  }, [showSelectableItems]);


  useEffect(() => {
    if (!showImageUpload) {
      setUploadedImageUrl(null);
      setUploadError(null);
    }
  }, [showImageUpload]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      setUploadError(null);
      
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const presignedURL = new URL('/api/s3/presigned', window.location.href);
      presignedURL.searchParams.set('fileName', file.name);
      presignedURL.searchParams.set('contentType', file.type);

      const presignedResponse = await fetch(presignedURL.toString());
      if (!presignedResponse.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const presignedData = await presignedResponse.json();
      const uploadResponse = await fetch(presignedData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      const imageUrl = presignedData.signedUrl.split('?')[0];
      setUploadedImageUrl(imageUrl);

      if (hackathonId) {
        const updateResponse = await fetch(`/api/hackathons/${hackathonId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [imageUploadType]: imageUrl
          })
        });

        if (!updateResponse.ok) {
          throw new Error('Failed to update hackathon in database');
        }
      }

      onSend(`Image uploaded successfully`);
      setUploadedImageUrl(null);
      
    } catch (err) {
      console.error('Image upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (showSelectableItems && selectedItems.length > 0) {
      onSend(selectedItems);
      setSelectedItems([]);
    } else if (message.trim() && !disabled && !isLoading && !showImageUpload) {
      onSend(message.trim());
      setMessage('');
      resetTextareaHeight();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !showSelectableItems && !showImageUpload) {
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

  const toggleItemSelection = (item: string) => {
    setSelectedItems(prev => {
      if (prev.includes(item)) {
        return prev.filter(i => i !== item);
      } else {
        return [...prev, item];
      }
    });
  };

  const removeSelectedItem = (item: string) => {
    setSelectedItems(prev => prev.filter(i => i !== item));
  };

  const isDisabled = disabled || isLoading || showImageUpload;
  const canSend = showSelectableItems 
    ? selectedItems.length > 0 && !isDisabled
    : showImageUpload
    ? false
    : message.trim() && !isDisabled;

  return (
    <div className="border-t border-devspot-dark-light bg-devspot-dark p-4">
      {showImageUpload && (
        <div className="mb-4">
          <div className="mb-3 text-sm text-devspot-text-secondary">
            Please upload {imageUploadType === 'logo' ? 'a logo' : 'a banner'} image for your hackathon:
          </div>
          
          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              disabled={isUploading}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isUploading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-devspot-blue-500 hover:bg-devspot-blue-600 text-white'
              }`}
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Upload {imageUploadType === 'logo' ? 'Logo' : 'Banner'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSend('skip')}
              disabled={isUploading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isUploading
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
              }`}
            >
              Skip
            </button>

            {uploadedImageUrl && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <Check className="w-4 h-4" />
                <span>Image uploaded successfully!</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="mt-2 text-red-400 text-sm">
              {uploadError}
            </div>
          )}

          <div className="mt-3 text-xs text-devspot-text-muted">
            Supported formats: JPG, PNG, GIF, WebP (Max 5MB) • You can skip this step if you don't have an image ready
          </div>
        </div>
      )}

      {showSelectableItems && selectableItems.length > 0 && (
        <div className="mb-4">
          <div className="mb-3 text-sm text-devspot-text-secondary">
            Select relevant criteria (you can choose multiple):
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {selectableItems.map((item) => {
              const isSelected = selectedItems.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleItemSelection(item)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                    ${isSelected 
                      ? 'bg-devspot-blue-500 text-white ring-2 ring-devspot-blue-400 ring-opacity-50' 
                      : 'bg-devspot-dark-light text-devspot-text-secondary hover:bg-gray-700 hover:text-white border border-gray-600'
                    }
                  `}
                >
                  <span className="flex items-center gap-1.5">
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {item}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedItems.length > 0 && (
            <div className="bg-devspot-dark-light rounded-lg p-3 mb-3 border border-gray-700">
              <div className="text-xs text-devspot-text-muted mb-2">
                Selected ({selectedItems.length}):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedItems.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-devspot-blue-500/20 text-devspot-blue-400 rounded text-xs"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => removeSelectedItem(item)}
                      className="hover:text-devspot-blue-300 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={showSelectableItems ? '' : message}
            onChange={(e) => !showSelectableItems && !showImageUpload && setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              showImageUpload
                ? 'Upload an image above to continue...'
                : showSelectableItems 
                ? `${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''} selected`
                : (isDisabled ? "Spot is responding..." : placeholder)
            }
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

      {showSelectableItems && (
        <div className="mt-2 text-xs text-devspot-text-muted">
          Click on options above to select, then click send to submit your choices
        </div>
      )}
    </div>
  );
};

export default ChatInput;