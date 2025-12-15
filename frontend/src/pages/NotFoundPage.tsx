import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Home, Search, Sparkles, Ghost, Rocket } from 'lucide-react';
import { SnakeGame } from '@/components/SnakeGame';

export function NotFoundPage() {
  const navigate = useNavigate();
  const [clickCount, setClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [konamiCode, setKonamiCode] = useState<string[]>([]);
  const [showKonamiEgg, setShowKonamiEgg] = useState(false);
  const [showSnakeGame, setShowSnakeGame] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);

  // Konami code detection
  useEffect(() => {
    if (showSnakeGame) return;

    const konamiSequence = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'KeyB', 'KeyA'
    ];

    const handleKeyPress = (e: KeyboardEvent) => {
      const newSequence = [...konamiCode, e.code];
      setKonamiCode(newSequence);

      // Check if the sequence matches
      if (newSequence.length >= konamiSequence.length) {
        const lastSequence = newSequence.slice(-konamiSequence.length);
        if (lastSequence.every((key, index) => key === konamiSequence[index])) {
          setShowKonamiEgg(true);
          setShowSnakeGame(true);
          setKonamiCode([]);
        } else {
          setKonamiCode(newSequence.slice(-konamiSequence.length + 1));
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [konamiCode, showSnakeGame]);

  const handle404Click = () => {
    setClickCount((prev) => {
      const newCount = prev + 1;
      if (newCount >= 10 && !showEasterEgg) {
        setShowEasterEgg(true);
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 2000);
      }
      return newCount;
    });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <Card className="border-primary/50 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center items-center gap-4">
              <div
                onClick={handle404Click}
                className={`text-8xl md:text-9xl font-bold text-primary cursor-pointer select-none transition-transform ${
                  isSpinning ? 'animate-spin' : 'hover:scale-110'
                }`}
                style={{ userSelect: 'none' }}
              >
                404
              </div>
            </div>
            <CardTitle className="text-3xl md:text-4xl">Page Not Found</CardTitle>
            <CardDescription className="text-lg">
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {showEasterEgg && (
              <Alert className="border-primary bg-primary/10 animate-bounce">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary font-semibold">
                  Easter Egg Found! You clicked 404 ten times! You're clearly very persistent. 
                  Here's a virtual cookie: 🍪
                </AlertDescription>
              </Alert>
            )}

            {showKonamiEgg && !showSnakeGame && (
              <Alert className="border-primary bg-primary/10 animate-pulse">
                <Rocket className="h-4 w-4 text-primary" />
                <AlertDescription className="text-primary font-semibold">
                  KONAMI CODE ACTIVATED! 🎮
                </AlertDescription>
              </Alert>
            )}


            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleGoHome}
                className="flex-1"
                size="lg"
                asChild
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Link>
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                size="lg"
                onClick={() => window.history.back()}
              >
                <Search className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>

            {/* Hidden easter egg counter hint */}
            {clickCount > 0 && clickCount < 10 && (
              <p className="text-xs text-center text-muted-foreground animate-pulse">
                Keep clicking... {10 - clickCount} more to go! 👆
              </p>
            )}
          </CardContent>
        </Card>

        {/* Floating ghost animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <Ghost
              key={i}
              className="absolute text-primary/20 animate-float"
              style={{
                left: `${20 + i * 30}%`,
                top: `${10 + i * 20}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + i}s`,
              }}
              size={40}
            />
          ))}
        </div>

        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
              opacity: 0.2;
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
              opacity: 0.4;
            }
          }
          
          .animate-float {
            animation: float 3s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Snake Game Modal */}
      {showSnakeGame && (
        <SnakeGame onClose={() => setShowSnakeGame(false)} />
      )}
    </div>
  );
}

