import { useEffect, useMemo, useRef, useState } from "react";
import { tickOwnedPetCareState } from "../../lib/catCare";
import {
  createDefaultSandboxState,
  loadPersistedSandboxState,
  savePersistedSandboxState
} from "../../lib/devLocalState";
import {
  createDefaultRoomState,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "../../lib/roomState";
import type { OwnedPet } from "../../lib/pets";
import type { SharedPetLiveState } from "../../lib/sharedPresenceTypes";
import type {
  FurnitureSpawnRequest,
  LocalPlayerPresenceSnapshot,
  PlayerInteractionStatus,
  SceneJumpRequest
} from "../types";
import { DEFAULT_CAMERA_POSITION, DEFAULT_PLAYER_POSITION } from "../constants";

type SandboxState = ReturnType<typeof loadPersistedSandboxState>;

const CAT_CARE_TICK_INTERVAL_MS = 60000;

export function useLocalRoomSession(input: {
  initialSandboxState?: SandboxState;
  skinSrc?: string | null;
  sharedRoomActive: boolean;
}) {
  const initialSandboxState = useMemo(
    () =>
      input.initialSandboxState ??
      loadPersistedSandboxState(
        DEFAULT_CAMERA_POSITION,
        DEFAULT_PLAYER_POSITION,
        createDefaultRoomState()
      ),
    [input.initialSandboxState]
  );
  const [cameraPosition, setCameraPosition] = useState<Vector3Tuple>(
    initialSandboxState.cameraPosition
  );
  const [playerPosition, setPlayerPosition] = useState<Vector3Tuple>(
    initialSandboxState.playerPosition
  );
  const [playerCoins, setPlayerCoins] = useState(initialSandboxState.playerCoins);
  const [roomState, setRoomState] = useState<RoomState>(initialSandboxState.roomState);
  const [liveFurniturePlacements, setLiveFurniturePlacements] = useState<
    RoomFurniturePlacement[]
  >(initialSandboxState.roomState.furniture);
  const [pendingSpawnOwnedFurnitureIds, setPendingSpawnOwnedFurnitureIds] = useState<string[]>([]);
  const [spawnRequest, setSpawnRequest] = useState<FurnitureSpawnRequest | null>(null);
  const [cameraResetToken, setCameraResetToken] = useState(0);
  const [standRequestToken, setStandRequestToken] = useState(0);
  const [sceneJumpRequest, setSceneJumpRequest] = useState<SceneJumpRequest | null>(null);
  const [playerInteractionStatus, setPlayerInteractionStatus] =
    useState<PlayerInteractionStatus>(null);
  const [localPresenceSnapshot, setLocalPresenceSnapshot] =
    useState<LocalPlayerPresenceSnapshot>({
      position: initialSandboxState.playerPosition,
      facingY: 0,
      activity: "idle",
      interactionPose: null
    });
  const [localSharedPetState, setLocalSharedPetState] =
    useState<SharedPetLiveState | null>(null);
  const [pcMinigameProgress, setPcMinigameProgress] = useState(initialSandboxState.pcMinigame);
  const [sharedPcResult, setSharedPcResult] = useState<{
    dailyRitualStatus: string;
    dailyRitualBonusCoins: number;
    dailyRitualBonusXp: number;
    streakCount: number;
  } | null>(null);
  const [ownedPets, setOwnedPets] = useState<OwnedPet[]>(initialSandboxState.pets);
  const [selectedMemoryFrameId, setSelectedMemoryFrameId] = useState<string | null>(null);
  const [memoryFrameSaving, setMemoryFrameSaving] = useState(false);
  const [breakupResetDialogOpen, setBreakupResetDialogOpen] = useState(false);
  const [breakupResetSaving, setBreakupResetSaving] = useState(false);
  const cameraPositionRef = useRef(initialSandboxState.cameraPosition);
  const playerPositionRef = useRef(initialSandboxState.playerPosition);
  const playerCoinsRef = useRef(initialSandboxState.playerCoins);
  const roomStateRef = useRef(initialSandboxState.roomState);
  const ownedPetsRef = useRef(initialSandboxState.pets);
  const petStatusByIdRef = useRef<Record<string, OwnedPet["status"]>>(
    Object.fromEntries(initialSandboxState.pets.map((pet) => [pet.id, pet.status]))
  );
  const pendingSpawnOwnedFurnitureIdsRef = useRef(new Set<string>());
  const soldOwnedFurnitureIdsRef = useRef(new Set<string>());
  const nextSpawnRequestIdRef = useRef(1);
  const nextSceneJumpRequestIdRef = useRef(1);

  useEffect(() => {
    ownedPetsRef.current = ownedPets;
  }, [ownedPets]);

  useEffect(() => {
    const previousStatuses = petStatusByIdRef.current;
    const nowIso = new Date().toISOString();
    let statusAdjusted = false;
    const nextPets = ownedPets.map((pet) => {
      if (pet.status !== "active_room" || previousStatuses[pet.id] !== "stored_roster") {
        return pet;
      }

      statusAdjusted = true;
      return {
        ...pet,
        care: {
          ...pet.care,
          lastUpdatedAt: nowIso
        }
      };
    });

    petStatusByIdRef.current = Object.fromEntries(nextPets.map((pet) => [pet.id, pet.status]));

    if (!statusAdjusted) {
      return;
    }

    ownedPetsRef.current = nextPets;
    setOwnedPets(nextPets);
  }, [ownedPets, setOwnedPets]);

  useEffect(() => {
    const tickActivePetCare = (): void => {
      const nowIso = new Date().toISOString();

      setOwnedPets((currentPets) => {
        let careUpdated = false;
        const nextPets = currentPets.map((pet) => {
          if (pet.status !== "active_room") {
            return pet;
          }

          const nextPet = tickOwnedPetCareState(pet, nowIso);
          if (nextPet !== pet) {
            careUpdated = true;
          }
          return nextPet;
        });

        if (!careUpdated) {
          return currentPets;
        }

        ownedPetsRef.current = nextPets;
        return nextPets;
      });
    };

    tickActivePetCare();
    const intervalId = window.setInterval(tickActivePetCare, CAT_CARE_TICK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [setOwnedPets]);

  useEffect(() => {
    const persistedRoomState = input.sharedRoomActive ? createDefaultRoomState() : roomState;
    const persistedPlayerCoins = input.sharedRoomActive
      ? initialSandboxState.playerCoins
      : playerCoins;

    savePersistedSandboxState({
      version: 6,
      skinSrc: input.skinSrc ?? null,
      cameraPosition,
      playerPosition,
      playerCoins: persistedPlayerCoins,
      roomState: persistedRoomState,
      pcMinigame: pcMinigameProgress,
      pets: ownedPets
    });
  }, [
    cameraPosition,
    initialSandboxState.playerCoins,
    input.sharedRoomActive,
    input.skinSrc,
    ownedPets,
    pcMinigameProgress,
    playerCoins,
    playerPosition,
    roomState
  ]);

  return {
    breakupResetDialogOpen,
    breakupResetSaving,
    cameraPosition,
    cameraPositionRef,
    cameraResetToken,
    initialSandboxState,
    liveFurniturePlacements,
    localPresenceSnapshot,
    localSharedPetState,
    memoryFrameSaving,
    nextSceneJumpRequestIdRef,
    nextSpawnRequestIdRef,
    ownedPets,
    ownedPetsRef,
    pendingSpawnOwnedFurnitureIds,
    pendingSpawnOwnedFurnitureIdsRef,
    pcMinigameProgress,
    playerCoins,
    playerCoinsRef,
    playerInteractionStatus,
    playerPosition,
    playerPositionRef,
    roomState,
    roomStateRef,
    sceneJumpRequest,
    selectedMemoryFrameId,
    setBreakupResetDialogOpen,
    setBreakupResetSaving,
    setCameraPosition,
    setCameraResetToken,
    setLiveFurniturePlacements,
    setLocalPresenceSnapshot,
    setLocalSharedPetState,
    setMemoryFrameSaving,
    setOwnedPets,
    setPendingSpawnOwnedFurnitureIds,
    setPcMinigameProgress,
    setPlayerCoins,
    setPlayerInteractionStatus,
    setPlayerPosition,
    setRoomState,
    setSceneJumpRequest,
    setSelectedMemoryFrameId,
    setSharedPcResult,
    setSpawnRequest,
    setStandRequestToken,
    sharedPcResult,
    soldOwnedFurnitureIdsRef,
    spawnRequest,
    standRequestToken
  };
}

export { createDefaultSandboxState };