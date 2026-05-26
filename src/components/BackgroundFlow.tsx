import React, { useEffect, useRef } from 'react';
import logoPng from '../../logo.png';

interface StreamPath {
  yPct: number;          // vertical base percentage (e.g. 0.3 = 30% height)
  amplitude: number;     // wave height in px
  frequencyPct: number;  // frequency relative to screen width
  phase: number;         // offset angle
  phaseSpeed: number;    // increment speed of phase
  color: string;         // stroke color
  width: number;
}

interface Spark {
  streamIndex: number;
  progress: number;      // 0 to 1 along the screen X axis
  speed: number;         // speed along curve
  size: number;
  color: string;
  alpha: number;         // particle opacity
  seed: number;          // unique noise offset
}

export function BackgroundFlow() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000, targetX: -1000, targetY: -1000, radius: 150 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Subtle stream lines (extremely low opacity to not distract from content text)
    const streams: StreamPath[] = [
      {
        yPct: 0.25,
        amplitude: 35,
        frequencyPct: 0.0015,
        phase: 0,
        phaseSpeed: 0.004,
        color: 'rgba(255, 78, 0, 0.02)',
        width: 0.75,
      },
      {
        yPct: 0.50,
        amplitude: 45,
        frequencyPct: 0.001,
        phase: Math.PI * 0.5,
        phaseSpeed: -0.003,
        color: 'rgba(255, 170, 0, 0.015)',
        width: 0.5,
      },
      {
        yPct: 0.75,
        amplitude: 30,
        frequencyPct: 0.002,
        phase: Math.PI,
        phaseSpeed: 0.003,
        color: 'rgba(255, 78, 0, 0.012)',
        width: 0.6,
      }
    ];

    // Minimal spark particles (small count, low size, gentle speeds for high readability)
    const sparks: Spark[] = Array.from({ length: 12 }, () => {
      const streamIndex = Math.floor(Math.random() * streams.length);
      return {
        streamIndex,
        progress: Math.random(),
        speed: 0.0003 + Math.random() * 0.0006, // Slower movement
        size: 0.8 + Math.random() * 1.5,       // Smaller sizes
        color: Math.random() > 0.5 ? '255, 78, 0' : '255, 170, 0',
        alpha: 0.15 + Math.random() * 0.25,    // Low base opacity
        seed: Math.random() * 100
      };
    });

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = e.clientX;
      mouseRef.current.targetY = e.clientY;
    };
    const handleMouseLeave = () => {
      mouseRef.current.targetX = -1000;
      mouseRef.current.targetY = -1000;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Main Draw & Animate loop
    const tick = () => {
      // Clear canvas with very transparent trail
      ctx.fillStyle = 'rgba(7, 7, 9, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Dampen mouse movement
      const mouse = mouseRef.current;
      if (mouse.targetX !== -1000) {
        mouse.x += (mouse.targetX - mouse.x) * 0.05;
        mouse.y += (mouse.targetY - mouse.y) * 0.05;
      } else {
        mouse.x = -1000;
        mouse.y = -1000;
      }

      // Draw mouse cursor glow
      if (mouse.x !== -1000) {
        ctx.save();
        const cursorGlow = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, mouse.radius
        );
        cursorGlow.addColorStop(0, 'rgba(255, 78, 0, 0.05)');
        cursorGlow.addColorStop(0.6, 'rgba(255, 170, 0, 0.01)');
        cursorGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = cursorGlow;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Compute Stream Points
      const getStreamY = (stream: StreamPath, x: number): number => {
        const baseX = x * stream.frequencyPct;
        const wave = Math.sin(baseX + stream.phase) * stream.amplitude;
        const baseHeight = stream.yPct * height;
        return baseHeight + wave;
      };

      // Draw stream lines
      streams.forEach((stream) => {
        stream.phase += stream.phaseSpeed;

        ctx.beginPath();
        for (let x = 0; x <= width; x += 30) {
          const y = getStreamY(stream, x);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = stream.color;
        ctx.lineWidth = stream.width;
        ctx.stroke();
      });

      // Draw sparks traveling along streams
      sparks.forEach((spark) => {
        spark.progress += spark.speed;
        if (spark.progress > 1) {
          spark.progress = 0;
          spark.streamIndex = Math.floor(Math.random() * streams.length);
          spark.speed = 0.0003 + Math.random() * 0.0006;
        }

        const stream = streams[spark.streamIndex];
        const x = spark.progress * width;
        let y = getStreamY(stream, x);

        // Add soft secondary wave wobble
        y += Math.cos(x * 0.01 + spark.seed) * 5;

        // Subtle mouse deflection
        if (mouse.x !== -1000) {
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.radius) {
            const force = (1 - dist / mouse.radius) * 12;
            const angle = Math.atan2(dy, dx);
            y += Math.sin(angle) * force;
          }
        }

        // Draw spark particle with glow
        ctx.beginPath();
        ctx.arc(x, y, spark.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${spark.color}, ${spark.alpha})`;
        ctx.shadowColor = `rgba(${spark.color}, 1)`;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      });

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <>
      {/* Giant moving glowing blobs behind the canvas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-20 bg-[#070709] select-none">
        <div className="absolute top-[-20%] left-[-20%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,78,0,0.06),transparent_75%)] blur-[120px] animate-blob-drift-1"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[70vw] h-[70vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,170,0,0.05),transparent_75%)] blur-[140px] animate-blob-drift-2"></div>
        <div className="absolute top-[25%] left-[50%] -translate-x-1/2 w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle_at_center,rgba(255,78,0,0.04),transparent_75%)] blur-[120px] animate-blob-drift-3"></div>
      </div>

      {/* Giant Floating Logo Background */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.05] animate-float-logo" style={{ zIndex: -15 }}>
        <img src={logoPng} alt="" className="w-[50vw] max-w-[500px] h-auto aspect-square object-contain" />
      </div>

      {/* Render Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
    </>
  );
}
