import { useEffect, useRef } from "react";

type NodePoint = {
  x: number;
  y: number;
  r: number;
  phase: number;
};

export default function MarketFilm() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frame = 0;
    let animationId = 0;
    const points: NodePoint[] = Array.from({ length: 72 }, (_, index) => ({
      x: Math.sin(index * 18.7) * 0.5 + 0.5,
      y: Math.cos(index * 11.3) * 0.5 + 0.5,
      r: 1 + ((index * 7) % 4) * 0.42,
      phase: index * 0.41
    }));

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      frame += 0.006;
      context.clearRect(0, 0, width, height);

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "rgba(12, 20, 31, 0.62)");
      gradient.addColorStop(0.48, "rgba(5, 8, 13, 0.2)");
      gradient.addColorStop(1, "rgba(22, 28, 36, 0.44)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      context.strokeStyle = "rgba(148, 171, 192, 0.075)";
      context.lineWidth = 1;
      for (let x = 0; x < width; x += 82) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let y = 0; y < height; y += 82) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      const livePoints = points.map((point, index) => ({
        x: (point.x * width + Math.sin(frame * 2 + point.phase) * 12 + width) % width,
        y: (point.y * height + Math.cos(frame * 1.6 + point.phase) * 9 + height) % height,
        r: point.r,
        index
      }));

      context.strokeStyle = "rgba(123, 200, 216, 0.12)";
      livePoints.forEach((point, index) => {
        for (let next = index + 1; next < livePoints.length; next += 17) {
          const target = livePoints[next];
          const distance = Math.hypot(point.x - target.x, point.y - target.y);
          if (distance < 230) {
            context.globalAlpha = Math.max(0.04, 0.18 - distance / 1700);
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(target.x, target.y);
            context.stroke();
          }
        }
      });
      context.globalAlpha = 1;

      livePoints.forEach((point) => {
        const pulse = Math.sin(frame * 5 + point.index) * 0.35 + 0.65;
        context.fillStyle = `rgba(183, 197, 208, ${0.25 + pulse * 0.3})`;
        context.beginPath();
        context.arc(point.x, point.y, point.r + pulse, 0, Math.PI * 2);
        context.fill();
      });

      context.strokeStyle = "rgba(200, 163, 92, 0.46)";
      context.lineWidth = 1.5;
      for (let row = 0; row < 4; row += 1) {
        context.beginPath();
        const baseY = height * (0.28 + row * 0.14);
        for (let x = -20; x <= width + 20; x += 18) {
          const y =
            baseY +
            Math.sin(x * 0.012 + frame * 7 + row) * (10 + row * 2) +
            Math.cos(x * 0.025 + frame * 4) * 8;
          if (x === -20) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.globalAlpha = 0.18 - row * 0.024;
        context.stroke();
      }
      context.globalAlpha = 1;

      animationId = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}
