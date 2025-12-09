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
import { useAuth } from '@/hooks/useAuth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Crown, Check, Sparkles, BarChart3, Headphones, Zap } from 'lucide-react';

interface ProSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const proFeatures = [
  {
    icon: Sparkles,
    title: 'Unlimited AI Requests',
    description: 'Get unlimited access to EZSolve and all AI-powered features',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Detailed insights into your study patterns, fitness progress, and sleep quality',
  },
  {
    icon: Headphones,
    title: 'Priority Support',
    description: 'Get priority customer support with faster response times',
  },
  {
    icon: Zap,
    title: 'Early Access',
    description: 'Be the first to try new features and updates',
  },
];

export function ProSubscriptionDialog({ open, onOpenChange }: ProSubscriptionDialogProps) {
  const { currentUser, studentProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!currentUser) {
      toast({
        title: 'Error',
        description: 'You must be logged in to subscribe',
        variant: 'destructive',
      });
      return;
    }

    if (studentProfile?.isPro) {
      toast({
        title: 'Already Pro',
        description: 'You already have a Pro subscription',
      });
      onOpenChange(false);
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update Firestore user document
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        isPro: true,
      });

      toast({
        title: 'Welcome to Pro!',
        description: 'Your Pro subscription has been activated. Enjoy all the premium features!',
      });

      // Close dialog after a short delay to show success
      setTimeout(() => {
        onOpenChange(false);
        // Reload the page to refresh the student profile
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error('Error subscribing to Pro:', error);
      toast({
        title: 'Subscription Failed',
        description: error.message || 'Failed to activate Pro subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-2xl">Upgrade to Pro</DialogTitle>
              <DialogDescription className="text-base">
                Unlock premium features and take your student life to the next level
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Pricing */}
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
            <div className="mb-2">
              <span className="text-5xl font-bold">$4.99</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">What's included:</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {proFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{feature.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="rounded-lg bg-muted p-4">
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>Support a small team</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubscribe}
            disabled={loading || studentProfile?.isPro}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : studentProfile?.isPro ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Already Pro
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

