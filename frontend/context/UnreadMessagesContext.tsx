"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '@/context/AuthContent';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContent';
import { usePathname } from 'next/navigation';

interface UnreadMessagesContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
}

const UnreadMessagesContext = createContext<UnreadMessagesContextType | undefined>(undefined);

export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  if (!context) {
    throw new Error('useUnreadMessages must be used within UnreadMessagesProvider');
  }
  return context;
};

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { socket } = useSocket();
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/messages/unread-count');
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const init = async () => {
      if (isAuthenticated && user) {
        await refreshUnreadCount();
        interval = setInterval(refreshUnreadCount, 30000);
      } else {
        setUnreadCount(0);
      }
    };

    init();

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAuthenticated, user, refreshUnreadCount]);

  // Socket realtime updates
  useEffect(() => {
    if (!socket || !isAuthenticated || !user) return;

    const handleIncomingMessage = () => {
      if (pathname?.startsWith('/messages')) {
        refreshUnreadCount();
        return;
      }
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_message', handleIncomingMessage);

    return () => {
      socket.off('new_message', handleIncomingMessage);
    };
  }, [socket, isAuthenticated, user, pathname, refreshUnreadCount]);

  // Refresh when entering messages page
  useEffect(() => {
    if (isAuthenticated && user && pathname?.startsWith('/messages')) {
      const refresh = async () => {
        await refreshUnreadCount();
      };
      refresh();
    }
  }, [pathname, isAuthenticated, user, refreshUnreadCount]);

  return (
    <UnreadMessagesContext.Provider value={{ unreadCount, refreshUnreadCount }}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
