'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Paperclip, SendHorizontal } from 'lucide-react';
import { useAuth } from "@/context/AuthContext"; 
import { cn } from "@/lib/utils";

// Define the structure for a chat message
interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export default function SupportChatPage() {
  const { user } = useAuth(); 
  const [messages, setMessages] = useState<Message[]>([]); 
  const [inputMessage, setInputMessage] = useState(''); 
  const [isSending, setIsSending] = useState(false); 
  const messagesEndRef = useRef<HTMLDivElement>(null); 

  // Mock AI response function
  const getMockAIResponse = (inputText: string): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`This is a simulated AI response to: "${inputText}".
This response might have multiple lines.`);
      }, 1500); 
    });
  };

  // Function to handle sending a message
  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault(); 
    const text = inputMessage.trim();
    if (!text) return; 

    const newUserMessage: Message = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: text,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputMessage('');
    setIsSending(true); 

    // Simulate getting AI response
    try {
      const aiText = await getMockAIResponse(text);
      const newAiMessage: Message = {
        id: Date.now().toString() + '-ai',
        sender: 'ai',
        text: aiText,
      };
      setMessages((prev) => [...prev, newAiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
    } finally {
      setIsSending(false); 
    }
  };

  // Effect to scroll to the bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    // Main container for the chat page
    <div className="flex flex-col h-[calc(100vh-60px-2rem)] md:h-[calc(100vh-60px-3rem)]"> 
      
      {/* Chat messages display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg border mb-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 pt-10">Ask the AI assistant about your organization's data.</div>
        )}
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={cn(
              "flex items-start gap-3",
              message.sender === 'user' ? "justify-end" : "justify-start"
            )}
          >
            {message.sender === 'ai' && (
              <Avatar className="h-8 w-8 border">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
            )}
            {/* Updated message bubble styling */}
            <div 
              className={cn(
                "max-w-[70%] rounded-lg p-3 text-sm shadow-sm break-words", 
                message.sender === 'user' 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-secondary-foreground" 
              )}
            >
              {/* Render text, splitting by newline character */}
              {message.text.split('\n').map((line, index) => ( 
                 <React.Fragment key={index}>{line}<br /></React.Fragment>
              ))}
            </div>
            {message.sender === 'user' && (
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={user?.picture} alt={user?.name || 'User'} />
                <AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback>
              </Avatar>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} /> 
      </div>

      {/* Input form area */}
      <form 
        onSubmit={handleSendMessage}
        className="relative overflow-hidden rounded-lg border bg-background focus-within:ring-1 focus-within:ring-ring"
      >
        <Textarea
          id="message"
          placeholder="Type your message here..."
          className="min-h-12 resize-none border-0 p-3 shadow-none focus-visible:ring-0"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault(); 
              handleSendMessage();
            }
          }}
          rows={1} 
          disabled={isSending}
        />
        <div className="flex items-center p-3 pt-0">
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" disabled={isSending}>
                  <Paperclip className="size-4" />
                  <span className="sr-only">Attach file</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Attach File (Not implemented)</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button 
             type="submit" 
             size="sm" 
             className="ml-auto gap-1.5" 
             disabled={!inputMessage.trim() || isSending}
           >
            Send
            <SendHorizontal className="size-3.5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
