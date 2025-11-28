"use client";

import React from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils';

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

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string) => void;
  loading: boolean;
}

export default function ConversationList({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading
}: ConversationListProps) {
  const getUserDisplayName = (user: any) => {
    return user.sellerDetails?.businessName || user.email.split('@')[0];
  };

  const getInitials = (user: any) => {
    const name = getUserDisplayName(user);
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card className="h-[600px]">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-muted-foreground mb-2">No conversations yet</p>
          <p className="text-sm text-muted-foreground">
            Start a conversation by clicking "Ask Seller" on a product page
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[600px]">
      <ScrollArea className="h-full">
        <div className="p-2">
          {conversations.map((conversation) => (
            <button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation._id)}
              className={`w-full p-3 rounded-lg transition-colors text-left hover:bg-muted/50 ${
                selectedConversation === conversation._id ? 'bg-muted' : ''
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

                  {conversation.product && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative h-8 w-8 rounded overflow-hidden bg-muted shrink-0">
                        <Image
                          src={getImageUrl(conversation.product.images[0])}
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

                  {conversation.lastMessage && (
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'font-semibold' : 'text-muted-foreground'}`}>
                      {conversation.lastMessage.message}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
