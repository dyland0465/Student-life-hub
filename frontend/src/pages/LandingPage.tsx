import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Calendar, Heart, BookOpen, Moon, MessageCircle } from 'lucide-react';

const rotatingWords = ['Life', 'Schedule', 'Health', 'Coursework', 'Sleep'];

export function LandingPage() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    // Start the animation cycle after initial mount
    const interval = setInterval(() => {
      setIsFlipping(true);
      // Wait for flip-out animation to complete, then change word and flip in
      setTimeout(() => {
        setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
        // Small delay to ensure React has updated the DOM before applying flip-in
        setTimeout(() => {
          setIsFlipping(false);
        }, 10);
      }, 300); // Duration of flip-out animation
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">Student Life Hub</span>
        </div>
        <div className="flex gap-4">
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
              <span
                key={currentWordIndex}
                className={`inline-block ${
                  isFlipping ? 'animate-flip-out' : 'animate-flip-in'
                }`}
              >
                {rotatingWords[currentWordIndex]}
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
          <p>&copy; 2024 Student Life Hub. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes flip-in {
          0% {
            opacity: 0;
            transform: perspective(1000px) rotateX(90deg) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0);
          }
        }
        
        @keyframes flip-out {
          0% {
            opacity: 1;
            transform: perspective(1000px) rotateX(0deg) translateY(0);
          }
          100% {
            opacity: 0;
            transform: perspective(1000px) rotateX(-90deg) translateY(-20px);
          }
        }
        
        .animate-flip-in {
          animation: flip-in 0.3s ease-out forwards;
        }
        
        .animate-flip-out {
          animation: flip-out 0.3s ease-in forwards;
        }
      `}</style>
    </div>
  );
}

