import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { CalendarSyncConfig } from '@/types';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, Link as LinkIcon, Loader2 } from 'lucide-react';

interface GoogleCalendarConnectProps {
  config: CalendarSyncConfig | null;
  onConfigChange: () => void;
}

export function GoogleCalendarConnect({ config, onConfigChange }: GoogleCalendarConnectProps) {
  const { toast } = useToast();
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const isConnected = config?.googleCalendar?.connected || false;

  async function handleConnect() {
    try {
      setConnecting(true);
      
      // In a real implementation, this would redirect to Google OAuth
      // For now, we'll show a placeholder message
      toast({
        title: 'Google Calendar Connection',
        description: 'OAuth flow not yet implemented. Please provide access token manually for now.',
        variant: 'default',
      });

      // TODO: Implement OAuth flow
      // 1. Redirect to Google OAuth URL
      // 2. Get authorization code from callback
      // 3. Exchange code for access/refresh tokens
      // 4. Call api.connectGoogleCalendar(accessToken, refreshToken)
      
    } catch (error: any) {
      console.error('Error connecting Google Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    try {
      setDisconnecting(true);
      await api.disconnectCalendar('google');
      toast({
        title: 'Success',
        description: 'Google Calendar disconnected',
      });
      onConfigChange();
    } catch (error: any) {
      console.error('Error disconnecting Google Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to disconnect Google Calendar',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  }

  async function handleSync() {
    try {
      await api.syncCalendar('google', 'push');
      toast({
        title: 'Success',
        description: 'Events synced to Google Calendar',
      });
    } catch (error: any) {
      console.error('Error syncing Google Calendar:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to sync Google Calendar',
        variant: 'destructive',
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Google Calendar</Label>
          <p className="text-xs text-muted-foreground">
            Sync your events with Google Calendar
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
              onClick={handleConnect}
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
      {isConnected && config?.googleCalendar?.lastSync && (
        <p className="text-xs text-muted-foreground">
          Last synced: {new Date(config.googleCalendar.lastSync).toLocaleString()}
        </p>
      )}
    </div>
  );
}

