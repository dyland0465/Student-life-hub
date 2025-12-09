import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Users, Settings, Trash2, AlertTriangle, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import type { ChatRoom } from '@/types';

interface RoomSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: ChatRoom | null;
  onRoomUpdated: (room: ChatRoom) => void;
  onRoomLeft: (roomId: string) => void;
  onRoomDeleted: (roomId: string) => void;
}

export function RoomSettingsDialog({
  open,
  onOpenChange,
  room,
  onRoomUpdated,
  onRoomLeft,
  onRoomDeleted,
}: RoomSettingsDialogProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (room) {
      setName(room.name);
      setCode(room.code);
    }
  }, [room]);

  const isCreator = room?.createdBy === currentUser?.uid;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!room) return;

    const updates: { name?: string; code?: string } = {};
    if (name !== room.name) updates.name = name.trim();
    if (code !== room.code) updates.code = code.trim().toUpperCase();

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.updateChatRoom(room.id, updates);
      onRoomUpdated(response.room);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Room updated successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update room',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!room) return;

    setIsLeaving(true);
    try {
      await api.leaveChatRoom(room.id);
      onRoomLeft(room.id);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Left room successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to leave room',
        variant: 'destructive',
      });
    } finally {
      setIsLeaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!room) return;

    setIsDeleting(true);
    try {
      await api.deleteChatRoom(room.id);
      onRoomDeleted(room.id);
      onOpenChange(false);
      
      toast({
        title: 'Success',
        description: 'Room deleted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete room',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isLoading && !isLeaving && !isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen && room) {
        setName(room.name);
        setCode(room.code);
      }
    }
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Room Settings
          </DialogTitle>
          <DialogDescription>
            Manage your private chat room settings and members.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Room Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter room name"
                maxLength={50}
                disabled={!isCreator}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="room-code">Room Code</Label>
              <Input
                id="room-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter room code"
                maxLength={6}
                className="uppercase"
                disabled={!isCreator}
              />
              {!isCreator && (
                <p className="text-xs text-muted-foreground">
                  Only the room creator can modify the name and code
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Members */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="font-medium">Members ({room.members.length}/{room.maxMembers})</span>
            </div>
            
            <div className="space-y-2">
              {room.members.map((memberId) => (
                <div key={memberId} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="text-sm">
                    {memberId === currentUser?.uid ? 'You' : `User ${memberId.slice(0, 8)}`}
                    {memberId === room.createdBy && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Creator
                      </Badge>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Room Code: <span className="font-mono font-bold">{room.code}</span>
            </div>
            
            {isCreator && (
              <div className="text-xs text-muted-foreground">
                Share this code with others to invite them to your room.
              </div>
            )}

            <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-semibold">Danger Zone</span>
                  </div>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform ${dangerZoneOpen ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 pt-4">

                <div className="space-y-4">
                  {/* Leave Room */}
                  <div className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Leave Room</h4>
                        <p className="text-sm text-muted-foreground">
                          Leave this room. If you're the last member, the room will be automatically deleted.
                        </p>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleLeaveRoom}
                        disabled={isLoading || isLeaving || isDeleting}
                        className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isLeaving ? 'Leaving...' : 'Leave Room'}
                      </Button>
                    </div>
                  </div>

                  {/* Delete Room - Only for creators */}
                  {isCreator && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="text-sm font-medium">Delete Room</h4>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete this room and all its messages. This action cannot be undone.
                          </p>
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteRoom}
                          disabled={isLoading || isLeaving || isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting ? 'Deleting...' : 'Delete Room'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading || isLeaving || isDeleting}
          >
            Cancel
          </Button>
          {isCreator && (
            <Button
              onClick={handleUpdate}
              disabled={isLoading || isLeaving || isDeleting}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
