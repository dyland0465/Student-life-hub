import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Settings } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ChatRoomTabs } from '@/components/chat/ChatRoomTabs';
import { CreateRoomDialog } from '@/components/chat/CreateRoomDialog';
import { JoinRoomDialog } from '@/components/chat/JoinRoomDialog';
import { RoomSettingsDialog } from '@/components/chat/RoomSettingsDialog';
import type { ChatMessage, ChatRoom } from '@/types';

export function ChatPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  
  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState('global');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [chatDisplayName, setChatDisplayName] = useState<string>('');
  const [isUsernameReady, setIsUsernameReady] = useState(false);
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  
  // Generate a consistent username for this session (for global chat)
  const getSessionUsername = () => {
    if (currentUsername) return currentUsername;
    
    // Generate a username and store it in sessionStorage
    const storedUsername = sessionStorage.getItem('chatUsername');
    if (storedUsername) {
      return storedUsername;
    }
    
    const newUsername = `Student${Math.floor(Math.random() * 9999) + 1}`;
    sessionStorage.setItem('chatUsername', newUsername);
    return newUsername;
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus input after sending message
  useEffect(() => {
    if (!isSending && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [isSending]);

  // Load user's chat rooms and profile on mount
  useEffect(() => {
    if (currentUser) {
      loadChatRooms();
      loadChatProfile();
    }
  }, [currentUser]);

  // Initialize session username on mount to prevent flash
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('chatUsername');
    if (storedUsername) {
      setCurrentUsername(storedUsername);
    } else {
      const newUsername = `Student${Math.floor(Math.random() * 9999) + 1}`;
      sessionStorage.setItem('chatUsername', newUsername);
      setCurrentUsername(newUsername);
    }
    setIsUsernameReady(true);
  }, []);

  // Load messages when active room changes
  useEffect(() => {
    if (activeRoomId) {
      loadRoomMessages(activeRoomId);
    }
  }, [activeRoomId]);

  const loadChatRooms = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.getChatRooms();
      setRooms(response.rooms || []);
      
      // Ensure global room exists
      const globalRoom = response.rooms?.find((room: ChatRoom) => room.id === 'global');
      if (!globalRoom) {
        // Add global room if not present
        setRooms(prev => [...prev, {
          id: 'global',
          name: 'Global Chat',
          code: 'GLOBAL',
          type: 'global',
          members: [],
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          maxMembers: 1000,
          unreadCount: 0
        }]);
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat rooms',
        variant: 'destructive',
      });
    }
  };

  const loadChatProfile = async () => {
    if (!currentUser) return;
    
    try {
      const response = await api.getChatProfile();
      setChatDisplayName(response.profile?.chatDisplayName || currentUser.displayName || 'You');
    } catch (error) {
      console.error('Error loading chat profile:', error);
      // Fallback to display name or 'You'
      setChatDisplayName(currentUser.displayName || 'You');
    }
  };

  const loadRoomMessages = async (roomId: string) => {
    try {
      setIsLoading(true);
      const response = await api.getRoomMessages(roomId);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Error loading room messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load messages',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !currentUser) return;

    const messageText = newMessage.trim();
    setIsSending(true);

    // Create optimistic message
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      userId: currentUser.uid,
      username: activeRoomId === 'global' ? getSessionUsername() : chatDisplayName,
      content: messageText,
      timestamp: new Date().toISOString(),
      roomId: activeRoomId,
      isModerated: false,
    };

    // Add optimistic message
    setMessages(prev => [...prev, optimisticMessage]);
    
    // Clear input after adding optimistic message
    setNewMessage('');

    try {
      let response;
      if (activeRoomId === 'global') {
        // Use new room API for global chat with anonymous username
        response = await api.sendRoomMessage(activeRoomId, messageText, getSessionUsername());
      } else {
        // Use new room API for private chats
        response = await api.sendRoomMessage(activeRoomId, messageText);
      }

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? response.message : msg
      ));
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      // Restore the message if sending failed
      setNewMessage(messageText);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleRoomSelect = (roomId: string) => {
    setActiveRoomId(roomId);
  };

  const handleCreateRoom = () => {
    setShowCreateDialog(true);
  };

  const handleJoinRoom = () => {
    setShowJoinDialog(true);
  };

  const handleRoomCreated = (room: ChatRoom) => {
    setRooms(prev => {
      // Check if room already exists (shouldn't happen for created rooms, but just in case)
      const existingRoom = prev.find(r => r.id === room.id);
      if (existingRoom) {
        setActiveRoomId(room.id);
        return prev;
      }
      return [...prev, room];
    });
    setActiveRoomId(room.id);
  };

  const handleRoomJoined = (room: ChatRoom) => {
    setRooms(prev => {
      // Check if room already exists
      const existingRoom = prev.find(r => r.id === room.id);
      if (existingRoom) {
        // Room already exists, just switch to it
        setActiveRoomId(room.id);
        toast({
          title: 'Already in room',
          description: `You're already in "${room.name}". Switched to the room.`,
        });
        return prev;
      }
      // Room doesn't exist, add it
      return [...prev, room];
    });
    setActiveRoomId(room.id);
  };

  const handleRoomUpdated = (updatedRoom: ChatRoom) => {
    setRooms(prev => prev.map(room => 
      room.id === updatedRoom.id ? updatedRoom : room
    ));
  };

  const handleRoomLeft = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId('global');
    }
  };

  const handleRoomDeleted = (roomId: string) => {
    setRooms(prev => prev.filter(room => room.id !== roomId));
    if (activeRoomId === roomId) {
      setActiveRoomId('global');
    }
  };

  const handleUsernameClick = (userId: string) => {
    // TODO: Implement invite user to room functionality
    console.log('Invite user:', userId);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getCurrentRoom = () => {
    return rooms.find(room => room.id === activeRoomId);
  };


  const currentRoom = getCurrentRoom();

  return (
    <div className="flex flex-col h-full -mx-6 -mt-6 min-h-0 relative">
      <div className="flex items-start justify-between mb-6 px-6 pt-6 flex-shrink-0">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold tracking-tight">Chat</h2>
          <p className="text-muted-foreground">
            {currentRoom?.type === 'global' 
              ? 'Chat with other students.'
              : `Private room: ${currentRoom?.name}`
            }
          </p>
        </div>
        {currentRoom?.type === 'private' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRoom(currentRoom);
              setShowSettingsDialog(true);
            }}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        )}
      </div>

      <Card className="flex-1 flex flex-col mx-6 mb-2 min-h-0 flex-shrink" style={{ marginBottom: '40px' }}>
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-thin">
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
            ) : !isUsernameReady ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground">Loading...</div>
              </div>
            ) : (
              messages.map((message) => {

                const sessionUsername = getSessionUsername();
                
                // For global chat, check by username since userId is anonymous
                // For private chat, check by userId
                const isOwnMessage = currentUser && (
                  activeRoomId === 'global' 
                    ? (sessionUsername && message.username === sessionUsername)
                    : (message.userId && message.userId === currentUser.uid)
                );
                const isPending = message.id.startsWith('temp_');
                
                // Use a more stable key to prevent re-renders
                const messageKey = `${message.id}-${isOwnMessage ? 'own' : 'other'}`;
                return (
                  <div
                    key={messageKey}
                    className={`flex items-start gap-2 py-1 px-2 hover:bg-muted/30 transition-all duration-200 ${
                      isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                    } ${isPending ? 'opacity-70' : ''}`}
                  >
                    <div className={`flex flex-col min-w-0 max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className={`text-xs font-medium cursor-pointer hover:underline ${
                            isOwnMessage ? 'text-blue-600' : 'text-muted-foreground'
                          }`}
                          onClick={() => handleUsernameClick(message.userId)}
                        >
                          {message.username}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(message.timestamp)}
                        </span>
                        {isPending && (
                          <span className="text-xs text-muted-foreground italic">
                            Sending...
                          </span>
                        )}
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
          <div className="border-t p-4 flex-shrink-0">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                ref={messageInputRef}
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
              {currentRoom?.type === 'global' 
                ? 'Messages are anonymous and will be moderated for inappropriate content.'
                : `Private room (${currentRoom?.members.length}/${currentRoom?.maxMembers} members). Click on usernames to invite them to other rooms.`
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Room Tabs */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 z-10 bg-background border-t">
        <ChatRoomTabs
          rooms={rooms}
          activeRoomId={activeRoomId}
          onRoomSelect={handleRoomSelect}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      </div>

      {/* Dialogs */}
      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRoomCreated={handleRoomCreated}
      />

      <JoinRoomDialog
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onRoomJoined={handleRoomJoined}
      />

      <RoomSettingsDialog
        open={showSettingsDialog}
        onOpenChange={setShowSettingsDialog}
        room={selectedRoom}
        onRoomUpdated={handleRoomUpdated}
        onRoomLeft={handleRoomLeft}
        onRoomDeleted={handleRoomDeleted}
      />
    </div>
  );
}
