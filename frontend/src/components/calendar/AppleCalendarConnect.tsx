import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CalendarSyncConfig } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';

interface AppleCalendarConnectProps {
  config: CalendarSyncConfig | null;
  onConfigChange: () => void;
}

export function AppleCalendarConnect({ config, onConfigChange }: AppleCalendarConnectProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [serverUrl, setServerUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [calendarName, setCalendarName] = useState('Home');

  const isConnected = config?.appleCalendar?.connected || false;

  async function handleConnect() {
    if (!serverUrl || !username || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConnecting(true);
      await api.connectAppleCalendar(serverUrl, username, password, calendarName);
      toast({
        title: 'Success',
        description: 'Apple Calendar connected successfully',
      });
      setShowDialog(false);
      setServerUrl('');
      setUsername('');
      setPassword('');
      setCalendarName('Home');
      onConfigChange();
    } catch (error: any) {
      console.error('Error connecting Apple Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Apple Calendar',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true);
      await api.disconnectCalendar('apple');
      toast({
        title: 'Success',
        description: 'Apple Calendar disconnected',
      });
      onConfigChange();
    } catch (error: any) {
      console.error('Error disconnecting Apple Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect Apple Calendar',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSync() {
    try {
      await api.syncCalendar('apple', 'push');
      toast({
        title: 'Success',
        description: 'Events synced to Apple Calendar',
      });
    } catch (error: any) {
      console.error('Error syncing Apple Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync Apple Calendar',
        variant: 'destructive',
      });
    }
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Apple Calendar (iCloud)</Label>
            <p className="text-xs text-muted-foreground">
              Sync your events with Apple Calendar via CalDAV
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-600" />
                  Connected
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSync}
                  disabled={connecting || disconnecting}
                >
                  Sync
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={connecting || disconnecting}
                >
                  {disconnecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Disconnect'
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDialog(true)}
                disabled={connecting || disconnecting}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Connect
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        {isConnected && config?.appleCalendar?.lastSync && (
          <p className="text-xs text-muted-foreground">
            Last synced: {new Date(config.appleCalendar.lastSync).toLocaleString()}
          </p>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect Apple Calendar</DialogTitle>
            <DialogDescription>
              Enter your CalDAV server details to connect Apple Calendar (iCloud)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="serverUrl">Server URL *</Label>
              <Input
                id="serverUrl"
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="https://caldav.icloud.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                For iCloud, use: https://caldav.icloud.com
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username/Email *</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your-email@icloud.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password/App Password *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <p className="text-xs text-muted-foreground">
                For iCloud, you may need to use an app-specific password
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="calendarName">Calendar Name</Label>
              <Input
                id="calendarName"
                type="text"
                value={calendarName}
                onChange={(e) => setCalendarName(e.target.value)}
                placeholder="Home"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)} disabled={connecting}>
              Cancel
            </Button>
            <Button onClick={handleConnect} disabled={connecting}>
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

