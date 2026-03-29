import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type DeveloperWorkspaceShellProps = {
  header?: ReactNode;
  inspector?: ReactNode;
  overlays?: ReactNode;
  rail?: ReactNode;
  stage: ReactNode;
  utility?: ReactNode;
};

export function DeveloperWorkspaceShell({
  header,
  inspector,
  overlays,
  rail,
  stage,
  utility
}: DeveloperWorkspaceShellProps) {
  const [railWidth, setRailWidth] = useState(86);
  const [inspectorWidth, setInspectorWidth] = useState(360);
  const [utilityHeight, setUtilityHeight] = useState(240);

  const resizeState = useRef<{
    type: "rail" | "inspector" | "utility" | null;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  }>({
    type: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0
  });

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = resizeState.current;
      if (!state.type) return;

      if (state.type === "rail") {
        const delta = e.clientX - state.startX;
        setRailWidth(Math.min(300, Math.max(64, state.startWidth + delta)));
      } else if (state.type === "inspector") {
        const delta = state.startX - e.clientX;
        setInspectorWidth(Math.min(600, Math.max(260, state.startWidth + delta)));
      } else if (state.type === "utility") {
        const delta = state.startY - e.clientY;
        setUtilityHeight(Math.min(600, Math.max(100, state.startHeight + delta)));
      }
    };

    const handlePointerUp = () => {
      resizeState.current.type = null;
      document.body.style.cursor = "";
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  const startResize = (type: "rail" | "inspector" | "utility") => (e: React.PointerEvent) => {
    e.preventDefault();
    resizeState.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: type === "rail" ? railWidth : type === "inspector" ? inspectorWidth : 0,
      startHeight: type === "utility" ? utilityHeight : 0
    };
    document.body.style.cursor = type === "utility" ? "ns-resize" : "ew-resize";
  };
  return (
    <div 
      className="developer-workspace-shell"
      style={{
        "--dev-rail-width": `${railWidth}px`,
        "--dev-inspector-width": `${inspectorWidth}px`,
        "--dev-utility-height": `${utilityHeight}px`
      } as CSSProperties}
    >
      {header ? <div className="developer-workspace-shell__header">{header}</div> : null}
      {rail ? (
        <>
          <div className="developer-workspace-shell__rail">{rail}</div>
          <div className="developer-workspace-shell__gutter-v developer-workspace-shell__gutter-v--rail" onPointerDown={startResize("rail")} />
        </>
      ) : null}
      <div className="app-shell__stage developer-workspace-shell__stage">{stage}</div>
      {inspector ? (
        <>
          <div className="developer-workspace-shell__gutter-v developer-workspace-shell__gutter-v--inspector" onPointerDown={startResize("inspector")} />
          <div className="developer-workspace-shell__inspector">{inspector}</div>
        </>
      ) : null}
      {utility ? (
        <>
          <div className="developer-workspace-shell__gutter-h developer-workspace-shell__gutter-h--utility" onPointerDown={startResize("utility")} />
          <div className="developer-workspace-shell__utility">{utility}</div>
        </>
      ) : null}
      {overlays ? <div className="developer-workspace-shell__overlay-stack">{overlays}</div> : null}
    </div>
  );
}
