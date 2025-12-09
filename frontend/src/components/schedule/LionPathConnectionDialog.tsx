import { useState } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Lock } from 'lucide-react';

interface LionPathConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected: () => void;
}

export function LionPathConnectionDialog({
  open,
  onOpenChange,
  onConnected,
}: LionPathConnectionDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleConnect() {
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please enter your LionPath credentials',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await api.connectLionPath(username, password);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: result.message || 'Connected to LionPath',
        });
        onConnected();
        onOpenChange(false);
        setUsername('');
        setPassword('');
      } else {
        toast({
          title: 'Error',
          description: result.message || 'Failed to connect to LionPath',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error connecting to LionPath:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to connect to LionPath',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Connect to LionPath
          </DialogTitle>
          <DialogDescription>
            Connect your LionPath account to enable automatic class registration
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-900 dark:text-blue-100">
            <strong>Demo Mode:</strong> This is a demonstration. Real LionPath integration is coming soon. 
            Your credentials are not stored or used for actual registration.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lionpath-username">LionPath Username</Label>
            <Input
              id="lionpath-username"
              placeholder="Enter your LionPath username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lionpath-password">LionPath Password</Label>
            <Input
              id="lionpath-password"
              type="password"
              placeholder="Enter your LionPath password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

