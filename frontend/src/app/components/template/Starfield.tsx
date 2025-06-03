"use client";
import { useEffect, useRef } from "react";

export default function Starfield({ numStars = 80 }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Generate random star positions and speeds
    const stars = Array.from({ length: numStars }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.random() * 1.1 + 0.2,
      speed: Math.random() * 0.2 + 0.05,
      twinkle: Math.random() * Math.PI * 2,
    }));

    let animationId: number;
    function animate() {
      ctx.clearRect(0, 0, width, height);
      stars.forEach((star) => {
        // twinkle: alpha goes up and down
        const alpha = 0.7 + 0.3 * Math.sin(Date.now() * 0.001 * star.speed + star.twinkle);
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(240, 230, 255, ${alpha})`;
        ctx.shadowColor = "#b49aff";
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });
      animationId = requestAnimationFrame(animate);
    }
    animate();

    // Handle resize
    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      stars.forEach((star) => {
        star.x = Math.random() * width;
        star.y = Math.random() * height;
      });
    }
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [numStars]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}
