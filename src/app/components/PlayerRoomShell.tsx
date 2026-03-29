import type { ReactNode } from "react";

type PlayerRoomShellProps = {
  bottomCenter?: ReactNode;
  bottomLeft?: ReactNode;
  drawer?: ReactNode;
  overlays?: ReactNode;
  stage: ReactNode;
  topLeft?: ReactNode;
  topCenter?: ReactNode;
  topRight?: ReactNode;
  bottomRight?: ReactNode;
  viewSwitch?: ReactNode;
};

export function PlayerRoomShell({
  bottomCenter,
  bottomLeft,
  drawer,
  overlays,
  stage,
  topLeft,
  topCenter,
  topRight,
  bottomRight,
  viewSwitch
}: PlayerRoomShellProps) {
  return (
    <div className="player-room-shell">
      <div className="app-shell__stage">{stage}</div>
      <div className="app-shell__overlay-layer">
        {viewSwitch ? <div className="player-room-shell__view-switch">{viewSwitch}</div> : null}
        {topLeft ? <div className="player-room-shell__top-left">{topLeft}</div> : null}
        {topCenter ? <div className="player-room-shell__top-center">{topCenter}</div> : null}
        {topRight ? <div className="player-room-shell__top-right">{topRight}</div> : null}
        {bottomLeft ? <div className="player-room-shell__bottom-left">{bottomLeft}</div> : null}
        {bottomCenter ? <div className="player-room-shell__bottom-center">{bottomCenter}</div> : null}
        {bottomRight ? <div className="player-room-shell__bottom-right">{bottomRight}</div> : null}
        {drawer ? <div className="player-room-shell__drawer">{drawer}</div> : null}
      </div>
      {overlays ? <div className="player-room-shell__overlay-stack">{overlays}</div> : null}
    </div>
  );
}
