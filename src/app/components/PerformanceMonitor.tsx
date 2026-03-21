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
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px",
        background: "rgba(0, 0, 0, 0.5)",
        color: "#00ff00",
        padding: "4px 8px",
        borderRadius: "4px",
        fontFamily: "monospace",
        fontSize: "12px",
        pointerEvents: "none",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        border: "1px solid rgba(0, 255, 0, 0.2)"
      }}
    >
      <div
        style={{
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: fps > 50 ? "#00ff00" : fps > 30 ? "#ffff00" : "#ff0000",
          boxShadow: `0 0 4px ${fps > 50 ? "#00ff00" : fps > 30 ? "#ffff00" : "#ff0000"}`
        }}
      />
      <span>{fps} FPS</span>
    </div>
  );
}
