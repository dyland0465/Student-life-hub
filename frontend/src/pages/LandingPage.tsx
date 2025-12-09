import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';
import { Sparkles, Calendar, Heart, BookOpen, Moon, MessageCircle, Sun, Monitor, Check } from 'lucide-react';

const rotatingWords = ['Life', 'Schedule', 'Health', 'Coursework', 'Sleep'];

export function LandingPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { setTheme, actualTheme } = useTheme();

  useEffect(() => {
    const currentWord = rotatingWords[currentWordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayedText.length < currentWord.length) {
      // Typing out the word
      timeout = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length + 1));
      }, 100); // Typing speed
    } else if (!isDeleting && displayedText.length === currentWord.length) {
      // Word is fully typed, wait before deleting
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 5000); // Pause at end of word
    } else if (isDeleting && displayedText.length > 0) {
      // Deleting the word
      timeout = setTimeout(() => {
        setDisplayedText(currentWord.slice(0, displayedText.length - 1));
      }, 50); // Deleting speed (faster than typing)
    } else if (isDeleting && displayedText.length === 0) {
      // Word is fully deleted, move to next word
      setIsDeleting(false);
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [currentWordIndex, displayedText, isDeleting]);

  const features = [
    {
      icon: Calendar,
      title: 'Schedule Management',
      description: 'Organize your classes, assignments, and events in one place.',
    },
    {
      icon: BookOpen,
      title: 'Coursework Tracking',
      description: 'Keep track of assignments, deadlines, and grades.',
    },
    {
      icon: Heart,
      title: 'Health & Wellness',
      description: 'Monitor your workouts, routines, and overall health.',
    },
    {
      icon: Moon,
      title: 'Sleep Tracking',
      description: 'Track your sleep patterns and improve your rest.',
    },
    {
      icon: MessageCircle,
      title: 'Student Chat',
      description: 'Connect with other students and get help with coursework.',
    },
  ];

  const pricingTiers = [
    {
      name: 'Free',
      price: '$0',
      frequency: 'per month',
      description: 'Perfect for students who are just getting started.',
      highlight: false,
      features: [
        'Organize classes and assignments',
        'Basic habit and sleep tracking',
        'Access to student community',
      ],
    },
    {
      name: 'Pro',
      price: '$4.99',
      frequency: 'per month',
      description: 'Unlock advanced insights and automation for your routines.',
      highlight: true,
      features: [
        'Everything in Free',
        'Smart scheduling suggestions',
        'Increased EZSolve limit',
        'Priority support',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Student Life Hub</span>
        </div>
        <div className="flex gap-4 items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {actualTheme === 'light' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" asChild>
            <Link to="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <div>Manage your</div>
            <div className="relative inline-block min-w-[200px] md:min-w-[300px] text-primary">
              <span className="inline-block pt-5">
                {displayedText}
                <span className="animate-blink cursor-line"></span>
              </span>
            </div>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one platform for managing student life, from coursework to health and wellness.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link to="/register">Get Started Free</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything you need to succeed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">Simple pricing that scales with you</h2>
          <p className="text-lg text-muted-foreground mt-4">
            Start for free and upgrade when you want smarter automation and deeper insights.
          </p>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`h-full border ${
                tier.highlight ? 'border-primary shadow-lg shadow-primary/20' : 'border-border'
              }`}
            >
              <CardHeader>
                <div className="flex flex-col items-start gap-2">
                  <CardTitle className="text-2xl">{tier.name}</CardTitle>
                  <p className="text-4xl font-bold">
                    {tier.price}
                    <span className="text-base font-medium text-muted-foreground ml-2">
                      {tier.frequency}
                    </span>
                  </p>
                  <CardDescription className="text-left">{tier.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <span className="mt-1">
                        <Check className="h-5 w-5 text-primary" />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Button className="w-full" variant={tier.highlight ? 'default' : 'outline'} asChild>
                    <Link to={tier.highlight ? '/register' : '/login'}>
                      {tier.highlight ? 'Start Free Trial' : 'Stay on Free Plan'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-3xl md:text-4xl mb-4">
                Ready to take control of your student life?
              </CardTitle>
              <CardDescription className="text-lg">
                Join thousands of students who are already managing their academic and personal lives better.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/register">Create Free Account</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>&copy; 2025 Student Life Hub. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes blink {
          0%, 50% {
            opacity: 1;
          }
          51%, 100% {
            opacity: 0;
          }
        }
        
        .animate-blink {
          animation: blink 1s infinite;
          margin-left: 8px;
        }
        
        .cursor-line {
          display: inline-block;
          width: 2px;
          height: 0.75em;
          background-color: currentColor;
        }
      `}</style>
    </div>
  );
}


