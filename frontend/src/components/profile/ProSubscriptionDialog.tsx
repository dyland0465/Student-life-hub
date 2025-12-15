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
      <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl">
        <DialogHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
              <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-lg sm:text-xl">Upgrade to Pro</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Unlock premium features and take your student life to the next level
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-1">
          {/* Pricing */}
          <div className="rounded-lg border-2 border-primary bg-primary/5 p-3 text-center">
            <div className="mb-1">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold">$4.99</span>
              <span className="text-muted-foreground text-xs sm:text-sm">/month</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Cancel anytime. No hidden fees.
            </p>
          </div>

          {/* Features List */}
          <div className="space-y-2">
            <h3 className="text-sm sm:text-base font-semibold">What's included:</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {proFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex gap-2 rounded-lg border p-2 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm leading-tight">{feature.title}</h4>
                      <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="rounded-lg bg-muted p-2">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary shrink-0" />
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="h-3 w-3 text-primary shrink-0" />
                <span>Support a small team</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubscribe}
            disabled={loading || studentProfile?.isPro}
            className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
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

