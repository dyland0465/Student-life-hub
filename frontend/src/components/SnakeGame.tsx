import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  onClose: () => void;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export function SnakeGame({ onClose }: SnakeGameProps) {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Position>({ x: 1, y: 0 });
  const [nextDirection, setNextDirection] = useState<Position>({ x: 1, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const gameLoopRef = useRef<number | null>(null);

  // Generate random food position
  const generateFood = useCallback((): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y)
    );
    return newFood;
  }, [snake]);

  // Check collision
  const checkCollision = useCallback(
    (head: Position): boolean => {
      // Wall collision
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }
      // Self collision
      return snake.some(
        (segment, index) =>
          index > 0 && segment.x === head.x && segment.y === head.y
      );
    },
    [snake]
  );

  // Game loop
  useEffect(() => {
    if (gameOver || isPaused) return;

    const gameLoop = () => {
      setDirection(nextDirection);

      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead: Position = {
          x: head.x + nextDirection.x,
          y: head.y + nextDirection.y,
        };

        // Check collision
        if (checkCollision(newHead)) {
          setGameOver(true);
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check if food is eaten
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((prev) => prev + 10);
          setFood(generateFood());
          return newSnake;
        }

        // Remove tail
        newSnake.pop();
        return newSnake;
      });
    };

    gameLoopRef.current = window.setInterval(gameLoop, 150);
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [nextDirection, food, gameOver, isPaused, checkCollision, generateFood]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver) return;

      const key = e.key;
      let newDirection = { ...nextDirection };

      switch (key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y === 0) {
            newDirection = { x: 0, y: -1 };
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y === 0) {
            newDirection = { x: 0, y: 1 };
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x === 0) {
            newDirection = { x: -1, y: 0 };
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x === 0) {
            newDirection = { x: 1, y: 0 };
          }
          break;
        case ' ':
          e.preventDefault();
          setIsPaused((prev) => !prev);
          break;
        default:
          return;
      }

      setNextDirection(newDirection);
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setFood({ x: 15, y: 15 });
    setDirection({ x: 1, y: 0 });
    setNextDirection({ x: 1, y: 0 });
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md border-primary/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-2xl">Snake? Snake? SNAAAAAAKE!</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold">Score: {score}</div>
            {isPaused && !gameOver && (
              <div className="text-sm text-muted-foreground">PAUSED</div>
            )}
          </div>

          <div
            className="bg-gray-900 dark:bg-gray-950 border-2 border-primary/30 rounded-lg mx-auto relative"
            style={{
              width: GRID_SIZE * CELL_SIZE,
              height: GRID_SIZE * CELL_SIZE,
            }}
          >
            {/* Food */}
            <div
              className="absolute bg-red-500 rounded-full animate-pulse"
              style={{
                left: food.x * CELL_SIZE,
                top: food.y * CELL_SIZE,
                width: CELL_SIZE - 2,
                height: CELL_SIZE - 2,
              }}
            />

            {/* Snake */}
            {snake.map((segment, index) => (
              <div
                key={index}
                className={`absolute rounded ${
                  index === 0
                    ? 'bg-primary'
                    : 'bg-primary/70'
                }`}
                style={{
                  left: segment.x * CELL_SIZE,
                  top: segment.y * CELL_SIZE,
                  width: CELL_SIZE - 2,
                  height: CELL_SIZE - 2,
                }}
              />
            ))}

            {/* Game Over Overlay */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold text-white">Game Over!</div>
                  <div className="text-lg text-white">Final Score: {score}</div>
                  <Button onClick={resetGame} className="mt-2">
                    Play Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Use Arrow Keys or WASD to move</p>
            <p>Press Space to pause</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

