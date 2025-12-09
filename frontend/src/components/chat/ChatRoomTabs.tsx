import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Users } from 'lucide-react';
import type { ChatRoom } from '@/types';

interface ChatRoomTabsProps {
  rooms: ChatRoom[];
  activeRoomId: string;
  onRoomSelect: (roomId: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

export function ChatRoomTabs({
  rooms,
  activeRoomId,
  onRoomSelect,
  onCreateRoom,
  onJoinRoom,
}: ChatRoomTabsProps) {
  const handleCreateClick = () => {
    onCreateRoom();
  };

  const handleJoinClick = () => {
    onJoinRoom();
  };

  return (
    <div className="flex items-center gap-2 p-2 bg-background border-t overflow-x-auto scrollbar-thin max-w-full">
      {/* Global room tab */}
      <Button
        variant={activeRoomId === 'global' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onRoomSelect('global')}
        className="flex items-center gap-2 min-w-0 flex-shrink-0"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Global</span>
        {rooms.find(r => r.id === 'global')?.unreadCount && rooms.find(r => r.id === 'global')!.unreadCount! > 0 && (
          <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
            {rooms.find(r => r.id === 'global')!.unreadCount}
          </Badge>
        )}
      </Button>

      {/* Private room tabs */}
      {rooms
        .filter(room => room.type === 'private')
        .map((room) => (
          <Button
            key={room.id}
            variant={activeRoomId === room.id ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onRoomSelect(room.id)}
            className="flex items-center gap-2 min-w-0 flex-shrink-0"
          >
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline truncate max-w-20">{room.name}</span>
            {room.unreadCount && room.unreadCount > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {room.unreadCount}
              </Badge>
            )}
          </Button>
        ))}

      {/* Join room button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleJoinClick}
        className="flex items-center gap-2 min-w-0 flex-shrink-0"
      >
        <MessageCircle className="h-4 w-4" />
        <span className="hidden sm:inline">Join</span>
      </Button>

      {/* Create room button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleCreateClick}
        className="flex items-center gap-2 min-w-0 flex-shrink-0"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Create</span>
      </Button>
    </div>
  );
}
