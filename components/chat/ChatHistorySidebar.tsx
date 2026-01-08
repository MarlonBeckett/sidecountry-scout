'use client';

import { useEffect, useState } from 'react';
import { X, Plus, MessageSquare, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatHistory {
  id: string;
  title: string;
  center: string | null;
  zone: string | null;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadChat: (chatId: string, messages: Message[], center: string | null, zone: string | null) => void;
  onNewChat: () => void;
  currentChatId: string | null;
}

export default function ChatHistorySidebar({
  isOpen,
  onClose,
  onLoadChat,
  onNewChat,
  currentChatId
}: ChatHistorySidebarProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadChatHistory();
    }
  }, [isOpen, user]);

  const loadChatHistory = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat-history?userId=${user.id}`);
      const data = await response.json();

      if (data.success) {
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  const groupChatsByDate = () => {
    const groups: { [key: string]: ChatHistory[] } = {};

    chats.forEach(chat => {
      const dateKey = formatDate(chat.created_at);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(chat);
    });

    return groups;
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this chat?')) return;

    try {
      const response = await fetch(`/api/chat-history?chatId=${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChats(prev => prev.filter(chat => chat.id !== chatId));
        if (currentChatId === chatId) {
          onNewChat();
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  if (!isOpen) return null;

  const groupedChats = groupChatsByDate();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 h-full w-80 bg-surface-dark border-l border-primary/20 z-50 shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-primary/20">
          <h2 className="text-white text-xl font-display font-bold">Chat History</h2>
          <button
            onClick={onClose}
            className="flex size-10 items-center justify-center text-slate-400 hover:text-white transition-colors rounded-xl hover:bg-surface-lighter/50"
          >
            <X size={22} />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 border-b border-primary/10">
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 w-full p-3 bg-gradient-to-br from-primary to-glacier text-black rounded-xl hover:brightness-110 active:scale-[0.97] transition-all shadow-tactical"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="font-display font-bold text-sm">New Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                <div className="size-2 rounded-full bg-primary animate-pulse delay-100"></div>
                <div className="size-2 rounded-full bg-primary animate-pulse delay-200"></div>
              </div>
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare size={48} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">No chat history yet</p>
              <p className="text-slate-500 text-xs mt-1">Start a conversation to see it here</p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {Object.entries(groupedChats).map(([dateKey, dateChats]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3 px-2">
                    <Calendar size={14} className="text-primary" />
                    <h3 className="text-xs font-display font-bold text-primary uppercase tracking-wider">
                      {dateKey}
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {dateChats.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => onLoadChat(chat.id, chat.messages, chat.center, chat.zone)}
                        className={`group w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                          currentChatId === chat.id
                            ? 'bg-primary/20 border border-primary/40'
                            : 'bg-surface-lighter/30 border border-primary/10 hover:border-primary/30 hover:bg-surface-lighter/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate mb-1">
                              {chat.title}
                            </p>
                            {(chat.center || chat.zone) && (
                              <div className="flex items-center gap-2">
                                {chat.zone && (
                                  <span className="text-[10px] text-primary font-display font-bold uppercase tracking-wider">
                                    {chat.zone}
                                  </span>
                                )}
                                {chat.center && (
                                  <span className="text-[10px] text-slate-500">
                                    {chat.center}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleDeleteChat(chat.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all p-1 rounded"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
