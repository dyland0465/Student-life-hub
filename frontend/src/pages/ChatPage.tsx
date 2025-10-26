import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Users } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChatMessage } from '@/types';

export function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Generate a consistent username for this session
  const getSessionUsername = () => {
    if (currentUsername) return currentUsername;
    
    // Generate a username and store it in sessionStorage
    const storedUsername = sessionStorage.getItem('chatUsername');
    if (storedUsername) {
      setCurrentUsername(storedUsername);
      return storedUsername;
    }
    
    const newUsername = `Student${Math.floor(Math.random() * 9999) + 1}`;
    sessionStorage.setItem('chatUsername', newUsername);
    setCurrentUsername(newUsername);
    return newUsername;
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages on component mount
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await api.getChatMessages();
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const messageText = newMessage.trim();
    const username = getSessionUsername();
    setNewMessage('');
    setIsSending(true);

    try {
      const response = await api.sendChatMessage(messageText, username);
      setMessages(prev => [...prev, response.message]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore the message if sending failed
      setNewMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };


  return (
    <div className="flex flex-col h-full -m-6">
      <div className="flex items-start justify-between mb-6 px-6 pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Chat</h2>
          <p className="text-muted-foreground">
            Chat with other students and get help with your coursework.
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col mx-6">
        
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading messages...</div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isOwnMessage = currentUsername && message.username === currentUsername;
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-2 py-1 px-2 hover:bg-muted/30 transition-colors ${
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`flex flex-col min-w-0 max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-medium ${isOwnMessage ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {message.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                      <div
                        className={`px-3 py-2 rounded-lg break-words ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-t p-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                disabled={isSending}
                maxLength={500}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!newMessage.trim() || isSending}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Messages are anonymous and will be moderated for inappropriate content.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
