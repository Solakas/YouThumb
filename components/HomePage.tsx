import React, { useState, useRef, useEffect } from 'react';
import { ImageUploader } from './ImageUploader';
import { geminiService } from '../services/geminiService';
import { PromptInput } from './PromptInput';
import { Spinner } from './Spinner';
import { GENERATE_PROMPT_SUGGESTIONS, EDIT_PROMPT_SUGGESTIONS } from '../constants';
import { ChatMessage } from '../types';
import { Chat } from '@google/genai';

interface HomePageProps {
  onImageReadyForEditor: (imageDataUrl: string) => void;
}

const InitialImageGenerator: React.FC<{ onImageReady: (imageDataUrl: string) => void }> = ({ onImageReady }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Chat states
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const chatRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatRef.current = geminiService.startChat("You are an expert on YouTube thumbnails. Keep your answers concise, to the point, and use lists for readability.");
  }, []);

  const handleSend = async ({ prompt, mode, guideImage }: { prompt: string; mode: 'edit' | 'ask'; guideImage: string | null; }) => {
    if (!prompt.trim()) return;

    if (mode === 'edit') {
      if (isLoading) return;
      setIsLoading(true);
      setError(null);

      try {
        const imageDataUrl = generatedImage
          ? await geminiService.editImage(generatedImage, prompt, undefined, guideImage || undefined)
          : await geminiService.generateImage(prompt);
        setGeneratedImage(imageDataUrl);
        setChatHistory([]); // Clear chat history when generating/editing image
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    } else { // Ask Mode
      if (isAnswering || !chatRef.current) return;
      const userMessage: ChatMessage = { role: 'user', content: prompt };
      setChatHistory(prev => [...prev, userMessage]);
      setIsAnswering(true);
      setError(null); // Clear image errors

      try {
        const response = await geminiService.sendMessage(chatRef.current, prompt);
        const modelMessage: ChatMessage = { role: 'model', content: response.text };
        setChatHistory(prev => [...prev, modelMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = { role: 'system', content: "Sorry, I couldn't get a response. Please try again." };
        setChatHistory(prev => [...prev, errorMessage]);
      } finally {
        setIsAnswering(false);
      }
    }
  };


  return (
    <div className="flex flex-col gap-6 h-full">
      <h2 className="text-h2 font-bold text-center mb-4">Generate an Image</h2>
      <div className="flex-grow aspect-w-16 aspect-h-9 bg-yt-neutral-bg-800 rounded-xl flex items-center justify-center p-4 relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-yt-neutral-bg-950/50 backdrop-blur-sm">
            <div className="absolute w-48 h-48 bg-yt-primary-500/10 rounded-full animate-ping"></div>
            <div className="absolute w-32 h-32 bg-yt-secondary-500/10 rounded-full animate-ping [animation-delay:-0.5s]"></div>
            <div className="relative z-10 flex flex-col items-center text-center">
              <Spinner className="w-12 h-12 text-yt-primary-400 mb-4" />
              <p className="text-body-lg font-bold text-yt-neutral-text">Conjuring pixels...</p>
              <p className="text-body-sm text-yt-neutral-text3">The AI is hard at work!</p>
            </div>
          </div>
        ) : error ? (
          <p className="text-yt-semantic-danger text-center z-10">{error}</p>
        ) : generatedImage ? (
          <img src={generatedImage} alt="Generated Thumbnail" className="object-contain max-w-full max-h-full rounded-lg z-10" />
        ) : (
          <div className="text-center text-yt-neutral-text3 flex flex-col items-center z-10">
              <i className="fa-solid fa-wand-magic-sparkles text-[32px] text-yt-neutral-text3 mb-4" aria-hidden="true"></i>
              <p className="font-bold text-body-lg">Your generated image will appear here</p>
              <p className="text-yt-neutral-text3 text-body-sm mt-1">Describe the image you want to create.</p>
          </div>
        )}
      </div>
      
      {generatedImage && !isLoading && (
        <button
          onClick={() => onImageReady(generatedImage)}
          className="w-full flex items-center justify-center gap-2 px-4 h-control-lg bg-yt-semantic-success text-yt-neutral-text hover:bg-green-600 rounded-lg transition-colors font-bold focus:outline-none focus:ring-2 focus:ring-yt-accent-focus"
        >
          <i className="fa-solid fa-paintbrush text-h4" aria-hidden="true"></i> Edit This Image
        </button>
      )}

      <div className={generatedImage ? '' : 'mt-auto pt-4'}>
        <PromptInput
          onSend={handleSend}
          isLoading={isLoading || isAnswering}
          suggestions={generatedImage ? EDIT_PROMPT_SUGGESTIONS : GENERATE_PROMPT_SUGGESTIONS}
          placeholder={generatedImage ? "Describe your edits..." : "e.g., A robot holding a red skateboard"}
          chatHistory={chatHistory}
        />
      </div>
    </div>
  );
};

export const HomePage: React.FC<HomePageProps> = ({ onImageReadyForEditor }) => {
  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-6xl">
        <h1 className="text-display font-extrabold tracking-display mb-4">Create Your Thumbnail</h1>
        <p className="text-body-lg text-yt-neutral-text3 mb-16">Start by uploading an existing image or generating a new one with AI.</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            <div className="bg-yt-neutral-bg-900 p-8 rounded-2xl flex flex-col min-h-[500px]">
                <ImageUploader onImageUpload={onImageReadyForEditor} />
            </div>
            <div className="bg-yt-neutral-bg-900 p-8 rounded-2xl flex flex-col min-h-[500px]">
                 <InitialImageGenerator onImageReady={onImageReadyForEditor} />
            </div>
        </div>
      </div>
    </div>
  );
};