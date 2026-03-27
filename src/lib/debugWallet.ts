import {
  applyPersonalWalletRefund,
  applyPersonalWalletSpend,
  selectActivePlayerProgression
} from "./sharedProgression";
import type { SharedRoomProgressionState } from "./sharedProgressionTypes";

export function applyDebugWalletTarget(
  progression: SharedRoomProgressionState,
  actorPlayerId: string,
  targetCoins: number,
  nowIso: string
): SharedRoomProgressionState {
  const actorProgression = selectActivePlayerProgression(progression, actorPlayerId);

  if (!actorProgression) {
    throw new Error("Shared player progression not found.");
  }

  const normalizedTargetCoins = Math.max(0, Math.floor(targetCoins));
  const coinDelta = normalizedTargetCoins - actorProgression.coins;

  if (coinDelta === 0) {
    return progression;
  }

  if (coinDelta > 0) {
    return applyPersonalWalletRefund(progression, actorPlayerId, coinDelta, nowIso);
  }

  return applyPersonalWalletSpend(progression, actorPlayerId, Math.abs(coinDelta), nowIso);
}
