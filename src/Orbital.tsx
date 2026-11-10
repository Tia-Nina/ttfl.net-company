import { useEffect, useRef } from "react";

type Vector = { x: number; y: number; z: number };
const sections = 180;
const sides = 28;

function center(t: number): Vector {
  const radius = 1.8 + 0.56 * Math.cos(3 * t);
  return {
    x: radius * Math.cos(2 * t),
    y: radius * Math.sin(2 * t),
    z: 0.72 * Math.sin(3 * t),
  };
}

// Build one continuous trefoil tube. Animation only changes its viewing angle.
const mesh = Array.from({ length: sections }, (_, index) => {
  const t = (index / sections) * Math.PI * 2;
  const point = center(t);
  const next = center(t + 0.001);
  const tangent = {
    x: next.x - point.x,
    y: next.y - point.y,
    z: next.z - point.z,
  };
  const length = Math.hypot(tangent.x, tangent.y, tangent.z);
  tangent.x /= length;
  tangent.y /= length;
  tangent.z /= length;
  const normalLength = Math.hypot(tangent.x, tangent.y);
  const normal = {
    x: -tangent.y / normalLength,
    y: tangent.x / normalLength,
    z: 0,
  };
  const binormal = {
    x: -tangent.z * normal.y,
    y: tangent.z * normal.x,
    z: tangent.x * normal.y - tangent.y * normal.x,
  };
  return Array.from({ length: sides }, (_, side) => {
    const angle = (side / sides) * Math.PI * 2;
    const a = Math.cos(angle) * 0.47;
    const b = Math.sin(angle) * 0.47;
    return {
      x: point.x + a * normal.x + b * binormal.x,
      y: point.y + a * normal.y + b * binormal.y,
      z: point.z + a * normal.z + b * binormal.z,
    };
  });
});

export default function Orbital({
  dark,
  paused,
}: {
  dark: boolean;
  paused: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotation = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let previousTime = 0;
    let visible = true;

    function draw(time: number) {
      if (!context) return;
      if (time - previousTime < 32) {
        frame = requestAnimationFrame(draw);
        return;
      }
      const elapsed = Math.min(time - previousTime, 50);
      previousTime = time;
      if (!paused && !reducedMotion.matches && visible && !document.hidden)
        rotation.current += elapsed * 0.000065;
      context.clearRect(0, 0, width, height);
      const angle = rotation.current + 0.35;
      const scale = Math.min(width, height) * 0.153;
      const tilt = 0.86;
      const projected = mesh.map((ring) =>
        ring.map((point) => {
          const x = point.x * Math.cos(angle) - point.z * Math.sin(angle);
          const z = point.x * Math.sin(angle) + point.z * Math.cos(angle);
          const y = point.y * Math.cos(tilt) - z * Math.sin(tilt);
          const depth = point.y * Math.sin(tilt) + z * Math.cos(tilt);
          const perspective = 7 / (7 - depth);
          return {
            x: width / 2 + x * scale * perspective,
            y: height / 2 + y * scale * perspective,
            z: depth,
          };
        }),
      );

      context.lineWidth = 0.65;
      for (let index = 0; index < sections; index++) {
        const ring = projected[index];
        const depth = ring.reduce((total, point) => total + point.z, 0) / sides;
        const alpha = 0.13 + ((depth + 3) / 6) * (dark ? 0.52 : 0.56);
        context.strokeStyle = `rgba(${dark ? "255, 120, 69" : "213, 73, 25"}, ${alpha})`;
        context.beginPath();
        ring.forEach((point, side) =>
          side === 0
            ? context.moveTo(point.x, point.y)
            : context.lineTo(point.x, point.y),
        );
        context.closePath();
        context.stroke();
      }

      context.lineWidth = 0.55;
      for (let side = 0; side < sides; side += 2) {
        context.strokeStyle = dark
          ? "rgba(255, 176, 117, 0.3)"
          : "rgba(211, 88, 39, 0.22)";
        context.beginPath();
        projected.forEach((ring, index) =>
          index === 0
            ? context.moveTo(ring[side].x, ring[side].y)
            : context.lineTo(ring[side].x, ring[side].y),
        );
        context.closePath();
        context.stroke();
      }
      if (!paused && !reducedMotion.matches && visible && !document.hidden)
        frame = requestAnimationFrame(draw);
    }

    function refresh() {
      cancelAnimationFrame(frame);
      previousTime = 0;
      frame = requestAnimationFrame(draw);
    }

    const resize = new ResizeObserver(([entry]) => {
      width = entry.contentRect.width;
      height = entry.contentRect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      refresh();
    });
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      refresh();
    });
    resize.observe(canvas);
    visibility.observe(canvas);
    reducedMotion.addEventListener("change", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      reducedMotion.removeEventListener("change", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [dark, paused]);

  return (
    <canvas ref={canvasRef} className="orbital-canvas" aria-hidden="true" />
  );
}
