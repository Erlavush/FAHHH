import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { getOwnedFurnitureSellPrice } from "../../lib/economy";
import { FURNITURE_REGISTRY, type FurnitureType } from "../../lib/furnitureRegistry";
import {
  applyPcMinigameResult,
  type PcDeskActivityId,
  type PcMinigameProgress,
  type PcMinigameResult
} from "../../lib/pcMinigame";
import {
  ALL_PET_TYPES,
  PET_REGISTRY,
  createOwnedPet,
  type OwnedPet,
  type PetType
} from "../../lib/pets";
import { pickPetSpawnPosition } from "../../lib/petPathing";
import {
  applyPersonalWalletRefund,
  applyPersonalWalletSpend,
  applySharedActivityCompletionToProgression,
  DESK_PC_XP_OFFSET
} from "../../lib/sharedProgression";
import { applyDebugWalletTarget } from "../../lib/debugWallet";
import { createSharedRoomPetRecord } from "../../lib/sharedRoomPet";
import { buildSharedRoomOwnerId } from "../../lib/sharedRoomSeed";
import {
  createOwnedFurnitureItem,
  getPlacedOwnedFurnitureIds,
  type RoomFurniturePlacement,
  type RoomState,
  type Vector3Tuple
} from "../../lib/roomState";
import { placementListsMatch } from "../../lib/roomPlacementEquality";
import type { SharedPlayerProgression } from "../../lib/sharedProgressionTypes";
import type { InventoryStats, FurnitureSpawnRequest } from "../types";
import { useSharedRoomRuntime } from "./useSharedRoomRuntime";

const COZY_REST_REWARD_COINS = 6;
const COZY_REST_REWARD_XP = 10;

function getPcGameRewardReason(activityId: PcDeskActivityId): string {
  switch (activityId) {
    case "pc_block_stacker":
      return "pc_game_reward:pc_block_stacker";
    case "pc_runner":
      return "pc_game_reward:pc_runner";
    case "pc_snake":
    default:
      return "pc_game_reward:pc_snake";
  }
}

interface UseAppRoomActionsInput {
  activePlayerProgression: SharedPlayerProgression | null;
  cozyRestReadyNow: boolean;
  inventoryByType: Map<FurnitureType, InventoryStats>;
  liveFurniturePlacements: RoomFurniturePlacement[];
  ownedPetTypes: Set<PetType>;
  playerPosition: Vector3Tuple;
  pendingSpawnOwnedFurnitureIdsRef: MutableRefObject<Set<string>>;
  playerCoinsRef: MutableRefObject<number>;
  roomStateRef: MutableRefObject<RoomState>;
  setBuildModeEnabled: Dispatch<SetStateAction<boolean>>;
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
  cozyRestReadyNow,
  inventoryByType,
  liveFurniturePlacements,
  ownedPetTypes,
  playerPosition,
  pendingSpawnOwnedFurnitureIdsRef,
  playerCoinsRef,
  roomStateRef,
  setBuildModeEnabled,
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
          sharedPet: snapshot.sharedPet
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
              sharedPet: snapshot.sharedPet
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
            sharedPet: snapshot.sharedPet
          };
        });
        return;
      }

      if (!trySpendCoins(buyPrice)) {
        return;
      }

      const nextRoomState = {
        ...roomStateRef.current,
        ownedFurniture: [
          ...roomStateRef.current.ownedFurniture,
          createOwnedFurnitureItem(type)
        ]
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
    (type: PetType): void => {
      if (sharedRoomActive) {
        if (
          type !== "minecraft_cat" ||
          !sharedRoomPlayerId ||
          !activePlayerProgression ||
          activePlayerProgression.coins < PET_REGISTRY[type].price ||
          sharedRoomRuntime.runtimeSnapshot?.sharedPet
        ) {
          return;
        }

        void sharedRoomRuntime.commitRoomMutation("adopt_shared_pet", (snapshot) => ({
          roomState: snapshot.roomState,
          progression: applyPersonalWalletSpend(
            snapshot.progression,
            sharedRoomPlayerId,
            PET_REGISTRY[type].price,
            new Date().toISOString()
          ),
          frameMemories: snapshot.frameMemories,
          sharedPet: createSharedRoomPetRecord(
            pickPetSpawnPosition(playerPosition, snapshot.roomState.furniture),
            sharedRoomPlayerId,
            new Date().toISOString()
          )
        }));
        return;
      }

      const petDefinition = PET_REGISTRY[type];

      if (ownedPetTypes.has(type) || !trySpendCoins(petDefinition.price)) {
        return;
      }

      const spawnPosition = pickPetSpawnPosition(playerPosition, liveFurniturePlacements);

      setOwnedPets((currentPets) =>
        currentPets.some((pet) => pet.type === type)
          ? currentPets
          : [...currentPets, createOwnedPet(type, spawnPosition)]
      );
    },
    [
      activePlayerProgression,
      liveFurniturePlacements,
      ownedPetTypes,
      playerPosition,
      setOwnedPets,
      sharedRoomActive,
      sharedRoomPlayerId,
      sharedRoomRuntime,
      trySpendCoins
    ]
  );

  const handleSpawnFurniture = useCallback(
    (type: FurnitureType, ownedFurnitureId: string): void => {
      if (
        pendingSpawnOwnedFurnitureIdsRef.current.has(ownedFurnitureId) ||
        getPlacedOwnedFurnitureIds(liveFurniturePlacements).has(ownedFurnitureId)
      ) {
        return;
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
      liveFurniturePlacements,
      nextSpawnRequestIdRef,
      pendingSpawnOwnedFurnitureIdsRef,
      setBuildModeEnabled,
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
              sharedPet: snapshot.sharedPet
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
            sharedPet: snapshot.sharedPet
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
        sharedPet: snapshot.sharedPet
      };
    });
  }, [cozyRestReadyNow, sharedRoomActive, sharedRoomRuntime]);

  return {
    addCoins,
    applyLocalSharedSnapshot,
    commitPlayerCoins,
    handleBuyFurniture,
    handleBuyPet,
    handleClaimCozyRest,
    handleDeveloperPlayerCoinsCommit,
    handleExitPcMinigame,
    handlePcMinigameComplete,
    handlePlaceStoredFurniture,
    handleSellStoredFurniture,
    trySpendCoins,
    updatePendingSpawnOwnedFurnitureIds
  };
}