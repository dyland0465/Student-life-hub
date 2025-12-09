import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Heart,
  Moon,
  Sparkles,
  MessageCircle,
  X,
  ChevronDown,
  ChevronRight,
  Dumbbell,
  UtensilsCrossed,
  ShoppingCart,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    name: 'Chat',
    href: '/chat',
    icon: MessageCircle,
  },
];

const educationSubItems = [
  {
    name: 'Coursework',
    href: '/coursework',
    icon: BookOpen,
  },
  {
    name: 'Schedule Builder',
    href: '/schedule',
    icon: Calendar,
  },
];

const healthSubItems = [
  {
    name: 'Workout',
    href: '/health/workout',
    icon: Dumbbell,
  },
  {
    name: 'Meal',
    href: '/health/meal',
    icon: UtensilsCrossed,
  },
  {
    name: 'Shopping List',
    href: '/health/shopping',
    icon: ShoppingCart,
  },
  {
    name: 'Sleep Schedule',
    href: '/health/sleep',
    icon: Moon,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const isEducationActive = location.pathname === '/coursework' || location.pathname === '/schedule';
  const isHealthActive = location.pathname.startsWith('/health');
  const isCalendarActive = location.pathname === '/calendar';
  const [educationOpen, setEducationOpen] = useState(isEducationActive);
  const [healthOpen, setHealthOpen] = useState(isHealthActive);

  // Update collapsible states when location changes
  useEffect(() => {
    if (isEducationActive) {
      setEducationOpen(true);
    }
    if (isHealthActive) {
      setHealthOpen(true);
    }
  }, [isEducationActive, isHealthActive]);

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 md:relative md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2"
            onClick={() => {
              // Only close on mobile
              if (window.innerWidth < 768) {
                onClose();
              }
            }}
          >
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">Student Life Hub</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => {
                  // Only close on mobile
                  if (window.innerWidth < 768) {
                    onClose();
                  }
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Education Collapsible */}
          <Collapsible open={educationOpen} onOpenChange={setEducationOpen}>
            <CollapsibleTrigger
              className={cn(
                'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isEducationActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="h-5 w-5" />
                <span>Education</span>
              </div>
              {educationOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {educationSubItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      // Only close on mobile
                      if (window.innerWidth < 768) {
                        onClose();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-6',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>

          {/* Health & Fitness Collapsible */}
          <Collapsible open={healthOpen} onOpenChange={setHealthOpen}>
            <CollapsibleTrigger
              className={cn(
                'w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isHealthActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5" />
                <span>Health & Fitness</span>
              </div>
              {healthOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1 mt-1">
              {healthSubItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => {
                      // Only close on mobile
                      if (window.innerWidth < 768) {
                        onClose();
                      }
                    }}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ml-6',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        </nav>
      </div>
    </>
  );
}

