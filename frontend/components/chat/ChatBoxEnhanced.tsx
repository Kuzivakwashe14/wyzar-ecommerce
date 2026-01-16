"use client";

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/context/AuthContent';
import { useSocket } from '@/context/SocketContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, Loader2, MoreVertical, Ban, Flag, Image as ImageIcon, X, ChevronLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { getImageUrl } from '@/lib/utils';
import Image from 'next/image';

interface Message {
  _id: string;
  sender: {
    _id: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  receiver: {
    _id: string;
  };
  message: string;
  attachments?: string[];
  isRead: boolean;
  createdAt: string;
}

interface ChatBoxProps {
  conversationId: string;
  otherUser: {
    _id: string;
    email: string;
    sellerDetails?: {
      businessName: string;
    };
  };
  currentUserId: string;
  onBack?: () => void;
}

export default function ChatBoxEnhanced({ conversationId, otherUser, currentUserId, onBack }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const { socket } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch messages and check block status
  useEffect(() => {
    fetchMessages();
    checkBlockStatus();
  }, [conversationId]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    };

    const handleUserTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId === otherUser._id) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: any) => {
      if (data.conversationId === conversationId && data.userId === otherUser._id) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [socket, conversationId, otherUser._id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/messages/conversation/${conversationId}`);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const checkBlockStatus = async () => {
    try {
      const response = await api.get(`/messages/is-blocked/${otherUser._id}`);
      setIsBlocked(response.data.isBlocked);
    } catch (error) {
      console.error('Error checking block status:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', {
      conversationId,
      receiverId: otherUser._id
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        conversationId,
        receiverId: otherUser._id
      });
    }, 2000);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = files.slice(0, 5 - selectedImages.length);
    setSelectedImages([...selectedImages, ...newImages]);

    // Create previews
    newImages.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if ((!newMessage.trim() && selectedImages.length === 0) || sending) return;

    try {
      setSending(true);

      if (selectedImages.length > 0) {
        // Send with images
        const formData = new FormData();
        formData.append('receiverId', otherUser._id);
        formData.append('message', newMessage.trim());
        selectedImages.forEach(file => {
          formData.append('images', file);
        });

        const response = await api.post('/messages/send-with-images', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        setMessages(prev => [...prev, response.data.message]);
      } else {
        // Send text only
        const response = await api.post('/messages/send', {
          receiverId: otherUser._id,
          message: newMessage.trim()
        });

        setMessages(prev => [...prev, response.data.message]);
      }

      // Emit socket event
      if (socket) {
        socket.emit('stop_typing', {
          conversationId,
          receiverId: otherUser._id
        });
      }

      setNewMessage('');
      setSelectedImages([]);
      setImagePreviews([]);
      scrollToBottom();
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.msg || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleBlockUser = async () => {
    try {
      if (isBlocked) {
        await api.post(`/messages/unblock/${otherUser._id}`);
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        await api.post(`/messages/block/${otherUser._id}`);
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to update block status');
    }
  };

  const handleReportUser = async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }

    try {
      await api.post('/messages/report', {
        reportedUserId: otherUser._id,
        reason: reportReason,
        description: reportDescription,
        conversationId
      });

      toast.success('Report submitted successfully');
      setShowReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      console.error('Error reporting user:', error);
      toast.error('Failed to submit report');
    }
  };

  const getUserDisplayName = (user: any) => {
    return user.sellerDetails?.businessName || user.email.split('@')[0];
  };

  const getInitials = (user: any) => {
    const name = getUserDisplayName(user);
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Card className="h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </Card>
    );
  }

  return (
    <>
      <Card className="h-[600px] flex flex-col border-0 md:border">
        <CardHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="md:hidden mr-1 -ml-2"
                  onClick={onBack}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              )}
              <Avatar>
                <AvatarFallback>{getInitials(otherUser)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-lg font-semibold leading-none">{getUserDisplayName(otherUser)}</div>
                <div className="text-sm text-muted-foreground font-normal mt-1">{otherUser.email}</div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleBlockUser}>
                  <Ban className="mr-2 h-4 w-4" />
                  {isBlocked ? 'Unblock User' : 'Block User'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isCurrentUser = message.sender._id === currentUserId;

                return (
                  <div
                    key={message._id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[70%] ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(message.sender)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.message && (
                            <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                          )}

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 grid grid-cols-2 gap-2">
                              {message.attachments.map((img, idx) => (
                                <div key={idx} className="relative aspect-square rounded overflow-hidden">
                                  <Image
                                    src={getImageUrl(img)}
                                    alt="Attachment"
                                    fill
                                    style={{ objectFit: 'cover' }}
                                    unoptimized
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">{getInitials(otherUser)}</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4">
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mb-3 flex gap-2 flex-wrap">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative w-20 h-20">
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded" />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                multiple
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending || selectedImages.length >= 5}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>

              <Input
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                placeholder="Type a message..."
                disabled={sending || isBlocked}
                className="flex-1"
              />

              <Button
                type="submit"
                disabled={(!newMessage.trim() && selectedImages.length === 0) || sending || isBlocked}
                size="icon"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>

            {isBlocked && (
              <p className="text-xs text-red-500 mt-2">You have blocked this user. Unblock to send messages.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report User Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Please select a reason for reporting {getUserDisplayName(otherUser)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Reason</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="inappropriate_content">Inappropriate Content</SelectItem>
                  <SelectItem value="scam">Scam/Fraud</SelectItem>
                  <SelectItem value="fake_account">Fake Account</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Details (Optional)</Label>
              <Textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more details..."
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowReportDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleReportUser}>
                Submit Report
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

