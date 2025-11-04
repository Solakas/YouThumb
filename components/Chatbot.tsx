
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { SendIcon } from './Icons';
import { Spinner } from './Spinner';
import type { Chat } from '@google/genai';

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
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-center">Gemini Chat</h1>
            <div className="flex-grow bg-gray-800 rounded-lg p-4 overflow-y-auto mb-4">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                         <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-md rounded-lg px-4 py-2 ${
                                msg.role === 'user' ? 'bg-blue-600' : 
                                msg.role === 'model' ? 'bg-gray-700' : 'bg-red-800 text-red-100'
                            }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                     {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-md rounded-lg px-4 py-2 bg-gray-700 flex items-center gap-2">
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
                    className="flex-grow bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 rounded-lg px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <SendIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};
