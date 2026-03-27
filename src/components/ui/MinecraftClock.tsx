import "./minecraft-clock.css";

type MinecraftClockProps = {
  label: string;
  ampm: 'AM' | 'PM';
};

export function MinecraftClock({ label, ampm }: MinecraftClockProps) {
  return (
    <div className="minecraft-clock">
      <div className="minecraft-clock__case">
        <div className="minecraft-clock__buttons">
          <div className="minecraft-clock__button"></div>
          <div className="minecraft-clock__button"></div>
          <div className="minecraft-clock__button"></div>
        </div>
        <div className="minecraft-clock__screen">
          <div className="minecraft-clock__display-container">
            <div className={`minecraft-clock__indicator minecraft-clock__indicator--am ${ampm === 'AM' ? 'minecraft-clock__indicator--lit' : ''}`}>
              AM
            </div>
            
            <div className="minecraft-clock__main-display">
              <div className="minecraft-clock__label">{label}</div>
            </div>

            <div className={`minecraft-clock__indicator minecraft-clock__indicator--pm ${ampm === 'PM' ? 'minecraft-clock__indicator--lit' : ''}`}>
              PM
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
