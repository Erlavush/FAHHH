import { useEffect, useState, useRef } from "react";

export function PerformanceMonitor() {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const update = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationId = requestAnimationFrame(update);
    };

    animationId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="performance-monitor">
      <div
        className={`performance-monitor__dot ${
          fps > 50
            ? "performance-monitor__dot--good"
            : fps > 30
              ? "performance-monitor__dot--warn"
              : "performance-monitor__dot--bad"
        }`}
      />
      <span>{fps} FPS</span>
    </div>
  );
}
