
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, SnakeData, Point, Direction } from './types';
import { INITIAL_LIVES, CANVAS_SIZE } from './constants';
import { generateLevel } from './utils/levelGenerator';
import { checkCollision } from './utils/collision';
import Snake from './components/Snake';
import Logo from './components/Logo';
import { playSnakeMove, playCollision, playLevelWin, playSnakeExit, playHint } from './utils/audio';

const SNAKE_SPEED = 5;
const MAX_SELECTABLE_LEVEL = 30; 

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [level, setLevel] = useState(1);
  const [unlockedLevel, setUnlockedLevel] = useState(1);
  const [completedLevels, setCompletedLevels] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [snakes, setSnakes] = useState<SnakeData[]>([]);
  const [movingSnakeId, setMovingSnakeId] = useState<string | null>(null);
  const [movingSnakeData, setMovingSnakeData] = useState<SnakeData | null>(null);
  const [hintedSnakeId, setHintedSnakeId] = useState<string | null>(null);
  const [isWrongMove, setIsWrongMove] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const requestRef = useRef<number>(null);
  const segmentDistancesRef = useRef<number[]>([]);

  const initLevel = useCallback((l: number) => {
    const newSnakes = generateLevel(l);
    setSnakes(newSnakes);
    setGameState(GameState.PLAYING);
    setIsWrongMove(false);
    setMovingSnakeId(null);
    setMovingSnakeData(null);
    setHintedSnakeId(null);
    setIsProcessing(false);
    setLives(INITIAL_LIVES);
  }, []);

  const handleStartGame = () => {
    setGameState(GameState.LEVEL_SELECT);
  };

  const selectLevel = (l: number) => {
    if (l > unlockedLevel) return;
    setLevel(l);
    initLevel(l);
  };

  const handleHint = () => {
    if (gameState !== GameState.PLAYING || isProcessing || hintedSnakeId) return;
    const validSnake = snakes.find(s => !checkCollision(s, snakes.filter(other => other.id !== s.id)));
    if (validSnake) {
      playHint();
      setHintedSnakeId(validSnake.id);
      setTimeout(() => setHintedSnakeId(null), 2000);
    }
  };

  /**
   * Complex Slither Animation Logic
   * Moves the head and makes each subsequent point follow the one ahead of it,
   * preserving segment lengths and naturally straightening the tail.
   */
  const animate = useCallback(() => {
    if (!movingSnakeData) return;

    const currentPoints = [...movingSnakeData.points];
    const headIndex = currentPoints.length - 1;
    const dir = movingSnakeData.headDirection;
    
    // 1. Move the head forward
    const oldHead = currentPoints[headIndex];
    const newHead = { ...oldHead };
    if (dir === 'UP') newHead.y -= SNAKE_SPEED;
    else if (dir === 'DOWN') newHead.y += SNAKE_SPEED;
    else if (dir === 'LEFT') newHead.x -= SNAKE_SPEED;
    else if (dir === 'RIGHT') newHead.x += SNAKE_SPEED;
    
    currentPoints[headIndex] = newHead;

    // 2. Adjust all trailing points to "follow" the head
    for (let i = headIndex - 1; i >= 0; i--) {
      const leader = currentPoints[i + 1];
      const follower = currentPoints[i];
      const targetDist = segmentDistancesRef.current[i];
      
      const dx = leader.x - follower.x;
      const dy = leader.y - follower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist > targetDist) {
        const ratio = (dist - targetDist) / dist;
        follower.x += dx * ratio;
        follower.y += dy * ratio;
      }
    }

    setMovingSnakeData({ ...movingSnakeData, points: currentPoints });

    // 3. Check if the entire snake has left the screen
    const margin = 100;
    const allOffScreen = currentPoints.every(p => 
      p.x < -margin || p.x > CANVAS_SIZE + margin || 
      p.y < -margin || p.y > CANVAS_SIZE + margin
    );

    if (allOffScreen) {
      playSnakeExit();
      setSnakes(prev => {
        const nextSnakes = prev.filter(s => s.id !== movingSnakeId);
        if (nextSnakes.length === 0) {
          setGameState(GameState.WON);
          setCompletedLevels(prev => new Set(prev).add(level));
          if (level >= unlockedLevel && level < MAX_SELECTABLE_LEVEL) {
            setUnlockedLevel(level + 1);
          }
          playLevelWin();
        }
        return nextSnakes;
      });
      setMovingSnakeId(null);
      setMovingSnakeData(null);
      setIsProcessing(false);
    } else {
      requestRef.current = requestAnimationFrame(animate);
    }
  }, [movingSnakeData, movingSnakeId, level, unlockedLevel]);

  useEffect(() => {
    if (movingSnakeId && movingSnakeData) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [movingSnakeId, movingSnakeData, animate]);

  const handleSnakeClick = (id: string) => {
    if (isProcessing || gameState !== GameState.PLAYING) return;
    const clickedSnake = snakes.find(s => s.id === id);
    if (!clickedSnake) return;
    
    setIsProcessing(true);
    setHintedSnakeId(null);
    const otherSnakes = snakes.filter(s => s.id !== id);
    const hasCollision = checkCollision(clickedSnake, otherSnakes);
    
    if (hasCollision) {
      playCollision();
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) setGameState(GameState.LOST);
        return newLives;
      });
      setIsWrongMove(true);
      setTimeout(() => { setIsWrongMove(false); setIsProcessing(false); }, 400);
    } else {
      playSnakeMove();
      
      const distances: number[] = [];
      for (let i = 0; i < clickedSnake.points.length - 1; i++) {
        const p1 = clickedSnake.points[i];
        const p2 = clickedSnake.points[i + 1];
        distances.push(Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)));
      }
      segmentDistancesRef.current = distances;

      setMovingSnakeId(id);
      setMovingSnakeData(clickedSnake);
    }
  };

  const nextLevel = () => { 
    const n = level + 1;
    if (n <= MAX_SELECTABLE_LEVEL) {
      setLevel(n); 
      initLevel(n); 
    } else {
      setGameState(GameState.LEVEL_SELECT);
    }
  };

  const renderStartScreen = () => (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-500">
      <div className="w-48 h-48 mb-8 floating">
        <Logo className="w-full h-full shadow-2xl rounded-[3rem]" />
      </div>
      <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Snake Logic</h2>
      <p className="text-slate-500 mb-10 max-w-[280px] leading-relaxed font-medium">Trace the path. Detect the loops. Master the escape.</p>
      <button 
        onClick={handleStartGame} 
        className="bg-slate-900 text-white px-16 py-6 rounded-2xl font-bold text-2xl transition-all hover:scale-105 active:scale-95 shadow-xl"
      >
        START MISSION
      </button>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="absolute inset-0 z-40 bg-white flex flex-col p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Difficulty Matrix</h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Levels 21-30: Titan Protocol</p>
        </div>
        <button onClick={() => setGameState(GameState.START)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-100 transition-colors border border-slate-100">
          <i className="fa-solid fa-house text-sm"></i>
        </button>
      </div>
      <div className="grid grid-cols-5 gap-3 overflow-y-auto pb-8 custom-scrollbar">
        {Array.from({ length: MAX_SELECTABLE_LEVEL }).map((_, i) => {
          const lNum = i + 1;
          const isCompleted = completedLevels.has(lNum);
          const isPlayable = lNum === unlockedLevel;
          const isLocked = lNum > unlockedLevel;
          const isExtreme = lNum >= 16;
          const isTitan = lNum >= 21;

          return (
            <div key={i} className="relative group">
              <button
                onClick={() => selectLevel(lNum)}
                disabled={isLocked}
                className={`w-full aspect-square rounded-2xl font-black text-lg flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                  isLocked 
                    ? 'bg-slate-50 border border-slate-100 text-slate-200 opacity-60 grayscale' 
                    : isPlayable
                      ? `${isTitan ? 'bg-indigo-900' : isExtreme ? 'bg-red-600' : 'bg-slate-900'} text-white shadow-xl scale-105 border-4 ${isTitan ? 'border-indigo-400/30' : isExtreme ? 'border-red-400/30' : 'border-emerald-400/20'}` 
                      : isCompleted
                        ? 'bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm'
                        : `${isTitan ? 'bg-indigo-50 border-indigo-100 text-indigo-400' : isExtreme ? 'bg-rose-50 border-rose-100 text-rose-400' : 'bg-white border-slate-100 text-slate-500'} border hover:border-slate-300 shadow-sm`
                }`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {isLocked ? (
                  <i className="fa-solid fa-lock text-[10px] mb-1 opacity-50"></i>
                ) : isCompleted ? (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                    <i className="fa-solid fa-check text-white text-[8px]"></i>
                  </div>
                ) : null}
                <span className={isLocked ? 'opacity-40' : ''}>{lNum}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors duration-300 ${isWrongMove ? 'bg-red-100' : 'bg-slate-50'}`}>
      
      <div className={`relative bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-[10px] border-white ring-1 ring-slate-100 transition-transform ${isWrongMove ? 'animate-shake' : ''}`} style={{ width: CANVAS_SIZE + 40, height: CANVAS_SIZE + 40 }}>
        
        {gameState === GameState.START && renderStartScreen()}
        {gameState === GameState.LEVEL_SELECT && renderLevelSelect()}

        {(gameState === GameState.PLAYING || gameState === GameState.WON || gameState === GameState.LOST) && (
          <div className="w-full h-full flex flex-col p-4">
            <div className="flex justify-between items-center mb-4 px-1">
              <div className="flex items-center gap-3">
                <span className={`text-xl font-black ${level >= 21 ? 'text-indigo-900' : level >= 16 ? 'text-red-600' : 'text-slate-900'}`}>
                  {level >= 21 ? 'TITAN ' : 'TIER '}{level}
                </span>
                <button onClick={() => setGameState(GameState.LEVEL_SELECT)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center">
                  <i className="fa-solid fa-layer-group text-xs"></i>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button onClick={handleHint} disabled={hintedSnakeId !== null || gameState !== GameState.PLAYING || isProcessing} className="w-10 h-10 rounded-xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-amber-500 hover:text-amber-600 transition-all disabled:opacity-20 active:scale-90">
                  <i className="fa-solid fa-bolt-lightning text-sm"></i>
                </button>
                <div className={`flex gap-2 ${level >= 21 ? 'bg-indigo-900' : level >= 16 ? 'bg-red-600' : 'bg-slate-900'} px-4 py-2 rounded-xl items-center h-10 shadow-lg`}>
                  <i className="fa-solid fa-heart text-white/80 text-xs"></i>
                  <span className="text-white font-black text-sm">{lives}</span>
                </div>
              </div>
            </div>

            <div className="relative flex-1 bg-slate-50/50 rounded-[1.5rem] overflow-hidden border border-slate-100">
              {gameState === GameState.WON && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-sm p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                    <Logo className="w-14 h-14" />
                  </div>
                  <h2 className="text-3xl font-black text-white mb-6 uppercase">Mission Success</h2>
                  <div className="flex flex-col gap-3 w-full max-w-[200px]">
                    <button onClick={nextLevel} className="bg-white text-emerald-600 px-10 py-4 rounded-xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-lg">CONTINUE</button>
                    <button onClick={() => setGameState(GameState.LEVEL_SELECT)} className="text-emerald-100 font-bold text-sm hover:text-white transition-colors">Tiers</button>
                  </div>
                </div>
              )}

              {gameState === GameState.LOST && (
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-rose-600/95 backdrop-blur-sm p-8 text-center animate-in fade-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-2xl"><i className="fa-solid fa-skull text-rose-600 text-4xl"></i></div>
                  <h2 className="text-3xl font-black text-white mb-6 uppercase">Path Blocked</h2>
                  <div className="flex flex-col gap-3 w-full max-w-[200px]">
                    <button onClick={() => selectLevel(level)} className="bg-white text-rose-600 px-10 py-4 rounded-xl font-black text-lg hover:scale-105 active:scale-95 transition-all shadow-lg">RETRY PATH</button>
                    <button onClick={() => setGameState(GameState.LEVEL_SELECT)} className="text-rose-100 font-bold text-sm hover:text-white transition-colors">Abort</button>
                  </div>
                </div>
              )}

              <svg viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`} className="w-full h-full overflow-visible p-5">
                {snakes.map(snake => (
                  <Snake 
                    key={snake.id}
                    data={movingSnakeId === snake.id && movingSnakeData ? movingSnakeData : snake} 
                    onClick={handleSnakeClick}
                    isMoving={movingSnakeId === snake.id}
                    isExiting={movingSnakeId !== null}
                    isHinted={hintedSnakeId === snake.id}
                  />
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em] opacity-50">
        Logic Protocol • Snake Titan v3.0
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default App;
