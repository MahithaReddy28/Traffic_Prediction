import React, { useEffect, useRef } from 'react';

interface Live3DBackgroundProps {
  theme?: 'dark' | 'light';
  enabled?: boolean;
}

export const Live3DBackground: React.FC<Live3DBackgroundProps> = ({ theme = 'dark', enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // 3D Perspective Grid Variables
    let offsetZ = 0;
    const speedZ = 0.8;
    const horizonY = height * 0.45;

    // Floating 3D Nodes / Traffic Particles
    const particlesCount = 70;
    const particles: Array<{
      x: number;
      y: number;
      z: number;
      radius: number;
      speed: number;
      color: string;
      pulse: number;
    }> = [];

    const colorsDark = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e', '#fbbf24'];
    const colorsLight = ['#0284c7', '#4f46e5', '#059669', '#e11d48', '#d97706'];

    for (let i = 0; i < particlesCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 1000 + 1,
        radius: Math.random() * 2.5 + 1,
        speed: Math.random() * 2 + 1,
        color: colorsDark[Math.floor(Math.random() * colorsDark.length)],
        pulse: Math.random() * Math.PI * 2
      });
    }

    const mouseX = 0;
    const mouseY = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';

      // 1. Background Gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isDark) {
        bgGrad.addColorStop(0, '#040711');
        bgGrad.addColorStop(0.5, '#080d1a');
        bgGrad.addColorStop(1, '#0c1326');
      } else {
        bgGrad.addColorStop(0, '#f8fafc');
        bgGrad.addColorStop(0.5, '#f1f5f9');
        bgGrad.addColorStop(1, '#e2e8f0');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Render 3D Perspective Grid
      offsetZ = (offsetZ + speedZ) % 40;
      ctx.save();
      ctx.translate(width / 2 + mouseX, horizonY + mouseY * 0.5);

      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.1)';
      ctx.lineWidth = 1.2;

      // Perspective Perspective Lines originating from vanishing point
      const linesCount = 28;
      const fov = 400;

      for (let i = -linesCount / 2; i <= linesCount / 2; i++) {
        const xStart = 0;
        const yStart = 0;
        const angle = (i / linesCount) * Math.PI * 0.85;
        const xEnd = Math.sin(angle) * width * 1.8;
        const yEnd = Math.cos(angle) * height * 1.4;

        ctx.beginPath();
        ctx.moveTo(xStart, yStart);
        ctx.lineTo(xEnd, yEnd);
        ctx.stroke();
      }

      // 3D Horizontal Ring / Grid Lines moving forward
      const gridRows = 16;
      for (let r = 1; r <= gridRows; r++) {
        const z = r * 40 - offsetZ;
        if (z <= 0) continue;

        const scale = fov / (fov + z);
        const yPos = (height * 0.75) * scale;
        const widthAtZ = width * 1.6 * scale;

        ctx.beginPath();
        ctx.moveTo(-widthAtZ / 2, yPos);
        ctx.lineTo(widthAtZ / 2, yPos);
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${0.25 * (1 - r / gridRows)})`
          : `rgba(2, 132, 199, ${0.2 * (1 - r / gridRows)})`;
        ctx.stroke();
      }

      ctx.restore();

      // 3. Floating 3D Traffic Particle Nodes
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.z -= p.speed;
        p.pulse += 0.03;

        if (p.z <= 0) {
          p.z = 1000;
          p.x = (Math.random() - 0.5) * width * 2;
          p.y = (Math.random() - 0.5) * height * 1.5;
        }

        const k = fov / (fov + p.z);
        const px = (p.x + mouseX * 2) * k + width / 2;
        const py = (p.y + mouseY * 2) * k + height / 2;
        const size = Math.max(0.8, p.radius * k * (1 + Math.sin(p.pulse) * 0.3));

        if (px >= 0 && px <= width && py >= 0 && py <= height) {
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? p.color : colorsLight[i % colorsLight.length];
          ctx.shadowBlur = isDark ? 12 : 6;
          ctx.shadowColor = p.color;
          ctx.globalAlpha = Math.min(1, k * 1.5);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.globalAlpha = 1;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [theme, enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[0] transition-opacity duration-700 opacity-25 dark:opacity-30"
      style={{ filter: theme === 'dark' ? 'contrast(1.05)' : 'none' }}
    />
  );
};
