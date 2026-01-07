"use client";

import React, { useState, useEffect } from 'react';
import { api } from '@/context/AuthContent';
import { useAuth } from '@/context/AuthContent';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Ban, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface BlockedUser {
  _id: string;
  email: string;
  sellerDetails?: {
    businessName: string;
  };
  blockedAt?: string;
}

export default function BlockedUsersPage() {
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    fetchBlockedUsers();
  }, [user]);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/messages/blocked-users');
      setBlockedUsers(response.data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
      toast.error('Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      setUnblocking(userId);
      await api.post(`/messages/unblock/${userId}`);
      setBlockedUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
    } finally {
      setUnblocking(null);
    }
  };

  const getUserDisplayName = (user: BlockedUser) => {
    return user.sellerDetails?.businessName || user.email.split('@')[0];
  };

  const getInitials = (user: BlockedUser) => {
    const name = getUserDisplayName(user);
    return name.substring(0, 2).toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/messages')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>

        <div className="flex items-center gap-3">
          <Ban className="h-8 w-8 text-destructive" />
          <div>
            <h1 className="text-3xl font-bold">Blocked Users</h1>
            <p className="text-muted-foreground mt-1">
              Manage users you have blocked from messaging you
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {blockedUsers.length} Blocked User{blockedUsers.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : blockedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No blocked users</h3>
              <p className="text-muted-foreground">
                You haven't blocked anyone yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {blockedUsers.map((blockedUser) => (
                <div
                  key={blockedUser.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>{getInitials(blockedUser)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{getUserDisplayName(blockedUser)}</h3>
                      <p className="text-sm text-muted-foreground">{blockedUser.email}</p>
                      {blockedUser.blockedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Blocked {formatDistanceToNow(new Date(blockedUser.blockedAt), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(blockedUser.id)}
                    disabled={unblocking === blockedUser.id}
                  >
                    {unblocking === blockedUser.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Ban className="h-4 w-4 mr-2" />
                    )}
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {blockedUsers.length > 0 && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">About Blocking</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Blocked users cannot send you messages</li>
            <li>You cannot send messages to blocked users</li>
            <li>Existing conversations remain visible but inactive</li>
            <li>You can unblock users at any time</li>
          </ul>
        </div>
      )}
    </div>
  );
}

