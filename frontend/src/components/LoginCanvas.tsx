import React, { useEffect, useRef } from 'react';

interface LoginCanvasProps {
  speed?: number;
  opacity?: number;
  isDark?: boolean;
}

export const LoginCanvas: React.FC<LoginCanvasProps> = ({
  speed = 0.005,
  opacity = 0.8,
  isDark = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotationAngle = 0;

    // Respect prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const isReducedMotion = mediaQuery.matches;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Smart City Nodes & Traffic Orbits Configuration
    const nodeCount = 36;
    const ringCount = 4;
    const particles: { ring: number; angle: number; speed: number; radius: number; size: number }[] = [];

    for (let i = 0; i < nodeCount; i++) {
      particles.push({
        ring: (i % ringCount) + 1,
        angle: (i / nodeCount) * Math.PI * 2,
        speed: (0.2 + (i % 3) * 0.1) * (i % 2 === 0 ? 1 : -1),
        radius: 120 + (i % ringCount) * 80,
        size: 2.5 + (i % 3) * 1.5
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.translate(centerX, centerY);

      if (!isReducedMotion) {
        rotationAngle += speed;
      }
      ctx.rotate(rotationAngle);

      // Draw Glowing Orbits
      for (let r = 1; r <= ringCount; r++) {
        const radius = 120 + (r - 1) * 80;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.lineWidth = r % 2 === 0 ? 1.5 : 1;
        ctx.setLineDash(r % 2 === 0 ? [8, 12] : []);
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${0.15 + r * 0.05})`
          : `rgba(2, 132, 199, ${0.15 + r * 0.05})`;
        ctx.stroke();
      }

      // Draw Connected Neural / Network Ribbons
      ctx.setLineDash([]);
      particles.forEach((p, idx) => {
        const currentAngle = p.angle + (isReducedMotion ? 0 : rotationAngle * p.speed);
        const x = Math.cos(currentAngle) * p.radius;
        const y = Math.sin(currentAngle) * p.radius;

        // Connect nearby nodes in adjacent rings
        for (let j = idx + 1; j < particles.length; j++) {
          const p2 = particles[j];
          if (Math.abs(p2.ring - p.ring) <= 1) {
            const currentAngle2 = p2.angle + (isReducedMotion ? 0 : rotationAngle * p2.speed);
            const x2 = Math.cos(currentAngle2) * p2.radius;
            const y2 = Math.sin(currentAngle2) * p2.radius;

            const dist = Math.hypot(x2 - x, y2 - y);
            if (dist < 130) {
              ctx.beginPath();
              ctx.moveTo(x, y);
              ctx.lineTo(x2, y2);
              const alpha = (1 - dist / 130) * 0.35;
              ctx.strokeStyle = isDark
                ? `rgba(56, 189, 248, ${alpha})`
                : `rgba(37, 99, 235, ${alpha})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }

        // Draw Orbital Particles / AI Traffic Hubs
        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, p.size * 2.5);
        if (isDark) {
          gradient.addColorStop(0, '#38bdf8');
          gradient.addColorStop(1, 'rgba(56, 189, 248, 0)');
        } else {
          gradient.addColorStop(0, '#2563eb');
          gradient.addColorStop(1, 'rgba(37, 99, 235, 0)');
        }
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Central Smart City Core Pulse
      const corePulse = Math.sin(rotationAngle * 3) * 10;
      const coreRadius = 55 + corePulse;
      ctx.beginPath();
      ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
      const coreGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, coreRadius);
      if (isDark) {
        coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
        coreGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      } else {
        coreGrad.addColorStop(0, 'rgba(37, 99, 235, 0.3)');
        coreGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }
      ctx.fillStyle = coreGrad;
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, opacity, isDark]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
