type PlayerClockChipProps = {
  label: string;
  timeLocked: boolean;
};

export function PlayerClockChip({ label, timeLocked }: PlayerClockChipProps) {
  return (
    <div className="player-clock-chip">
      <span className="player-clock-chip__eyebrow">{timeLocked ? "Time locked" : "Room time"}</span>
      <strong className="player-clock-chip__value">{label}</strong>
    </div>
  );
}
