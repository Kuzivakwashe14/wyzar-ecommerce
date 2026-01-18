"use client";

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/context/AuthContent';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Decode HTML entities (e.g., &#x27; -> ')
const decodeHtmlEntities = (text: string): string => {
  const textarea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (textarea) {
    textarea.innerHTML = text;
    return textarea.value;
  }
  // Fallback for SSR
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

interface Message {
  id: string;
  sender: {
    id: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  receiver: {
    id: string;
  };
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatBoxProps {
  conversationId: string;
  otherUser: {
    _id: string;
    id?: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  currentUserId: string;
}

export default function ChatBoxEnhanced({ conversationId, otherUser, currentUserId }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    socket.on('newMessage', handleNewMessage);

    return () => {
      socket.off('newMessage', handleNewMessage);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(response.data);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Error fetching messages:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      await api.post('/messages/send', {
        receiverId: otherUser.id || otherUser._id,
        message: newMessage.trim()
      });
      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getUserDisplayName = (user: any) => {
    return user.sellerDetails?.businessName || user.email?.split('@')[0] || 'User';
  };

  const getInitials = (user: any) => {
    const name = getUserDisplayName(user);
    return name.substring(0, 2).toUpperCase();
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header - Hidden on mobile (parent handles mobile header with back button) */}
      <div className="hidden lg:flex px-4 py-3 border-b items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{getInitials(otherUser)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold">{getUserDisplayName(otherUser)}</h3>
          <p className="text-xs text-muted-foreground">{otherUser.email}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isCurrentUser = message.sender.id === currentUserId;

          return (
            <div
              key={message.id}
              className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                  isCurrentUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {decodeHtmlEntities(message.message)}
                </p>
                <p className={`text-[10px] mt-1 ${
                  isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {formatMessageTime(message.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-3 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            size="icon"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
