'use client';

import BottomNav from '@/components/BottomNav';
import { ArrowLeft, Menu, Trees, Wind, Info, Mic, ArrowUp, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

  // Load selected center and zone from database
  useEffect(() => {
    if (!user) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch(`/api/preferences?userId=${user.id}`);
        const data = await response.json();

        if (data.success && data.preferences) {
          setSelectedCenter(data.preferences.selected_center);
          setSelectedZone(data.preferences.selected_zone);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save chat to database whenever messages change
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const saveChat = async () => {
      try {
        const title = messages[0]?.content.substring(0, 50) || 'New Chat';
        const response = await fetch('/api/chat-history', {
          method: currentChatId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: currentChatId,
            userId: user.id,
            center: selectedCenter,
            zone: selectedZone,
            title,
            messages
          }),
        });

        const data = await response.json();
        if (data.success && data.chatId && !currentChatId) {
          setCurrentChatId(data.chatId);
        }
      } catch (error) {
        console.error('Error saving chat:', error);
      }
    };

    const debounceTimer = setTimeout(saveChat, 1000);
    return () => clearTimeout(debounceTimer);
  }, [messages, user, currentChatId, selectedCenter, selectedZone]);

  const loadChat = (chatId: string, chatMessages: Message[], center: string | null, zone: string | null) => {
    setCurrentChatId(chatId);
    setMessages(chatMessages);
    setSelectedCenter(center);
    setSelectedZone(zone);
    setIsSidebarOpen(false);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
    setIsSidebarOpen(false);
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          conversationHistory: messages,
          center: selectedCenter,
          zone: selectedZone
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    sendMessage(question);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-body antialiased overflow-hidden h-screen flex flex-col pb-32 max-w-md mx-auto border-x border-primary/10">
      <header className="flex items-center bg-gradient-to-b from-surface-dark to-background-dark p-5 justify-between shrink-0 z-10 border-b border-primary/10 backdrop-blur-xl opacity-0 animate-fade-in-up">
        {selectedZone && selectedCenter ? (
          <div className="px-3 py-1.5 rounded-lg bg-surface-lighter/50 border border-primary/30">
            <p className="text-[10px] font-display font-bold text-primary uppercase tracking-wider">
              {selectedZone}
            </p>
          </div>
        ) : (
          <div className="px-3 py-1.5 rounded-lg bg-surface-lighter/50 border border-slate-600/30">
            <p className="text-[10px] font-display font-bold text-slate-500 uppercase tracking-wider">
              No Location
            </p>
          </div>
        )}
        <div className="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
          <h2 className="text-white text-xl font-display font-bold leading-tight tracking-wide">SCOUT AI</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-[9px] font-display font-bold text-primary tracking-[0.15em] uppercase">Online</span>
          </div>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex size-10 items-center justify-center text-slate-300 hover:text-white transition-colors rounded-xl hover:bg-surface-lighter/50"
        >
          <Menu size={22} />
        </button>
      </header>

      <main ref={chatContainerRef} className="flex-1 overflow-y-auto no-scrollbar relative flex flex-col w-full">
        {messages.length === 0 ? (
          <>
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 min-h-[300px] opacity-0 animate-fade-in-up delay-100">
              {/* AI Avatar with Glow Effect */}
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-primary/30 blur-[60px] rounded-full animate-pulse-glow"></div>
                <div
                  className="bg-center bg-no-repeat bg-cover rounded-full size-36 relative z-10 shadow-elevation border-4 border-surface-dark ring-2 ring-primary/30 overflow-hidden"
                  style={{
                    backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuA4ZqF0Fm2wxKq-yiBJ2UzyAl2SIVE8ik0n7217w6-3F9_4UjU66WvdgTXxM3XzI1sZY1N8P680-34HZKwimU8tepPmkP2hcrZH8cb6Y9YWKkJjieza_XPTXDfDHYwa7hbAqPjT-soEax2PbT6PGjiU2hbSAzsfpb6VGabPuYwwo93y54bZGsLPN0ZNASw_b0ndumPCPJciWSynyAIf8WR8j1hHlAS3HuFZQ_zQW_AD0FsrNlrKHjk8ly5VoHq2lJw96bH-dT7_4h-X")`,
                  }}
                ></div>
                {/* Status Badge */}
                <div className="absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full bg-primary text-black border-2 border-background-dark">
                  <Zap size={14} className="fill-black" />
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 text-center max-w-[300px]">
                <div>
                  <h1 className="text-white text-[28px] font-display font-bold leading-tight tracking-wide mb-2">
                    READY TO GUIDE
                  </h1>
                  <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full mx-auto mb-3"></div>
                </div>
                <p className="text-slate-400 text-[15px] leading-relaxed">
                  Scout is monitoring conditions. Ask about terrain, weather, or safety protocols.
                </p>
              </div>
            </div>

            {/* Quick Suggestions */}
            <div className="px-5 pb-4 opacity-0 animate-fade-in-up delay-200">
              <div className="flex flex-col gap-3 w-full">
                <button
                  onClick={() => handleQuickQuestion('Is the trees off Lincoln safe?')}
                  className="group flex items-center w-full gap-3 p-4 bg-surface-dark rounded-xl active:scale-[0.97] transition-all border border-primary/20 hover:border-primary/40 shadow-lg hover:shadow-primary/10"
                >
                  <div className="flex shrink-0 items-center justify-center size-11 rounded-lg bg-primary/15 border border-primary/30 group-hover:bg-primary/25 transition-colors">
                    <Trees size={22} className="text-primary" />
                  </div>
                  <div className="flex flex-col items-start text-left flex-1">
                    <p className="text-white text-[15px] font-medium">Is the trees off Lincoln safe?</p>
                  </div>
                  <ArrowUp size={18} className="text-slate-600 -rotate-45" />
                </button>

                <button
                  onClick={() => handleQuickQuestion('Show me the wind forecast')}
                  className="group flex items-center w-full gap-3 p-4 bg-surface-dark rounded-xl active:scale-[0.97] transition-all border border-glacier/20 hover:border-glacier/40 shadow-lg hover:shadow-glacier/10"
                >
                  <div className="flex shrink-0 items-center justify-center size-11 rounded-lg bg-glacier/15 border border-glacier/30 group-hover:bg-glacier/25 transition-colors">
                    <Wind size={22} className="text-glacier" />
                  </div>
                  <div className="flex flex-col items-start text-left flex-1">
                    <p className="text-white text-[15px] font-medium">Show me the wind forecast</p>
                  </div>
                  <ArrowUp size={18} className="text-slate-600 -rotate-45" />
                </button>

                <button
                  onClick={() => handleQuickQuestion("Explain 'Persistent Slab'")}
                  className="group flex items-center w-full gap-3 p-4 bg-surface-dark rounded-xl active:scale-[0.97] transition-all border border-sunset/20 hover:border-sunset/40 shadow-lg hover:shadow-sunset/10"
                >
                  <div className="flex shrink-0 items-center justify-center size-11 rounded-lg bg-sunset/15 border border-sunset/30 group-hover:bg-sunset/25 transition-colors">
                    <Info size={22} className="text-sunset" />
                  </div>
                  <div className="flex flex-col items-start text-left flex-1">
                    <p className="text-white text-[15px] font-medium">Explain &apos;Persistent Slab&apos;</p>
                  </div>
                  <ArrowUp size={18} className="text-slate-600 -rotate-45" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-4 px-5 py-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-primary to-glacier text-black'
                      : 'bg-surface-dark text-slate-200 border border-primary/20'
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-surface-dark border border-primary/20">
                  <div className="flex items-center gap-2">
                    <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                    <div className="size-2 rounded-full bg-primary animate-pulse delay-100"></div>
                    <div className="size-2 rounded-full bg-primary animate-pulse delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Chat Input */}
      <div className="shrink-0 bg-background-dark px-5 pb-3 pt-3 border-t border-primary/10 z-20 opacity-0 animate-fade-in-up delay-300">
        <form onSubmit={handleSubmit} className="flex flex-col w-full">
          <div className="flex w-full items-stretch rounded-2xl h-14 bg-surface-dark border border-primary/20 shadow-elevation hover:border-primary/30 transition-all">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className="flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-l-2xl text-white focus:outline-0 focus:ring-0 border-none bg-transparent h-full placeholder:text-slate-500 pl-5 pr-2 text-[15px] font-normal leading-normal"
              placeholder="Message Scout..."
            />
            <div className="flex items-center justify-center pr-2 pl-2 gap-2">
              <button
                type="button"
                className="flex items-center justify-center size-10 rounded-xl hover:bg-white/5 active:scale-95 transition-all"
              >
                <Mic size={22} className="text-slate-500 hover:text-primary transition-colors" />
              </button>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-primary to-glacier text-black hover:brightness-110 active:scale-95 transition-all shadow-tactical disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </form>
      </div>

      <BottomNav />

      <ChatHistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLoadChat={loadChat}
        onNewChat={startNewChat}
        currentChatId={currentChatId}
      />
    </div>
  );
}
