
import React, { useState } from 'react';
import { SendIcon } from './Icons';

interface PromptInputProps {
  onSend: (prompt: string) => void;
  isLoading: boolean;
  suggestions: string[];
  placeholder: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, suggestions, placeholder }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSend(prompt.trim());
      setPrompt('');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {suggestions.slice(0, 4).map((s, i) => (
          <button 
            key={i} 
            onClick={() => handleSuggestionClick(s)}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded-md text-xs transition-colors"
            disabled={isLoading}
          >
            {s}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={placeholder}
          className="flex-grow bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !prompt.trim()} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          <SendIcon className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};
