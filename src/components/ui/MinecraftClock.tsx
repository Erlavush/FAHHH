import "./minecraft-clock.css";

type MinecraftClockProps = {
  label: string;
  ampm: "AM" | "PM";
};

export function MinecraftClock({ label, ampm }: MinecraftClockProps) {
  const detailedLabel = label.length > 5;
  const timeTextClassName = detailedLabel
    ? "minecraft-clock__time-text minecraft-clock__time-text--detailed"
    : "minecraft-clock__time-text";
  const labelClassName = detailedLabel
    ? "minecraft-clock__label minecraft-clock__label--detailed"
    : "minecraft-clock__label";

  return (
    <div className="minecraft-clock" aria-label={`Clock showing ${label} ${ampm}`}>
      <div className="minecraft-clock__frame">
        <img
          src="/icons/clock-game.png"
          alt="Cat themed digital clock"
          className="minecraft-clock__image"
          draggable={false}
        />
        <div className={timeTextClassName}>
          <span className={labelClassName}>{label}</span>
          <span
            className={
              ampm === "AM"
                ? "minecraft-clock__ampm minecraft-clock__ampm--lit"
                : "minecraft-clock__ampm"
            }
          >
            {ampm}
          </span>
        </div>
      </div>
    </div>
  );
}