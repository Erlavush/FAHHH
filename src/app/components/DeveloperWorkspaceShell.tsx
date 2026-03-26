import type { ReactNode } from "react";

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
  return (
    <div className="developer-workspace-shell">
      {header ? <div className="developer-workspace-shell__header">{header}</div> : null}
      {rail ? <div className="developer-workspace-shell__rail">{rail}</div> : null}
      <div className="app-shell__stage developer-workspace-shell__stage">{stage}</div>
      {inspector ? (
        <div className="developer-workspace-shell__inspector">{inspector}</div>
      ) : null}
      {utility ? <div className="developer-workspace-shell__utility">{utility}</div> : null}
      {overlays ? <div className="developer-workspace-shell__overlay-stack">{overlays}</div> : null}
    </div>
  );
}
