interface WelcomeOverlayProps {
  partnerName: string | null;
  onClose: () => void;
}

export function WelcomeOverlay({ partnerName, onClose }: WelcomeOverlayProps) {
  return (
    <div className="overlay-backdrop">
      <div className="welcome-card">
        <span className="eyebrow">Welcome Home</span>
        <h2>Your room is ready</h2>
        <p>
          {partnerName
            ? `You and ${partnerName} now share this cozy little room.`
            : "Your shared room is ready to decorate together."}
        </p>
        <button className="primary-button" onClick={onClose}>
          Enter the room
        </button>
      </div>
    </div>
  );
}
