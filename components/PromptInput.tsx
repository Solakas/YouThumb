import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Spinner } from './Spinner';

interface PromptInputProps {
  onSend: (data: { prompt: string; mode: 'edit' | 'ask'; guideImage: string | null; }) => void;
  isLoading: boolean;
  suggestions: string[];
  // Fix: Make chatHistory optional and add placeholder prop to resolve type errors.
  chatHistory?: ChatMessage[];
  placeholder?: string;
}

export const PromptInput: React.FC<PromptInputProps> = ({ onSend, isLoading, suggestions, chatHistory = [], placeholder }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<'edit' | 'ask'>('edit');
  const [guideImage, setGuideImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  useEffect(() => {
    if (chatHistoryRef.current) {
        chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSend({ prompt: prompt.trim(), mode, guideImage });
      setPrompt('');
      if (mode === 'edit') {
        setGuideImage(null);
      }
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e as any);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            setGuideImage(event.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 self-start">
            <div className="flex items-center bg-yt-neutral-bg-800 p-1 rounded-lg border border-yt-neutral-border">
                <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-body-sm transition-colors focus:outline-none focus:ring-2 ring-inset focus:ring-yt-accent-focus ${
                        mode === 'edit'
                        ? 'bg-yt-primary-500 text-black font-bold'
                        : 'text-yt-neutral-text3 hover:bg-yt-neutral-border'
                    }`}
                >
                    <i className="fa-solid fa-wand-magic-sparkles"></i>
                    <span>Edit</span>
                </button>
                <button
                    type="button"
                    onClick={() => setMode('ask')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-body-sm transition-colors focus:outline-none focus:ring-2 ring-inset focus:ring-yt-accent-focus ${
                        mode === 'ask'
                        ? 'bg-yt-primary-500 text-black font-bold'
                        : 'text-yt-neutral-text3 hover:bg-yt-neutral-border'
                    }`}
                >
                    <i className="fa-solid fa-circle-question"></i>
                    <span>Ask</span>
                </button>
            </div>
            {mode === 'edit' && (
                <>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden"/>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 h-control-sm bg-yt-neutral-bg-800 border-thin border-yt-neutral-border rounded-lg text-body-sm text-yt-neutral-text2 hover:bg-yt-neutral-borderStrong focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                        <i className="fa-solid fa-paperclip text-xs"></i>
                        <span>{guideImage ? "Change Guide Image" : "Add Guide Image"}</span>
                    </button>
                </>
            )}
        </div>

        {mode === 'ask' && chatHistory.length > 0 && (
            <div ref={chatHistoryRef} className="max-h-48 overflow-y-auto space-y-3 p-3 bg-yt-neutral-bg-800 rounded-xl text-body-sm">
                {chatHistory.map((msg, index) => (
                     <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-md px-3 py-1.5 ${
                            msg.role === 'user' ? 'bg-yt-secondary-500/80 text-yt-neutral-text rounded-l-lg rounded-tr-lg' : 
                            msg.role === 'model' ? 'bg-yt-neutral-bg-950 rounded-r-lg rounded-tl-lg' : 'bg-yt-semantic-danger text-yt-neutral-text rounded-lg'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-md rounded-lg px-3 py-1.5 bg-yt-neutral-bg-950 flex items-center gap-2">
                            <Spinner className="w-4 h-4" />
                        </div>
                    </div>
                )}
            </div>
        )}
        
        <form onSubmit={handleSubmit} className="bg-yt-neutral-bg-800 rounded-xl p-2 flex items-end gap-2 focus-within:ring-2 focus-within:ring-yt-accent-focus transition-shadow">
            <div className="flex-grow flex flex-col gap-2">
                {mode === 'edit' && guideImage && (
                    <div className="flex items-center gap-2 bg-yt-neutral-bg-950/50 p-1.5 rounded-md">
                        <img src={guideImage} className="w-10 h-10 object-cover rounded" alt="Guide image preview" />
                        <span className="text-body-sm text-yt-neutral-text3 truncate">Guide image attached</span>
                        <button type="button" onClick={() => setGuideImage(null)} className="ml-auto flex-shrink-0 w-6 h-6 rounded-full bg-yt-neutral-border hover:bg-yt-neutral-borderStrong flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-yt-accent-focus">
                           <i className="fa-solid fa-xmark text-xs"></i>
                        </button>
                    </div>
                )}
                <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    // Fix: Use placeholder prop if provided, otherwise use default.
                    placeholder={placeholder || (mode === 'edit' ? "Describe your edits... e.g., 'Make the background a galaxy'" : "Ask for thumbnail advice...")}
                    className="w-full bg-transparent p-2 resize-y focus:outline-none disabled:opacity-50 text-body"
                    disabled={isLoading}
                    rows={1}
                />
            </div>
            <button type="submit" disabled={isLoading || !prompt.trim()} className="bg-yt-primary-500 hover:bg-yt-primary-600 text-black rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors motion-safe:hover:shadow-glowPrimary focus:outline-none">
                <i className="fa-solid fa-paper-plane text-h4 -ml-0.5" aria-hidden="true"></i>
            </button>
        </form>
    </div>
  );
};
