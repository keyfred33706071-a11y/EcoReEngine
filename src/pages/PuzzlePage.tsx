import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Gamepad2, Zap, RotateCcw, Trophy, Star, HelpCircle, X } from 'lucide-react';
import { awardXP, fetchProfile, updateProfile } from '../lib/firestore';
import { checkAndAwardAchievements } from '../lib/achievementChecker';
import { showAchievementPopup } from '../components/AchievementPopup';
import RobotDialog from '../components/RobotDialog';


interface FallingItem {
  id: number;
  x: number;
  y: number;
  type: 'recyclable' | 'waste';
  image: string;
  label: string;
  speed: number;
  wobble: number;
}

interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  emoji: string;
}

const RECYCLABLE_ITEMS = [
  { image: '/texturas/r1.png', label: 'Placa' },
  { image: '/texturas/r2.png', label: 'Disco' },
  { image: '/texturas/r3.png', label: 'RAM' },
  { image: '/texturas/r4.png', label: 'Cable' },
  { image: '/texturas/r5.png', label: 'Ventilador' },
  { image: '/texturas/r6.png', label: 'Fuente' },
  { image: '/texturas/r7.png', label: 'Parlante' },
  { image: '/texturas/r8.png', label: 'Motor' },
  { image: '/texturas/r9.png', label: 'LED' },
  { image: '/texturas/r10.png', label: 'Disipador' },
  { image: '/texturas/r11.png', label: 'Circuito' },
  { image: '/texturas/r12.png', label: 'Sensor' },
  { image: '/texturas/r13.webp', label: 'Tetra Pack' },
  { image: '/texturas/r14.webp', label: 'Llanta' },
  { image: '/texturas/r15.webp', label: 'Metal' },
  { image: '/texturas/r16.webp', label: 'Madera' },
  { image: '/texturas/r17.webp', label: 'Bolsa' },
  { image: '/texturas/r18.webp', label: 'Teclado' },
  { image: '/texturas/r19.webp', label: 'Revista' },
  { image: '/texturas/r20.webp', label: 'Lata' },
  { image: '/texturas/r21.webp', label: 'Batería' },
];

const WASTE_ITEMS = [
  { image: '/texturas/v6.png', label: 'Unicel' },
  { image: '/texturas/v7.png', label: 'Colilla' },
  { image: '/texturas/v8.png', label: 'Curita' },
  { image: '/texturas/v9.png', label: 'Esponja' },
  { image: '/texturas/v10.png', label: 'Pintura' },
  { image: '/texturas/v11.png', label: 'Vidrio roto' },
  { image: '/texturas/v12.png', label: 'Residuo' },
  { image: '/texturas/v13.webp', label: 'Plaguicida' },
  { image: '/texturas/v14.webp', label: 'Vidrio' },
  { image: '/texturas/v15.webp', label: 'Batería' },
  { image: '/texturas/v16.webp', label: 'Medicamento' },
  { image: '/texturas/v17.webp', label: 'Aerosol' },
  { image: '/texturas/v18.webp', label: 'Filtro' },
  { image: '/texturas/v19.webp', label: 'Cuchilla' },
  { image: '/texturas/v20.webp', label: 'Pila' },
];

const PARTICLE_EMOJIS = ['✨', '💚', '🌟', '♻️', '💫'];

const PLAYER_WIDTH = 44;
const PLAYER_HEIGHT = 12;
const PLAYER_HITBOX = 30;
const ITEM_SIZE = 60;
const ITEM_HITBOX = 24;
const BASE_SPEED = 1;
const MAX_SPEED = 7;
const POINTS_RECYCLABLE = 3;
const SPAWN_INTERVAL_BASE = 1500;

function getItemsForScore(score: number) {
  if (score < 20) return { r: RECYCLABLE_ITEMS.slice(0, 4), w: WASTE_ITEMS.slice(0, 4) };
  if (score < 60) return { r: RECYCLABLE_ITEMS.slice(0, 8), w: WASTE_ITEMS.slice(0, 8) };
  if (score < 150) return { r: RECYCLABLE_ITEMS.slice(0, 12), w: WASTE_ITEMS.slice(0, 12) };
  return { r: RECYCLABLE_ITEMS.slice(0), w: WASTE_ITEMS.slice(0) };
}

// Hitos del coach: al alcanzar el puntaje aparece el robot + mensaje unos segundos.
const COACH_MILESTONES = [50, 100, 300, 500, 1000];
const COACH_ROBOT_POSE: Record<number, string> = {
  50: '/robot/saludar.png',
  100: '/robot/celebrar.png',
  300: '/robot/emocionado.png',
  500: '/robot/logro.png',
  1000: '/robot/celebrar.png',
};
const COACH_MESSAGE: Record<number, string> = {
  50: '¡50 PUNTOS! 🎉 Sigue así ♻️',
  100: '¡100 PUNTOS! 🤩 Eres un máquina 💪',
  300: '¡300 PUNTOS! ⚡ Vas imparable 🔥',
  500: '¡500 PUNTOS! 🏆 Leyenda del reciclaje 🌟',
  1000: '¡1000 PUNTOS! 🎊 Eres el MVP 👑',
};

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

const GameItem = memo(function GameItem({ item }: { item: FallingItem }) {
  return (
    <div
      className="absolute flex items-center justify-center pointer-events-none"
      style={{
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        left: item.x,
        top: item.y,
        transform: `rotate(${Math.sin(item.wobble) * 10}deg)`,
      }}
    >
      <img src={item.image} alt={item.label} className="w-full h-full object-contain" loading="lazy" />
    </div>
  );
});

export default function PuzzlePage({ userId, onXpGained, onNavigate }: { userId: string; onXpGained: () => void; onNavigate?: (page: string) => void }) {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'over'>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    try { return Number(localStorage.getItem(`eco_fall_high_${userId}`)) || 0; } catch { return 0; }
  });
  const [totalGames, setTotalGames] = useState(() => {
    try { return Number(localStorage.getItem(`eco_fall_games_${userId}`)) || 0; } catch { return 0; }
  });
  const [items, setItems] = useState<FallingItem[]>([]);
  const [gameWidth, setGameWidth] = useState(0);
  const [playerX, setPlayerX] = useState(0);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPuzzleOnboarding, setShowPuzzleOnboarding] = useState(() => !localStorage.getItem('eco_puzzle_tutorial_done'));
  const [coachMilestone, setCoachMilestone] = useState<number | null>(null);
  const [lives, setLives] = useState(3);
  const [hitFlash, setHitFlash] = useState(false);
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const hitCooldownRef = useRef(0);
  const reachedMilestonesRef = useRef<Set<number>>(new Set());
  const coachTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const [touchMode, setTouchMode] = useState(() => localStorage.getItem('eco_puzzle_touch') === '1');
  const draggingRef = useRef(false);
  const comboRef = useRef(0);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef(0);
  const recycledRef = useRef(0);
  const itemsRef = useRef<FallingItem[]>([]);
  const playerXRef = useRef(playerX);
  const gameWidthRef = useRef(gameWidth);
  const livesRef = useRef(lives);
  const gameOverRef = useRef(false);
  const floatIdRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const spawnIntervalRef = useRef(SPAWN_INTERVAL_BASE);
  const btnLeftRef = useRef(false);
  const btnRightRef = useRef(false);
  const keysRef = useRef<Set<string>>(new Set());

  useEffect(() => { window.scrollTo(0, 0); }, [gameState]);

  useEffect(() => () => { if (coachTimerRef.current) clearTimeout(coachTimerRef.current); }, []);

  scoreRef.current = score;
  itemsRef.current = items;
  playerXRef.current = playerX;
  gameWidthRef.current = gameWidth;
  livesRef.current = lives;

  const addFloatingText = useCallback((x: number, text: string, color: string) => {
    const id = ++floatIdRef.current;
    const area = gameAreaRef.current;
    const gh = area ? area.clientHeight : 640;
    setFloats(prev => [...prev, { id, x, y: gh - 100, text, color }]);
    setTimeout(() => setFloats(prev => prev.filter(f => f.id !== id)), 800);
  }, []);

  // Muestra el coach al cruzar un hito (una sola vez por partida), ~3s.
  // Durante el coach se pausan los objetos que caen.
  const checkMilestone = useCallback((currentScore: number) => {
    const hit = COACH_MILESTONES.find(m => currentScore >= m && !reachedMilestonesRef.current.has(m));
    if (hit == null) return;
    reachedMilestonesRef.current.add(hit);
    pausedRef.current = true;
    setItems([]);
    setCoachMilestone(hit);
    if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
    coachTimerRef.current = setTimeout(() => {
      setCoachMilestone(null);
      pausedRef.current = false;
      lastSpawnRef.current = Date.now();
    }, 3000);
  }, []);

  // Tecla L abre el tutorial del robot
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'l' || e.key === 'L') {
        setShowPuzzleOnboarding(true);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const spawnParticles = useCallback((x: number, y: number, count: number) => {
    const newP: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newP.push({
        id: Date.now() + Math.random() * 1000 + i,
        x, y,
        vx: randomBetween(-3, 3),
        vy: randomBetween(-5, -1),
        life: 1,
        emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
      });
    }
    setParticles(prev => [...prev, ...newP]);
  }, []);

  const spawnItem = useCallback(() => {
    const currentScore = scoreRef.current;
    const pool = getItemsForScore(currentScore);
    const isWaste = Math.random() < 0.4;
    const template = (isWaste ? pool.w : pool.r)[Math.floor(Math.random() * (isWaste ? pool.w : pool.r).length)];
    const gw = gameWidthRef.current;
    if (gw < ITEM_SIZE) return;
    const x = Math.random() * (gw - ITEM_SIZE);
    const speed = Math.min(MAX_SPEED, BASE_SPEED + Math.floor(currentScore / 15) * 0.5 + Math.random() * 0.3);
    const newItem: FallingItem = {
      id: Date.now() + Math.random(),
      x: Math.min(x, gw - ITEM_SIZE), y: -ITEM_SIZE,
      type: isWaste ? 'waste' : 'recyclable',
      image: template.image,
      label: template.label,
      speed,
      wobble: Math.random() * Math.PI * 2,
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const startGame = () => {
    const gw = gameAreaRef.current?.clientWidth || gameWidth || 360;
    gameWidthRef.current = gw;
    setScore(0);
    recycledRef.current = 0;
    setItems([]);
    setFloats([]);
    setParticles([]);
    reachedMilestonesRef.current = new Set();
    setCoachMilestone(null);
    setLives(3);
    setPlayerX(Math.max(0, gw / 2 - PLAYER_WIDTH / 2));
    setGameWidth(gw);
    setGameState('playing');
    gameOverRef.current = false;
    pausedRef.current = false;
    keysRef.current = new Set();
    btnLeftRef.current = false;
    btnRightRef.current = false;
    lastSpawnRef.current = 0;
    spawnIntervalRef.current = SPAWN_INTERVAL_BASE;
  };

  const endGame = useCallback(async () => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    setGameState('over');
    const finalScore = scoreRef.current;
    const floored = Math.floor(finalScore);
    const isNewHigh = floored > highScore;
    if (isNewHigh) {
      localStorage.setItem(`eco_fall_high_${userId}`, String(floored));
      setHighScore(floored);
    }
    const newTotal = totalGames + 1;
    setTotalGames(newTotal);
    localStorage.setItem(`eco_fall_games_${userId}`, String(newTotal));

    const xpReward = Math.min(Math.floor(finalScore / 3) + 5, 150);

    try {
      await awardXP(userId, xpReward);
      if (isNewHigh || newTotal > 0) {
        const prof = await fetchProfile(userId);
        if (prof) {
          const currentTotal = (prof as any).puzzle_total_recycled ?? 0;
          await updateProfile(userId, {
            high_score: isNewHigh ? Math.max(Math.floor(finalScore), prof.high_score ?? 0) : (prof.high_score ?? 0),
            games_played: newTotal,
            puzzle_total_recycled: currentTotal + recycledRef.current,
          } as any);
        }
      }
    } catch {}
    checkAndAwardAchievements(userId, null).then(earned => {
      if (earned.length > 0) { onXpGained(); earned.forEach(showAchievementPopup); }
    });
    onXpGained();
  }, [userId, highScore, totalGames, onXpGained]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoopRef = { current: 0 };
    const lastTimeRef = { current: 0 };

    function gameLoop(timestamp: number) {
      if (gameOverRef.current) return;

      const dt = timestamp - lastTimeRef.current;
      if (dt < 1000 / 60) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      lastTimeRef.current = timestamp;

      const now = Date.now();
      // Spawn (pausado mientras el coach está activo)
      if (!pausedRef.current && now - lastSpawnRef.current > spawnIntervalRef.current) {
        spawnItem();
        lastSpawnRef.current = now;
      }

      // Player movement — frame-rate independent (suave incluso a bajos FPS)
      const moveStep = Math.min(30, 0.65 * dt);
      if (keysRef.current.has('arrowleft') || keysRef.current.has('a') || btnLeftRef.current) {
        setPlayerX(prev => Math.round(Math.max(0, prev - moveStep)));
      }
      if (keysRef.current.has('arrowright') || keysRef.current.has('d') || btnRightRef.current) {
        setPlayerX(prev => Math.round(Math.min(gameWidthRef.current - PLAYER_WIDTH, prev + moveStep)));
      }

      // Update falling items + collisions
      setItems(prev => {
        const area = gameAreaRef.current;
        const gh = area ? area.clientHeight : 640;
        const playerTop = gh - 16 - PLAYER_HEIGHT;
        const px = playerXRef.current;
        const updated = prev.map(item => ({ ...item, y: item.y + item.speed, wobble: item.wobble + 0.04 }));
        const kept: FallingItem[] = [];
        let caughtRecyclable = false;
        let caughtWaste: FallingItem | null = null;
        let missedRecyclable = false;

        for (const item of updated) {
          if (item.y + ITEM_SIZE > playerTop && item.y < playerTop + PLAYER_HEIGHT) {
            const itemMid = item.x + ITEM_SIZE / 2;
            const playerMid = px + PLAYER_WIDTH / 2;
            if (Math.abs(itemMid - playerMid) < PLAYER_HITBOX / 2 + ITEM_HITBOX / 2) {
              if (item.type === 'recyclable') caughtRecyclable = true;
              else caughtWaste = item;
              continue;
            }
          }
          if (item.y > gh + 20) {
            if (item.type === 'recyclable') missedRecyclable = true;
            continue;
          }
          kept.push(item);
        }

        if (caughtRecyclable) {
          comboRef.current++;
          const bonus = comboRef.current > 3 ? Math.floor(comboRef.current / 3) : 0;
          const totalPts = POINTS_RECYCLABLE + bonus;
          setCombo(comboRef.current);
          setScore(s => s + totalPts);
          scoreRef.current += totalPts;
          recycledRef.current++;
          spawnParticles(px + PLAYER_WIDTH / 2, playerTop, 8 + bonus * 2);
          const label = bonus > 0 ? `+${totalPts} 🔥x${comboRef.current}` : `+${totalPts}`;
          addFloatingText(px + PLAYER_WIDTH / 2, label, 'text-emerald-400');
          checkMilestone(scoreRef.current);
        } else {
          comboRef.current = 0;
          setCombo(0);
        }
        if (missedRecyclable) {
          comboRef.current = 0;
          setCombo(0);
          setScore(s => Math.max(0, s - 2));
          scoreRef.current = Math.max(0, scoreRef.current - 2);
          addFloatingText(px + PLAYER_WIDTH / 2, '-2 😢', 'text-red-400');
        }
        if (caughtWaste) {
          comboRef.current = 0;
          setCombo(0);
          const now = Date.now();
          if (now - hitCooldownRef.current > 1000) {
            hitCooldownRef.current = now;
            const next = livesRef.current - 1;
            setLives(next);
            if (next <= 0) {
              setTimeout(() => endGame(), 100);
            } else {
              setHitFlash(true);
              setShake(true);
              setTimeout(() => { setHitFlash(false); setShake(false); }, 600);
              setScore(s => Math.max(0, s - 10));
              scoreRef.current = Math.max(0, scoreRef.current - 10);
              addFloatingText(px + PLAYER_WIDTH / 2, '-10 💀', 'text-red-400');
              spawnParticles(px + PLAYER_WIDTH / 2, playerTop, 12);
            }
          }
        }

        return kept;
      });

      // Increase difficulty
      spawnIntervalRef.current = Math.max(350, SPAWN_INTERVAL_BASE - Math.floor(scoreRef.current / 8) * 25);

      // Update particles
      setParticles(prev =>
        prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.15, life: p.life - 0.02 })).filter(p => p.life > 0)
      );
      // Update floating texts
      setFloats(prev => prev.map(f => ({ ...f, y: f.y - 1.5 })));

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => cancelAnimationFrame(gameLoopRef.current);
  }, [gameState, spawnItem, endGame, spawnParticles, addFloatingText]);

  // Track game area width + re-center player on resize
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      if (w > 0) {
        const clamped = Math.min(w, 480);
        gameWidthRef.current = clamped;
        setGameWidth(clamped);
        if (gameState === 'playing') {
          setPlayerX(prev => Math.min(prev, clamped - PLAYER_WIDTH));
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [gameState]);

  // Keyboard input tracking (movimiento se procesa en el game loop)
  useEffect(() => {
    if (gameState !== 'playing') return;
    const handleKey = (e: KeyboardEvent, isDown: boolean) => {
      keysRef.current[isDown ? 'add' : 'delete'](e.key.toLowerCase());
    };
    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      keysRef.current = new Set();
    };
  }, [gameState]);

  // Touch drag: window-level pointer tracking (más estable que setPointerCapture en WebView)
  useEffect(() => {
    const area = gameAreaRef.current;
    if (!area || gameState !== 'playing' || !touchMode) return;
    const onMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      const rect = area.getBoundingClientRect();
      const clamped = Math.max(0, Math.min(rect.width - PLAYER_WIDTH, e.clientX - rect.left - PLAYER_WIDTH / 2));
      setPlayerX(Math.round(clamped));
    };
    const onEnd = () => { draggingRef.current = false; };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };
  }, [gameState, touchMode]);

  const getTotalXp = () => Math.min(Math.floor(score / 3) + 5, 150);

  const puzzleOnboardingSteps = [
    { title: 'EcoCatch', text: 'Te explicaré cómo funciona el juego.', emoji: '👋' },
    { title: 'Objetivo', text: 'Atrapa los objetos reciclables ☑️ que caen del cielo. ¡Cada uno suma puntos!\nEvita la basura 🚫 o perderás una vida.', emoji: '🎯' },
    { title: '3 Vidas', text: 'Tienes 3 corazones. Si atrapas basura, pierdes una vida y 10 puntos.\n¡Con 0 vidas el juego termina!', emoji: '❤️' },
    { title: 'Cómo jugar', text: 'Usa los botones para moverte o activa el modo táctil 👆 arrastrando sobre el área de juego.', emoji: '🎮' },
    { title: 'Puntaje', text: 'Entre más lejos llegues, más objetos exclusivos aparecen.\n¡Intenta superar tu récord cada vez!', emoji: '🏆' },
  ];

  function completePuzzleOnboarding() {
    localStorage.setItem('eco_puzzle_tutorial_done', '1');
    setShowPuzzleOnboarding(false);
  }

  if (gameState === 'menu') {
    return (
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-8 border border-emerald-700/30 text-center"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(5,150,105,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 50%, rgba(13,148,136,0.1) 0%, transparent 60%)',
            backgroundColor: 'var(--game-bg)',
          }}>
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/40 animate-bounce">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-2">EcoCatch</h2>
          <p className="text-emerald-400 text-sm mb-4">¡Atrapa reciclables, evita la basura!</p>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Atrapa los <span className="text-emerald-400">reciclables</span> ♻️ que caen
            y <span className="text-red-400">evita la basura</span> 🧻.
            <br />Un solo golpe y termina el juego!
            <br />Entre más avances, más objetos <span className="text-amber-400">exclusivos</span> aparecerán.
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6 text-xs">
            <div className="bg-emerald-900/30 border border-emerald-700/30 rounded-xl p-3">
              <p className="text-emerald-400 font-bold text-lg">{Math.floor(highScore)}</p>
              <p className="text-slate-500">Mejor puntaje</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3">
              <p className="text-slate-200 font-bold text-lg">{totalGames}</p>
              <p className="text-slate-500">Partidas</p>
            </div>
          </div>

          <button onClick={startGame} className="btn-primary px-10 py-3 text-base animate-pulse">
            ¡Jugar ahora!
          </button>

          <div className="mt-6 flex justify-center gap-3">
            {RECYCLABLE_ITEMS.slice(0, 6).map((item, i) => (
              <img key={i} src={item.image} alt={item.label} className="w-9 h-9 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50 hover:scale-110 transition-transform object-contain" />
            ))}
          </div>
          <div className="mt-2 flex justify-center gap-3">
            {WASTE_ITEMS.slice(0, 6).map((item, i) => (
              <img key={i} src={item.image} alt={item.label} className="w-9 h-9 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50 opacity-60 object-contain" />
            ))}
          </div>
        </div>
        {showPuzzleOnboarding && (
          <RobotDialog
            steps={puzzleOnboardingSteps}
            onComplete={completePuzzleOnboarding}
            title="ReBot - Tutorial"
            audioPrefix="j"
          />
        )}
      </div>
    );
  }

  if (gameState === 'over') {
    const xp = getTotalXp();
    return (
      <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
        <div className="relative rounded-3xl overflow-hidden p-8 border border-emerald-700/30 text-center"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(5,150,105,0.15) 0%, transparent 60%)',
            backgroundColor: 'var(--game-bg)',
          }}>
          <div className="flex justify-center mb-4">
            <img src="/robot/triste.png" alt="Game Over"
              className="w-40 h-auto object-contain drop-shadow-2xl animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-100 mb-1">¡Game Over!</h2>
          <p className="text-slate-400 text-sm mb-6">Puntaje final</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <p className="text-amber-400 font-bold text-3xl">{Math.floor(score)}</p>
              <p className="text-xs text-slate-500 mt-1">Puntos</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-center gap-1">
                <Zap className="w-5 h-5 text-amber-400" />
                <p className="text-amber-400 font-bold text-3xl">+{xp}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">XP ganado</p>
            </div>
          </div>

          {Math.floor(score) >= highScore && score > 0 && (
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-xl p-3 mb-6 flex items-center justify-center gap-2 animate-pulse">
              <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">¡Nuevo récord!</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button onClick={startGame} className="btn-primary flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Jugar de nuevo
            </button>
            <button onClick={() => onNavigate?.('leaderboard-game')} className="btn-ghost text-sm flex items-center justify-center gap-2">
              <Trophy className="w-4 h-4" />
              Ver clasificación — ¿estás en el top?
            </button>
            <button onClick={() => setGameState('menu')} className="btn-ghost text-sm">
              Volver al menú
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in select-none w-full max-w-md mx-auto overflow-hidden px-1">
      {/* HUD */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button onClick={endGame} className="text-xs text-slate-500 hover:text-red-400 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-red-500/10 transition-all active:scale-95">
            Salir
          </button>
          <div className="flex items-center gap-0.5 ml-2">
            {[1, 2, 3].map(h => (
              <span key={h} className={`text-base transition-all duration-200 ${h <= lives ? 'opacity-100 scale-100' : 'opacity-20 scale-75'}`}>
                {h <= lives ? '❤️' : '🖤'}
              </span>
            ))}
          </div>
          <button onClick={() => {
            const next = !touchMode;
            setTouchMode(next);
            localStorage.setItem('eco_puzzle_touch', next ? '1' : '0');
          }} className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all active:scale-90 ${touchMode ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400' : 'border-slate-700/50 bg-slate-800/60 text-slate-500 hover:text-slate-300'}`} title={touchMode ? 'Modo táctil (arrastra)' : 'Modo botones'}>
            {touchMode ? '👆' : '◀▶'}
          </button>
        </div>
        <span className="text-lg font-bold text-slate-100 font-mono">{Math.floor(score)}</span>
      </div>

      {/* Combo indicator */}
      {combo >= 3 && (
        <div className="flex items-center justify-center gap-1 mb-1 animate-scale-in">
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl px-4 py-1.5">
            <span className="text-sm font-bold text-amber-400">🔥 Combo x{combo}</span>
          </div>
        </div>
      )}

      {/* Game area */}
      <div
        ref={gameAreaRef}
        className={`relative w-full max-w-full rounded-2xl border border-slate-700/50 bg-slate-900/60 touch-none ${shake ? 'animate-shake' : ''}`}
        style={{
          height: 'calc(100dvh - 220px)',
          minHeight: 400,
          margin: '0 auto',
          backgroundImage: `url(/fondo.png?v=4)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          contain: 'layout',
        }}
        onPointerDown={e => {
          if (!touchMode) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const clamped = Math.max(0, Math.min(rect.width - PLAYER_WIDTH, e.clientX - rect.left - PLAYER_WIDTH / 2));
          setPlayerX(Math.round(clamped));
          draggingRef.current = true;
        }}
      >
        {/* Ground */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-950/40 to-transparent border-t border-emerald-800/30">
          <div className="absolute inset-0" style={{
            backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(5,150,105,0.08) 18px, rgba(5,150,105,0.08) 20px)',
          }} />
        </div>
        <div className="absolute bottom-14 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-600/40 to-transparent" />

        {/* Help button */}
        <button
          onClick={() => setShowTutorial(true)}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700/50 flex items-center justify-center hover:bg-slate-800 transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-slate-300" />
        </button>

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} className="absolute text-sm pointer-events-none"
            style={{ left: p.x, top: p.y, opacity: Math.max(0, p.life), transform: `scale(${p.life})` }}>
            {p.emoji}
          </div>
        ))}

        {/* Floating texts */}
        {floats.map(f => (
          <div key={f.id} className={`absolute text-sm sm:text-base font-bold pointer-events-none ${f.color} break-words max-w-[40vw] leading-tight`}
            style={{ left: `clamp(4px, ${f.x}px, calc(100% - 4px))`, top: `${Math.max(10, f.y)}px`, opacity: Math.max(0, (f.y - 500 + 140) / 60) }}>
            {f.text}
          </div>
        ))}

        {/* Falling items */}
        {items.map(item => <div key={item.id} className={item.type === 'recyclable' ? 'animate-item-glow' : ''}><GameItem item={item} /></div>)}

        {/* Coach de hitos (robot + mensaje con texto) */}
        {coachMilestone != null && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none gap-3">
            <div className="bg-slate-900/85 backdrop-blur-sm px-6 py-3 rounded-2xl border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <p className="text-lg sm:text-xl font-bold text-white text-center break-words max-w-[85vw]">{COACH_MESSAGE[coachMilestone]}</p>
            </div>
            <img
              src={COACH_ROBOT_POSE[coachMilestone]}
              alt={`¡${coachMilestone} puntos!`}
              className="max-h-[65%] w-auto object-contain drop-shadow-2xl coach-pop"
            />
          </div>
        )}

        {/* Player bar */}
        <div className="absolute bottom-4"
          style={{ transform: `translateX(${playerX}px)`, width: PLAYER_WIDTH, height: PLAYER_HEIGHT, willChange: 'transform' }}>
          <div className={`w-full h-full rounded-md flex items-center justify-center shadow-lg transition-colors duration-100 ${
            hitFlash ? 'bg-red-500/90 border-red-400/60' : 'bg-emerald-500/90 border-emerald-400/60'
          } border`}>
            <span className="text-[10px] drop-shadow-lg">{hitFlash ? '💥' : '♻️'}</span>
          </div>
        </div>

        {/* Direction buttons - only in button mode */}
        {gameState === 'playing' && !touchMode && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="absolute pointer-events-auto left-1 bottom-[90px] w-14 h-14">
              <button
                onPointerDown={() => { btnLeftRef.current = true; }}
                onPointerUp={() => { btnLeftRef.current = false; }}
                onPointerLeave={() => { btnLeftRef.current = false; }}
                className="w-full h-full rounded-2xl flex items-center justify-center bg-slate-900/10 border border-slate-700/15 backdrop-blur-sm active:bg-slate-700 active:scale-90 transition-all touch-none select-none"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-100" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            </div>
            <div className="absolute pointer-events-auto right-1 bottom-[90px] w-14 h-14">
              <button
                onPointerDown={() => { btnRightRef.current = true; }}
                onPointerUp={() => { btnRightRef.current = false; }}
                onPointerLeave={() => { btnRightRef.current = false; }}
                className="w-full h-full rounded-2xl flex items-center justify-center bg-slate-900/10 border border-slate-700/15 backdrop-blur-sm active:bg-slate-700 active:scale-90 transition-all touch-none select-none"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-slate-100" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-500">
        {touchMode ? '👆 Arrastra el dedo sobre el área de juego para mover' : '← → o A/D para mover · Botones ◀ ▶'}
      </p>

      {showTutorial && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowTutorial(false)} />
          <div className="relative bg-slate-900/90 border border-slate-700/50 rounded-2xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-100">♻️ Cómo Jugar</h3>
              <button onClick={() => setShowTutorial(false)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                Arrastra los objetos reciclables a sus contenedores correctos
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                Los objetos caen desde arriba, puedes moverlos con los botones ◀ ▶
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                Ganas puntos por cada objeto bien clasificado
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                El juego termina cuando un objeto toca el suelo sin ser clasificado
              </li>
              <li className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-emerald-400 mt-0.5">•</span>
                ¡Los objetos pueden apilarse! Organízalos bien
              </li>
            </ul>
            <button
              onClick={() => setShowTutorial(false)}
              className="btn-primary w-full py-3"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
