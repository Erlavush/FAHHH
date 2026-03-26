type PlayerProgressStackProps = {
  coins: number;
  playerLevel: number;
  playerXp: number;
  playerXpNextLevel: number;
  streakCount: number;
  walletLabel: string;
};

export function PlayerProgressStack({
  coins,
  playerLevel,
  playerXp,
  playerXpNextLevel,
  streakCount,
  walletLabel
}: PlayerProgressStackProps) {
  return (
    <section className="player-progress-stack" aria-label="Player progression">
      <div className="player-progress-stack__card">
        <span className="player-progress-stack__label">{walletLabel}</span>
        <strong className="player-progress-stack__value">{coins}</strong>
      </div>
      <div className="player-progress-stack__card">
        <span className="player-progress-stack__label">Level</span>
        <strong className="player-progress-stack__value">Lv {playerLevel}</strong>
        <span className="player-progress-stack__meta">
          XP {playerXp}/{playerXpNextLevel}
        </span>
      </div>
      <div className="player-progress-stack__card">
        <span className="player-progress-stack__label">Streak</span>
        <strong className="player-progress-stack__value">{streakCount} days</strong>
      </div>
    </section>
  );
}
