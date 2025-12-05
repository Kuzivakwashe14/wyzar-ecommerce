"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/context/AuthContent';
import { useAuth } from '@/context/AuthContent';
import { useRouter } from 'next/navigation';
import ChatBoxEnhanced from '@/components/chat/ChatBoxEnhanced';
import ConversationList from '@/components/chat/ConversationList';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MessageCircle, Search, X, Ban } from 'lucide-react';

interface Conversation {
  _id: string;
  otherUser: {
    _id: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  product?: {
    _id: string;
    name: string;
    images: string[];
    price: number;
  };
  lastMessage?: {
    message: string;
    createdAt: string;
  };
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchConversations();
  }, [user]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/conversations');
      setConversations(response.data);

      // Auto-select first conversation if none selected
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]._id);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    try {
      setIsSearching(true);
      const response = await api.get(`/messages/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching messages:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const selectedConv = conversations.find(c => c._id === selectedConversation);

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2 text-shop_dark_green">
                  <MessageCircle className="h-8 w-8" />
                  Messages
                </h1>
                <p className="text-gray-600 mt-2">
                  Chat with buyers and sellers
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/messages/blocked')}
                className="mt-1 border-shop_dark_green text-shop_dark_green hover:bg-shop_dark_green hover:text-white"
              >
                <Ban className="h-4 w-4 mr-2" />
                Blocked Users
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-64 border-gray-300 focus:border-shop_dark_green"
            />
            <Button type="submit" disabled={isSearching || searchQuery.length < 2} className="bg-shop_dark_green hover:bg-shop_light_green text-white">
              <Search className="h-4 w-4" />
            </Button>
            {searchQuery && (
              <Button type="button" variant="outline" onClick={clearSearch} className="border-gray-300">
                <X className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 p-4 bg-shop_dark_green/5 border border-shop_dark_green/20 rounded-lg">
            <h3 className="font-semibold mb-3 text-shop_dark_green">Search Results ({searchResults.length})</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searchResults.map((msg: any) => (
                <button
                  key={msg._id}
                  onClick={() => {
                    setSelectedConversation(msg.conversation._id);
                    clearSearch();
                  }}
                  className="w-full text-left p-3 hover:bg-white rounded-lg transition-colors"
                >
                  <p className="text-sm font-medium text-shop_dark_green">
                    {msg.sender._id === user?._id ? 'You' : msg.sender.sellerDetails?.businessName || msg.sender.email}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(msg.createdAt).toLocaleDateString()}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="md:col-span-1">
          <ConversationList
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            loading={loading}
          />
        </div>

        {/* Chat Box */}
        <div className="md:col-span-2">
          {selectedConv && user ? (
            <ChatBoxEnhanced
              conversationId={selectedConv._id}
              otherUser={selectedConv.otherUser}
              currentUserId={user._id || user.id}
            />
          ) : (
            <Card className="h-[600px] flex items-center justify-center border-gray-200">
              <CardContent className="text-center">
                <MessageCircle className="h-16 w-16 text-shop_dark_green/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-shop_dark_green">Select a conversation</h3>
                <p className="text-gray-600">
                  Choose a conversation from the list to start chatting
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

