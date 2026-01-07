'use client';

import { Send, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  id: string;
  title: string;
  created_at: string;
  messages: Message[];
  center: string | null;
  zone: string | null;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth');
    }
  }, [user, authLoading, router]);

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

  useEffect(() => {
    if (!user) return;

    const loadChatHistory = async () => {
      try {
        const response = await fetch(`/api/chat-history?userId=${user.id}`);
        const data = await response.json();

        if (data.success) {
          setChatHistory(data.chats);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      }
    };

    loadChatHistory();
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const loadChat = (chat: ChatHistory) => {
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setSelectedCenter(chat.center);
    setSelectedZone(chat.zone);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setMessages([]);
  };

  const deleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chat-history?chatId=${chatId}`, { method: 'DELETE' });
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        startNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-4rem)]">
          {/* Sidebar - Chat History */}
          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <div className="p-4 border-b">
                <Button onClick={startNewChat} className="w-full" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                        currentChatId === chat.id
                          ? 'bg-secondary'
                          : 'hover:bg-secondary/50'
                      }`}
                      onClick={() => loadChat(chat)}
                    >
                      <p className="text-sm font-medium truncate pr-8">
                        {chat.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(chat.created_at).toLocaleDateString()}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>

          {/* Main Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Scout AI</h1>
                    <p className="text-sm text-muted-foreground">
                      {selectedZone && selectedCenter ? `${selectedZone}` : 'No location selected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="mb-8">
                      <div className="w-16 h-16 rounded-full bg-muted mb-4 mx-auto flex items-center justify-center">
                        <Send className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h2 className="text-xl font-semibold mb-2">Start a conversation</h2>
                      <p className="text-muted-foreground max-w-md">
                        Ask about terrain, weather conditions, or avalanche safety protocols.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-6 text-left justify-start"
                        onClick={() => sendMessage('Is the trees off Lincoln safe?')}
                      >
                        <div>
                          <p className="font-medium">Terrain Safety</p>
                          <p className="text-sm text-muted-foreground">Is the trees off Lincoln safe?</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-6 text-left justify-start"
                        onClick={() => sendMessage('Show me the wind forecast')}
                      >
                        <div>
                          <p className="font-medium">Weather Forecast</p>
                          <p className="text-sm text-muted-foreground">Show me the wind forecast</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-6 text-left justify-start"
                        onClick={() => sendMessage("Explain 'Persistent Slab'")}
                      >
                        <div>
                          <p className="font-medium">Avalanche Education</p>
                          <p className="text-sm text-muted-foreground">Explain &apos;Persistent Slab&apos;</p>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-auto py-4 px-6 text-left justify-start"
                        onClick={() => sendMessage('What are current conditions?')}
                      >
                        <div>
                          <p className="font-medium">Current Conditions</p>
                          <p className="text-sm text-muted-foreground">What are current conditions?</p>
                        </div>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg px-4 py-3">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse"></div>
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse delay-75"></div>
                            <div className="w-2 h-2 rounded-full bg-foreground/40 animate-pulse delay-150"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-4 border-t">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Message Scout..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!inputValue.trim() || isLoading}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
