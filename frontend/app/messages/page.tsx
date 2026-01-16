"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/context/AuthContent';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Search, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ChatBoxEnhanced from '@/components/chat/ChatBoxEnhanced';
import { useAuth } from '@/context/AuthContent';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

// Decode HTML entities (e.g., &#x27; -> ')
const decodeHtmlEntities = (text: string): string => {
  if (!text) return text;
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
};

interface Conversation {
  id: string;
  _id: string;
  otherUser: {
    _id: string;
    id: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  lastMessage?: {
    message: string;
    createdAt: string;
  };
  unreadCount: number;
  product?: {
    id: string;
    name: string;
    images: string[];
  };
}

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchConversations();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);
    } catch (error: any) {
      if (error?.response?.status === 401) {
        console.log('User not authenticated');
      } else {
        console.error('Error fetching conversations:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const getUserDisplayName = (user: any) => {
    return user?.sellerDetails?.businessName || user?.email?.split('@')[0] || 'User';
  };

  const getInitials = (user: any) => {
    const name = getUserDisplayName(user);
    return name?.substring(0, 2).toUpperCase() || 'U';
  };

  const filteredConversations = conversations.filter(conv => {
    const name = getUserDisplayName(conv.otherUser).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const selectedConv = conversations.find(
    c => c.id === selectedConversation || c._id === selectedConversation
  );

  // Handle back button on mobile
  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="p-8 text-center max-w-md mx-auto">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground mb-4">
            Please log in to view your messages
          </p>
          <Button asChild>
            <a href="/login">Log In</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 sm:px-4 py-0 sm:py-6">
      {/* Header - Hidden on mobile when chat is open */}
      <div className={`px-4 sm:px-0 py-4 sm:py-0 mb-4 sm:mb-6 ${selectedConversation ? 'hidden sm:block' : ''}`}>
        <div className="flex items-center gap-3">
          <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Messages</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Chat with buyers and sellers</p>
          </div>
        </div>
      </div>

      {/* Search - Hidden on mobile when chat is open */}
      <div className={`px-4 sm:px-0 mb-4 ${selectedConversation ? 'hidden sm:block' : ''}`}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {conversations.length === 0 ? (
        <Card className="mx-4 sm:mx-0 p-8 text-center">
          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
          <p className="text-muted-foreground">
            Start a conversation by messaging a seller on a product page
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 sm:gap-4 h-[calc(100vh-180px)] sm:h-[600px]">
          {/* Conversations List - Hidden on mobile when chat is selected */}
          <Card className={`lg:col-span-1 overflow-hidden rounded-none sm:rounded-lg border-0 sm:border ${
            selectedConversation ? 'hidden lg:block' : ''
          }`}>
            <ScrollArea className="h-full">
              <div className="divide-y">
                {filteredConversations.map((conversation, index) => (
                  <button
                    key={conversation.id || conversation._id || `conv-${index}`}
                    onClick={() => setSelectedConversation(conversation.id || conversation._id)}
                    className={`w-full p-4 transition-colors text-left hover:bg-muted/50 ${
                      selectedConversation === (conversation.id || conversation._id) ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback>{getInitials(conversation.otherUser)}</AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                            {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold truncate">
                            {getUserDisplayName(conversation.otherUser)}
                          </h4>
                          {conversation.lastMessage && (
                            <span className="text-xs text-muted-foreground ml-2 shrink-0">
                              {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                addSuffix: false
                              })}
                            </span>
                          )}
                        </div>

                        {/* Product info if exists */}
                        {conversation.product && (
                          <div className="flex items-center gap-2 mb-1">
                            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0">
                              <Image
                                src={getImageUrl(conversation.product.images?.[0])}
                                alt={conversation.product.name}
                                fill
                                style={{ objectFit: 'cover' }}
                                unoptimized
                              />
                            </div>
                            <span className="text-xs text-muted-foreground truncate">
                              {conversation.product.name}
                            </span>
                          </div>
                        )}

                        {/* Last message preview */}
                        {conversation.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {decodeHtmlEntities(conversation.lastMessage.message)}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Chat Area - Full screen on mobile when selected */}
          <Card className={`lg:col-span-2 overflow-hidden rounded-none sm:rounded-lg border-0 sm:border ${
            !selectedConversation ? 'hidden lg:block' : ''
          }`}>
            {selectedConv && user ? (
              <div className="h-full flex flex-col">
                {/* Mobile back button header */}
                <div className="lg:hidden flex items-center gap-2 px-4 py-3 border-b">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-sm">{getInitials(selectedConv.otherUser)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {getUserDisplayName(selectedConv.otherUser)}
                    </h3>
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <ChatBoxEnhanced
                    conversationId={selectedConv.id || selectedConv._id}
                    otherUser={selectedConv.otherUser}
                    currentUserId={user.id}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <MessageCircle className="h-16 w-16 mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
