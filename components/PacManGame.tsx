import React, { useEffect, useRef, useState } from 'react';

export default function PacManGame({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Game constants
    const TILE_SIZE = 20;
    const ROWS = 21;
    const COLS = 21;
    canvas.width = COLS * TILE_SIZE;
    canvas.height = ROWS * TILE_SIZE;

    // 1: wall, 0: dot, 2: empty, 3: power pellet
    const map = [
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,3,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,3,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
      [1,1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1,1],
      [2,2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,2],
      [1,1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1,1],
      [2,2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2,2],
      [1,1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1,1],
      [2,2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2,2],
      [1,1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1],
      [1,0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0,1],
      [1,3,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,3,1],
      [1,1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1,1],
      [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
      [1,0,1,1,1,1,1,1,1,0,1,0,1,1,1,1,1,1,1,0,1],
      [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    ];

    // Game state
    let gameMap = JSON.parse(JSON.stringify(map));
    let currentScore = 0;
    let isGameOver = false;

    // Player (Jules - SpongeBob style)
    const player = {
      x: 10 * TILE_SIZE + TILE_SIZE/2,
      y: 15 * TILE_SIZE + TILE_SIZE/2,
      vx: 0,
      vy: 0,
      speed: 2,
      radius: TILE_SIZE/2 - 2,
      nextVx: 0,
      nextVy: 0,
    };

    // Ghosts (Kraken Opus style)
    const ghosts = [
      { x: 9 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: 2, vy: 0, speed: 1.5, color: '#9333ea' },
      { x: 10 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: -2, vy: 0, speed: 1.5, color: '#c084fc' },
      { x: 11 * TILE_SIZE + TILE_SIZE/2, y: 9 * TILE_SIZE + TILE_SIZE/2, vx: 0, vy: -2, speed: 1.5, color: '#7e22ce' },
    ];

    // Input handling
    const keys: {[key: string]: boolean} = {};
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.key] = true;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) { player.nextVx = 0; player.nextVy = -player.speed; e.preventDefault(); }
      if (['ArrowDown', 's', 'S'].includes(e.key)) { player.nextVx = 0; player.nextVy = player.speed; e.preventDefault(); }
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) { player.nextVx = -player.speed; player.nextVy = 0; e.preventDefault(); }
      if (['ArrowRight', 'd', 'D'].includes(e.key)) { player.nextVx = player.speed; player.nextVy = 0; e.preventDefault(); }
    };
    const handleKeyUp = (e: KeyboardEvent) => { keys[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Collision detection
    const isWall = (x: number, y: number) => {
      const col = Math.floor(x / TILE_SIZE);
      const row = Math.floor(y / TILE_SIZE);
      if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
      return gameMap[row][col] === 1;
    };

    const canMove = (x: number, y: number, vx: number, vy: number) => {
      const margin = player.radius;
      return !isWall(x + vx + margin, y + vy + margin) &&
             !isWall(x + vx - margin, y + vy + margin) &&
             !isWall(x + vx + margin, y + vy - margin) &&
             !isWall(x + vx - margin, y + vy - margin);
    };

    // Game loop
    let animationId: number;
    const update = () => {
      if (isGameOver) return;

      // Move player
      if (canMove(player.x, player.y, player.nextVx, player.nextVy)) {
        player.vx = player.nextVx;
        player.vy = player.nextVy;
      }
      if (canMove(player.x, player.y, player.vx, player.vy)) {
        player.x += player.vx;
        player.y += player.vy;
      }

      // Wrap around
      if (player.x < 0) player.x = canvas.width;
      if (player.x > canvas.width) player.x = 0;

      // Eat dots
      const col = Math.floor(player.x / TILE_SIZE);
      const row = Math.floor(player.y / TILE_SIZE);
      if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
        if (gameMap[row][col] === 0) {
          gameMap[row][col] = 2;
          currentScore += 10;
          setScore(currentScore);
        } else if (gameMap[row][col] === 3) {
          gameMap[row][col] = 2;
          currentScore += 50;
          setScore(currentScore);
        }
      }

      // Move ghosts
      ghosts.forEach(ghost => {
        if (!canMove(ghost.x, ghost.y, ghost.vx, ghost.vy)) {
          // Simple random direction change
          const dirs = [
            {vx: ghost.speed, vy: 0}, {vx: -ghost.speed, vy: 0},
            {vx: 0, vy: ghost.speed}, {vx: 0, vy: -ghost.speed}
          ];
          const validDirs = dirs.filter(d => canMove(ghost.x, ghost.y, d.vx, d.vy));
          if (validDirs.length > 0) {
            const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
            ghost.vx = dir.vx;
            ghost.vy = dir.vy;
          }
        }
        ghost.x += ghost.vx;
        ghost.y += ghost.vy;

        // Wrap around
        if (ghost.x < 0) ghost.x = canvas.width;
        if (ghost.x > canvas.width) ghost.x = 0;

        // Collision with player
        const dist = Math.hypot(player.x - ghost.x, player.y - ghost.y);
        if (dist < player.radius * 2) {
          isGameOver = true;
          setGameOver(true);
        }
      });
    };

    const draw = () => {
      // Clear
      ctx.fillStyle = isDarkMode ? '#0f172a' : '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw map
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          if (gameMap[r][c] === 1) {
            ctx.fillStyle = isDarkMode ? '#1e3a8a' : '#bfdbfe';
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = isDarkMode ? '#3b82f6' : '#60a5fa';
            ctx.strokeRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          } else if (gameMap[r][c] === 0) {
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (gameMap[r][c] === 3) {
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(c * TILE_SIZE + TILE_SIZE/2, r * TILE_SIZE + TILE_SIZE/2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Draw player (Jules - Yellow Square with face)
      ctx.fillStyle = '#fde047';
      ctx.fillRect(player.x - player.radius, player.y - player.radius, player.radius*2, player.radius*2);
      // Eyes
      ctx.fillStyle = 'white';
      ctx.beginPath(); ctx.arc(player.x - 3, player.y - 3, 3, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + 3, player.y - 3, 3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'blue';
      ctx.beginPath(); ctx.arc(player.x - 3, player.y - 3, 1.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(player.x + 3, player.y - 3, 1.5, 0, Math.PI*2); ctx.fill();
      // Smile
      ctx.strokeStyle = 'black';
      ctx.beginPath(); ctx.arc(player.x, player.y + 2, 4, 0, Math.PI); ctx.stroke();

      // Draw ghosts (Kraken Opus)
      ghosts.forEach(ghost => {
        ctx.fillStyle = ghost.color;
        ctx.beginPath();
        ctx.arc(ghost.x, ghost.y, player.radius, Math.PI, 0);
        ctx.lineTo(ghost.x + player.radius, ghost.y + player.radius);
        ctx.lineTo(ghost.x + player.radius/2, ghost.y + player.radius - 2);
        ctx.lineTo(ghost.x, ghost.y + player.radius);
        ctx.lineTo(ghost.x - player.radius/2, ghost.y + player.radius - 2);
        ctx.lineTo(ghost.x - player.radius, ghost.y + player.radius);
        ctx.fill();
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath(); ctx.arc(ghost.x - 3, ghost.y - 2, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ghost.x + 3, ghost.y - 2, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black';
        ctx.beginPath(); ctx.arc(ghost.x - 3, ghost.y - 2, 1, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(ghost.x + 3, ghost.y - 2, 1, 0, Math.PI*2); ctx.fill();
      });
    };

    const loop = () => {
      update();
      draw();
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationId);
    };
  }, [isDarkMode]);

  return (
    <div className="flex flex-col items-center">
      <div className="mb-4 flex justify-between w-full max-w-[420px]">
        <div className="text-xl font-bold text-yellow-500">SCORE: {score}</div>
        {gameOver && <div className="text-xl font-bold text-red-500 animate-pulse">GAME OVER</div>}
      </div>
      <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'} shadow-inner`}>
        <canvas 
          ref={canvasRef} 
          className="rounded-lg shadow-lg"
          style={{ width: '420px', height: '420px' }}
        />
      </div>
      <p className={`mt-4 text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Use WASD or Arrow Keys to move Jules and avoid the Kraken Opus!
      </p>
    </div>
  );
}
