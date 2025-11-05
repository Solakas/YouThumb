import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { Spinner } from './Spinner';
// Fix: Correct import to follow coding guidelines.
import { Chat } from '@google/genai';

export const Chatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([{role: 'model', content: "Hello! How can I help you today?"}]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatRef = useRef<Chat | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatRef.current = geminiService.startChat();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await geminiService.sendMessage(chatRef.current, input);
            const modelMessage: ChatMessage = { role: 'model', content: response.text };
            setMessages(prev => [...prev, modelMessage]);
        } catch (error) {
            const errorMessage: ChatMessage = { role: 'system', content: "Sorry, I couldn't get a response. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto w-full">
            <h1 className="text-h1 font-extrabold mb-4 text-center">Gemini Chat</h1>
            <div className="flex-grow bg-yt-neutral-bg-900 rounded-2xl p-4 overflow-y-auto mb-4">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md px-4 py-2 ${
                                msg.role === 'user' ? 'bg-yt-secondary-500 text-yt-neutral-text rounded-l-xl rounded-tr-xl' : 
                                msg.role === 'model' ? 'bg-yt-neutral-bg-800 rounded-r-xl rounded-tl-xl' : 'bg-yt-semantic-danger text-yt-neutral-text rounded-xl'
                            }`}>
                                <p className="text-body-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-md rounded-xl px-4 py-2 bg-yt-neutral-bg-800 flex items-center gap-2">
                                <Spinner/>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <form onSubmit={handleSend} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask me anything..."
                    className="flex-grow bg-yt-neutral-bg-800 rounded-lg px-4 h-control-md focus:outline-none focus:ring-2 focus:ring-yt-accent-focus text-body-sm"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="bg-yt-primary-500 hover:bg-yt-primary-600 text-black rounded-lg px-4 h-control-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-yt-accent-focus">
                    <i className="fa-solid fa-paper-plane text-h4" aria-hidden="true"></i>
                </button>
            </form>
        </div>
    );
};
