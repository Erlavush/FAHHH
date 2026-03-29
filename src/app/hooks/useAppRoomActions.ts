import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { getOwnedFurnitureSellPrice } from "../../lib/economy";
import { applyCatCareAction, type CatCareActionId } from "../../lib/catCare";
import { FURNITURE_REGISTRY, getFurnitureDefinition, type FurnitureType } from "../../lib/furnitureRegistry";
import {
  applyPcMinigameResult,
  type PcDeskActivityId,
  type PcMinigameProgress,
  type PcMinigameResult
} from "../../lib/pcMinigame";
import {
  countOwnedPetsByStatus,
  countOwnedPetsByType,
  createOwnedPet,
  getNextPetDisplayName,
  type OwnedPet,
  type PetDefinition
} from "../../lib/pets";
import { pickPetSpawnPosition } from "../../lib/petPathing";
import { applyPersonalWalletRefund, applyPersonalWalletSpend, applySharedActivityCompletionToProgression, DESK_PC_XP_OFFSET } from "../../lib/sharedProgression";
import { applyDebugWalletTarget } from "../../lib/debugWallet";
import { createSharedRoomPetRecord, toRuntimeOwnedPet } from "../../lib/sharedRoomPet";
import { buildSharedRoomOwnerId } from "../../lib/sharedRoomSeed";
import { THEME_REGISTRY } from "../../lib/themeRegistry";
import {
  createOwnedFurnitureItem,
  getPlacedOwnedFurnitureIds,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "../../lib/roomState";
import { placementListsMatch } from "../../lib/roomPlacementEquality";
import type { SharedPlayerProgression } from "../../lib/sharedProgressionTypes";
import type { BuildModeSource, InventoryStats, FurnitureSpawnRequest } from "../types";
import { useSharedRoomRuntime } from "./useSharedRoomRuntime";

const COZY_REST_REWARD_COINS = 6;
const COZY_REST_REWARD_XP = 10;
const MAX_ACTIVE_SHOWCASE_CATS = 6;
const MAX_TOTAL_SHOWCASE_CATS = 12;

function getPcGameRewardReason(activityId: PcDeskActivityId): string {
  switch (activityId) {
    case "pc_block_stacker":
      return "pc_game_reward:pc_block_stacker";
    case "pc_pacman":
      return "pc_game_reward:pc_pacman";
    case "pc_snake":
    default:
      return "pc_game_reward:pc_snake";
  }
}

interface UseAppRoomActionsInput {
  activePlayerProgression: SharedPlayerProgression | null;
  buildModeSource: BuildModeSource;
  cozyRestReadyNow: boolean;
  inventoryByType: Map<FurnitureType, InventoryStats>;
  liveFurniturePlacements: RoomFurniturePlacement[];
  ownedPetsRef: MutableRefObject<OwnedPet[]>;
  playerPosition: Vector3Tuple;
  pendingSpawnOwnedFurnitureIdsRef: MutableRefObject<Set<string>>;
  playerCoinsRef: MutableRefObject<number>;
  roomStateRef: MutableRefObject<RoomState>;
  setBuildModeEnabled: Dispatch<SetStateAction<boolean>>;
  setBuildModeSource: Dispatch<SetStateAction<BuildModeSource>>;
  setCatalogOpen: Dispatch<SetStateAction<boolean>>;
  setLiveFurniturePlacements: Dispatch<SetStateAction<RoomFurniturePlacement[]>>;
  setOwnedPets: Dispatch<SetStateAction<OwnedPet[]>>;
  setPendingSpawnOwnedFurnitureIds: Dispatch<SetStateAction<string[]>>;
  setPcMinigameProgress: Dispatch<SetStateAction<PcMinigameProgress>>;
  setPlayerCoins: Dispatch<SetStateAction<number>>;
  setRoomState: Dispatch<SetStateAction<RoomState>>;
  setSharedPcResult: Dispatch<
    SetStateAction<{
      dailyRitualStatus: string;
      dailyRitualBonusCoins: number;
      dailyRitualBonusXp: number;
      streakCount: number;
    } | null>
  >;
  setSpawnRequest: Dispatch<SetStateAction<FurnitureSpawnRequest | null>>;
  setStandRequestToken: Dispatch<SetStateAction<number>>;
  sharedRoomActive: boolean;
  sharedRoomPlayerId: string | null;
  sharedRoomRuntime: ReturnType<typeof useSharedRoomRuntime>;
  soldOwnedFurnitureIdsRef: MutableRefObject<Set<string>>;
  nextSpawnRequestIdRef: MutableRefObject<number>;
}

export function useAppRoomActions({
  activePlayerProgression,
  buildModeSource,
  cozyRestReadyNow,
  inventoryByType,
  liveFurniturePlacements,
  ownedPetsRef,
  playerPosition,
  pendingSpawnOwnedFurnitureIdsRef,
  playerCoinsRef,
  roomStateRef,
  setBuildModeEnabled,
  setBuildModeSource,
  setCatalogOpen,
  setLiveFurniturePlacements,
  setOwnedPets,
  setPendingSpawnOwnedFurnitureIds,
  setPcMinigameProgress,
  setPlayerCoins,
  setRoomState,
  setSharedPcResult,
  setSpawnRequest,
  setStandRequestToken,
  sharedRoomActive,
  sharedRoomPlayerId,
  sharedRoomRuntime,
  soldOwnedFurnitureIdsRef,
  nextSpawnRequestIdRef
}: UseAppRoomActionsInput) {
  const applyLocalSharedSnapshot = useCallback(
    (nextRoomState: RoomState, nextCoins: number): void => {
      roomStateRef.current = nextRoomState;
      playerCoinsRef.current = nextCoins;
      setLiveFurniturePlacements((currentPlacements) =>
        placementListsMatch(currentPlacements, nextRoomState.furniture)
          ? currentPlacements
          : nextRoomState.furniture
      );
      setRoomState(nextRoomState);
      setPlayerCoins(nextCoins);
    },
    [playerCoinsRef, roomStateRef, setLiveFurniturePlacements, setPlayerCoins, setRoomState]
  );

  const commitPlayerCoins = useCallback(
    (nextCoins: number): void => {
      const normalizedCoins = Math.max(0, Math.floor(nextCoins));
      playerCoinsRef.current = normalizedCoins;
      setPlayerCoins(normalizedCoins);
    },
    [playerCoinsRef, setPlayerCoins]
  );

  const trySpendCoins = useCallback(
    (cost: number): boolean => {
      if (playerCoinsRef.current < cost) {
        return false;
      }

      commitPlayerCoins(playerCoinsRef.current - cost);
      return true;
    },
    [commitPlayerCoins, playerCoinsRef]
  );

  const addCoins = useCallback(
    (amount: number): void => {
      commitPlayerCoins(playerCoinsRef.current + amount);
    },
    [commitPlayerCoins, playerCoinsRef]
  );

  const updatePendingSpawnOwnedFurnitureIds = useCallback(
    (updater: (currentIds: string[]) => string[]): void => {
      setPendingSpawnOwnedFurnitureIds((currentIds) => {
        const nextIds = updater(currentIds);
        pendingSpawnOwnedFurnitureIdsRef.current = new Set(nextIds);
        return nextIds;
      });
    },
    [pendingSpawnOwnedFurnitureIdsRef, setPendingSpawnOwnedFurnitureIds]
  );

  const commitOwnedPets = useCallback(
    (nextPets: OwnedPet[]): void => {
      ownedPetsRef.current = nextPets;
      setOwnedPets(nextPets);
    },
    [ownedPetsRef, setOwnedPets]
  );

  const handleDeveloperPlayerCoinsCommit = useCallback(
    (nextCoins: number): void => {
      const normalizedCoins = Math.max(0, Math.floor(nextCoins));

      if (sharedRoomActive && sharedRoomRuntime.session?.playerId) {
        void sharedRoomRuntime.commitRoomMutation("debug:set_wallet", (snapshot) => ({
          roomState: snapshot.roomState,
          progression: applyDebugWalletTarget(
            snapshot.progression,
            sharedRoomRuntime.session?.playerId ?? "",
            normalizedCoins,
            new Date().toISOString()
          ),
          frameMemories: snapshot.frameMemories,
          sharedPets: snapshot.sharedPets
        }));
        return;
      }

      commitPlayerCoins(normalizedCoins);
    },
    [commitPlayerCoins, sharedRoomActive, sharedRoomRuntime]
  );

  const handlePcMinigameComplete = useCallback(
    (result: PcMinigameResult): void => {
      const activityId = result.activityId ?? "pc_snake";

      if (sharedRoomActive && sharedRoomRuntime.session?.playerId) {
        void sharedRoomRuntime
          .commitRoomMutation(getPcGameRewardReason(activityId), (snapshot) => {
            const nextSharedResult = applySharedActivityCompletionToProgression({
              progression: snapshot.progression,
              activityId,
              claimMode: "per_player",
              actorPlayerId: sharedRoomRuntime.session?.playerId ?? "",
              memberIds: snapshot.memberIds,
              rewardCoins: result.rewardCoins,
              rewardXp: result.rewardCoins + DESK_PC_XP_OFFSET,
              score: result.score,
              nowIso: new Date().toISOString()
            });

            return {
              roomState: snapshot.roomState,
              progression: nextSharedResult.progression,
              frameMemories: snapshot.frameMemories,
              sharedPets: snapshot.sharedPets
            };

          })
          .then(() => {
            setSharedPcResult(null);
          });

        return;
      }

      setPcMinigameProgress((currentProgress) => applyPcMinigameResult(currentProgress, result));
      commitPlayerCoins(playerCoinsRef.current + result.rewardCoins);
      setSharedPcResult(null);
    },
    [
      commitPlayerCoins,
      playerCoinsRef,
      setPcMinigameProgress,
      setSharedPcResult,
      sharedRoomActive,
      sharedRoomRuntime
    ]
  );

  const handleExitPcMinigame = useCallback((): void => {
    setSharedPcResult(null);
    setStandRequestToken((currentToken) => currentToken + 1);
  }, [setSharedPcResult, setStandRequestToken]);

  const handleBuyFurniture = useCallback(
    (type: FurnitureType): void => {
      const buyPrice = FURNITURE_REGISTRY[type].price;

      if (sharedRoomActive) {
        if (
          !sharedRoomRuntime.session?.playerId ||
          !activePlayerProgression ||
          activePlayerProgression.coins < buyPrice
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation(`buy:${type}`, (snapshot) => {
          const nextProgression = applyPersonalWalletSpend(
            snapshot.progression,
            sharedRoomRuntime.session?.playerId ?? "",
            buyPrice,
            new Date().toISOString()
          );
          const ownerId = buildSharedRoomOwnerId(snapshot.roomState.metadata.roomId);
          const nextRoomState = {
            ...snapshot.roomState,
            ownedFurniture: [
              ...snapshot.roomState.ownedFurniture,
              createOwnedFurnitureItem(type, ownerId)
            ]
          };

          return {
            roomState: nextRoomState,
            progression: nextProgression,
            frameMemories: snapshot.frameMemories,
            sharedPets: snapshot.sharedPets
          };
        });
        return;
      }

      if (!trySpendCoins(buyPrice)) {
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        ownedFurniture: [...roomStateRef.current.ownedFurniture, createOwnedFurnitureItem(type)]
      };

      applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
    },
    [
      activePlayerProgression,
      applyLocalSharedSnapshot,
      playerCoinsRef,
      roomStateRef,
      sharedRoomActive,
      sharedRoomRuntime,
      trySpendCoins
    ]
  );

  const handleBuyPet = useCallback(
    (petDefinition: PetDefinition): void => {
      const type = petDefinition.type;

      if (sharedRoomActive) {
        if (
          type !== "minecraft_cat" ||
          !sharedRoomPlayerId ||
          !activePlayerProgression ||
          activePlayerProgression.coins < petDefinition.price ||
          sharedRoomRuntime.runtimeSnapshot?.sharedPets.some(p => p.presetId === petDefinition.presetId)
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation("adopt_shared_pet", (snapshot) => ({
          roomState: snapshot.roomState,
          progression: applyPersonalWalletSpend(
            snapshot.progression,
            sharedRoomPlayerId,
            petDefinition.price,
            new Date().toISOString()
          ),
          frameMemories: snapshot.frameMemories,
          sharedPets: [
            ...snapshot.sharedPets,
            createSharedRoomPetRecord(
              pickPetSpawnPosition(playerPosition, snapshot.roomState.furniture),
              sharedRoomPlayerId,
              new Date().toISOString(),
              {
                presetId: petDefinition.presetId,
                displayName: getNextPetDisplayName(type, snapshot.sharedPets.map(toRuntimeOwnedPet))
              }
            )
          ]
        }));
        return;
      }

      const currentPets = ownedPetsRef.current;

      if (
        type !== "minecraft_cat" ||
        currentPets.some((pet) => pet.presetId === petDefinition.presetId) ||
        countOwnedPetsByType(currentPets, type) >= MAX_TOTAL_SHOWCASE_CATS ||
        !trySpendCoins(petDefinition.price)
      ) {
        return;
      }

      const spawnPosition = pickPetSpawnPosition(playerPosition, liveFurniturePlacements);
      const nextStatus =
        countOwnedPetsByStatus(currentPets, "active_room", type) < MAX_ACTIVE_SHOWCASE_CATS
          ? "active_room"
          : "stored_roster";
      const nextPets = [
        ...currentPets,
        createOwnedPet(type, spawnPosition, {
          displayName: getNextPetDisplayName(type, currentPets),
          presetId: petDefinition.presetId,
          status: nextStatus,
          nowIso: new Date().toISOString()
        })
      ];

      commitOwnedPets(nextPets);
    },
    [
      activePlayerProgression,
      commitOwnedPets,
      liveFurniturePlacements,
      ownedPetsRef,
      playerPosition,
      sharedRoomActive,
      sharedRoomPlayerId,
      sharedRoomRuntime,
      trySpendCoins
    ]
  );

  const handleStorePet = useCallback(
    (petId: string): void => {
      if (sharedRoomActive) {
        return;
      }

      const currentPets = ownedPetsRef.current;
      const nextPets = currentPets.map((pet) =>
        pet.id === petId && pet.status === "active_room"
          ? {
              ...pet,
              status: "stored_roster" as const
            }
          : pet
      );

      if (nextPets.every((pet, index) => pet === currentPets[index])) {
        return;
      }

      commitOwnedPets(nextPets);
    },
    [commitOwnedPets, ownedPetsRef, sharedRoomActive]
  );

  const handleActivateStoredPet = useCallback(
    (petId: string): void => {
      if (sharedRoomActive) {
        return;
      }

      const currentPets = ownedPetsRef.current;
      const storedPet = currentPets.find(
        (pet) => pet.id === petId && pet.status === "stored_roster"
      );

      if (!storedPet) {
        return;
      }

      if (
        storedPet.type === "minecraft_cat" &&
        countOwnedPetsByStatus(currentPets, "active_room", "minecraft_cat") >=
          MAX_ACTIVE_SHOWCASE_CATS
      ) {
        return;
      }

      const nextSpawnPosition = pickPetSpawnPosition(playerPosition, liveFurniturePlacements);
      const nextPets = currentPets.map((pet) =>
        pet.id === petId
          ? {
              ...pet,
              status: "active_room" as const,
              spawnPosition: nextSpawnPosition
            }
          : pet
      );

      commitOwnedPets(nextPets);
    },
    [commitOwnedPets, liveFurniturePlacements, ownedPetsRef, playerPosition, sharedRoomActive]
  );

  const handleRemovePet = useCallback(
    (petId: string): void => {
      if (sharedRoomActive) {
        return;
      }

      const currentPets = ownedPetsRef.current;
      const nextPets = currentPets.filter((pet) => pet.id !== petId);

      if (nextPets.length === currentPets.length) {
        return;
      }

      commitOwnedPets(nextPets);
    },
    [commitOwnedPets, ownedPetsRef, sharedRoomActive]
  );

  const handleCareForPet = useCallback(
    (petId: string, actionId: CatCareActionId): void => {
      if (sharedRoomActive) {
        return;
      }

      const currentPets = ownedPetsRef.current;
      const targetPet = currentPets.find(
        (pet) => pet.id === petId && pet.status === "active_room"
      );

      if (!targetPet) {
        return;
      }

      const careResult = applyCatCareAction(targetPet, actionId, new Date().toISOString());
      const nextPets = currentPets.map((pet) =>
        pet.id === petId ? careResult.pet : pet
      );

      commitOwnedPets(nextPets);
      addCoins(careResult.rewardCoins);
    },
    [addCoins, commitOwnedPets, ownedPetsRef, sharedRoomActive]
  );

  const handleSpawnFurniture = useCallback(
    (type: FurnitureType, ownedFurnitureId: string): void => {
      if (
        pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurnitureId) ||
        getPlacedOwnedFurnitureIds(liveFurniturePlacements).has(ownedFurnitureId)
      ) {
        return;
      }

      if (buildModeSource !== "manual") {
        setBuildModeSource("placement");
      }
      setBuildModeEnabled(true);
      setCatalogOpen(true);
      pendingSpawnOwnedFurnitureIdsRef.current.add(ownedFurnitureId);
      updatePendingSpawnOwnedFurnitureIds((currentIds) =>
        currentIds.includes(ownedFurnitureId) ? currentIds : [...currentIds, ownedFurnitureId]
      );
      setSpawnRequest({
        requestId: nextSpawnRequestIdRef.current,
        type,
        ownedFurnitureId
      });
      nextSpawnRequestIdRef.current += 1;
    },
    [
      buildModeSource,
      liveFurniturePlacements,
      nextSpawnRequestIdRef,
      pendingSpawnOwnedFurnitureIdsRef,
      setBuildModeEnabled,
      setBuildModeSource,
      setCatalogOpen,
      setSpawnRequest,
      updatePendingSpawnOwnedFurnitureIds
    ]
  );

  const handlePlaceStoredFurniture = useCallback(
    (type: FurnitureType): void => {
      const nextStoredOwnedFurniture = inventoryByType
        .get(type)
        ?.storedItems.find(
          (ownedFurniture) => !pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurniture.id)
        );

      if (!nextStoredOwnedFurniture) {
        return;
      }

      handleSpawnFurniture(type, nextStoredOwnedFurniture.id);
    },
    [handleSpawnFurniture, inventoryByType, pendingSpawnOwnedFurnitureIdsRef]
  );

  const handleSellStoredFurniture = useCallback(
    (type: FurnitureType): void => {
      const storedItems = (inventoryByType.get(type)?.storedItems ?? []).filter(
        (ownedFurniture) => !pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurniture.id)
      );
      const nextSellItem =
        storedItems.find((item) => getOwnedFurnitureSellPrice(item) > 0) ?? storedItems[0];

      if (!nextSellItem || soldOwnedFurnitureIdsRef.current.has(nextSellItem.id)) {
        return;
      }

      const sellPrice = getOwnedFurnitureSellPrice(nextSellItem);
      soldOwnedFurnitureIdsRef.current.add(nextSellItem.id);
      updatePendingSpawnOwnedFurnitureIds((currentIds) =>
        currentIds.filter((ownedFurnitureId) => ownedFurnitureId !== nextSellItem.id)
      );

      if (sharedRoomActive) {
        if (!sharedRoomRuntime.session?.playerId) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation(`sell:${nextSellItem.id}`, (snapshot) => {
          const snapshotSellItem = snapshot.roomState.ownedFurniture.find(
            (ownedFurniture) => ownedFurniture.id === nextSellItem.id
          );

          if (!snapshotSellItem) {
            return {
              roomState: snapshot.roomState,
              progression: snapshot.progression,
              frameMemories: snapshot.frameMemories,
              sharedPets: snapshot.sharedPets
            };
          }

          const nextProgression =
            sellPrice > 0
              ? applyPersonalWalletRefund(
                  snapshot.progression,
                  sharedRoomRuntime.session?.playerId ?? "",
                  sellPrice,
                  new Date().toISOString()
                )
              : snapshot.progression;
          const nextRoomState = {
            ...snapshot.roomState,
            ownedFurniture: snapshot.roomState.ownedFurniture.filter(
              (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
            )
          };

          return {
            roomState: nextRoomState,
            progression: nextProgression,
            frameMemories: snapshot.frameMemories,
            sharedPets: snapshot.sharedPets
          };
        });
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        ownedFurniture: roomStateRef.current.ownedFurniture.filter(
          (ownedFurniture) => ownedFurniture.id !== nextSellItem.id
        )
      };

      if (sellPrice > 0) {
        addCoins(sellPrice);
      }

      applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
    },
    [
      addCoins,
      applyLocalSharedSnapshot,
      inventoryByType,
      pendingSpawnOwnedFurnitureIdsRef,
      playerCoinsRef,
      roomStateRef,
      sharedRoomActive,
      sharedRoomRuntime,
      soldOwnedFurnitureIdsRef,
      updatePendingSpawnOwnedFurnitureIds
    ]
  );

  const handleClaimCozyRest = useCallback(() => {
    if (!sharedRoomActive || !sharedRoomRuntime.session?.playerId || !cozyRestReadyNow) {
      return;
    }

    void sharedRoomRuntime.commitRoomMutation("cozy_rest_reward", (snapshot) => {
      const nextSharedResult = applySharedActivityCompletionToProgression({
        progression: snapshot.progression,
        activityId: "cozy_rest",
        claimMode: "couple",
        actorPlayerId: sharedRoomRuntime.session?.playerId ?? "",
        memberIds: snapshot.memberIds,
        rewardCoins: COZY_REST_REWARD_COINS,
        rewardXp: COZY_REST_REWARD_XP,
        score: 1,
        nowIso: new Date().toISOString()
      });

      return {
        roomState: snapshot.roomState,
        progression: nextSharedResult.progression,
        frameMemories: snapshot.frameMemories,
        sharedPets: snapshot.sharedPets
      };

    });
  }, [cozyRestReadyNow, sharedRoomActive, sharedRoomRuntime]);

  const handleUnlockTheme = useCallback(
    (themeId: string): void => {
      const themeDefinition = THEME_REGISTRY[themeId];
      if (!themeDefinition) {
        return;
      }

      const buyPrice = themeDefinition.price;

      if (sharedRoomActive) {
        if (
          !sharedRoomRuntime.session?.playerId ||
          !activePlayerProgression ||
          activePlayerProgression.coins < buyPrice ||
          sharedRoomRuntime.runtimeSnapshot?.roomState.metadata.unlockedThemes.includes(themeId)
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation(`unlock_theme:${themeId}`, (snapshot) => {
          const nextProgression = applyPersonalWalletSpend(
            snapshot.progression,
            sharedRoomRuntime.session?.playerId ?? "",
            buyPrice,
            new Date().toISOString()
          );
          const nextRoomState = {
            ...snapshot.roomState,
            metadata: {
              ...snapshot.roomState.metadata,
              unlockedThemes: [...snapshot.roomState.metadata.unlockedThemes, themeId]
            }
          };

          return {
            roomState: nextRoomState,
            progression: nextProgression,
            frameMemories: snapshot.frameMemories,
            sharedPets: snapshot.sharedPets
          };
        });
        return;
      }

      const currentMetadata = roomStateRef.current.metadata;
      if (
        currentMetadata.unlockedThemes.includes(themeId) ||
        !trySpendCoins(buyPrice)
      ) {
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        metadata: {
          ...currentMetadata,
          unlockedThemes: [...currentMetadata.unlockedThemes, themeId]
        }
      };

      applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
    },
    [
      activePlayerProgression,
      applyLocalSharedSnapshot,
      playerCoinsRef,
      roomStateRef,
      sharedRoomActive,
      sharedRoomRuntime,
      trySpendCoins
    ]
  );

  const handleUnlockFurniture = useCallback(
    (type: FurnitureType): void => {
      const definition = getFurnitureDefinition(type);
      if (!definition) {
        return;
      }

      const buyPrice = Math.floor(definition.price * 2); // Unlocking costs more than buying

      if (sharedRoomActive) {
        if (
          !sharedRoomRuntime.session?.playerId ||
          !activePlayerProgression ||
          activePlayerProgression.coins < buyPrice ||
          sharedRoomRuntime.runtimeSnapshot?.roomState.metadata.unlockedFurniture.includes(type)
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation(`unlock_furniture:${type}`, (snapshot) => {
          const nextProgression = applyPersonalWalletSpend(
            snapshot.progression,
            sharedRoomRuntime.session?.playerId ?? "",
            buyPrice,
            new Date().toISOString()
          );
          const nextRoomState = {
            ...snapshot.roomState,
            metadata: {
              ...snapshot.roomState.metadata,
              unlockedFurniture: [...snapshot.roomState.metadata.unlockedFurniture, type]
            }
          };

          return {
            roomState: nextRoomState,
            progression: nextProgression,
            frameMemories: snapshot.frameMemories,
            sharedPets: snapshot.sharedPets
          };
        });
        return;
      }

      const currentMetadata = roomStateRef.current.metadata;
      if (
        currentMetadata.unlockedFurniture.includes(type) ||
        !trySpendCoins(buyPrice)
      ) {
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        metadata: {
          ...currentMetadata,
          unlockedFurniture: [...currentMetadata.unlockedFurniture, type]
        }
      };

      applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
    },
    [
      activePlayerProgression,
      applyLocalSharedSnapshot,
      playerCoinsRef,
      roomStateRef,
      sharedRoomActive,
      sharedRoomRuntime,
      trySpendCoins
    ]
  );

  const handleSetTheme = useCallback(
    (themeId: string): void => {
      if (sharedRoomActive) {
        if (
          !sharedRoomRuntime.session?.playerId ||
          !sharedRoomRuntime.runtimeSnapshot?.roomState.metadata.unlockedThemes.includes(themeId)
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation(`set_theme:${themeId}`, (snapshot) => {
          const nextRoomState = {
            ...snapshot.roomState,
            metadata: {
              ...snapshot.roomState.metadata,
              roomTheme: themeId
            }
          };

          return {
            roomState: nextRoomState,
            progression: snapshot.progression,
            frameMemories: snapshot.frameMemories,
            sharedPets: snapshot.sharedPets
          };
        });
        return;
      }

      const currentMetadata = roomStateRef.current.metadata;
      if (!currentMetadata.unlockedThemes.includes(themeId)) {
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        metadata: {
          ...currentMetadata,
          roomTheme: themeId
        }
      };

      applyLocalSharedSnapshot(nextRoomState, playerCoinsRef.current);
    },
    [applyLocalSharedSnapshot, playerCoinsRef, roomStateRef, sharedRoomActive, sharedRoomRuntime]
  );

  return {
    addCoins,
    applyLocalSharedSnapshot,
    commitPlayerCoins,
    handleActivateStoredPet,
    handleBuyFurniture,
    handleBuyPet,
    handleCareForPet,
    handleClaimCozyRest,
    handleDeveloperPlayerCoinsCommit,
    handleExitPcMinigame,
    handlePcMinigameComplete,
    handlePlaceStoredFurniture,
    handleRemovePet,
    handleSellStoredFurniture,
    handleStorePet,
    handleUnlockTheme,
    handleUnlockFurniture,
    handleSetTheme,
    trySpendCoins,
    updatePendingSpawnOwnedFurnitureIds
  };
}

