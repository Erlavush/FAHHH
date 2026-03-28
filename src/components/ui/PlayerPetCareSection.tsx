import type { CatCareActionId } from "../../lib/catCare";
import type { OwnedPet } from "../../lib/pets";

function formatCareStat(label: string, value: number): string {
  return `${label} ${value}`;
}

type PlayerPetCareSectionProps = {
  activeCats: OwnedPet[];
  catsNeedingCareIds?: Set<string>;
  onActivateStoredPet?: (petId: string) => void;
  onCareForPet?: (petId: string, actionId: CatCareActionId) => void;
  onRemovePet?: (petId: string) => void;
  onStorePet?: (petId: string) => void;
  petCatalogMode: "sandbox" | "shared_room";
  sharedRoomMessage: string;
  storedCats: OwnedPet[];
};

export function PlayerPetCareSection({
  activeCats,
  catsNeedingCareIds,
  onActivateStoredPet,
  onCareForPet,
  onRemovePet,
  onStorePet,
  petCatalogMode,
  sharedRoomMessage,
  storedCats
}: PlayerPetCareSectionProps) {
  const sharedPetMode = petCatalogMode === "shared_room";
  const activeCareTargets = catsNeedingCareIds ?? new Set<string>();
  const hasCatInventory = activeCats.length > 0 || storedCats.length > 0;

  return (
    <section className="spawn-section">
      <span className="spawn-section__title">Pet Care</span>
      <p className="spawn-section__description">
        {sharedPetMode ? sharedRoomMessage : "Take care of the cats already in your room."}
      </p>
      {sharedPetMode ? (
        <div className="spawn-empty">{sharedRoomMessage}</div>
      ) : (
        <>
          {activeCats.length > 0 ? (
            <section className="spawn-subsection">
              <span className="spawn-subsection__title">Room Cats</span>
              <div className="spawn-grid">
                {activeCats.map((pet) => {
                  const needsCare = activeCareTargets.has(pet.id);

                  return (
                    <div key={pet.id} className="spawn-card">
                      <div className="spawn-card__content">
                        <div className="spawn-card__header-row">
                          <strong>{pet.displayName}</strong>
                          <span className="spawn-card__price">{needsCare ? "Needs care" : "Active"}</span>
                        </div>
                        <div className="spawn-card__stats">
                          <span className="spawn-card__stat">{formatCareStat("Hunger", pet.care.hunger)}</span>
                          <span className="spawn-card__stat">{formatCareStat("Affection", pet.care.affection)}</span>
                          <span className="spawn-card__stat">{formatCareStat("Energy", pet.care.energy)}</span>
                        </div>
                        <span className="spawn-card__hint">
                          {needsCare
                            ? "Feed, pet, or play to bring this cat back into a happy routine."
                            : "This cat is doing well. Keep it roaming the room or store it for later."}
                        </span>
                        <div className="spawn-card__actions">
                          <button
                            className="spawn-card__button spawn-card__button--care"
                            onClick={() => onCareForPet?.(pet.id, "feed")}
                            type="button"
                          >
                            Feed +2
                          </button>
                          <button
                            className="spawn-card__button spawn-card__button--care"
                            onClick={() => onCareForPet?.(pet.id, "pet")}
                            type="button"
                          >
                            Pet +1
                          </button>
                          <button
                            className="spawn-card__button spawn-card__button--care"
                            onClick={() => onCareForPet?.(pet.id, "play")}
                            type="button"
                          >
                            Play +3
                          </button>
                          <button
                            className="spawn-card__button spawn-card__button--secondary"
                            onClick={() => onStorePet?.(pet.id)}
                            type="button"
                          >
                            Store
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {storedCats.length > 0 ? (
            <section className="spawn-subsection">
              <span className="spawn-subsection__title">Stored Cats</span>
              <div className="spawn-grid">
                {storedCats.map((pet) => (
                  <div key={pet.id} className="spawn-card">
                    <div className="spawn-card__content">
                      <div className="spawn-card__header-row">
                        <strong>{pet.displayName}</strong>
                        <span className="spawn-card__price">Stored</span>
                      </div>
                      <div className="spawn-card__stats">
                        <span className="spawn-card__stat">{formatCareStat("Hunger", pet.care.hunger)}</span>
                        <span className="spawn-card__stat">{formatCareStat("Affection", pet.care.affection)}</span>
                        <span className="spawn-card__stat">{formatCareStat("Energy", pet.care.energy)}</span>
                      </div>
                      <span className="spawn-card__hint">
                        Stored cats keep their saved care values until you activate them again.
                      </span>
                      <div className="spawn-card__actions">
                        <button
                          className="spawn-card__button"
                          onClick={() => onActivateStoredPet?.(pet.id)}
                          type="button"
                        >
                          Activate
                        </button>
                        <button
                          className="spawn-card__button spawn-card__button--secondary"
                          onClick={() => onRemovePet?.(pet.id)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!hasCatInventory ? (
            <div className="spawn-empty">No cats in your room yet. Visit Shop to adopt one.</div>
          ) : null}
        </>
      )}
    </section>
  );
}